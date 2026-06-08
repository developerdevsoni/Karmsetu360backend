import { Router } from 'express';
import { NotificationController } from '../controller/notification.controller';
import { authenticate } from '../../../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * components:
 *   schemas:
 *     NotificationType:
 *       type: string
 *       enum: [ATTENDANCE, LEAVE, PAYROLL, HOLIDAY, ANNOUNCEMENT, SYSTEM]
 *       example: SYSTEM
 *     Notification:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "notif_uuid_123"
 *         userId:
 *           type: string
 *           format: uuid
 *           example: "user_uuid_123"
 *         title:
 *           type: string
 *           example: "Leave Request Approved"
 *         body:
 *           type: string
 *           example: "Your annual leave request from 2026-06-15 has been approved."
 *         type:
 *           $ref: '#/components/schemas/NotificationType'
 *         isRead:
 *           type: boolean
 *           example: false
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: List Notifications
 *     description: Retrieve list of all personal notifications for the authenticated user.
 *     tags:
 *       - Notification
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications.
 */
router.get('/', NotificationController.list);

/**
 * @swagger
 * /notifications/mark-all-read:
 *   put:
 *     summary: Mark All Read
 *     description: Mark all notifications for the authenticated user as read.
 *     tags:
 *       - Notification
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read.
 */
router.put('/mark-all-read', NotificationController.markAllRead);

/**
 * @swagger
 * /notifications/{id}/mark-read:
 *   put:
 *     summary: Mark Notification as Read
 *     description: Mark a specific notification as read.
 *     tags:
 *       - Notification
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read.
 */
router.put('/:id/mark-read', NotificationController.markRead);

/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     summary: Delete Notification
 *     description: Delete a specific notification record.
 *     tags:
 *       - Notification
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification deleted.
 */
router.delete('/:id', NotificationController.delete);

export default router;
