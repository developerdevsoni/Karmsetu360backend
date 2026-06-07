import { z } from 'zod';
import { LeaveType } from '@prisma/client';

export const applyLeaveSchema = z.object({
  body: z.object({
    leaveType: z.nativeEnum(LeaveType),
    startDate: z.string().transform((val) => new Date(val)),
    endDate: z.string().transform((val) => new Date(val)),
    reason: z.string().min(5, 'Reason for leave must be at least 5 characters'),
    attachmentUrl: z.string().optional()
  })
});

export const processLeaveSchema = z.object({
  body: z.object({
    leaveId: z.string().uuid('Invalid leave UUID'),
    action: z.enum(['APPROVED', 'REJECTED']),
    comments: z.string().optional()
  })
});
