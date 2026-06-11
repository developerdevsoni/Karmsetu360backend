import { TaskRepository } from '../repository/task.repository';
import { prisma } from '../../../config/database';
import { AppError } from '../../../utils/response';
import { TaskStatus } from '@prisma/client';

export class TaskService {
  public static async createTask(
    orgId: string,
    creatorId: string,
    role: string,
    data: { employeeId?: string; title: string; description?: string; dueDate?: Date }
  ) {
    let targetEmployeeId = data.employeeId;

    if (role === 'EMPLOYEE') {
      const employee = await prisma.employee.findUnique({
        where: { userId: creatorId }
      });

      if (!employee) {
        throw new AppError('Employee profile not found.', 404);
      }

      if (targetEmployeeId && targetEmployeeId !== employee.id) {
        throw new AppError('Standard employees can only create and assign tasks to themselves.', 403);
      }

      targetEmployeeId = employee.id;
    } else {
      if (!targetEmployeeId) {
        throw new AppError('employeeId is required to assign a task.', 400);
      }

      // Check if the employee exists in this organization
      const employee = await prisma.employee.findFirst({
        where: {
          id: targetEmployeeId,
          organizationId: orgId
        }
      });

      if (!employee) {
        throw new AppError('Target employee profile not found in this organization.', 404);
      }
    }

    return TaskRepository.create(orgId, targetEmployeeId, creatorId, data);
  }

  public static async listTasks(
    orgId: string,
    userId: string,
    role: string,
    filters: { employeeId?: string; creatorId?: string; status?: TaskStatus }
  ) {
    // If the caller is an Employee, force filter by their own employee ID
    if (role === 'EMPLOYEE') {
      const employee = await prisma.employee.findUnique({
        where: { userId }
      });

      if (!employee) {
        throw new AppError('Employee profile not found.', 404);
      }

      // Restrict list strictly to own tasks
      return TaskRepository.findAll(orgId, { employeeId: employee.id });
    }

    // Admins, HR, and managers can view all tasks or apply filters
    return TaskRepository.findAll(orgId, filters);
  }

  public static async updateTaskStatus(
    id: string,
    orgId: string,
    userId: string,
    role: string,
    status: TaskStatus
  ) {
    const task = await TaskRepository.findById(id, orgId);

    if (!task) {
      throw new AppError('Task not found.', 404);
    }

    // If the caller is an Employee, ensure the task is assigned to them
    if (role === 'EMPLOYEE') {
      const employee = await prisma.employee.findUnique({
        where: { userId }
      });

      if (!employee || task.employeeId !== employee.id) {
        throw new AppError('Unauthorized: You can only update your own tasks.', 403);
      }
    }

    return TaskRepository.updateStatus(id, orgId, status);
  }

  public static async deleteTask(id: string, orgId: string) {
    const task = await TaskRepository.findById(id, orgId);

    if (!task) {
      throw new AppError('Task not found.', 404);
    }

    return TaskRepository.delete(id, orgId);
  }
}
