import { Router } from 'express';
import { PayrollController } from '../controller/payroll.controller';
import { validate } from '../../../middlewares/validation.middleware';
import { generatePayrollSchema, lockPayrollSchema, updatePayrollRowSchema } from '../validator/payroll.validator';
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
 *     PayrollStatus:
 *       type: string
 *       enum: [PENDING, PAID, LOCKED]
 *       example: PENDING
 *     Payroll:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "payroll_uuid_123"
 *         organizationId:
 *           type: string
 *           format: uuid
 *         branchId:
 *           type: string
 *           format: uuid
 *         employeeId:
 *           type: string
 *           format: uuid
 *         month:
 *           type: string
 *           example: "2026-06"
 *         baseSalary:
 *           type: number
 *           example: 50000.0
 *         overtimePay:
 *           type: number
 *           example: 2000.0
 *         bonus:
 *           type: number
 *           example: 5000.0
 *         incentives:
 *           type: number
 *           example: 0.0
 *         leaveDeductions:
 *           type: number
 *           example: 1500.0
 *         latePenalties:
 *           type: number
 *           example: 500.0
 *         otherDeductions:
 *           type: number
 *           example: 0.0
 *         netSalary:
 *           type: number
 *           example: 55000.0
 *         status:
 *           $ref: '#/components/schemas/PayrollStatus'
 *         payslipUrl:
 *           type: string
 *           nullable: true
 *           example: "/uploads/payslips/2026-06/employee_123.pdf"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     GeneratePayrollRequest:
 *       type: object
 *       required:
 *         - month
 *       properties:
 *         month:
 *           type: string
 *           example: "2026-06"
 *         branchId:
 *           type: string
 *           format: uuid
 *           example: "branch_uuid_123"
 *     LockPayrollRequest:
 *       type: object
 *       required:
 *         - month
 *       properties:
 *         month:
 *           type: string
 *           example: "2026-06"
 *         branchId:
 *           type: string
 *           format: uuid
 *           example: "branch_uuid_123"
 *     UpdatePayrollRowRequest:
 *       type: object
 *       properties:
 *         overtimePay:
 *           type: number
 *           example: 2000.0
 *         bonus:
 *           type: number
 *           example: 5000.0
 *         incentives:
 *           type: number
 *           example: 0.0
 *         otherDeductions:
 *           type: number
 *           example: 0.0
 */

const clientRouter = Router();
clientRouter.use(authenticate);
clientRouter.use(tenantContext);

const adminRouter = Router();
adminRouter.use(authenticate);
adminRouter.use(tenantContext);

// Employee actions

/**
 * @swagger
 * /payroll/my/payslips:
 *   get:
 *     summary: View Personal Payslips
 *     description: Retrieve list of all personal payslips generated for the authenticated employee.
 *     tags:
 *       - Payroll
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of payslips.
 */
clientRouter.get('/my/payslips', PayrollController.listSelfPayslips);

/**
 * @swagger
 * /payroll/my/payslips/{id}/download:
 *   get:
 *     summary: Download PDF Payslip
 *     description: Download a generated payslip PDF. Requires employee profile ownership.
 *     tags:
 *       - Payroll
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Payroll Record ID
 *     responses:
 *       200:
 *         description: File download.
 */
clientRouter.get('/my/payslips/:id/download', PayrollController.downloadPayslip);

// Administrator / HR actions

/**
 * @swagger
 * /payroll/generate:
 *   post:
 *     summary: Generate Monthly Payroll
 *     description: Run payroll calculations for a specific month and branch. Calculates base salary, overtime, leave deductions and late penalties. Requires SUPER_ADMIN, ORG_ADMIN, or HR.
 *     tags:
 *       - Payroll
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GeneratePayrollRequest'
 *     responses:
 *       200:
 *         description: Payroll generated.
 */
adminRouter.post('/generate', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR']), validate(generatePayrollSchema), PayrollController.generate);

/**
 * @swagger
 * /payroll/lock:
 *   post:
 *     summary: Lock Payroll
 *     description: Lock payroll rows to prevent updates and mark them as ready for payouts. Requires SUPER_ADMIN or ORG_ADMIN.
 *     tags:
 *       - Payroll
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LockPayrollRequest'
 *     responses:
 *       200:
 *         description: Payroll rows locked.
 */
adminRouter.post('/lock', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN']), validate(lockPayrollSchema), PayrollController.lock);

/**
 * @swagger
 * /payroll/{id}:
 *   put:
 *     summary: Modify Payroll Row Details
 *     description: Manually adjust bonuses, deductions or overtime pay before locking. Requires SUPER_ADMIN, ORG_ADMIN, or HR.
 *     tags:
 *       - Payroll
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Payroll Row ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePayrollRowRequest'
 *     responses:
 *       200:
 *         description: Payroll row details updated.
 */
adminRouter.put('/:id', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR']), validate(updatePayrollRowSchema), PayrollController.updateRow);

/**
 * @swagger
 * /payroll/{id}:
 *   get:
 *     summary: Get Payroll Row Details
 *     description: Retrieve specific payroll row. Requires admin/HR/manager.
 *     tags:
 *       - Payroll
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Payroll Record ID
 *     responses:
 *       200:
 *         description: Details retrieved.
 */
adminRouter.get('/:id', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'BRANCH_MANAGER']), PayrollController.get);

/**
 * @swagger
 * /payroll:
 *   get:
 *     summary: List Payroll Records
 *     description: Retrieve organizational payroll logs. Supports month, branch and status filters. Requires admin/HR/manager.
 *     tags:
 *       - Payroll
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *         description: Month filter (YYYY-MM)
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *         description: Branch filter
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/PayrollStatus'
 *         description: Status filter
 *     responses:
 *       200:
 *         description: List of payroll logs.
 */
adminRouter.get('/', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'BRANCH_MANAGER']), PayrollController.list);

export { clientRouter as clientPayrollRouter, adminRouter as adminPayrollRouter };
