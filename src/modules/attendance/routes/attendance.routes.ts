import { Router } from 'express';
import { AttendanceController } from '../controller/attendance.controller';
import { validate } from '../../../middlewares/validation.middleware';
import { checkInSchema, correctionSchema, processCorrectionSchema } from '../validator/attendance.validator';
import { authenticate } from '../../../middlewares/auth.middleware';
import { tenantContext } from '../../../middlewares/tenant.middleware';
import { authorizeRole } from '../../../middlewares/role.middleware';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

// Employee actions
router.post('/check-in', validate(checkInSchema), AttendanceController.checkIn);
router.post('/check-out', AttendanceController.checkOut);
router.post('/break-in', AttendanceController.breakIn);
router.post('/break-out', AttendanceController.breakOut);
router.get('/history', AttendanceController.getHistory);
router.post('/correction', validate(correctionSchema), AttendanceController.requestCorrection);

// Administrator actions
router.get('/logs', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'BRANCH_MANAGER']), AttendanceController.getLogs);
router.get('/analytics', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'BRANCH_MANAGER']), AttendanceController.getAnalytics);
router.put('/correction/process', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'BRANCH_MANAGER']), validate(processCorrectionSchema), AttendanceController.processCorrection);

export default router;
