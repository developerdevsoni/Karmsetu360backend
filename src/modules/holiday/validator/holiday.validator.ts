import { z } from 'zod';
import { HolidayType } from '@prisma/client';

export const createHolidaySchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    date: z.string().transform((val) => new Date(val)),
    type: z.nativeEnum(HolidayType),
    branchId: z.string().uuid().optional().nullable()
  })
});

export const updateHolidaySchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    date: z.string().transform((val) => new Date(val)).optional(),
    type: z.nativeEnum(HolidayType).optional(),
    branchId: z.string().uuid().nullable().optional()
  })
});
