import { Router } from 'express';
import { AuthController } from '../controller/auth.controller';
import { validate } from '../../../middlewares/validation.middleware';
import { loginSchema, refreshTokenSchema, forgotPasswordSchema, resetPasswordSchema } from '../validator/auth.validator';
import { authenticate } from '../../../middlewares/auth.middleware';

const router = Router();

router.post('/login', validate(loginSchema), AuthController.login);
router.post('/logout', authenticate, AuthController.logout);
router.post('/refresh-token', validate(refreshTokenSchema), AuthController.refresh);
router.post('/forgot-password', validate(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), AuthController.resetPassword);

export default router;
