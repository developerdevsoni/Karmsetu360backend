import { Request, Response, NextFunction } from 'express';
import { AnnouncementService } from '../service/announcement.service';
import { sendResponse } from '../../../utils/response';

export class AnnouncementController {
  public static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.tenant?.organizationId;
      const result = await AnnouncementService.create(orgId!, req.body);
      return sendResponse(res, 201, true, 'Announcement published successfully', result);
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.tenant?.organizationId;
      const id = req.params.id as string;
      const result = await AnnouncementService.update(id, orgId!, req.body);
      return sendResponse(res, 200, true, 'Announcement updated successfully', result);
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.tenant?.organizationId;
      const id = req.params.id as string;
      await AnnouncementService.delete(id, orgId!);
      return sendResponse(res, 200, true, 'Announcement deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.tenant?.organizationId;
      const id = req.params.id as string;
      const result = await AnnouncementService.get(id, orgId!);
      return sendResponse(res, 200, true, 'Announcement details retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  public static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.tenant?.organizationId;
      const role = req.user?.role;
      
      // Employees fetch filtered/scoped announcements list
      if (role === 'EMPLOYEE') {
        const userId = req.user?.userId;
        const result = await AnnouncementService.listEmployee(userId!, orgId!);
        return sendResponse(res, 200, true, 'Announcements retrieved successfully', result);
      }
      
      // Admins/HR list everything published in organization
      const result = await AnnouncementService.listAdmin(orgId!);
      return sendResponse(res, 200, true, 'Announcements retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }
}
