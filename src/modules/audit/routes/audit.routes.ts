import { Router } from 'express';
import { AuditController } from '../controller/audit.controller';
import { authenticate } from '../../../middlewares/auth.middleware';
import { tenantContext } from '../../../middlewares/tenant.middleware';
import { authorizeRole } from '../../../middlewares/role.middleware';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

// Restricted strictly to Organization Admins & Super Admins
router.get('/', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN']), AuditController.list);

export default router;
