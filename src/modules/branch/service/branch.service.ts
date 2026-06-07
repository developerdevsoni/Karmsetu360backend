import { BranchRepository } from '../repository/branch.repository';
import { AppError } from '../../../utils/response';
import { prisma } from '../../../config/database';

export class BranchService {
  public static async createBranch(orgId: string, name: string, address: string) {
    return BranchRepository.create(orgId, name, address);
  }

  public static async updateBranch(id: string, orgId: string, data: any) {
    const branch = await BranchRepository.findById(id, orgId);
    if (!branch) {
      throw new AppError('Branch not found in this organization.', 404);
    }
    
    if (data.managerId) {
      // Confirm that the assigned manager exists and is active inside this organization
      const employee = await prisma.employee.findFirst({
        where: { id: data.managerId, organizationId: orgId }
      });
      if (!employee) {
        throw new AppError('Invalid Manager. The manager must be an employee inside your organization.', 400);
      }
    }
    
    return BranchRepository.update(id, orgId, data);
  }

  public static async deleteBranch(id: string, orgId: string) {
    const branch = await BranchRepository.findById(id, orgId);
    if (!branch) {
      throw new AppError('Branch not found in this organization.', 404);
    }
    
    const employeeCount = await prisma.employee.count({
      where: { branchId: id }
    });
    
    if (employeeCount > 0) {
      throw new AppError('Operation Denied. Cannot delete a branch with active employees assigned.', 400);
    }

    return BranchRepository.delete(id, orgId);
  }

  public static async getBranch(id: string, orgId: string) {
    const branch = await BranchRepository.findById(id, orgId);
    if (!branch) {
      throw new AppError('Branch not found in this organization.', 404);
    }
    return branch;
  }

  public static async listBranches(orgId: string) {
    return BranchRepository.findAll(orgId);
  }
}
