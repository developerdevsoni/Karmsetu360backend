import { prisma } from '../../../config/database';
import { TaskStatus } from '@prisma/client';

export class TaskRepository {
  public static async create(
    organizationId: string,
    employeeId: string,
    creatorId: string,
    data: { title: string; description?: string; dueDate?: Date }
  ) {
    return prisma.task.create({
      data: {
        organizationId,
        employeeId,
        creatorId,
        title: data.title,
        description: data.description,
        dueDate: data.dueDate,
        status: TaskStatus.PENDING
      }
    });
  }

  public static async findById(id: string, organizationId: string) {
    return prisma.task.findFirst({
      where: {
        id,
        organizationId
      },
      include: {
        employee: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        },
        creator: {
          select: { id: true, name: true, email: true }
        }
      }
    });
  }

  public static async findAll(organizationId: string, filters: { employeeId?: string; creatorId?: string; status?: TaskStatus }) {
    const where: any = { organizationId };

    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.creatorId) where.creatorId = filters.creatorId;
    if (filters.status) where.status = filters.status;

    return prisma.task.findMany({
      where,
      include: {
        employee: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        },
        creator: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  public static async updateStatus(id: string, organizationId: string, status: TaskStatus) {
    return prisma.task.update({
      where: {
        id,
        organizationId
      },
      data: {
        status
      }
    });
  }

  public static async delete(id: string, organizationId: string) {
    return prisma.task.delete({
      where: {
        id,
        organizationId
      }
    });
  }
}
