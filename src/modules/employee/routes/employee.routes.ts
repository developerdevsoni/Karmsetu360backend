import { Router } from 'express';
import multer from 'multer';
import { EmployeeController } from '../controller/employee.controller';
import { validate } from '../../../middlewares/validation.middleware';
import { createEmployeeSchema, updateEmployeeSchema } from '../validator/employee.validator';
import { authenticate } from '../../../middlewares/auth.middleware';
import { tenantContext } from '../../../middlewares/tenant.middleware';
import { authorizeRole } from '../../../middlewares/role.middleware';

// Memory storage specifically for excel parsing buffer
const importUpload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }
});

const router = Router();

router.use(authenticate);
router.use(tenantContext);

/**
 * @swagger
 * components:
 *   schemas:
 *     Employee:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "employee_uuid_123"
 *         userId:
 *           type: string
 *           format: uuid
 *           example: "user_uuid_123"
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
 *           example: "EMP1001"
 *         mobile:
 *           type: string
 *           example: "9876543210"
 *         address:
 *           type: string
 *           example: "123 Main St, New York, NY"
 *         department:
 *           type: string
 *           example: "HR"
 *         designation:
 *           type: string
 *           example: "Manager"
 *         joiningDate:
 *           type: string
 *           format: date-time
 *           example: "2026-06-01T00:00:00.000Z"
 *         baseSalary:
 *           type: number
 *           example: 50000.0
 *         shiftId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           example: "shift_uuid_123"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreateEmployeeRequest:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *         - employeeId
 *         - mobile
 *         - address
 *         - department
 *         - designation
 *         - joiningDate
 *         - branchId
 *       properties:
 *         name:
 *           type: string
 *           example: "John Doe"
 *         email:
 *           type: string
 *           format: email
 *           example: "johndoe@example.com"
 *         password:
 *           type: string
 *           format: password
 *           minLength: 6
 *           example: "password123"
 *         employeeId:
 *           type: string
 *           example: "EMP1001"
 *         mobile:
 *           type: string
 *           example: "9876543210"
 *         address:
 *           type: string
 *           example: "123 Main St, New York, NY"
 *         department:
 *           type: string
 *           example: "Engineering"
 *         designation:
 *           type: string
 *           example: "Software Engineer"
 *         joiningDate:
 *           type: string
 *           format: date
 *           example: "2026-06-01"
 *         baseSalary:
 *           type: number
 *           example: 60000.0
 *         branchId:
 *           type: string
 *           format: uuid
 *           example: "branch_uuid_123"
 *         shiftId:
 *           type: string
 *           format: uuid
 *           example: "shift_uuid_123"
 */

// Self profile retrieval

/**
 * @swagger
 * /employees/profile:
 *   get:
 *     summary: Get Self Profile
 *     description: Retrieve the employee profile of the authenticated user.
 *     tags:
 *       - Employee
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile details retrieved.
 */
router.get('/profile', EmployeeController.getProfile);

// Bulk Excel operations

/**
 * @swagger
 * /employees/import:
 *   post:
 *     summary: Bulk Excel Import
 *     description: Upload an Excel sheet to bulk import employee records. Requires SUPER_ADMIN, ORG_ADMIN, or HR roles.
 *     tags:
 *       - Employee
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Employees imported successfully.
 */
router.post('/import', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR']), importUpload.single('file'), EmployeeController.importEmployees);

/**
 * @swagger
 * /employees/export:
 *   get:
 *     summary: Export Employees to Excel
 *     description: Download an Excel file containing all employee profiles. Requires SUPER_ADMIN, ORG_ADMIN, or HR roles.
 *     tags:
 *       - Employee
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: File download successful.
 */
router.get('/export', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR']), EmployeeController.exportEmployees);

// CRUD operations

/**
 * @swagger
 * /employees:
 *   post:
 *     summary: Create Employee Profile
 *     description: Register a new employee user and create their employee details profile. Requires SUPER_ADMIN, ORG_ADMIN, or HR.
 *     tags:
 *       - Employee
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateEmployeeRequest'
 *     responses:
 *       201:
 *         description: Employee profile created.
 */
router.post('/', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR']), validate(createEmployeeSchema), EmployeeController.create);

/**
 * @swagger
 * /employees/{id}:
 *   put:
 *     summary: Update Employee details
 *     description: Modify designation, salary, department or branch of an employee. Requires SUPER_ADMIN, ORG_ADMIN, HR, or BRANCH_MANAGER.
 *     tags:
 *       - Employee
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Employee ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mobile:
 *                 type: string
 *                 example: 9876543210
 *               address:
 *                 type: string
 *                 example: 456 Elm St, Brooklyn, NY
 *               department:
 *                 type: string
 *                 example: Engineering
 *               designation:
 *                 type: string
 *                 example: Senior Tech Lead
 *               baseSalary:
 *                 type: number
 *                 example: 95000.0
 *               branchId:
 *                 type: string
 *                 format: uuid
 *                 example: branch_uuid_123
 *               shiftId:
 *                 type: string
 *                 format: uuid
 *                 example: shift_uuid_123
 *     responses:
 *       200:
 *         description: Employee updated.
 */
router.put('/:id', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'BRANCH_MANAGER']), validate(updateEmployeeSchema), EmployeeController.update);

/**
 * @swagger
 * /employees/{id}:
 *   delete:
 *     summary: Delete Employee User
 *     description: Permanently delete an employee profile and user login. Requires SUPER_ADMIN or ORG_ADMIN.
 *     tags:
 *       - Employee
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Employee ID
 *     responses:
 *       200:
 *         description: Employee deleted.
 */
router.delete('/:id', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN']), EmployeeController.delete);

/**
 * @swagger
 * /employees/{id}/deactivate:
 *   put:
 *     summary: Deactivate Employee
 *     description: Toggle employee status to INACTIVE. Requires SUPER_ADMIN, ORG_ADMIN, or HR.
 *     tags:
 *       - Employee
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Employee ID
 *     responses:
 *       200:
 *         description: Employee status updated.
 */
router.put('/:id/deactivate', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR']), EmployeeController.deactivate);

/**
 * @swagger
 * /employees/{id}:
 *   get:
 *     summary: Get Employee Details
 *     description: Retrieve specific employee profile details. Requires admin, HR or manager.
 *     tags:
 *       - Employee
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Employee ID
 *     responses:
 *       200:
 *         description: Employee details retrieved.
 */
router.get('/:id', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'BRANCH_MANAGER']), EmployeeController.get);

/**
 * @swagger
 * /employees:
 *   get:
 *     summary: List Employees
 *     description: List all employees in the organization. Requires admin, HR or manager.
 *     tags:
 *       - Employee
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of employee profiles.
 */
router.get('/', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'BRANCH_MANAGER']), EmployeeController.list);

export default router;
