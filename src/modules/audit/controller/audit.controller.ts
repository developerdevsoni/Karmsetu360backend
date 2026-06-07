import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../service/audit.service';
import { sendResponse } from '../../../utils/response';

export class AuditController {
  public static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.tenant?.organizationId;
      const result = await AuditService.fetchLogs(orgId!, req.query);
      return sendResponse(res, 200, true, 'Audit logs retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }
}
