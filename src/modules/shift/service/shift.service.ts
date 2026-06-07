import { ShiftRepository } from '../repository/shift.repository';
import { AppError } from '../../../utils/response';
import { prisma } from '../../../config/database';

export class ShiftService {
  public static async createShift(orgId: string, data: any) {
    return ShiftRepository.create(orgId, data);
  }

  public static async updateShift(id: string, orgId: string, data: any) {
    const shift = await ShiftRepository.findById(id, orgId);
    if (!shift) {
      throw new AppError('Shift configuration not found.', 404);
    }
    return ShiftRepository.update(id, orgId, data);
  }

  public static async deleteShift(id: string, orgId: string) {
    const shift = await ShiftRepository.findById(id, orgId);
    if (!shift) {
      throw new AppError('Shift configuration not found.', 404);
    }
    
    // Prevent deletion if employees are currently linked to this shift
    const count = await prisma.employee.count({
      where: { shiftId: id }
    });
    if (count > 0) {
      throw new AppError('Cannot delete shift. There are active employees assigned to this shift.', 400);
    }

    return ShiftRepository.delete(id, orgId);
  }

  public static async getShift(id: string, orgId: string) {
    const shift = await ShiftRepository.findById(id, orgId);
    if (!shift) {
      throw new AppError('Shift configuration not found.', 404);
    }
    return shift;
  }

  public static async listShifts(orgId: string) {
    return ShiftRepository.findAll(orgId);
  }

  public static async assignShift(orgId: string, employeeIds: string[], shiftId: string | null) {
    if (shiftId) {
      const shift = await ShiftRepository.findById(shiftId, orgId);
      if (!shift) {
        throw new AppError('Shift target configuration not found.', 404);
      }
    }
    return ShiftRepository.assignShiftToEmployees(orgId, employeeIds, shiftId);
  }
}
