import { Request, Response, NextFunction } from 'express';
import { ShiftService } from '../service/shift.service';
import { sendResponse } from '../../../utils/response';

export class ShiftController {
  public static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.tenant?.organizationId;
      const result = await ShiftService.createShift(orgId!, req.body);
      return sendResponse(res, 201, true, 'Shift created successfully', result);
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.tenant?.organizationId;
      const id = req.params.id as string;
      const result = await ShiftService.updateShift(id, orgId!, req.body);
      return sendResponse(res, 200, true, 'Shift updated successfully', result);
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.tenant?.organizationId;
      const id = req.params.id as string;
      await ShiftService.deleteShift(id, orgId!);
      return sendResponse(res, 200, true, 'Shift configuration deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.tenant?.organizationId;
      const id = req.params.id as string;
      const result = await ShiftService.getShift(id, orgId!);
      return sendResponse(res, 200, true, 'Shift retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  public static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.tenant?.organizationId;
      const result = await ShiftService.listShifts(orgId!);
      return sendResponse(res, 200, true, 'All shifts retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  public static async assign(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.tenant?.organizationId;
      const { employeeIds, shiftId } = req.body;
      await ShiftService.assignShift(orgId!, employeeIds, shiftId);
      return sendResponse(res, 200, true, 'Shift parameters successfully assigned to staff.');
    } catch (error) {
      next(error);
    }
  }
}
