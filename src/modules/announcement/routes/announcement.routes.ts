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

/**
 * @swagger
 * components:
 *   schemas:
 *     AudienceType:
 *       type: string
 *       enum: [ALL, BRANCH, DEPARTMENT]
 *       example: ALL
 *     Announcement:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "announcement_uuid_123"
 *         organizationId:
 *           type: string
 *           format: uuid
 *         branchId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           example: "branch_uuid_123"
 *         department:
 *           type: string
 *           nullable: true
 *           example: "Sales"
 *         title:
 *           type: string
 *           example: "Town Hall Meeting"
 *         content:
 *           type: string
 *           example: "Please join the monthly town hall tomorrow at 10 AM."
 *         audienceType:
 *           $ref: '#/components/schemas/AudienceType'
 *         scheduledFor:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreateAnnouncementRequest:
 *       type: object
 *       required:
 *         - title
 *         - content
 *       properties:
 *         title:
 *           type: string
 *           example: "Town Hall Meeting"
 *         content:
 *           type: string
 *           example: "Please join the monthly town hall tomorrow at 10 AM."
 *         branchId:
 *           type: string
 *           format: uuid
 *           example: "branch_uuid_123"
 *         department:
 *           type: string
 *           example: "Engineering"
 *         audienceType:
 *           $ref: '#/components/schemas/AudienceType'
 *         scheduledFor:
 *           type: string
 *           format: date-time
 *           example: "2026-06-09T10:00:00.000Z"
 */

const clientRouter = Router();
clientRouter.use(authenticate);
clientRouter.use(tenantContext);

const adminRouter = Router();
adminRouter.use(authenticate);
adminRouter.use(tenantContext);

// Announcement routes with custom permissions checks

/**
 * @swagger
 * /announcements:
 *   post:
 *     summary: Create Announcement
 *     description: Publish a new notice, news, or message targeting the organization, a branch, or a department. Requires admin, HR or manager.
 *     tags:
 *       - Announcement
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAnnouncementRequest'
 *     responses:
 *       201:
 *         description: Announcement created.
 */
adminRouter.post('/', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'BRANCH_MANAGER']), validate(createAnnouncementSchema), AnnouncementController.create);

/**
 * @swagger
 * /announcements/{id}:
 *   put:
 *     summary: Update Announcement details
 *     description: Edit an announcement's content or audience settings. Requires admin, HR or manager.
 *     tags:
 *       - Announcement
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Announcement ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAnnouncementRequest'
 *     responses:
 *       200:
 *         description: Announcement updated.
 */
adminRouter.put('/:id', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'BRANCH_MANAGER']), validate(updateAnnouncementSchema), AnnouncementController.update);

/**
 * @swagger
 * /announcements/{id}:
 *   delete:
 *     summary: Delete Announcement
 *     description: Remove a posted announcement. Requires admin, HR or manager.
 *     tags:
 *       - Announcement
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Announcement ID
 *     responses:
 *       200:
 *         description: Announcement deleted.
 */
adminRouter.delete('/:id', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'BRANCH_MANAGER']), AnnouncementController.delete);

/**
 * @swagger
 * /announcements/{id}:
 *   get:
 *     summary: Get Announcement Details
 *     description: Retrieve specific announcement details.
 *     tags:
 *       - Announcement
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Announcement ID
 *     responses:
 *       200:
 *         description: Announcement details retrieved.
 */
clientRouter.get('/:id', AnnouncementController.get);

/**
 * @swagger
 * /announcements:
 *   get:
 *     summary: List Announcements
 *     description: Retrieve list of all announcements visible to the user. Standard employees only see announcements targetting their department, branch, or all.
 *     tags:
 *       - Announcement
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of announcements.
 */
clientRouter.get('/', AnnouncementController.list);

export { clientRouter as clientAnnouncementRouter, adminRouter as adminAnnouncementRouter };
