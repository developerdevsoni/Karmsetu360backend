import { prisma } from '../../../config/database';

export class ShiftRepository {
  public static async create(organizationId: string, data: any) {
    return prisma.shift.create({
      data: {
        organizationId,
        name: data.name,
        startTime: data.startTime,
        endTime: data.endTime,
        graceTime: data.graceTime,
        breakDuration: data.breakDuration,
        workingHours: data.workingHours
      }
    });
  }

  public static async update(id: string, organizationId: string, data: any) {
    return prisma.shift.update({
      where: { id, organizationId },
      data
    });
  }

  public static async delete(id: string, organizationId: string) {
    return prisma.shift.delete({
      where: { id, organizationId }
    });
  }

  public static async findById(id: string, organizationId: string) {
    return prisma.shift.findFirst({
      where: { id, organizationId }
    });
  }

  public static async findAll(organizationId: string) {
    return prisma.shift.findMany({
      where: { organizationId },
      include: {
        _count: {
          select: { employees: true }
        }
      }
    });
  }

  public static async assignShiftToEmployees(organizationId: string, employeeIds: string[], shiftId: string | null) {
    return prisma.employee.updateMany({
      where: {
        id: { in: employeeIds },
        organizationId
      },
      data: {
        shiftId
      }
    });
  }
}
