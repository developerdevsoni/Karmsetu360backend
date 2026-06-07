import { PayrollRepository } from '../repository/payroll.repository';
import { AppError } from '../../../utils/response';
import { prisma } from '../../../config/database';
import { PayrollStatus } from '@prisma/client';
import { generatePayslipPdf } from '../../../utils/pdf.service';
import { EmailService } from '../../../utils/email.service';
import fs from 'fs/promises';
import path from 'path';

export class PayrollService {
  private static getMonthDateRange(monthStr: string) {
    const [year, month] = monthStr.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    return { startDate, endDate };
  }

  public static async generatePayroll(orgId: string, month: string, branchId?: string) {
    // 1. Fetch organization settings
    const settings = await prisma.orgSettings.findUnique({
      where: { organizationId: orgId }
    });

    if (!settings) {
      throw new AppError('Organization settings not found. Configure policies first.', 400);
    }

    const { startDate, endDate } = this.getMonthDateRange(month);

    // 2. Fetch employees
    const employees = await prisma.employee.findMany({
      where: {
        organizationId: orgId,
        branchId: branchId || undefined
      },
      include: {
        user: true,
        shift: true,
        branch: true
      }
    });

    const results = [];

    for (const emp of employees) {
      // Fetch attendance records for this month
      const attendance = await prisma.attendance.findMany({
        where: {
          employeeId: emp.id,
          date: { gte: startDate, lte: endDate }
        }
      });

      // Fetch approved leave days this month
      const leaves = await prisma.leave.findMany({
        where: {
          employeeId: emp.id,
          status: 'APPROVED',
          startDate: { lte: endDate },
          endDate: { gte: startDate }
        }
      });

      // Calculate days count
      const presentDays = attendance.length;
      
      let approvedLeaveDays = 0;
      leaves.forEach((lv) => {
        const lvStart = lv.startDate < startDate ? startDate : lv.startDate;
        const lvEnd = lv.endDate > endDate ? endDate : lv.endDate;
        const diff = Math.abs(lvEnd.getTime() - lvStart.getTime());
        approvedLeaveDays += Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
      });

      // Calculate absent days
      const workingDays = settings.workingDaysPerMonth;
      const absentDays = Math.max(0, workingDays - presentDays - approvedLeaveDays);

      // Check existing row to preserve custom manual adjustments (bonus, incentives, otherDeductions)
      const existingPayroll = await PayrollRepository.findEmployeePayroll(emp.id, month);
      
      const bonus = existingPayroll ? existingPayroll.bonus : 0.0;
      const incentives = existingPayroll ? existingPayroll.incentives : 0.0;
      const otherDeductions = existingPayroll ? existingPayroll.otherDeductions : 0.0;

      // Deductions calculations
      const dailyRate = emp.baseSalary / workingDays;
      const leaveDeductions = parseFloat((absentDays * dailyRate).toFixed(2));

      // Late Penalties calculations
      const lateCount = attendance.filter(a => a.status === 'LATE').length;
      let latePenalties = 0.0;
      if (lateCount >= settings.latePenaltyLimit) {
        const penaltyCount = Math.floor(lateCount / settings.latePenaltyLimit);
        latePenalties = parseFloat((penaltyCount * settings.latePenaltyDeduction * dailyRate).toFixed(2));
      }

      // Overtime Pay calculations
      let overtimePay = 0.0;
      if (emp.shift) {
        let totalOvertimeHours = 0.0;
        attendance.forEach((att) => {
          const expected = emp.shift?.workingHours || 8.0;
          if (att.workingHours > expected) {
            totalOvertimeHours += (att.workingHours - expected);
          }
        });

        const hourlyRate = dailyRate / 8.0;
        overtimePay = parseFloat((totalOvertimeHours * hourlyRate * 1.5).toFixed(2)); // 1.5x OT multiplier
      }

      // Net Take-Home Salary Calculation
      // Net = Base + OT + Bonus + Incentives - LeaveDeduct - LatePenalty - OtherDeduct
      const netSalary = parseFloat(
        Math.max(
          0,
          emp.baseSalary + overtimePay + bonus + incentives - leaveDeductions - latePenalties - otherDeductions
        ).toFixed(2)
      );

      const payrollRow = await PayrollRepository.upsertPayroll({
        organizationId: orgId,
        branchId: emp.branchId,
        employeeId: emp.id,
        month,
        baseSalary: emp.baseSalary,
        overtimePay,
        bonus,
        incentives,
        leaveDeductions,
        latePenalties,
        otherDeductions,
        netSalary
      });

      results.push(payrollRow);
    }

    return results;
  }

