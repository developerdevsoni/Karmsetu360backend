import { Router } from 'express';
import { AuthController } from '../controller/auth.controller';
import { validate } from '../../../middlewares/validation.middleware';
import { loginSchema, refreshTokenSchema, forgotPasswordSchema, resetPasswordSchema } from '../validator/auth.validator';
import { authenticate } from '../../../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *         password:
 *           type: string
 *           format: password
 *           minLength: 6
 *           example: password123
 *         deviceToken:
 *           type: string
 *           description: Push notification token for mobile devices
 *           example: "fcm_token_xyz..."
 *     LoginResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Logged in successfully
 *         data:
 *           type: object
 *           properties:
 *             accessToken:
 *               type: string
 *               example: "eyJhbGciOiJIUzI1NiIsIn..."
 *             refreshToken:
 *               type: string
 *               example: "eyJhbGciOiJIUzI1NiIsIn..."
 *             user:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "user_uuid_123"
 *                 email:
 *                   type: string
 *                   example: user@example.com
 *                 role:
 *                   type: string
 *                   example: "ORG_ADMIN"
 *     RefreshTokenRequest:
 *       type: object
 *       required:
 *         - refreshToken
 *       properties:
 *         refreshToken:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiIsIn..."
 *     ForgotPasswordRequest:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *     ResetPasswordRequest:
 *       type: object
 *       required:
 *         - token
 *         - newPassword
 *       properties:
 *         token:
 *           type: string
 *           description: The token received in the reset email
 *           example: "reset_token_abc123"
 *         newPassword:
 *           type: string
 *           format: password
 *           minLength: 6
 *           example: newSecurePassword456
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Error message detailed here"
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User Login
 *     description: Authenticate a user and return tokens (access token and refresh token).
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Validation or authentication error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', validate(loginSchema), AuthController.login);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: User Logout
 *     description: Invalidate the user's refresh token and active session.
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: The refresh token to invalidate
 *                 example: "eyJhbGciOiJIUzI1NiIsIn..."
 *               deviceToken:
 *                 type: string
 *                 description: Device token to remove
 *                 example: "fcm_token_xyz..."
 *     responses:
 *       200:
 *         description: Logged out successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Session logged out successfully
 *       401:
 *         description: Unauthorized.
 */
router.post('/logout', authenticate, AuthController.logout);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh Access Token
 *     description: Generate a new access token using a valid refresh token.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Token credentials refreshed successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsIn..."
 *                     refreshToken:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsIn..."
 *       400:
 *         description: Invalid or expired refresh token.
 */
router.post('/refresh-token', validate(refreshTokenSchema), AuthController.refresh);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request Password Reset Link
 *     description: Send a password reset email if the address exists in the system.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequest'
 *     responses:
 *       200:
 *         description: Request processed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: If the email matches our records, a password reset link has been dispatched.
 *       400:
 *         description: Invalid email format.
 */
router.post('/forgot-password', validate(forgotPasswordSchema), AuthController.forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset Password
 *     description: Reset user's password using the token sent via email.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 *     responses:
 *       200:
 *         description: Password reset successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Password changed successfully
 *       400:
 *         description: Invalid or expired reset token, or password too short.
 */
router.post('/reset-password', validate(resetPasswordSchema), AuthController.resetPassword);

export default router;
