import { Router } from 'express';
import { LeaveController } from '../controller/leave.controller';
import { validate } from '../../../middlewares/validation.middleware';
import { applyLeaveSchema, processLeaveSchema } from '../validator/leave.validator';
import { authenticate } from '../../../middlewares/auth.middleware';
import { tenantContext } from '../../../middlewares/tenant.middleware';
import { authorizeRole } from '../../../middlewares/role.middleware';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

// Employee paths
router.post('/apply', validate(applyLeaveSchema), LeaveController.apply);
router.put('/:id/cancel', LeaveController.cancel);
router.get('/my/history', LeaveController.getHistory);
router.get('/my/balances', LeaveController.getBalances);

// Admin/HR/Manager paths
router.get('/logs', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'BRANCH_MANAGER']), LeaveController.list);
router.put('/process', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'BRANCH_MANAGER']), validate(processLeaveSchema), LeaveController.process);

export default router;
