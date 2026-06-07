import { Router } from 'express';
import { ReportController } from '../controller/report.controller';
import { authenticate } from '../../../middlewares/auth.middleware';
import { tenantContext } from '../../../middlewares/tenant.middleware';
import { authorizeRole } from '../../../middlewares/role.middleware';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

// Report download paths requiring specific authorization roles
router.get('/attendance', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'BRANCH_MANAGER']), ReportController.attendance);
router.get('/leave', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'BRANCH_MANAGER']), ReportController.leave);
router.get('/payroll', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR']), ReportController.payroll);

export default router;
