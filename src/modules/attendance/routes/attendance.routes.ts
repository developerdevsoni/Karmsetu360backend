import { Router } from 'express';
import { AttendanceController } from '../controller/attendance.controller';
import { validate } from '../../../middlewares/validation.middleware';
import { checkInSchema, correctionSchema, processCorrectionSchema } from '../validator/attendance.validator';
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
 *     Attendance:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "attendance_uuid_123"
 *         organizationId:
 *           type: string
 *           format: uuid
 *           example: "org_uuid_123"
 *         branchId:
 *           type: string
 *           format: uuid
 *           example: "branch_uuid_123"
 *         employeeId:
 *           type: string
 *           format: uuid
 *           example: "employee_uuid_123"
 *         date:
 *           type: string
 *           format: date
 *           example: "2026-06-08"
 *         status:
 *           type: string
 *           enum: [PRESENT, LATE, ABSENT, ON_LEAVE]
 *           example: "PRESENT"
 *         checkIn:
 *           type: string
 *           format: date-time
 *           example: "2026-06-08T09:00:00.000Z"
 *         checkOut:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: "2026-06-08T18:00:00.000Z"
 *         breakIn:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: "2026-06-08T13:00:00.000Z"
 *         breakOut:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: "2026-06-08T14:00:00.000Z"
 *         breakDuration:
 *           type: integer
 *           example: 60
 *         workingHours:
 *           type: number
 *           example: 8.0
 *         notes:
 *           type: string
 *           nullable: true
 *           example: "Checked in on site"
 *         corrections:
 *           type: array
 *           items:
 *             type: object
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CheckInRequest:
 *       type: object
 *       properties:
 *         notes:
 *           type: string
 *           example: "Checked in from head office"
 *     CorrectionRequest:
 *       type: object
 *       required:
 *         - checkIn
 *         - checkOut
 *         - reason
 *       properties:
 *         attendanceId:
 *           type: string
 *           format: uuid
 *           example: "attendance_uuid_123"
 *         checkIn:
 *           type: string
 *           format: date-time
 *           example: "2026-06-08T09:00:00.000Z"
 *         checkOut:
 *           type: string
 *           format: date-time
 *           example: "2026-06-08T18:00:00.000Z"
 *         reason:
 *           type: string
 *           example: "Forgot to check-out yesterday"
 *     ProcessCorrectionRequest:
 *       type: object
 *       required:
 *         - attendanceId
 *         - correctionIndex
 *         - action
 *       properties:
 *         attendanceId:
 *           type: string
 *           format: uuid
 *           example: "attendance_uuid_123"
 *         correctionIndex:
 *           type: integer
 *           example: 0
 *         action:
 *           type: string
 *           enum: [APPROVED, REJECTED]
 *           example: "APPROVED"
 *         comments:
 *           type: string
 *           example: "Valid reason, approved"
 */

// Employee actions

/**
 * @swagger
 * /attendance/check-in:
 *   post:
 *     summary: Employee Check In
 *     description: Log check-in time for today's attendance. Available for standard authenticated employees.
 *     tags:
 *       - Attendance
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CheckInRequest'
 *     responses:
 *       200:
 *         description: Checked in successfully.
 */
router.post('/check-in', validate(checkInSchema), AttendanceController.checkIn);

/**
 * @swagger
 * /attendance/check-out:
 *   post:
 *     summary: Employee Check Out
 *     description: Log check-out time for today's attendance.
 *     tags:
 *       - Attendance
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Checked out successfully.
 */
router.post('/check-out', AttendanceController.checkOut);

/**
 * @swagger
 * /attendance/break-in:
 *   post:
 *     summary: Start Break
 *     description: Log break-in time to pause working hours tracker.
 *     tags:
 *       - Attendance
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Break started successfully.
 */
router.post('/break-in', AttendanceController.breakIn);

/**
 * @swagger
 * /attendance/break-out:
 *   post:
 *     summary: End Break
 *     description: Log break-out time to resume working hours tracker.
 *     tags:
 *       - Attendance
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Break ended successfully.
 */
router.post('/break-out', AttendanceController.breakOut);

/**
 * @swagger
 * /attendance/history:
 *   get:
 *     summary: View Personal Attendance History
 *     description: Get list of daily logs for the authenticated employee in a date range.
 *     tags:
 *       - Attendance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date filter (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date filter (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Personal attendance history list.
 */
router.get('/history', AttendanceController.getHistory);

/**
 * @swagger
 * /attendance/correction:
 *   post:
 *     summary: Request Attendance Correction
 *     description: Request modification of check-in or check-out times for a past date due to forgetfulness or error.
 *     tags:
 *       - Attendance
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CorrectionRequest'
 *     responses:
 *       200:
 *         description: Correction request submitted.
 */
router.post('/correction', validate(correctionSchema), AttendanceController.requestCorrection);

// Administrator actions

/**
 * @swagger
 * /attendance/logs:
 *   get:
 *     summary: List All Attendance Logs
 *     description: Retrieve organizational attendance logs. Supports filtering by branch, department, employee and date. Requires admin/HR/manager.
 *     tags:
 *       - Attendance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *         description: Branch filter
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: string
 *         description: Employee filter
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *         description: Exact date filter (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: List of logs.
 */
router.get('/logs', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'BRANCH_MANAGER']), AttendanceController.getLogs);

/**
 * @swagger
 * /attendance/analytics:
 *   get:
 *     summary: Get Attendance Analytics
 *     description: Retrieve percentage of present, late, absent stats. Requires admin/HR/manager.
 *     tags:
 *       - Attendance
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics object.
 */
router.get('/analytics', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'BRANCH_MANAGER']), AttendanceController.getAnalytics);

/**
 * @swagger
 * /attendance/correction/process:
 *   put:
 *     summary: Process Attendance Correction Request
 *     description: Approve or Reject an employee's attendance correction request. Requires admin/HR/manager.
 *     tags:
 *       - Attendance
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProcessCorrectionRequest'
 *     responses:
 *       200:
 *         description: Correction request processed.
 */
router.put('/correction/process', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'BRANCH_MANAGER']), validate(processCorrectionSchema), AttendanceController.processCorrection);

export default router;
