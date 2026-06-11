import { prisma } from '../../../config/database';
import { AttendanceStatus, Prisma } from '@prisma/client';

export class AttendanceRepository {
  public static async findTodayRecord(employeeId: string, date: Date) {
    return prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date
        }
      }
    });
  }

  public static async createCheckIn(
    organizationId: string,
    branchId: string,
    employeeId: string,
    date: Date,
    checkIn: Date,
    status: AttendanceStatus,
    notes?: string,
    activities?: any
  ) {
    return prisma.attendance.create({
      data: {
        organizationId,
        branchId,
        employeeId,
        date,
        checkIn,
        status,
        notes,
        activities
      }
    });
  }

  public static async updateAttendanceRecord(
    id: string,
    data: {
      checkOut?: Date | null;
      breakIn?: Date | null;
      breakOut?: Date | null;
      breakDuration?: number;
      workingHours?: number;
      status?: AttendanceStatus;
      activities?: any;
    }
  ) {
    return prisma.attendance.update({
      where: { id },
      data
    });
  }

  public static async updateCheckOut(id: string, checkOut: Date, workingHours: number) {
    return prisma.attendance.update({
      where: { id },
      data: {
        checkOut,
        workingHours
      }
    });
  }

  public static async updateBreakIn(id: string, breakIn: Date) {
    return prisma.attendance.update({
      where: { id },
      data: {
        breakIn
      }
    });
  }

  public static async updateBreakOut(id: string, breakOut: Date, incrementBreakMinutes: number) {
    return prisma.attendance.update({
      where: { id },
      data: {
        breakOut,
        breakIn: null, // Clear active break state
        breakDuration: {
          increment: incrementBreakMinutes
        }
      }
    });
  }

  public static async findHistory(employeeId: string, startDate: Date, endDate: Date) {
    return prisma.attendance.findMany({
      where: {
        employeeId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { date: 'desc' }
    });
  }

  public static async findAllLogs(organizationId: string, filters: any) {
    const where: any = { organizationId };

    if (filters.branchId) where.branchId = filters.branchId;
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.date) {
      where.date = new Date(filters.date);
    } else if (filters.startDate && filters.endDate) {
      where.date = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate)
      };
    }

    if (filters.department || filters.designation) {
      where.employee = {
        department: filters.department || undefined,
        designation: filters.designation || undefined
      };
    }

    return prisma.attendance.findMany({
      where,
      include: {
        employee: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        },
        branch: true
      },
      orderBy: { date: 'desc' }
    });
  }

  public static async updateCorrectionField(id: string, correctionsJson: Prisma.InputJsonValue) {
    return prisma.attendance.update({
      where: { id },
      data: {
        corrections: correctionsJson
      }
    });
  }

  public static async applyCorrectionApproval(
    id: string,
    checkIn: Date,
    checkOut: Date | null,
    workingHours: number,
    status: AttendanceStatus,
    correctionsJson: Prisma.InputJsonValue
  ) {
    return prisma.attendance.update({
      where: { id },
      data: {
        checkIn,
        checkOut,
        workingHours,
        status,
        corrections: correctionsJson
      }
    });
  }
}
