import { Router } from 'express';
import { LeaveController } from '../controller/leave.controller';
import { validate } from '../../../middlewares/validation.middleware';
import { applyLeaveSchema, processLeaveSchema } from '../validator/leave.validator';
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
 *     LeaveType:
 *       type: string
 *       enum: [ANNUAL, CASUAL, SICK, UNPAID]
 *       example: ANNUAL
 *     LeaveStatus:
 *       type: string
 *       enum: [PENDING, APPROVED, REJECTED, CANCELLED]
 *       example: PENDING
 *     Leave:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "leave_uuid_123"
 *         organizationId:
 *           type: string
 *           format: uuid
 *         branchId:
 *           type: string
 *           format: uuid
 *         employeeId:
 *           type: string
 *           format: uuid
 *         leaveType:
 *           $ref: '#/components/schemas/LeaveType'
 *         status:
 *           $ref: '#/components/schemas/LeaveStatus'
 *         startDate:
 *           type: string
 *           format: date
 *           example: "2026-06-15"
 *         endDate:
 *           type: string
 *           format: date
 *           example: "2026-06-17"
 *         reason:
 *           type: string
 *           example: "Family function"
 *         attachmentUrl:
 *           type: string
 *           nullable: true
 *         approvedBy:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         comments:
 *           type: string
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     LeaveBalance:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         organizationId:
 *           type: string
 *           format: uuid
 *         employeeId:
 *           type: string
 *           format: uuid
 *         leaveType:
 *           $ref: '#/components/schemas/LeaveType'
 *         balance:
 *           type: number
 *           example: 12.5
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     ApplyLeaveRequest:
 *       type: object
 *       required:
 *         - leaveType
 *         - startDate
 *         - endDate
 *         - reason
 *       properties:
 *         leaveType:
 *           $ref: '#/components/schemas/LeaveType'
 *         startDate:
 *           type: string
 *           format: date
 *           example: "2026-06-15"
 *         endDate:
 *           type: string
 *           format: date
 *           example: "2026-06-17"
 *         reason:
 *           type: string
 *           example: "Going to home town"
 *         attachmentUrl:
 *           type: string
 *           example: "https://example.com/attachment.pdf"
 *     ProcessLeaveRequest:
 *       type: object
 *       required:
 *         - leaveId
 *         - action
 *       properties:
 *         leaveId:
 *           type: string
 *           format: uuid
 *           example: "leave_uuid_123"
 *         action:
 *           type: string
 *           enum: [APPROVED, REJECTED]
 *           example: APPROVED
 *         comments:
 *           type: string
 *           example: "Enjoy your leave"
 */

// Employee paths

/**
 * @swagger
 * /leaves/apply:
 *   post:
 *     summary: Apply for Leave
 *     description: Submit a new leave application request. Available for standard authenticated employees.
 *     tags:
 *       - Leave
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApplyLeaveRequest'
 *     responses:
 *       201:
 *         description: Leave applied successfully.
 */
router.post('/apply', validate(applyLeaveSchema), LeaveController.apply);

/**
 * @swagger
 * /leaves/{id}/cancel:
 *   put:
 *     summary: Cancel Leave
 *     description: Cancel a pending or approved leave request. Standard employees can only cancel their own leaves.
 *     tags:
 *       - Leave
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Leave ID
 *     responses:
 *       200:
 *         description: Leave cancelled successfully.
 */
router.put('/:id/cancel', LeaveController.cancel);

/**
 * @swagger
 * /leaves/my/history:
 *   get:
 *     summary: View Personal Leave History
 *     description: Get list of all past leave applications submitted by the authenticated employee.
 *     tags:
 *       - Leave
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of leave records.
 */
router.get('/my/history', LeaveController.getHistory);

/**
 * @swagger
 * /leaves/my/balances:
 *   get:
 *     summary: View Personal Leave Balances
 *     description: Get remaining balance counts for different leave types (Annual, Sick, Casual, etc.).
 *     tags:
 *       - Leave
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of balances.
 */
router.get('/my/balances', LeaveController.getBalances);

// Admin/HR/Manager paths

/**
 * @swagger
 * /leaves/logs:
 *   get:
 *     summary: List All Leave Requests
 *     description: Retrieve all leave applications across the organization. Supports status and branch filtering. Requires admin/HR/manager.
 *     tags:
 *       - Leave
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *         description: Branch filter
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/LeaveStatus'
 *         description: Status filter
 *     responses:
 *       200:
 *         description: List of leave applications.
 */
router.get('/logs', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'BRANCH_MANAGER']), LeaveController.list);

/**
 * @swagger
 * /leaves/process:
 *   put:
 *     summary: Approve/Reject Leave Request
 *     description: Approve or reject an employee's leave request. Requires SUPER_ADMIN, ORG_ADMIN, HR, or BRANCH_MANAGER.
 *     tags:
 *       - Leave
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProcessLeaveRequest'
 *     responses:
 *       200:
 *         description: Leave status updated.
 */
router.put('/process', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'BRANCH_MANAGER']), validate(processLeaveSchema), LeaveController.process);

export default router;
