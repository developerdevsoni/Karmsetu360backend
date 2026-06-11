import { Request, Response, NextFunction } from 'express';
import { TaskService } from '../service/task.service';
import { sendResponse } from '../../../utils/response';
import { TaskStatus } from '@prisma/client';

export class TaskController {
  public static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.tenant?.organizationId;
      const creatorId = req.user?.userId;
      const role = req.user?.role;
      const { employeeId, title, description, dueDate } = req.body;

      const result = await TaskService.createTask(orgId!, creatorId!, role!, {
        employeeId,
        title,
        description,
        dueDate
      });

      return sendResponse(res, 201, true, 'Task created successfully', result);
    } catch (error) {
      next(error);
    }
  }

  public static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.tenant?.organizationId;
      const userId = req.user?.userId;
      const role = req.user?.role;
      const { employeeId, creatorId, status } = req.query;

      const result = await TaskService.listTasks(orgId!, userId!, role!, {
        employeeId: employeeId as string,
        creatorId: creatorId as string,
        status: status as TaskStatus
      });

      return sendResponse(res, 200, true, 'Tasks retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  public static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.tenant?.organizationId;
      const userId = req.user?.userId;
      const role = req.user?.role;
      const id = req.params.id as string;
      const { status } = req.body;

      const result = await TaskService.updateTaskStatus(id, orgId!, userId!, role!, status);

      return sendResponse(res, 200, true, 'Task status updated successfully', result);
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.tenant?.organizationId;
      const id = req.params.id as string;

      await TaskService.deleteTask(id, orgId!);

      return sendResponse(res, 200, true, 'Task deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
