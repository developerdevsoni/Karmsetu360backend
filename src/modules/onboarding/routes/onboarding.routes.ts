import { Router } from 'express';
import { OnboardingController } from '../controller/onboarding.controller';
import { validate } from '../../../middlewares/validation.middleware';
import { createOrganizationSchema, registerAdminSchema } from '../validator/onboarding.validator';

const router = Router();

router.post('/organization', validate(createOrganizationSchema), OnboardingController.createOrganization);
router.post('/admin', validate(registerAdminSchema), OnboardingController.registerAdmin);

export default router;
