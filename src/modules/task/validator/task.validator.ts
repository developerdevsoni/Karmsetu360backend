import { z } from 'zod';
import { TaskStatus } from '@prisma/client';

export const createTaskSchema = z.object({
  body: z.object({
    employeeId: z.string().uuid('Invalid employee UUID format').optional(),
    title: z.string().min(3, 'Title must be at least 3 characters long'),
    description: z.string().optional(),
    dueDate: z.string().optional().transform((val) => (val ? new Date(val) : undefined))
  })
});

export const updateTaskStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(TaskStatus)
  })
});
