import { Router } from 'express';
import { AnnouncementController } from '../controller/announcement.controller';
import { validate } from '../../../middlewares/validation.middleware';
import { createAnnouncementSchema, updateAnnouncementSchema } from '../validator/announcement.validator';
import { authenticate } from '../../../middlewares/auth.middleware';
import { tenantContext } from '../../../middlewares/tenant.middleware';
import { authorizeRole } from '../../../middlewares/role.middleware';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

// Announcement routes with custom permissions checks
router.post('/', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'BRANCH_MANAGER']), validate(createAnnouncementSchema), AnnouncementController.create);
router.put('/:id', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'BRANCH_MANAGER']), validate(updateAnnouncementSchema), AnnouncementController.update);
router.delete('/:id', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'BRANCH_MANAGER']), AnnouncementController.delete);
router.get('/:id', AnnouncementController.get);
router.get('/', AnnouncementController.list);

export default router;
