import { Request, Response, NextFunction } from 'express';
import { AttendanceService } from '../service/attendance.service';
import { sendResponse } from '../../../utils/response';

export class AttendanceController {
  public static async checkIn(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const orgId = req.user?.organizationId;
      const result = await AttendanceService.checkIn(userId!, orgId!);
      return sendResponse(res, 200, true, 'Check-in registered successfully.', result);
    } catch (error) {
      next(error);
    }
  }

  public static async checkOut(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const orgId = req.user?.organizationId;
      const result = await AttendanceService.checkOut(userId!, orgId!);
      return sendResponse(res, 200, true, 'Check-out registered successfully.', result);
    } catch (error) {
      next(error);
    }
  }

  public static async breakIn(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const orgId = req.user?.organizationId;
      const result = await AttendanceService.breakIn(userId!, orgId!);
      return sendResponse(res, 200, true, 'Break session started successfully.', result);
    } catch (error) {
      next(error);
    }
  }

  public static async breakOut(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const orgId = req.user?.organizationId;
      const result = await AttendanceService.breakOut(userId!, orgId!);
      return sendResponse(res, 200, true, 'Break session ended successfully.', result);
    } catch (error) {
      next(error);
    }
  }

  public static async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const orgId = req.user?.organizationId;
      const { startDate, endDate } = req.query;
      const result = await AttendanceService.getSelfHistory(userId!, orgId!, startDate as string, endDate as string);
      return sendResponse(res, 200, true, 'Self attendance logs retrieved successfully.', result);
    } catch (error) {
      next(error);
    }
  }

  public static async getLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.tenant?.organizationId;
      const result = await AttendanceService.listLogs(orgId!, req.query);
      return sendResponse(res, 200, true, 'Organization attendance logs retrieved successfully.', result);
    } catch (error) {
      next(error);
    }
  }

  public static async getAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.tenant?.organizationId;
      const branchId = req.query.branchId as string;
      const result = await AttendanceService.getAnalytics(orgId!, branchId);
      return sendResponse(res, 200, true, 'Attendance trends and analytics loaded successfully.', result);
    } catch (error) {
      next(error);
    }
  }

  public static async requestCorrection(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const orgId = req.user?.organizationId;
      const result = await AttendanceService.requestCorrection(userId!, orgId!, req.body);
      return sendResponse(res, 200, true, 'Attendance adjustment request submitted successfully.', result);
    } catch (error) {
      next(error);
    }
  }

  public static async processCorrection(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.tenant?.organizationId;
      const result = await AttendanceService.processCorrection(orgId!, req.body);
      return sendResponse(res, 200, true, 'Attendance adjustment request processed successfully.', result);
    } catch (error) {
      next(error);
    }
  }
}
