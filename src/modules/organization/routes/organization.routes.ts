import { Router } from 'express';
import { OrganizationController } from '../controller/organization.controller';
import { validate } from '../../../middlewares/validation.middleware';
import { createOrganizationSchema, updateOrganizationSchema, updateSettingsSchema } from '../validator/organization.validator';
import { authenticate } from '../../../middlewares/auth.middleware';
import { tenantContext } from '../../../middlewares/tenant.middleware';
import { authorizeRole } from '../../../middlewares/role.middleware';

const router = Router();

// Super Admin actions
router.post('/', authenticate, authorizeRole(['SUPER_ADMIN']), validate(createOrganizationSchema), OrganizationController.create);
router.get('/', authenticate, authorizeRole(['SUPER_ADMIN']), OrganizationController.list);

// Tenant profile actions
router.get('/my', authenticate, tenantContext, OrganizationController.get);
router.put('/my', authenticate, tenantContext, authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN']), validate(updateOrganizationSchema), OrganizationController.update);

// Settings actions
router.get('/my/settings', authenticate, tenantContext, authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR']), OrganizationController.getSettings);
router.put('/my/settings', authenticate, tenantContext, authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN']), validate(updateSettingsSchema), OrganizationController.updateSettings);

export default router;
