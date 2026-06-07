import { AttendanceRepository } from '../repository/attendance.repository';
import { AppError } from '../../../utils/response';
import { prisma } from '../../../config/database';
import { AttendanceStatus } from '@prisma/client';

export class AttendanceService {
  private static getMidnightDate(d = new Date()) {
    const nd = new Date(d);
    nd.setHours(0, 0, 0, 0);
    return nd;
  }

  public static async checkIn(userId: string, orgId: string, checkInDate = new Date()) {
    const employee = await prisma.employee.findFirst({
      where: { userId, organizationId: orgId },
      include: { shift: true }
    });

    if (!employee) {
      throw new AppError('Employee profile not found.', 404);
    }

    const todayMidnight = this.getMidnightDate(checkInDate);
    
    // Check if check-in already recorded
    const existing = await AttendanceRepository.findTodayRecord(employee.id, todayMidnight);
    if (existing) {
      throw new AppError('Check-in has already been registered for today.', 400);
    }

    // Determine status based on shift startTime & graceTime
    let status: AttendanceStatus = AttendanceStatus.PRESENT;
    if (employee.shift) {
      const [shiftH, shiftM] = employee.shift.startTime.split(':').map(Number);
      const checkInTotalMin = checkInDate.getHours() * 60 + checkInDate.getMinutes();
      const shiftTotalMin = shiftH * 60 + shiftM;
      
      if (checkInTotalMin > shiftTotalMin + employee.shift.graceTime) {
        status = AttendanceStatus.LATE;
      }
    }

    return AttendanceRepository.createCheckIn(
      orgId,
      employee.branchId,
      employee.id,
      todayMidnight,
      checkInDate,
      status
    );
  }

  public static async checkOut(userId: string, orgId: string, checkOutDate = new Date()) {
    const employee = await prisma.employee.findFirst({
      where: { userId, organizationId: orgId }
    });

    if (!employee) {
      throw new AppError('Employee profile not found.', 404);
    }

    const todayMidnight = this.getMidnightDate(checkOutDate);
    const attendance = await AttendanceRepository.findTodayRecord(employee.id, todayMidnight);
    
    if (!attendance) {
      throw new AppError('No active check-in log found for today. Please check-in first.', 400);
    }

    if (attendance.checkOut) {
      throw new AppError('Check-out has already been registered for today.', 400);
    }

    // Calculate working hours: difference between check-in and check-out (in milliseconds)
    // minus breakDuration (which is stored in minutes)
    const diffMs = checkOutDate.getTime() - attendance.checkIn.getTime();
    const totalWorkedMinutes = Math.max(0, (diffMs / 60000) - attendance.breakDuration);
    const workingHours = parseFloat((totalWorkedMinutes / 60).toFixed(2));

    return AttendanceRepository.updateCheckOut(attendance.id, checkOutDate, workingHours);
  }

  public static async breakIn(userId: string, orgId: string, breakInDate = new Date()) {
    const employee = await prisma.employee.findFirst({
      where: { userId, organizationId: orgId }
    });

    if (!employee) {
      throw new AppError('Employee profile not found.', 404);
    }

    const todayMidnight = this.getMidnightDate(breakInDate);
    const attendance = await AttendanceRepository.findTodayRecord(employee.id, todayMidnight);

    if (!attendance) {
      throw new AppError('No active attendance record found for today.', 400);
    }

    if (attendance.checkOut) {
      throw new AppError('Check-out has already been registered. Cannot break in.', 400);
    }

    if (attendance.breakIn) {
      throw new AppError('You are already on an active break.', 400);
    }

    return AttendanceRepository.updateBreakIn(attendance.id, breakInDate);
  }

  public static async breakOut(userId: string, orgId: string, breakOutDate = new Date()) {
    const employee = await prisma.employee.findFirst({
      where: { userId, organizationId: orgId }
    });

    if (!employee) {
      throw new AppError('Employee profile not found.', 404);
    }

    const todayMidnight = this.getMidnightDate(breakOutDate);
    const attendance = await AttendanceRepository.findTodayRecord(employee.id, todayMidnight);

    if (!attendance || !attendance.breakIn) {
      throw new AppError('No active break session found to record checkout.', 400);
    }

    const diffMs = breakOutDate.getTime() - attendance.breakIn.getTime();
    const breakMinutes = Math.max(0, Math.round(diffMs / 60000));

    return AttendanceRepository.updateBreakOut(attendance.id, breakOutDate, breakMinutes);
  }

  public static async getSelfHistory(userId: string, orgId: string, startDateStr?: string, endDateStr?: string) {
    const employee = await prisma.employee.findFirst({
      where: { userId, organizationId: orgId }
    });

    if (!employee) {
      throw new AppError('Employee profile not found.', 404);
    }

    const endDate = endDateStr ? new Date(endDateStr) : new Date();
    const startDate = startDateStr ? new Date(startDateStr) : new Date(new Date().setDate(endDate.getDate() - 30));

    return AttendanceRepository.findHistory(employee.id, startDate, endDate);
  }

