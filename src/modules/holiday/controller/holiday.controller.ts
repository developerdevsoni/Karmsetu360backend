import { Request, Response, NextFunction } from 'express';
import { HolidayService } from '../service/holiday.service';
import { sendResponse } from '../../../utils/response';

export class HolidayController {
  public static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.tenant?.organizationId;
      const result = await HolidayService.createHoliday(orgId!, req.body);
      return sendResponse(res, 201, true, 'Holiday entry registered successfully', result);
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.tenant?.organizationId;
      const id = req.params.id as string;
      const result = await HolidayService.updateHoliday(id, orgId!, req.body);
      return sendResponse(res, 200, true, 'Holiday entry updated successfully', result);
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.tenant?.organizationId;
      const id = req.params.id as string;
      await HolidayService.deleteHoliday(id, orgId!);
      return sendResponse(res, 200, true, 'Holiday entry deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.tenant?.organizationId;
      // Fetch user specific branch context if not explicitly queried
      const branchId = (req.query.branchId as string) || req.user?.branchId;
      const result = await HolidayService.listHolidays(orgId!, branchId);
      return sendResponse(res, 200, true, 'Holiday calendar retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }
}
