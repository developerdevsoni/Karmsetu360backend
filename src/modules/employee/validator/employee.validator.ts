import { z } from 'zod';

export const createEmployeeSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters long'),
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Temporary password must be at least 6 characters'),
    roleId: z.string().uuid('Invalid role ID'),
    branchId: z.string().uuid('Invalid branch ID'),
    employeeId: z.string().min(2, 'Employee ID field is required'),
    mobile: z.string().min(10, 'Mobile must be at least 10 digits'),
    address: z.string().min(5, 'Address must be at least 5 characters'),
    department: z.string().min(2, 'Department is required'),
    designation: z.string().min(2, 'Designation is required'),
    joiningDate: z.string().transform((val) => new Date(val)),
    shiftId: z.string().uuid().optional(),
    baseSalary: z.number().min(0, 'Base salary must be a positive number')
  })
});

export const updateEmployeeSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    roleId: z.string().uuid().optional(),
    branchId: z.string().uuid().optional(),
    mobile: z.string().optional(),
    address: z.string().optional(),
    department: z.string().optional(),
    designation: z.string().optional(),
    joiningDate: z.string().transform((val) => new Date(val)).optional(),
    shiftId: z.string().uuid().nullable().optional(),
    baseSalary: z.number().min(0).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional()
  })
});
