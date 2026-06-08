import { Router } from 'express';
import { ShiftController } from '../controller/shift.controller';
import { validate } from '../../../middlewares/validation.middleware';
import { createShiftSchema, updateShiftSchema, assignShiftSchema } from '../validator/shift.validator';
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
 *     Shift:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "shift_uuid_123"
 *         organizationId:
 *           type: string
 *           format: uuid
 *           example: "org_uuid_123"
 *         name:
 *           type: string
 *           example: "Day Shift"
 *         startTime:
 *           type: string
 *           example: "09:00"
 *         endTime:
 *           type: string
 *           example: "18:00"
 *         graceTime:
 *           type: integer
 *           example: 15
 *         breakDuration:
 *           type: integer
 *           example: 60
 *         workingHours:
 *           type: number
 *           example: 8.0
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreateShiftRequest:
 *       type: object
 *       required:
 *         - name
 *         - startTime
 *         - endTime
 *       properties:
 *         name:
 *           type: string
 *           example: "Day Shift"
 *         startTime:
 *           type: string
 *           example: "09:00"
 *         endTime:
 *           type: string
 *           example: "18:00"
 *         graceTime:
 *           type: integer
 *           example: 15
 *         breakDuration:
 *           type: integer
 *           example: 60
 *         workingHours:
 *           type: number
 *           example: 8.0
 *     AssignShiftRequest:
 *       type: object
 *       required:
 *         - employeeIds
 *       properties:
 *         employeeIds:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *           example: ["employee_uuid_123"]
 *         shiftId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           example: "shift_uuid_123"
 */

// Shift routes with role permissions checks

/**
 * @swagger
 * /shifts:
 *   post:
 *     summary: Create Shift Configuration
 *     description: Define a new daily shift timeline. Requires SUPER_ADMIN, ORG_ADMIN, or HR roles.
 *     tags:
 *       - Shift
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateShiftRequest'
 *     responses:
 *       201:
 *         description: Shift created successfully.
 */
router.post('/', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR']), validate(createShiftSchema), ShiftController.create);

/**
 * @swagger
 * /shifts/assign:
 *   put:
 *     summary: Assign Shift to Employees
 *     description: Bulk link a list of employees to a shift. Set shiftId to null to unassign. Requires SUPER_ADMIN, ORG_ADMIN, HR, or BRANCH_MANAGER roles.
 *     tags:
 *       - Shift
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssignShiftRequest'
 *     responses:
 *       200:
 *         description: Shift assignment completed.
 */
router.put('/assign', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'BRANCH_MANAGER']), validate(assignShiftSchema), ShiftController.assign);

/**
 * @swagger
 * /shifts/{id}:
 *   put:
 *     summary: Update Shift Configuration
 *     description: Update shift timings, grace periods and breaks. Requires SUPER_ADMIN, ORG_ADMIN, or HR.
 *     tags:
 *       - Shift
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Shift ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateShiftRequest'
 *     responses:
 *       200:
 *         description: Shift updated.
 */
router.put('/:id', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR']), validate(updateShiftSchema), ShiftController.update);

/**
 * @swagger
 * /shifts/{id}:
 *   delete:
 *     summary: Delete Shift Configuration
 *     description: Remove a shift configuration if no employee is currently assigned to it. Requires SUPER_ADMIN or ORG_ADMIN.
 *     tags:
 *       - Shift
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Shift ID
 *     responses:
 *       200:
 *         description: Shift configuration deleted.
 */
router.delete('/:id', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN']), ShiftController.delete);

/**
 * @swagger
 * /shifts/{id}:
 *   get:
 *     summary: Get Shift details
 *     description: Retrieve specific details of a shift. Requires admin, HR or manager.
 *     tags:
 *       - Shift
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Shift ID
 *     responses:
 *       200:
 *         description: Shift details retrieved.
 */
router.get('/:id', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'BRANCH_MANAGER']), ShiftController.get);

/**
 * @swagger
 * /shifts:
 *   get:
 *     summary: List Shifts
 *     description: Retrieve list of all shifts defined in the organization. Available for all authenticated roles.
 *     tags:
 *       - Shift
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of shifts.
 */
router.get('/', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'BRANCH_MANAGER', 'EMPLOYEE']), ShiftController.list);

export default router;
