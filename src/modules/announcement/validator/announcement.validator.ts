import { z } from 'zod';
import { AudienceType } from '@prisma/client';

export const createAnnouncementSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    content: z.string().min(5, 'Content must be at least 5 characters'),
    audienceType: z.nativeEnum(AudienceType),
    branchId: z.string().uuid().optional().nullable(),
    department: z.string().optional().nullable()
  })
});

export const updateAnnouncementSchema = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    content: z.string().min(5).optional(),
    audienceType: z.nativeEnum(AudienceType).optional(),
    branchId: z.string().uuid().nullable().optional(),
    department: z.string().nullable().optional()
  })
});
