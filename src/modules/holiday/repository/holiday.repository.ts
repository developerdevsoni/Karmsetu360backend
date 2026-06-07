import { prisma } from '../../../config/database';

export class HolidayRepository {
  public static async create(organizationId: string, data: any) {
    return prisma.holiday.create({
      data: {
        organizationId,
        branchId: data.branchId || null,
        name: data.name,
        date: data.date,
        type: data.type
      }
    });
  }

  public static async update(id: string, organizationId: string, data: any) {
    return prisma.holiday.update({
      where: { id, organizationId },
      data
    });
  }

  public static async delete(id: string, organizationId: string) {
    return prisma.holiday.delete({
      where: { id, organizationId }
    });
  }

  public static async findById(id: string, organizationId: string) {
    return prisma.holiday.findFirst({
      where: { id, organizationId }
    });
  }

  public static async findAll(organizationId: string, branchId?: string) {
    const where: any = {
      organizationId,
      OR: [
        { branchId: null }, // Organization-wide holidays
        { branchId: branchId || undefined }
      ]
    };
    
    return prisma.holiday.findMany({
      where,
      orderBy: { date: 'asc' }
    });
  }
}
