import { Router } from 'express';
import multer from 'multer';
import { EmployeeController } from '../controller/employee.controller';
import { validate } from '../../../middlewares/validation.middleware';
import { createEmployeeSchema, updateEmployeeSchema } from '../validator/employee.validator';
import { authenticate } from '../../../middlewares/auth.middleware';
import { tenantContext } from '../../../middlewares/tenant.middleware';
import { authorizeRole } from '../../../middlewares/role.middleware';

// Memory storage specifically for excel parsing buffer
const importUpload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }
});

const router = Router();

router.use(authenticate);
router.use(tenantContext);

// Self profile retrieval
router.get('/profile', EmployeeController.getProfile);

// Bulk Excel operations
router.post('/import', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR']), importUpload.single('file'), EmployeeController.importEmployees);
router.get('/export', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR']), EmployeeController.exportEmployees);

// CRUD operations
router.post('/', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR']), validate(createEmployeeSchema), EmployeeController.create);
router.put('/:id', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'BRANCH_MANAGER']), validate(updateEmployeeSchema), EmployeeController.update);
router.delete('/:id', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN']), EmployeeController.delete);
router.put('/:id/deactivate', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR']), EmployeeController.deactivate);
router.get('/:id', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'BRANCH_MANAGER']), EmployeeController.get);
router.get('/', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'BRANCH_MANAGER']), EmployeeController.list);

export default router;
