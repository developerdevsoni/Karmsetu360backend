import { prisma } from '../../../config/database';

export class OrganizationRepository {
  public static async create(name: string, logoUrl?: string) {
    return prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name, logoUrl }
      });
      // Initialize default settings alongside organization
      await tx.orgSettings.create({
        data: { organizationId: org.id }
      });
      return org;
    });
  }

  public static async update(id: string, data: any) {
    return prisma.organization.update({
      where: { id },
      data
    });
  }

  public static async findById(id: string) {
    return prisma.organization.findUnique({
      where: { id },
      include: {
        settings: true
      }
    });
  }

  public static async findAll() {
    return prisma.organization.findMany({
      include: {
        _count: {
          select: { branches: true, employees: true }
        }
      }
    });
  }

  public static async getSettings(organizationId: string) {
    return prisma.orgSettings.findUnique({
      where: { organizationId }
    });
  }

  public static async updateSettings(organizationId: string, data: any) {
    return prisma.orgSettings.update({
      where: { organizationId },
      data
    });
  }
}
