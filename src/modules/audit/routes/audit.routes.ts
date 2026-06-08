import { Router } from 'express';
import { AuditController } from '../controller/audit.controller';
import { authenticate } from '../../../middlewares/auth.middleware';
import { tenantContext } from '../../../middlewares/tenant.middleware';
import { authorizeRole } from '../../../middlewares/role.middleware';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

/**
 * @swagger
 * components:
 *   schemas:
 *     AuditLog:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "log_uuid_123"
 *         organizationId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         userId:
 *           type: string
 *           format: uuid
 *         action:
 *           type: string
 *           example: "EMPLOYEE_CREATED"
 *         entity:
 *           type: string
 *           example: "Employee"
 *         entityId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         oldValue:
 *           type: object
 *           nullable: true
 *         newValue:
 *           type: object
 *           nullable: true
 *         ipAddress:
 *           type: string
 *           nullable: true
 *           example: "127.0.0.1"
 *         userAgent:
 *           type: string
 *           nullable: true
 *         timestamp:
 *           type: string
 *           format: date-time
 */

// Restricted strictly to Organization Admins & Super Admins

/**
 * @swagger
 * /audit:
 *   get:
 *     summary: List Organization Audit Logs
 *     description: Retrieve logs of all administrative actions. Requires SUPER_ADMIN or ORG_ADMIN roles.
 *     tags:
 *       - Audit
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of audit logs.
 */
router.get('/', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN']), AuditController.list);

export default router;
