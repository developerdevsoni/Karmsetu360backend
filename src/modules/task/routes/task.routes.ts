import { Router } from 'express';
import { TaskController } from '../controller/task.controller';
import { validate } from '../../../middlewares/validation.middleware';
import { createTaskSchema, updateTaskStatusSchema } from '../validator/task.validator';
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
 *     TaskStatus:
 *       type: string
 *       enum: [PENDING, IN_PROGRESS, COMPLETED, CANCELLED]
 *       example: PENDING
 *     Task:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "task_uuid_123"
 *         organizationId:
 *           type: string
 *           format: uuid
 *           example: "org_uuid_123"
 *         employeeId:
 *           type: string
 *           format: uuid
 *           example: "emp_uuid_123"
 *         creatorId:
 *           type: string
 *           format: uuid
 *           example: "user_uuid_123"
 *         title:
 *           type: string
 *           example: "Draft payroll sheet for June 2026"
 *         description:
 *           type: string
 *           nullable: true
 *           example: "Include attendance corrections and late penalties in deductions."
 *         status:
 *           $ref: '#/components/schemas/TaskStatus'
 *         dueDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: "2026-06-15T18:00:00.000Z"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreateTaskRequest:
 *       type: object
 *       required:
 *         - employeeId
 *         - title
 *       properties:
 *         employeeId:
 *           type: string
 *           format: uuid
 *           example: "emp_uuid_123"
 *         title:
 *           type: string
 *           example: "Draft payroll sheet for June 2026"
 *         description:
 *           type: string
 *           example: "Include attendance corrections and late penalties in deductions."
 *         dueDate:
 *           type: string
 *           format: date-time
 *           example: "2026-06-15T18:00:00.000Z"
 *     UpdateTaskStatusRequest:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           $ref: '#/components/schemas/TaskStatus'
 */

const clientRouter = Router();
clientRouter.use(authenticate);
clientRouter.use(tenantContext);

const adminRouter = Router();
adminRouter.use(authenticate);
adminRouter.use(tenantContext);

/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Create a new Task for an employee
 *     description: Assign a task to a specific employee in the organization. Requires SUPER_ADMIN, ORG_ADMIN, or HR, or BRANCH_MANAGER roles.
 *     tags:
 *       - Tasks
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTaskRequest'
 *     responses:
 *       201:
 *         description: Task created successfully.
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
 *                   example: Task created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 */
adminRouter.post(
  '/',
  authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'BRANCH_MANAGER']),
  validate(createTaskSchema),
  TaskController.create
);

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: List Tasks
 *     description: Retrieve tasks. Administrators/managers see all tasks or filtered by employeeId/creatorId/status. Standard employees only see their assigned tasks.
 *     tags:
 *       - Tasks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter tasks by employee (Admin/Manager only)
 *       - in: query
 *         name: creatorId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter tasks by creator (Admin/Manager only)
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/TaskStatus'
 *         description: Filter tasks by status
 *     responses:
 *       200:
 *         description: List of tasks.
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
 *                   example: Tasks retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 */
clientRouter.get('/', TaskController.list);
clientRouter.post('/', validate(createTaskSchema), TaskController.create);
adminRouter.get('/', TaskController.list);

/**
 * @swagger
 * /tasks/{id}/status:
 *   put:
 *     summary: Update Task Status
 *     description: Update the status of a specific task. Standard employees can only update tasks assigned to them.
 *     tags:
 *       - Tasks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTaskStatusRequest'
 *     responses:
 *       200:
 *         description: Task status updated successfully.
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
 *                   example: Task status updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 */
clientRouter.put('/:id/status', validate(updateTaskStatusSchema), TaskController.updateStatus);
adminRouter.put('/:id/status', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'BRANCH_MANAGER']), validate(updateTaskStatusSchema), TaskController.updateStatus);

/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     summary: Delete a Task
 *     description: Remove a task from the database. Requires SUPER_ADMIN, ORG_ADMIN, or HR, or BRANCH_MANAGER roles.
 *     tags:
 *       - Tasks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task deleted successfully.
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
 *                   example: Task deleted successfully
 */
adminRouter.delete('/:id', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'BRANCH_MANAGER']), TaskController.delete);

export { clientRouter as clientTaskRouter, adminRouter as adminTaskRouter };
