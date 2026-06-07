import { prisma } from '../../../config/database';
import { PayrollStatus } from '@prisma/client';

export class PayrollRepository {
  public static async findEmployeePayroll(employeeId: string, month: string) {
    return prisma.payroll.findUnique({
      where: {
        employeeId_month: {
          employeeId,
          month
        }
      }
    });
  }

  public static async upsertPayroll(data: any) {
    return prisma.payroll.upsert({
      where: {
        employeeId_month: {
          employeeId: data.employeeId,
          month: data.month
        }
      },
      update: {
        baseSalary: data.baseSalary,
        overtimePay: data.overtimePay,
        bonus: data.bonus,
        incentives: data.incentives,
        leaveDeductions: data.leaveDeductions,
        latePenalties: data.latePenalties,
        otherDeductions: data.otherDeductions,
        netSalary: data.netSalary,
        payslipUrl: data.payslipUrl || undefined
      },
      create: {
        organizationId: data.organizationId,
        branchId: data.branchId,
        employeeId: data.employeeId,
        month: data.month,
        baseSalary: data.baseSalary,
        overtimePay: data.overtimePay,
        bonus: data.bonus || 0,
        incentives: data.incentives || 0,
        leaveDeductions: data.leaveDeductions,
        latePenalties: data.latePenalties,
        otherDeductions: data.otherDeductions || 0,
        netSalary: data.netSalary,
        status: PayrollStatus.PENDING,
        payslipUrl: data.payslipUrl || null
      }
    });
  }

  public static async updatePayslipUrl(id: string, payslipUrl: string) {
    return prisma.payroll.update({
      where: { id },
      data: { payslipUrl }
    });
  }

  public static async lockMonthPayrolls(organizationId: string, month: string) {
    return prisma.payroll.updateMany({
      where: {
        organizationId,
        month,
        status: PayrollStatus.PENDING
      },
      data: {
        status: PayrollStatus.LOCKED
      }
    });
  }

  public static async findById(id: string, organizationId: string) {
    return prisma.payroll.findFirst({
      where: { id, organizationId },
      include: {
        employee: {
          include: {
            user: { select: { name: true, email: true } },
            branch: true
          }
        }
      }
    });
  }

  public static async findAll(organizationId: string, filters: any) {
    const where: any = { organizationId };
    
    if (filters.branchId) where.branchId = filters.branchId;
    if (filters.month) where.month = filters.month;
    if (filters.status) where.status = filters.status;

    return prisma.payroll.findMany({
      where,
      include: {
        employee: {
          include: {
            user: { select: { name: true, email: true } },
            branch: true
          }
        }
      },
      orderBy: { netSalary: 'desc' }
    });
  }
}
