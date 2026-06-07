import { z } from 'zod';

export const createBranchSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Branch name must be at least 2 characters long'),
    address: z.string().min(5, 'Address must be at least 5 characters long')
  })
});

export const updateBranchSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    address: z.string().min(5).optional(),
    managerId: z.string().uuid().nullable().optional()
  })
});
