import { prisma } from '../../../config/database';

export class BranchRepository {
  public static async create(organizationId: string, name: string, address: string) {
    return prisma.branch.create({
      data: {
        organizationId,
        name,
        address
      }
    });
  }

  public static async update(id: string, organizationId: string, data: any) {
    return prisma.branch.update({
      where: { id, organizationId },
      data
    });
  }

  public static async delete(id: string, organizationId: string) {
    return prisma.branch.delete({
      where: { id, organizationId }
    });
  }

  public static async findById(id: string, organizationId: string) {
    return prisma.branch.findFirst({
      where: { id, organizationId }
    });
  }

  public static async findAll(organizationId: string) {
    return prisma.branch.findMany({
      where: { organizationId },
      include: {
        _count: {
          select: { employees: true }
        }
      }
    });
  }
}
