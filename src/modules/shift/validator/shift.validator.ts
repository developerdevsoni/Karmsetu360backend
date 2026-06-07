import { z } from 'zod';

export const createShiftSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format'),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format'),
    graceTime: z.number().int().min(0).default(15),
    breakDuration: z.number().int().min(0).default(60),
    workingHours: z.number().min(0).default(8.0)
  })
});

export const updateShiftSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    graceTime: z.number().int().min(0).optional(),
    breakDuration: z.number().int().min(0).optional(),
    workingHours: z.number().min(0).optional()
  })
});

export const assignShiftSchema = z.object({
  body: z.object({
    employeeIds: z.array(z.string().uuid('Invalid employee UUID')),
    shiftId: z.string().uuid('Invalid shift UUID').nullable()
  })
});
