import { AttendanceRepository } from '../repository/attendance.repository';
import { AppError } from '../../../utils/response';
import { prisma } from '../../../config/database';
import { AttendanceStatus } from '@prisma/client';
import { exportToExcelBuffer, exportToCsvBuffer } from '../../../utils/excel.service';

export class AttendanceService {
  private static getMidnightDate(d = new Date()) {
    const nd = new Date(d);
    nd.setHours(0, 0, 0, 0);
    return nd;
  }

  private static getCurrentState(activities: any[]) {
    if (!activities || activities.length === 0) return 'CLOCKED_OUT';
    const last = activities[activities.length - 1];
    if (last.type === 'CHECK_IN' || last.type === 'BREAK_OUT') return 'CLOCKED_IN';
    if (last.type === 'BREAK_IN') return 'ON_BREAK';
    if (last.type === 'CHECK_OUT') return 'CLOCKED_OUT';
    return 'CLOCKED_OUT';
  }

  private static calculateAttendanceTotals(activities: any[]) {
    let totalWorkingMinutes = 0;
    let totalBreakMinutes = 0;
    
    let currentCheckIn: Date | null = null;
    let currentBreakIn: Date | null = null;
    
    const sorted = [...activities].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
    
    for (const event of sorted) {
      const eventTime = new Date(event.time);
      if (event.type === 'CHECK_IN') {
        currentCheckIn = eventTime;
      } else if (event.type === 'CHECK_OUT') {
        if (currentCheckIn) {
          let diffMs = eventTime.getTime() - currentCheckIn.getTime();
          totalWorkingMinutes += diffMs / 60000;
          currentCheckIn = null;
        }
      } else if (event.type === 'BREAK_IN') {
        currentBreakIn = eventTime;
      } else if (event.type === 'BREAK_OUT') {
        if (currentBreakIn) {
          let diffMs = eventTime.getTime() - currentBreakIn.getTime();
          let breakMins = diffMs / 60000;
          totalBreakMinutes += breakMins;
          totalWorkingMinutes -= breakMins;
          currentBreakIn = null;
        }
      }
    }
    
    return {
      workingHours: parseFloat(Math.max(0, totalWorkingMinutes / 60).toFixed(2)),
      breakDuration: Math.round(totalBreakMinutes)
    };
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
    
    const newEvent = { type: 'CHECK_IN', time: checkInDate.toISOString() };

    if (existing) {
      const activities = (existing.activities as any[]) || [];
      const currentState = this.getCurrentState(activities);
      
      if (currentState !== 'CLOCKED_OUT') {
        throw new AppError(`Cannot check in. Your current state is ${currentState}.`, 400);
      }
      
      activities.push(newEvent);
      
      return AttendanceRepository.updateAttendanceRecord(existing.id, {
        checkOut: null,
        breakIn: null,
        breakOut: null,
        activities
      });
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

    const initialActivities = [newEvent];

    return AttendanceRepository.createCheckIn(
      orgId,
      employee.branchId,
      employee.id,
      todayMidnight,
      checkInDate,
      status,
      undefined,
      initialActivities
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

    const activities = (attendance.activities as any[]) || [];
    const currentState = this.getCurrentState(activities);
    
    if (currentState === 'CLOCKED_OUT') {
      throw new AppError('Check-out has already been registered.', 400);
    }

    // If currently ON_BREAK, automatically check them out of break first
    if (currentState === 'ON_BREAK') {
      activities.push({ type: 'BREAK_OUT', time: checkOutDate.toISOString() });
    }

    activities.push({ type: 'CHECK_OUT', time: checkOutDate.toISOString() });

    const { workingHours, breakDuration } = this.calculateAttendanceTotals(activities);

    return AttendanceRepository.updateAttendanceRecord(attendance.id, {
      checkOut: checkOutDate,
      breakIn: null,
      breakOut: null,
      workingHours,
      breakDuration,
      activities
    });
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

    const activities = (attendance.activities as any[]) || [];
    const currentState = this.getCurrentState(activities);
    
    if (currentState !== 'CLOCKED_IN') {
      throw new AppError(`Cannot start a break when you are ${currentState}.`, 400);
    }

    activities.push({ type: 'BREAK_IN', time: breakInDate.toISOString() });

    return AttendanceRepository.updateAttendanceRecord(attendance.id, {
      breakIn: breakInDate,
      activities
    });
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

    if (!attendance) {
      throw new AppError('No active break session found to record checkout.', 400);
    }

    const activities = (attendance.activities as any[]) || [];
    const currentState = this.getCurrentState(activities);
    
    if (currentState !== 'ON_BREAK') {
      throw new AppError('You are not currently on an active break.', 400);
    }

    activities.push({ type: 'BREAK_OUT', time: breakOutDate.toISOString() });

    const { workingHours, breakDuration } = this.calculateAttendanceTotals(activities);

    return AttendanceRepository.updateAttendanceRecord(attendance.id, {
      breakOut: breakOutDate,
      breakIn: null,
      workingHours,
      breakDuration,
      activities
    });
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

  public static async getTodayStatus(userId: string, orgId: string) {
    const employee = await prisma.employee.findFirst({
      where: { userId, organizationId: orgId }
    });

    if (!employee) {
      throw new AppError('Employee profile not found.', 404);
    }

    const todayMidnight = this.getMidnightDate();
    const record = await AttendanceRepository.findTodayRecord(employee.id, todayMidnight);
    if (!record) return null;

    const activities = (record.activities as any[]) || [];
    const currentState = this.getCurrentState(activities);

    return {
      ...record,
      currentState
    };
  }

  public static async exportSelfHistory(
    userId: string,
    orgId: string,
    startDateStr?: string,
    endDateStr?: string,
    format: 'excel' | 'csv' = 'excel'
  ) {
    const employee = await prisma.employee.findFirst({
      where: { userId, organizationId: orgId },
      include: { user: { select: { name: true } } }
    });

    if (!employee) {
      throw new AppError('Employee profile not found.', 404);
    }

    const endDate = endDateStr ? new Date(endDateStr) : new Date();
    const startDate = startDateStr ? new Date(startDateStr) : new Date(new Date().setDate(endDate.getDate() - 30));

    const records = await AttendanceRepository.findHistory(employee.id, startDate, endDate);

    const columns = [
      { header: 'Date', key: 'date' },
      { header: 'Status', key: 'status' },
      { header: 'Check-In', key: 'checkIn' },
      { header: 'Check-Out', key: 'checkOut' },
      { header: 'Break Duration (mins)', key: 'breakDuration' },
      { header: 'Working Hours', key: 'workingHours' },
      { header: 'Notes', key: 'notes' }
    ];

    const rows = records.map(r => ({
      date: r.date.toISOString().split('T')[0],
      status: r.status,
      checkIn: r.checkIn.toISOString(),
      checkOut: r.checkOut ? r.checkOut.toISOString() : '',
      breakDuration: r.breakDuration,
      workingHours: r.workingHours,
      notes: r.notes || ''
    }));

    const cleanName = employee.user.name.replace(/\s+/g, '_');
    const filename = `attendance_logs_${cleanName}_${new Date().toISOString().split('T')[0]}`;

    let buffer: Buffer;
    let mimeType: string;
    
    if (format === 'csv') {
      buffer = await exportToCsvBuffer(columns, rows);
      mimeType = 'text/csv';
    } else {
      buffer = await exportToExcelBuffer('Attendance Logs', columns, rows);
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    }

    return { buffer, filename, mimeType };
  }

  public static async exportLogs(
    orgId: string,
    filters: any,
    format: 'excel' | 'csv' = 'excel'
  ) {
    const records = await AttendanceRepository.findAllLogs(orgId, filters);

    const columns = [
      { header: 'Employee ID', key: 'employeeId' },
      { header: 'Employee Name', key: 'employeeName' },
      { header: 'Email', key: 'email' },
      { header: 'Branch', key: 'branchName' },
      { header: 'Date', key: 'date' },
      { header: 'Status', key: 'status' },
      { header: 'Check-In', key: 'checkIn' },
      { header: 'Check-Out', key: 'checkOut' },
      { header: 'Break Duration (mins)', key: 'breakDuration' },
      { header: 'Working Hours', key: 'workingHours' },
      { header: 'Notes', key: 'notes' }
    ];

    const rows = records.map(r => ({
      employeeId: r.employee.employeeId,
      employeeName: r.employee.user.name,
      email: r.employee.user.email,
      branchName: r.branch.name,
      date: r.date.toISOString().split('T')[0],
      status: r.status,
      checkIn: r.checkIn.toISOString(),
      checkOut: r.checkOut ? r.checkOut.toISOString() : '',
      breakDuration: r.breakDuration,
      workingHours: r.workingHours,
      notes: r.notes || ''
    }));

    const filename = `attendance_logs_org_${orgId.substring(0, 8)}_${new Date().toISOString().split('T')[0]}`;

    let buffer: Buffer;
    let mimeType: string;
    
    if (format === 'csv') {
      buffer = await exportToCsvBuffer(columns, rows);
      mimeType = 'text/csv';
    } else {
      buffer = await exportToExcelBuffer('Attendance Logs', columns, rows);
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    }

    return { buffer, filename, mimeType };
  }
}
