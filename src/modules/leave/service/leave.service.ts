import { LeaveRepository } from '../repository/leave.repository';
import { AppError } from '../../../utils/response';
import { prisma } from '../../../config/database';
import { LeaveStatus, LeaveType } from '@prisma/client';
import { EmailService } from '../../../utils/email.service';

export class LeaveService {
  private static calculateLeaveDays(start: Date, end: Date): number {
    const diffMs = Math.abs(end.getTime() - start.getTime());
    // Add 1 to count both start and end dates inclusive
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1;
  }

  public static async applyLeave(userId: string, orgId: string, data: any) {
    const employee = await prisma.employee.findFirst({
      where: { userId, organizationId: orgId }
    });

    if (!employee) {
      throw new AppError('Employee profile not found.', 404);
    }

    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    if (start.getTime() > end.getTime()) {
      throw new AppError('Leave start date must be before or equal to the end date.', 400);
    }

    const days = this.calculateLeaveDays(start, end);

    // Verify balance if leave is not Unpaid
    if (data.leaveType !== LeaveType.UNPAID) {
      const balanceObj = await LeaveRepository.findBalanceByType(employee.id, data.leaveType);
      if (!balanceObj || balanceObj.balance < days) {
        throw new AppError(`Insufficient leave balance. Requested: ${days} days, Available: ${balanceObj?.balance || 0} days.`, 400);
      }
    }

    return LeaveRepository.create(orgId, employee.branchId, employee.id, data);
  }

  public static async processLeave(orgId: string, approverUserId: string, data: any) {
    const leave = await LeaveRepository.findById(data.leaveId, orgId);
    if (!leave) {
      throw new AppError('Leave application record not found.', 404);
    }

    if (leave.status !== LeaveStatus.PENDING) {
      throw new AppError(`Cannot process leave. Request is already in ${leave.status} state.`, 400);
    }

    const days = this.calculateLeaveDays(leave.startDate, leave.endDate);

    if (data.action === 'APPROVED') {
      // Deduct balance
      if (leave.leaveType !== LeaveType.UNPAID) {
        const balanceObj = await LeaveRepository.findBalanceByType(leave.employeeId, leave.leaveType);
        if (!balanceObj || balanceObj.balance < days) {
          throw new AppError(`Cannot approve leave. Employee has insufficient leave balance.`, 400);
        }
        await LeaveRepository.deductBalance(leave.employeeId, leave.leaveType, days);
      }

      await LeaveRepository.updateStatus(leave.id, orgId, LeaveStatus.APPROVED, approverUserId, data.comments);
    } else {
      await LeaveRepository.updateStatus(leave.id, orgId, LeaveStatus.REJECTED, approverUserId, data.comments);
    }

    // Queue email alert
    const templateName = data.action === 'APPROVED' ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED';
    await EmailService.queueEmail(leave.employee.user.email, `Leave Application Status Update`, templateName, {
      name: leave.employee.user.name,
      leaveType: leave.leaveType,
      startDate: leave.startDate.toLocaleDateString(),
      endDate: leave.endDate.toLocaleDateString(),
      comments: data.comments
    });

    return prisma.leave.findUnique({ where: { id: leave.id } });
  }

  public static async cancelLeave(userId: string, orgId: string, leaveId: string) {
    const employee = await prisma.employee.findFirst({
      where: { userId, organizationId: orgId }
    });

    if (!employee) {
      throw new AppError('Employee profile not found.', 404);
    }

    const leave = await prisma.leave.findFirst({
      where: { id: leaveId, employeeId: employee.id, organizationId: orgId }
    });

    if (!leave) {
      throw new AppError('Leave application record not found.', 404);
    }

    if (leave.status === LeaveStatus.CANCELLED || leave.status === LeaveStatus.REJECTED) {
      throw new AppError(`Cannot cancel a leave application in ${leave.status} state.`, 400);
    }

    const days = this.calculateLeaveDays(leave.startDate, leave.endDate);

    return prisma.$transaction(async (tx) => {
      // If approved earlier, refund the balance back
      if (leave.status === LeaveStatus.APPROVED && leave.leaveType !== LeaveType.UNPAID) {
        await tx.leaveBalance.update({
          where: {
            employeeId_leaveType: {
              employeeId: employee.id,
              leaveType: leave.leaveType
            }
          },
          data: {
            balance: {
              increment: days
            }
          }
        });
      }

      return tx.leave.update({
        where: { id: leaveId },
        data: {
          status: LeaveStatus.CANCELLED
        }
      });
    });
  }

  public static async getSelfHistory(userId: string, orgId: string) {
    const employee = await prisma.employee.findFirst({
      where: { userId, organizationId: orgId }
    });

    if (!employee) {
      throw new AppError('Employee profile not found.', 404);
    }

    return LeaveRepository.findSelfLeaves(employee.id);
  }

  public static async getSelfBalances(userId: string, orgId: string) {
    const employee = await prisma.employee.findFirst({
      where: { userId, organizationId: orgId }
    });

    if (!employee) {
      throw new AppError('Employee profile not found.', 404);
    }

    return LeaveRepository.getBalances(employee.id);
  }

  public static async listLeaves(orgId: string, filters: any) {
    return LeaveRepository.findAll(orgId, filters);
  }
}