  public static async updatePayrollRow(payrollId: string, orgId: string, data: any) {
    const payroll = await prisma.payroll.findFirst({
      where: { id: payrollId, organizationId: orgId },
      include: { employee: true }
    });

    if (!payroll) {
      throw new AppError('Payroll record not found.', 404);
    }

    if (payroll.status === PayrollStatus.LOCKED) {
      throw new AppError('Cannot edit locked payroll sheets.', 400);
    }

    const bonus = data.bonus !== undefined ? data.bonus : payroll.bonus;
    const incentives = data.incentives !== undefined ? data.incentives : payroll.incentives;
    const otherDeductions = data.otherDeductions !== undefined ? data.otherDeductions : payroll.otherDeductions;

    // Recalculate Net Take-Home
    const netSalary = parseFloat(
      Math.max(
        0,
        payroll.baseSalary +
          payroll.overtimePay +
          bonus +
          incentives -
          payroll.leaveDeductions -
          payroll.latePenalties -
          otherDeductions
      ).toFixed(2)
    );

    return prisma.payroll.update({
      where: { id: payrollId },
      data: {
        bonus,
        incentives,
        otherDeductions,
        netSalary
      }
    });
  }

  public static async lockPayroll(orgId: string, month: string) {
    // 1. Fetch organization name for payslip header
    const org = await prisma.organization.findUnique({
      where: { id: orgId }
    });

    if (!org) {
      throw new AppError('Organization not found.', 404);
    }

    // 2. Fetch all payroll rows of this month
    const payrolls = await prisma.payroll.findMany({
      where: { organizationId: orgId, month, status: PayrollStatus.PENDING },
      include: {
        employee: {
          include: {
            user: { select: { name: true, email: true } },
            branch: true
          }
        }
      }
    });

    if (payrolls.length === 0) {
      throw new AppError('No pending payroll records found to lock for this month.', 400);
    }

    // Ensure upload destination exists
    const payslipDir = path.join(process.cwd(), 'uploads/payslips');
    await fs.mkdir(payslipDir, { recursive: true });

    for (const pr of payrolls) {
      // Generate PDF buffer
      const pdfBuffer = await generatePayslipPdf({
        organizationName: org.name,
        branchName: pr.employee.branch.name,
        employeeName: pr.employee.user.name,
        employeeId: pr.employee.employeeId,
        department: pr.employee.department,
        designation: pr.employee.designation,
        month: pr.month,
        baseSalary: pr.baseSalary,
        overtimePay: pr.overtimePay,
        bonus: pr.bonus,
        incentives: pr.incentives,
        leaveDeductions: pr.leaveDeductions,
        latePenalties: pr.latePenalties,
        otherDeductions: pr.otherDeductions,
        netSalary: pr.netSalary
      });

      // Write PDF to disk
      const filename = `payslip-${pr.id}.pdf`;
      const filepath = path.join(payslipDir, filename);
      await fs.writeFile(filepath, pdfBuffer);

      // Update URL
      const relativeUrl = `/uploads/payslips/${filename}`;
      await prisma.payroll.update({
        where: { id: pr.id },
        data: {
          status: PayrollStatus.LOCKED,
          payslipUrl: relativeUrl
        }
      });

      // Send email alert to employee
      await EmailService.queueEmail(pr.employee.user.email, `Payslip Lock & Release Alert`, 'PAYROLL_GENERATED', {
        name: pr.employee.user.name,
        month: pr.month,
        netSalary: pr.netSalary
      });
    }

    return { lockedRecords: payrolls.length };
  }

  public static async listPayrolls(orgId: string, filters: any) {
    return PayrollRepository.findAll(orgId, filters);
  }

  public static async getPayslip(id: string, orgId: string) {
    const payroll = await PayrollRepository.findById(id, orgId);
    if (!payroll) {
      throw new AppError('Payroll details not found.', 404);
    }
    return payroll;
  }

  public static async getPayslipsForEmployee(userId: string, orgId: string) {
    const employee = await prisma.employee.findFirst({
      where: { userId, organizationId: orgId }
    });

    if (!employee) {
      throw new AppError('Employee profile not found.', 404);
    }

    return prisma.payroll.findMany({
      where: { employeeId: employee.id, status: PayrollStatus.LOCKED },
      orderBy: { month: 'desc' }
    });
  }
}
