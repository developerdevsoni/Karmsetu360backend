import { Router } from 'express';
import { ReportController } from '../controller/report.controller';
import { authenticate } from '../../../middlewares/auth.middleware';
import { tenantContext } from '../../../middlewares/tenant.middleware';
import { authorizeRole } from '../../../middlewares/role.middleware';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

// Report download paths requiring specific authorization roles

/**
 * @swagger
 * /reports/attendance:
 *   get:
 *     summary: Export Attendance Report (Excel)
 *     description: Generate and download an Excel sheet containing attendance summary. Requires SUPER_ADMIN, ORG_ADMIN, HR, or BRANCH_MANAGER roles.
 *     tags:
 *       - Report
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *         description: Filter by branch
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *         description: Filter by month (YYYY-MM)
 *     responses:
 *       200:
 *         description: Excel file download.
 */
router.get('/attendance', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'BRANCH_MANAGER']), ReportController.attendance);

/**
 * @swagger
 * /reports/leave:
 *   get:
 *     summary: Export Leave Report (Excel)
 *     description: Generate and download an Excel sheet containing leaves summary. Requires SUPER_ADMIN, ORG_ADMIN, HR, or BRANCH_MANAGER roles.
 *     tags:
 *       - Report
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *         description: Filter by branch
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by leave status
 *     responses:
 *       200:
 *         description: Excel file download.
 */
router.get('/leave', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'BRANCH_MANAGER']), ReportController.leave);

/**
 * @swagger
 * /reports/payroll:
 *   get:
 *     summary: Export Payroll Report (Excel)
 *     description: Generate and download an Excel sheet containing payroll summary. Requires SUPER_ADMIN, ORG_ADMIN, or HR.
 *     tags:
 *       - Report
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *         description: Filter by branch
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *         description: Filter by month (YYYY-MM)
 *     responses:
 *       200:
 *         description: Excel file download.
 */
router.get('/payroll', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR']), ReportController.payroll);

export default router;
