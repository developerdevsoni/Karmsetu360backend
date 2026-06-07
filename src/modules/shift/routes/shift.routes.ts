import { Router } from 'express';
import { ShiftController } from '../controller/shift.controller';
import { validate } from '../../../middlewares/validation.middleware';
import { createShiftSchema, updateShiftSchema, assignShiftSchema } from '../validator/shift.validator';
import { authenticate } from '../../../middlewares/auth.middleware';
import { tenantContext } from '../../../middlewares/tenant.middleware';
import { authorizeRole } from '../../../middlewares/role.middleware';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

// Shift routes with role permissions checks
router.post('/', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR']), validate(createShiftSchema), ShiftController.create);
router.put('/assign', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'BRANCH_MANAGER']), validate(assignShiftSchema), ShiftController.assign);
router.put('/:id', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR']), validate(updateShiftSchema), ShiftController.update);
router.delete('/:id', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN']), ShiftController.delete);
router.get('/:id', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'BRANCH_MANAGER']), ShiftController.get);
router.get('/', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'BRANCH_MANAGER', 'EMPLOYEE']), ShiftController.list);

export default router;
