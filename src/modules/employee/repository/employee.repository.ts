import { prisma } from '../../../config/database';
import { LeaveType, EmployeeStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

export interface EmployeeFilters {
  branchId?: string;
  department?: string;
  designation?: string;
  shiftId?: string;
  status?: string;
  search?: string;
}

export class EmployeeRepository {
  public static async create(organizationId: string, data: any) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    return prisma.$transaction(async (tx) => {
      // 1. Create User Account
      const user = await tx.user.create({
        data: {
          organizationId,
          name: data.name,
          email: data.email,
          passwordHash: hashedPassword,
          roleId: data.roleId,
          status: EmployeeStatus.ACTIVE
        }
      });

      // 2. Create Employee Profile
      const employee = await tx.employee.create({
        data: {
          userId: user.id,
          organizationId,
          branchId: data.branchId,
          employeeId: data.employeeId,
          mobile: data.mobile,
          address: data.address,
          department: data.department,
          designation: data.designation,
          joiningDate: data.joiningDate,
          shiftId: data.shiftId || null,
          baseSalary: data.baseSalary
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              role: true
            }
          },
          branch: true,
          shift: true
        }
      });

      // 3. Initialize default Leave Balances
      const defaultLeaves = [
        { leaveType: LeaveType.ANNUAL, balance: 12.0 },
        { leaveType: LeaveType.CASUAL, balance: 10.0 },
        { leaveType: LeaveType.SICK, balance: 8.0 },
        { leaveType: LeaveType.UNPAID, balance: 99.0 }
      ];

      await tx.leaveBalance.createMany({
        data: defaultLeaves.map(l => ({
          organizationId,
          employeeId: employee.id,
          leaveType: l.leaveType,
          balance: l.balance
        }))
      });

      return employee;
    });
  }

  public static async update(id: string, organizationId: string, data: any) {
    const employee = await prisma.employee.findFirst({
      where: { id, organizationId }
    });

    if (!employee) return null;

    return prisma.$transaction(async (tx) => {
      // Update User if name, email or status is modified
      const userUpdates: any = {};
      if (data.name) userUpdates.name = data.name;
      if (data.email) userUpdates.email = data.email;
      if (data.status) userUpdates.status = data.status;
      if (data.roleId) userUpdates.roleId = data.roleId;

      if (Object.keys(userUpdates).length > 0) {
        await tx.user.update({
          where: { id: employee.userId },
          data: userUpdates
        });
      }

      // Update Employee fields
      const employeeUpdates: any = {};
      if (data.branchId) employeeUpdates.branchId = data.branchId;
      if (data.mobile) employeeUpdates.mobile = data.mobile;
      if (data.address) employeeUpdates.address = data.address;
      if (data.department) employeeUpdates.department = data.department;
      if (data.designation) employeeUpdates.designation = data.designation;
      if (data.joiningDate) employeeUpdates.joiningDate = data.joiningDate;
      if (data.shiftId !== undefined) employeeUpdates.shiftId = data.shiftId;
      if (data.baseSalary !== undefined) employeeUpdates.baseSalary = data.baseSalary;

      return tx.employee.update({
        where: { id },
        data: employeeUpdates,
        include: {
          user: {
            select: {
              name: true,
              email: true,
              role: true,
              status: true
            }
          },
          branch: true,
          shift: true
        }
      });
    });
  }

  public static async findById(id: string, organizationId: string) {
    return prisma.employee.findFirst({
      where: { id, organizationId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            status: true,
            role: true
          }
        },
        branch: true,
        shift: true,
        leaveBalances: true
      }
    });
  }

  public static async findByUserId(userId: string, organizationId: string) {
    return prisma.employee.findFirst({
      where: { userId, organizationId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            status: true,
            role: true
          }
        },
        branch: true,
        shift: true,
        leaveBalances: true
      }
    });
  }

  public static async findAll(organizationId: string, filters: EmployeeFilters) {
    const whereClause: any = {
      organizationId,
      branchId: filters.branchId || undefined,
      department: filters.department || undefined,
      designation: filters.designation || undefined,
      shiftId: filters.shiftId || undefined
    };

    if (filters.status) {
      whereClause.user = { status: filters.status };
    }

    if (filters.search) {
      whereClause.OR = [
        { employeeId: { contains: filters.search, mode: 'insensitive' } },
        { mobile: { contains: filters.search } },
        { user: { name: { contains: filters.search, mode: 'insensitive' } } },
        { user: { email: { contains: filters.search, mode: 'insensitive' } } }
      ];
    }

    return prisma.employee.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            status: true,
            role: true
          }
        },
        branch: true,
        shift: true
      },
      orderBy: { employeeId: 'asc' }
    });
  }

  public static async delete(id: string, organizationId: string) {
    const employee = await prisma.employee.findFirst({
      where: { id, organizationId }
    });

    if (!employee) return null;

    return prisma.$transaction(async (tx) => {
      // Deleting employee cascades to user
      await tx.user.delete({
        where: { id: employee.userId }
      });
      return employee;
    });
  }
}
