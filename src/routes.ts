import { Router } from 'express';
import authRoutes from './modules/auth/routes/auth.routes';
import organizationRoutes from './modules/organization/routes/organization.routes';
import branchRoutes from './modules/branch/routes/branch.routes';
import { clientEmployeeRouter, adminEmployeeRouter } from './modules/employee/routes/employee.routes';
import { clientAttendanceRouter, adminAttendanceRouter } from './modules/attendance/routes/attendance.routes';
import shiftRoutes from './modules/shift/routes/shift.routes';
import { clientLeaveRouter, adminLeaveRouter } from './modules/leave/routes/leave.routes';
import { clientHolidayRouter, adminHolidayRouter } from './modules/holiday/routes/holiday.routes';
import { clientPayrollRouter, adminPayrollRouter } from './modules/payroll/routes/payroll.routes';
import { clientAnnouncementRouter, adminAnnouncementRouter } from './modules/announcement/routes/announcement.routes';
import notificationRoutes from './modules/notification/routes/notification.routes';
import reportRoutes from './modules/report/routes/report.routes';
import auditRoutes from './modules/audit/routes/audit.routes';
import { clientTaskRouter, adminTaskRouter } from './modules/task/routes/task.routes';
import onboardingRoutes from './modules/onboarding/routes/onboarding.routes';
import { OnboardingController } from './modules/onboarding/controller/onboarding.controller';
import { validate } from './middlewares/validation.middleware';
import { registerAdminSchema } from './modules/onboarding/validator/onboarding.validator';

// 1. Client App Router (Standard Employee App)
export const clientRouter = Router();

clientRouter.use('/auth', authRoutes);
clientRouter.use('/employees', clientEmployeeRouter);
clientRouter.use('/attendance', clientAttendanceRouter);
clientRouter.use('/leaves', clientLeaveRouter);
clientRouter.use('/tasks', clientTaskRouter);
clientRouter.use('/payroll', clientPayrollRouter);
clientRouter.use('/announcements', clientAnnouncementRouter);
clientRouter.use('/notifications', notificationRoutes);
clientRouter.use('/holidays', clientHolidayRouter);

// 2. Admin/Server App Router (Management Console)
export const adminRouter = Router();

adminRouter.use('/auth', authRoutes); // Admins also use authentication endpoints
adminRouter.use('/onboarding', onboardingRoutes);
adminRouter.use('/organizations', organizationRoutes);
adminRouter.use('/branches', branchRoutes);
adminRouter.use('/employees', adminEmployeeRouter);
adminRouter.use('/attendance', adminAttendanceRouter);
adminRouter.use('/shifts', shiftRoutes);
adminRouter.use('/leaves', adminLeaveRouter);
adminRouter.use('/holidays', adminHolidayRouter);
adminRouter.use('/payroll', adminPayrollRouter);
adminRouter.use('/announcements', adminAnnouncementRouter);
adminRouter.use('/tasks', adminTaskRouter);
adminRouter.use('/reports', reportRoutes);
adminRouter.use('/audit', auditRoutes);

// Support POST /api/v1/admin/register directly
adminRouter.post('/register', validate(registerAdminSchema), OnboardingController.registerAdmin);

