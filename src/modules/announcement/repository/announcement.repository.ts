import { prisma } from '../../../config/database';

export class AnnouncementRepository {
  public static async create(organizationId: string, data: any) {
    return prisma.announcement.create({
      data: {
        organizationId,
        branchId: data.branchId || null,
        department: data.department || null,
        title: data.title,
        content: data.content,
        audienceType: data.audienceType
      }
    });
  }

  public static async update(id: string, organizationId: string, data: any) {
    return prisma.announcement.update({
      where: { id, organizationId },
      data
    });
  }

  public static async delete(id: string, organizationId: string) {
    return prisma.announcement.delete({
      where: { id, organizationId }
    });
  }

  public static async findById(id: string, organizationId: string) {
    return prisma.announcement.findFirst({
      where: { id, organizationId }
    });
  }

  public static async findAllAdmin(organizationId: string) {
    return prisma.announcement.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' }
    });
  }

  public static async findAllForEmployee(organizationId: string, branchId: string, department: string) {
    return prisma.announcement.findMany({
      where: {
        organizationId,
        OR: [
          { audienceType: 'ALL' },
          {
            AND: [
              { audienceType: 'BRANCH' },
              { branchId }
            ]
          },
          {
            AND: [
              { department }
            ]
          }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