  public static async listLogs(orgId: string, filters: any) {
    return AttendanceRepository.findAllLogs(orgId, filters);
  }

  public static async requestCorrection(userId: string, orgId: string, data: any) {
    const employee = await prisma.employee.findFirst({
      where: { userId, organizationId: orgId }
    });

    if (!employee) {
      throw new AppError('Employee profile not found.', 404);
    }

    const attendance = await prisma.attendance.findFirst({
      where: { id: data.attendanceId, employeeId: employee.id, organizationId: orgId }
    });

    if (!attendance) {
      throw new AppError('Attendance record not found.', 404);
    }

    const currentCorrections = (attendance.corrections as any[]) || [];
    
    // Add new correction request
    const newRequest = {
      id: Math.random().toString(36).substring(2, 9),
      notes: data.notes,
      correctedCheckIn: data.correctedCheckIn ? new Date(data.correctedCheckIn).toISOString() : null,
      correctedCheckOut: data.correctedCheckOut ? new Date(data.correctedCheckOut).toISOString() : null,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    currentCorrections.push(newRequest);
    return AttendanceRepository.updateCorrectionField(attendance.id, currentCorrections);
  }

  public static async processCorrection(orgId: string, data: any) {
    const attendance = await prisma.attendance.findFirst({
      where: { id: data.attendanceId, organizationId: orgId },
      include: {
        employee: {
          include: { shift: true }
        }
      }
    });

    if (!attendance) {
      throw new AppError('Attendance record not found.', 404);
    }

    const corrections = (attendance.corrections as any[]) || [];
    const pendingRequest = corrections.find(c => c.status === 'PENDING');
    
    if (!pendingRequest) {
      throw new AppError('No pending correction requests found on this log entry.', 400);
    }

    pendingRequest.status = data.action; // APPROVED or REJECTED
    pendingRequest.comments = data.comments || '';
    pendingRequest.processedAt = new Date().toISOString();

    if (data.action === 'REJECTED') {
      return AttendanceRepository.updateCorrectionField(attendance.id, corrections);
    }

    // Apply corrected times if approved
    const checkIn = pendingRequest.correctedCheckIn ? new Date(pendingRequest.correctedCheckIn) : attendance.checkIn;
    const checkOut = pendingRequest.correctedCheckOut ? new Date(pendingRequest.correctedCheckOut) : attendance.checkOut;

    let workingHours = attendance.workingHours;
    if (checkIn && checkOut) {
      const diffMs = checkOut.getTime() - checkIn.getTime();
      const totalWorkedMinutes = Math.max(0, (diffMs / 60000) - attendance.breakDuration);
      workingHours = parseFloat((totalWorkedMinutes / 60).toFixed(2));
    }

    // Recalculate status LATE / PRESENT
    let status = attendance.status;
    if (attendance.employee.shift) {
      const [shiftH, shiftM] = attendance.employee.shift.startTime.split(':').map(Number);
      const checkInTotalMin = checkIn.getHours() * 60 + checkIn.getMinutes();
      const shiftTotalMin = shiftH * 60 + shiftM;
      status = (checkInTotalMin > shiftTotalMin + attendance.employee.shift.graceTime)
        ? AttendanceStatus.LATE
        : AttendanceStatus.PRESENT;
    }

    return AttendanceRepository.applyCorrectionApproval(
      attendance.id,
      checkIn,
      checkOut,
      workingHours,
      status,
      corrections
    );
  }

  public static async getAnalytics(orgId: string, branchId?: string) {
    const todayMidnight = this.getMidnightDate();
    const baseWhere: any = {
      organizationId: orgId,
      date: todayMidnight
    };

    if (branchId) {
      baseWhere.branchId = branchId;
    }

    const [totalEmployees, presentToday, lateToday, leavesApproved] = await Promise.all([
      prisma.employee.count({ where: { organizationId: orgId, branchId: branchId || undefined } }),
      prisma.attendance.count({ where: { ...baseWhere, status: { in: ['PRESENT', 'LATE'] } } }),
      prisma.attendance.count({ where: { ...baseWhere, status: 'LATE' } }),
      prisma.leave.count({
        where: {
          organizationId: orgId,
          branchId: branchId || undefined,
          status: 'APPROVED',
          startDate: { lte: todayMidnight },
          endDate: { gte: todayMidnight }
        }
      })
    ]);

    const absentToday = Math.max(0, totalEmployees - presentToday - leavesApproved);

    return {
      totalEmployees,
      presentToday,
      lateToday,
      onLeave: leavesApproved,
      absentToday
    };
  }
}
