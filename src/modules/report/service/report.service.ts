import { prisma } from '../../../config/database';
import { exportToExcelBuffer, exportToCsvBuffer } from '../../../utils/excel.service';
import { AppError } from '../../../utils/response';

export class ReportService {
  public static async generateAttendanceReport(orgId: string, filters: any, format: 'excel' | 'csv') {
    const where: any = { organizationId: orgId };
    if (filters.branchId) where.branchId = filters.branchId;
    if (filters.startDate && filters.endDate) {
      where.date = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate)
      };
    }

    const records = await prisma.attendance.findMany({
      where,
      include: {
        employee: {
          include: { user: { select: { name: true } } }
        },
        branch: true
      },
      orderBy: { date: 'asc' }
    });

    const columns = [
      { header: 'Date', key: 'date' },
      { header: 'Employee ID', key: 'employeeId' },
      { header: 'Name', key: 'name' },
      { header: 'Branch', key: 'branch' },
      { header: 'Check In', key: 'checkIn' },
      { header: 'Check Out', key: 'checkOut' },
      { header: 'Status', key: 'status' },
      { header: 'Worked Hours', key: 'workingHours' },
      { header: 'Break Duration (Min)', key: 'breakDuration' }
    ];

    const rows = records.map((r) => ({
      date: r.date.toISOString().split('T')[0],
      employeeId: r.employeeId,
      name: r.employee.user.name,
      branch: r.branch.name,
      checkIn: r.checkIn.toISOString(),
      checkOut: r.checkOut ? r.checkOut.toISOString() : 'N/A',
      status: r.status,
      workingHours: r.workingHours,
      breakDuration: r.breakDuration
    }));

    if (format === 'excel') {
      const buffer = await exportToExcelBuffer('Attendance Report', columns, rows);
      return { buffer, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
    } else {
      const buffer = await exportToCsvBuffer(columns, rows);
      return { buffer, mimeType: 'text/csv' };
    }
  }

  public static async generateLeaveReport(orgId: string, filters: any, format: 'excel' | 'csv') {
    const where: any = { organizationId: orgId };
    if (filters.branchId) where.branchId = filters.branchId;
    if (filters.status) where.status = filters.status;

    const records = await prisma.leave.findMany({
      where,
      include: {
        employee: {
          include: { user: { select: { name: true } } }
        },
        branch: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const columns = [
      { header: 'Employee ID', key: 'employeeId' },
      { header: 'Name', key: 'name' },
      { header: 'Branch', key: 'branch' },
      { header: 'Leave Type', key: 'leaveType' },
      { header: 'Start Date', key: 'startDate' },
      { header: 'End Date', key: 'endDate' },
      { header: 'Status', key: 'status' },
      { header: 'Reason', key: 'reason' }
    ];

    const rows = records.map((r) => ({
      employeeId: r.employeeId,
      name: r.employee.user.name,
      branch: r.branch.name,
      leaveType: r.leaveType,
      startDate: r.startDate.toISOString().split('T')[0],
      endDate: r.endDate.toISOString().split('T')[0],
      status: r.status,
      reason: r.reason
    }));

    if (format === 'excel') {
      const buffer = await exportToExcelBuffer('Leave Report', columns, rows);
      return { buffer, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
    } else {
      const buffer = await exportToCsvBuffer(columns, rows);
      return { buffer, mimeType: 'text/csv' };
    }
  }

  public static async generatePayrollReport(orgId: string, month: string, format: 'excel' | 'csv') {
    const records = await prisma.payroll.findMany({
      where: { organizationId: orgId, month },
      include: {
        employee: {
          include: { user: { select: { name: true } } }
        },
        branch: true
      },
      orderBy: { netSalary: 'desc' }
    });

    const columns = [
      { header: 'Employee ID', key: 'employeeId' },
      { header: 'Name', key: 'name' },
      { header: 'Branch', key: 'branch' },
      { header: 'Month', key: 'month' },
      { header: 'Base Salary', key: 'baseSalary' },
      { header: 'Overtime Pay', key: 'overtimePay' },
      { header: 'Bonus', key: 'bonus' },
      { header: 'Incentives', key: 'incentives' },
      { header: 'Leave Deductions', key: 'leaveDeductions' },
      { header: 'Late Penalties', key: 'latePenalties' },
      { header: 'Other Deductions', key: 'otherDeductions' },
      { header: 'Net Salary', key: 'netSalary' },
      { header: 'Status', key: 'status' }
    ];

    const rows = records.map((r) => ({
      employeeId: r.employeeId,
      name: r.employee.user.name,
      branch: r.branch.name,
      month: r.month,
      baseSalary: r.baseSalary,
      overtimePay: r.overtimePay,
      bonus: r.bonus,
      incentives: r.incentives,
      leaveDeductions: r.leaveDeductions,
      latePenalties: r.latePenalties,
      otherDeductions: r.otherDeductions,
      netSalary: r.netSalary,
      status: r.status
    }));

    if (format === 'excel') {
      const buffer = await exportToExcelBuffer('Payroll Report', columns, rows);
      return { buffer, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
    } else {
      const buffer = await exportToCsvBuffer(columns, rows);
      return { buffer, mimeType: 'text/csv' };
    }
  }
}
