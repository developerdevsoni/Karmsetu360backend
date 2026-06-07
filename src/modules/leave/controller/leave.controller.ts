import { Request, Response, NextFunction } from 'express';
import { LeaveService } from '../service/leave.service';
import { sendResponse } from '../../../utils/response';

export class LeaveController {
  public static async apply(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const orgId = req.user?.organizationId;
      const result = await LeaveService.applyLeave(userId!, orgId!, req.body);
      return sendResponse(res, 201, true, 'Leave applied successfully', result);
    } catch (error) {
      next(error);
    }
  }

  public static async process(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.tenant?.organizationId;
      const approverUserId = req.user?.userId;
      const result = await LeaveService.processLeave(orgId!, approverUserId!, req.body);
      return sendResponse(res, 200, true, 'Leave request processed successfully', result);
    } catch (error) {
      next(error);
    }
  }

  public static async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const orgId = req.user?.organizationId;
      const id = req.params.id as string;
      const result = await LeaveService.cancelLeave(userId!, orgId!, id);
      return sendResponse(res, 200, true, 'Leave application cancelled successfully', result);
    } catch (error) {
      next(error);
    }
  }

  public static async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const orgId = req.user?.organizationId;
      const result = await LeaveService.getSelfHistory(userId!, orgId!);
      return sendResponse(res, 200, true, 'Self leave history retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  public static async getBalances(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const orgId = req.user?.organizationId;
      const result = await LeaveService.getSelfBalances(userId!, orgId!);
      return sendResponse(res, 200, true, 'Leave balances retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  public static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.tenant?.organizationId;
      const result = await LeaveService.listLeaves(orgId!, req.query);
      return sendResponse(res, 200, true, 'Leave applications list retrieved', result);
    } catch (error) {
      next(error);
    }
  }
}
