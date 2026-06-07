import { HolidayRepository } from '../repository/holiday.repository';
import { AppError } from '../../../utils/response';

export class HolidayService {
  public static async createHoliday(orgId: string, data: any) {
    return HolidayRepository.create(orgId, data);
  }

  public static async updateHoliday(id: string, orgId: string, data: any) {
    const holiday = await HolidayRepository.findById(id, orgId);
    if (!holiday) {
      throw new AppError('Holiday record not found.', 404);
    }
    return HolidayRepository.update(id, orgId, data);
  }

  public static async deleteHoliday(id: string, orgId: string) {
    const holiday = await HolidayRepository.findById(id, orgId);
    if (!holiday) {
      throw new AppError('Holiday record not found.', 404);
    }
    return HolidayRepository.delete(id, orgId);
  }

  public static async listHolidays(orgId: string, branchId?: string) {
    return HolidayRepository.findAll(orgId, branchId);
  }
}
