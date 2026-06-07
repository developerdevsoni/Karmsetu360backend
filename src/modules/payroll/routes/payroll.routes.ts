import { Router } from 'express';
import { PayrollController } from '../controller/payroll.controller';
import { validate } from '../../../middlewares/validation.middleware';
import { generatePayrollSchema, lockPayrollSchema, updatePayrollRowSchema } from '../validator/payroll.validator';
import { authenticate } from '../../../middlewares/auth.middleware';
import { tenantContext } from '../../../middlewares/tenant.middleware';
import { authorizeRole } from '../../../middlewares/role.middleware';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

// Employee actions
router.get('/my/payslips', PayrollController.listSelfPayslips);
router.get('/my/payslips/:id/download', PayrollController.downloadPayslip);

// Administrator / HR actions
router.post('/generate', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR']), validate(generatePayrollSchema), PayrollController.generate);
router.post('/lock', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN']), validate(lockPayrollSchema), PayrollController.lock);
router.put('/:id', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR']), validate(updatePayrollRowSchema), PayrollController.updateRow);
router.get('/:id', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'BRANCH_MANAGER']), PayrollController.get);
router.get('/', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'BRANCH_MANAGER']), PayrollController.list);

export default router;
