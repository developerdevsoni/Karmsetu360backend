import { Router } from 'express';
import authRoutes from './modules/auth/routes/auth.routes';
import organizationRoutes from './modules/organization/routes/organization.routes';
import branchRoutes from './modules/branch/routes/branch.routes';
import employeeRoutes from './modules/employee/routes/employee.routes';
import attendanceRoutes from './modules/attendance/routes/attendance.routes';
import shiftRoutes from './modules/shift/routes/shift.routes';
import leaveRoutes from './modules/leave/routes/leave.routes';
import holidayRoutes from './modules/holiday/routes/holiday.routes';
import payrollRoutes from './modules/payroll/routes/payroll.routes';
import announcementRoutes from './modules/announcement/routes/announcement.routes';
import notificationRoutes from './modules/notification/routes/notification.routes';
import reportRoutes from './modules/report/routes/report.routes';
import auditRoutes from './modules/audit/routes/audit.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/organizations', organizationRoutes);
router.use('/branches', branchRoutes);
router.use('/employees', employeeRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/shifts', shiftRoutes);
router.use('/leaves', leaveRoutes);
router.use('/holidays', holidayRoutes);
router.use('/payroll', payrollRoutes);
router.use('/announcements', announcementRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reports', reportRoutes);
router.use('/audit', auditRoutes);

export default router;
