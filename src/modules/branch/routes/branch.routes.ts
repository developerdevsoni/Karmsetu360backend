import { Router } from 'express';
import { BranchController } from '../controller/branch.controller';
import { validate } from '../../../middlewares/validation.middleware';
import { createBranchSchema, updateBranchSchema } from '../validator/branch.validator';
import { authenticate } from '../../../middlewares/auth.middleware';
import { tenantContext } from '../../../middlewares/tenant.middleware';
import { authorizeRole } from '../../../middlewares/role.middleware';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

// Branch endpoints with specific roles checks
router.post('/', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN']), validate(createBranchSchema), BranchController.create);
router.put('/:id', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'BRANCH_MANAGER']), validate(updateBranchSchema), BranchController.update);
router.delete('/:id', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN']), BranchController.delete);
router.get('/:id', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'BRANCH_MANAGER', 'EMPLOYEE']), BranchController.get);
router.get('/', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'BRANCH_MANAGER']), BranchController.list);

export default router;
