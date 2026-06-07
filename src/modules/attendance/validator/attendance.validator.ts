import { z } from 'zod';

export const checkInSchema = z.object({
  body: z.object({
    notes: z.string().optional()
  })
});

export const correctionSchema = z.object({
  body: z.object({
    attendanceId: z.string().uuid('Invalid attendance UUID'),
    notes: z.string().min(5, 'Reason for correction must be at least 5 characters'),
    correctedCheckIn: z.string().optional(), // Expected ISO Date String
    correctedCheckOut: z.string().optional() // Expected ISO Date String
  })
});

export const processCorrectionSchema = z.object({
  body: z.object({
    attendanceId: z.string().uuid('Invalid attendance UUID'),
    action: z.enum(['APPROVED', 'REJECTED']),
    comments: z.string().optional()
  })
});
