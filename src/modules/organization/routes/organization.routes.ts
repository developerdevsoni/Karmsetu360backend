import { Router } from 'express';
import { OrganizationController } from '../controller/organization.controller';
import { validate } from '../../../middlewares/validation.middleware';
import { createOrganizationSchema, updateOrganizationSchema, updateSettingsSchema } from '../validator/organization.validator';
import { authenticate } from '../../../middlewares/auth.middleware';
import { tenantContext } from '../../../middlewares/tenant.middleware';
import { authorizeRole } from '../../../middlewares/role.middleware';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Organization:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "org_uuid_123"
 *         name:
 *           type: string
 *           example: "Acme Corp"
 *         logoUrl:
 *           type: string
 *           nullable: true
 *           example: "https://example.com/logo.png"
 *         subscriptionTier:
 *           type: string
 *           example: "FREE"
 *         subscriptionStatus:
 *           type: string
 *           example: "ACTIVE"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     OrgSettings:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "settings_uuid_123"
 *         organizationId:
 *           type: string
 *           format: uuid
 *           example: "org_uuid_123"
 *         graceTimeMinutes:
 *           type: integer
 *           example: 15
 *         latePenaltyLimit:
 *           type: integer
 *           example: 3
 *         latePenaltyDeduction:
 *           type: number
 *           example: 0.5
 *         workingDaysPerMonth:
 *           type: integer
 *           example: 26
 *         notifyOnLeaveStatus:
 *           type: boolean
 *           example: true
 *         notifyOnPayrollGen:
 *           type: boolean
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

// Super Admin actions

/**
 * @swagger
 * /organizations:
 *   post:
 *     summary: Create Organization (Super Admin)
 *     description: Register a new tenant organization in the system. Requires SUPER_ADMIN permissions.
 *     tags:
 *       - Organization
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Acme Corp
 *     responses:
 *       201:
 *         description: Organization created.
 */
router.post('/', authenticate, authorizeRole(['SUPER_ADMIN']), validate(createOrganizationSchema), OrganizationController.create);

/**
 * @swagger
 * /organizations:
 *   get:
 *     summary: List Organizations (Super Admin)
 *     description: List all organizations registered in the platform. Requires SUPER_ADMIN permissions.
 *     tags:
 *       - Organization
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of organizations.
 */
router.get('/', authenticate, authorizeRole(['SUPER_ADMIN']), OrganizationController.list);

// Tenant profile actions

/**
 * @swagger
 * /organizations/my:
 *   get:
 *     summary: Get Current Organization Details
 *     description: Get current tenant organization profile. Requires authentication and tenant context.
 *     tags:
 *       - Organization
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current organization details.
 */
router.get('/my', authenticate, tenantContext, OrganizationController.get);

/**
 * @swagger
 * /organizations/my:
 *   put:
 *     summary: Update Organization Details
 *     description: Update organization details for current tenant. Requires ORG_ADMIN or SUPER_ADMIN role.
 *     tags:
 *       - Organization
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Acme Corporation Updated
 *               logoUrl:
 *                 type: string
 *                 example: https://example.com/new-logo.png
 *     responses:
 *       200:
 *         description: Organization updated.
 */
router.put('/my', authenticate, tenantContext, authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN']), validate(updateOrganizationSchema), OrganizationController.update);

// Settings actions

/**
 * @swagger
 * /organizations/my/settings:
 *   get:
 *     summary: Get Organization Settings
 *     description: Get payroll/shift late grace settings. Requires SUPER_ADMIN, ORG_ADMIN, or HR roles.
 *     tags:
 *       - Organization
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current organization settings.
 */
router.get('/my/settings', authenticate, tenantContext, authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR']), OrganizationController.getSettings);

/**
 * @swagger
 * /organizations/my/settings:
 *   put:
 *     summary: Update Organization Settings
 *     description: Update grace periods, penalty limits and deduction multipliers. Requires SUPER_ADMIN or ORG_ADMIN.
 *     tags:
 *       - Organization
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               graceTimeMinutes:
 *                 type: integer
 *                 example: 15
 *               latePenaltyLimit:
 *                 type: integer
 *                 example: 3
 *               latePenaltyDeduction:
 *                 type: number
 *                 example: 0.5
 *               workingDaysPerMonth:
 *                 type: integer
 *                 example: 26
 *               notifyOnLeaveStatus:
 *                 type: boolean
 *                 example: true
 *               notifyOnPayrollGen:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Organization settings updated.
 */
router.put('/my/settings', authenticate, tenantContext, authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN']), validate(updateSettingsSchema), OrganizationController.updateSettings);

export default router;
