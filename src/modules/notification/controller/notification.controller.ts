import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../service/notification.service';
import { sendResponse } from '../../../utils/response';

export class NotificationController {
  public static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const result = await NotificationService.getNotifications(userId!);
      return sendResponse(res, 200, true, 'Notifications retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  public static async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const id = req.params.id as string;
      const result = await NotificationService.markRead(id, userId!);
      return sendResponse(res, 200, true, 'Notification marked as read successfully', result);
    } catch (error) {
      next(error);
    }
  }

  public static async markAllRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      await NotificationService.markAllRead(userId!);
      return sendResponse(res, 200, true, 'All notifications marked as read successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const id = req.params.id as string;
      await NotificationService.deleteNotification(id, userId!);
      return sendResponse(res, 200, true, 'Notification deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
