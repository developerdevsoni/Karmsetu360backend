import { z } from 'zod';

export const generatePayrollSchema = z.object({
  body: z.object({
    month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
    branchId: z.string().uuid('Invalid branch UUID').optional()
  })
});

export const lockPayrollSchema = z.object({
  body: z.object({
    month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format')
  })
});

export const updatePayrollRowSchema = z.object({
  body: z.object({
    bonus: z.number().min(0).optional(),
    incentives: z.number().min(0).optional(),
    otherDeductions: z.number().min(0).optional()
  })
});
