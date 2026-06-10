import bcrypt from 'bcrypt';
import { prisma } from '../../../config/database';
import { AppError } from '../../../utils/response';
import { EmployeeStatus } from '../../../generated/prisma/client';

export class OnboardingService {
  public static async createOrganization(data: {
    name: string;
    logoUrl?: string;
    subscriptionTier?: string;
    branchName?: string;
    branchAddress?: string;
  }) {
    const durationDays = 30;
    const start = new Date();
    const end = new Date(start.getTime() + durationDays * 24 * 60 * 60 * 1000);

    return await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: data.name,
          logoUrl: data.logoUrl || null,
          subscriptionTier: data.subscriptionTier || 'FREE',
          subscriptionStatus: 'ACTIVE',
        },
      });

      // Create main branch
      const branch = await tx.branch.create({
        data: {
          organizationId: org.id,
          name: data.branchName || 'Main Branch',
          address: data.branchAddress || 'Main Campus',
        },
      });

      return {
        organization: org,
        mainBranch: branch,
      };
    });
  }

  public static async registerAdmin(data: {
    organizationId: string;
    branchId?: string;
    employeeId: string;
    fullName: string;
    email: string;
    mobileNumber: string;
    password: string;
    designation?: string;
    address?: string;
    department?: string;
  }) {
    // Verify organization exists
    const org = await prisma.organization.findUnique({
      where: { id: data.organizationId },
    });

    if (!org) {
      throw new AppError('Organization not found.', 404);
    }

    // Resolve and verify branch
    let resolvedBranchId = data.branchId;
    if (!resolvedBranchId) {
      const mainBranch = await prisma.branch.findFirst({
        where: { organizationId: data.organizationId },
        orderBy: { createdAt: 'asc' },
      });
      if (!mainBranch) {
        throw new AppError('No branch found for this organization.', 404);
      }
      resolvedBranchId = mainBranch.id;
    } else {
      const branch = await prisma.branch.findFirst({
        where: { id: resolvedBranchId, organizationId: data.organizationId },
      });
      if (!branch) {
        throw new AppError('Branch not found or does not belong to this organization.', 404);
      }
    }

    // Check if email already registered
    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    if (existingEmail) {
      throw new AppError('Email is already registered.', 400);
    }

    // Check if employee ID is already in use in this organization
    const existingEmpId = await prisma.employee.findUnique({
      where: {
        organizationId_employeeId: {
          organizationId: data.organizationId,
          employeeId: data.employeeId,
        },
      },
    });
    if (existingEmpId) {
      throw new AppError(`Employee ID '${data.employeeId}' is already taken in this organization.`, 400);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return await prisma.$transaction(async (tx) => {
      // Find ORG_ADMIN role (typically created by database seed)
      let adminRole = await tx.role.findFirst({
        where: { name: 'Organization Admin' },
      });

      // Fallback in case seeds are missing
      if (!adminRole) {
        adminRole = await tx.role.create({
          data: {
            name: 'Organization Admin',
            roleType: 'ORG_ADMIN',
          },
        });
      }

      // Create Admin User
      const user = await tx.user.create({
        data: {
          organizationId: data.organizationId,
          name: data.fullName,
          email: data.email.toLowerCase(),
          passwordHash: hashedPassword,
          status: EmployeeStatus.ACTIVE,
          roleId: adminRole.id,
        },
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          organizationId: true,
          createdAt: true,
        },
      });

      // Create Employee Profile linked to the User
      const employee = await tx.employee.create({
        data: {
          userId: user.id,
          organizationId: data.organizationId,
          branchId: resolvedBranchId as string,
          employeeId: data.employeeId,
          mobile: data.mobileNumber,
          address: data.address || 'Main Campus',
          department: data.department || 'Administration',
          designation: data.designation || 'Owner',
          joiningDate: new Date(),
          baseSalary: 0.0,
        },
      });

      // Log Audit Entry
      await tx.auditLog.create({
        data: {
          organizationId: org.id,
          userId: user.id,
          action: `ADMIN_REGISTERED: User ID ${user.id} registered as Org Admin with Employee ID ${employee.employeeId}`,
          entity: 'User',
          entityId: user.id,
        },
      });

      return {
        user,
        employee,
        role: adminRole.name,
      };
    });
  }
}
