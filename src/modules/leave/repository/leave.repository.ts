import { prisma } from '../../../config/database';
import { LeaveStatus, LeaveType } from '@prisma/client';

export class LeaveRepository {
  public static async create(
    organizationId: string,
    branchId: string,
    employeeId: string,
    data: any
  ) {
    return prisma.leave.create({
      data: {
        organizationId,
        branchId,
        employeeId,
        leaveType: data.leaveType,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason,
        attachmentUrl: data.attachmentUrl || null,
        status: LeaveStatus.PENDING
      }
    });
  }

  public static async updateStatus(
    id: string,
    organizationId: string,
    status: LeaveStatus,
    approvedBy?: string,
    comments?: string
  ) {
    return prisma.leave.update({
      where: { id, organizationId },
      data: {
        status,
        approvedBy,
        comments
      }
    });
  }

  public static async findById(id: string, organizationId: string) {
    return prisma.leave.findFirst({
      where: { id, organizationId },
      include: {
        employee: {
          include: {
            user: { select: { name: true, email: true } }
          }
        }
      }
    });
  }

  public static async findAll(organizationId: string, filters: any) {
    const where: any = { organizationId };

    if (filters.branchId) where.branchId = filters.branchId;
    if (filters.status) where.status = filters.status;
    if (filters.leaveType) where.leaveType = filters.leaveType;
    if (filters.employeeId) where.employeeId = filters.employeeId;

    return prisma.leave.findMany({
      where,
      include: {
        employee: {
          include: {
            user: { select: { name: true, email: true } }
          }
        },
        branch: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  public static async findSelfLeaves(employeeId: string) {
    return prisma.leave.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' }
    });
  }

  public static async getBalances(employeeId: string) {
    return prisma.leaveBalance.findMany({
      where: { employeeId }
    });
  }

  public static async findBalanceByType(employeeId: string, leaveType: LeaveType) {
    return prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveType: {
          employeeId,
          leaveType
        }
      }
    });
  }

  public static async deductBalance(employeeId: string, leaveType: LeaveType, days: number) {
    return prisma.leaveBalance.update({
      where: {
        employeeId_leaveType: {
          employeeId,
          leaveType
        }
      },
      data: {
        balance: {
          decrement: days
        }
      }
    });
  }
}
