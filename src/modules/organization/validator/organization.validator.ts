import { z } from 'zod';

export const createOrganizationSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters long'),
    logoUrl: z.string().optional()
  })
});

export const updateOrganizationSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    logoUrl: z.string().optional(),
    subscriptionTier: z.string().optional(),
    subscriptionStatus: z.string().optional()
  })
});

export const updateSettingsSchema = z.object({
  body: z.object({
    graceTimeMinutes: z.number().int().min(0).optional(),
    latePenaltyLimit: z.number().int().min(0).optional(),
    latePenaltyDeduction: z.number().min(0).optional(),
    workingDaysPerMonth: z.number().int().min(1).max(31).optional(),
    notifyOnLeaveStatus: z.boolean().optional(),
    notifyOnPayrollGen: z.boolean().optional()
  })
});
