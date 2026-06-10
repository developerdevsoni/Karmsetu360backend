import { z } from 'zod';

export const createOrganizationSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Organization name must be at least 2 characters'),
    logoUrl: z.string().url('Invalid logo URL').optional(),
    subscriptionTier: z.string().optional().default('FREE'),
    branchName: z.string().min(2, 'Branch name must be at least 2 characters').optional().default('Main Branch'),
    branchAddress: z.string().min(2, 'Branch address must be at least 2 characters').optional().default('Main Campus'),
  }),
});

export const registerAdminSchema = z.object({
  body: z.object({
    organizationId: z.string().uuid('Invalid organization ID'),
    branchId: z.string().uuid('Invalid branch ID').optional(),
    employeeId: z.string().min(2, 'Employee ID must be at least 2 characters'),
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    mobileNumber: z.string().min(10, 'Mobile number must be at least 10 digits'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    designation: z.string().optional().default('Owner'),
    address: z.string().optional().default('Main Campus'),
    department: z.string().optional().default('Administration'),
  }),
});
