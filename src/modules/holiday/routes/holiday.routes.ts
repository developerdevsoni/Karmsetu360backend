import { Router } from 'express';
import { HolidayController } from '../controller/holiday.controller';
import { validate } from '../../../middlewares/validation.middleware';
import { createHolidaySchema, updateHolidaySchema } from '../validator/holiday.validator';
import { authenticate } from '../../../middlewares/auth.middleware';
import { tenantContext } from '../../../middlewares/tenant.middleware';
import { authorizeRole } from '../../../middlewares/role.middleware';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

// Holiday endpoints with role permissions validation
router.post('/', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR']), validate(createHolidaySchema), HolidayController.create);
router.put('/:id', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR']), validate(updateHolidaySchema), HolidayController.update);
router.delete('/:id', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR']), HolidayController.delete);
router.get('/', HolidayController.list);

export default router;
