import { Router } from 'express';
import { BranchController } from '../controller/branch.controller';
import { validate } from '../../../middlewares/validation.middleware';
import { createBranchSchema, updateBranchSchema } from '../validator/branch.validator';
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
 *     Branch:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "branch_uuid_123"
 *         organizationId:
 *           type: string
 *           format: uuid
 *           example: "org_uuid_123"
 *         name:
 *           type: string
 *           example: "East Coast Branch"
 *         address:
 *           type: string
 *           example: "123 Main St, New York, NY"
 *         managerId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           example: "employee_uuid_456"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreateBranchRequest:
 *       type: object
 *       required:
 *         - name
 *         - address
 *       properties:
 *         name:
 *           type: string
 *           example: "East Coast Branch"
 *         address:
 *           type: string
 *           example: "123 Main St, New York, NY"
 */

// Branch endpoints with specific roles checks

/**
 * @swagger
 * /branches:
 *   post:
 *     summary: Create Branch
 *     description: Register a new branch for the tenant organization. Requires SUPER_ADMIN or ORG_ADMIN roles.
 *     tags:
 *       - Branch
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBranchRequest'
 *     responses:
 *       201:
 *         description: Branch created successfully.
 */
router.post('/', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN']), validate(createBranchSchema), BranchController.create);

/**
 * @swagger
 * /branches/{id}:
 *   put:
 *     summary: Update Branch Details
 *     description: Update name/address of a branch. Requires SUPER_ADMIN, ORG_ADMIN, or BRANCH_MANAGER roles.
 *     tags:
 *       - Branch
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Branch ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Updated Branch Name
 *               address:
 *                 type: string
 *                 example: 456 Broadway, New York, NY
 *               managerId:
 *                 type: string
 *                 format: uuid
 *                 example: employee_uuid_456
 *     responses:
 *       200:
 *         description: Branch updated successfully.
 */
router.put('/:id', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'BRANCH_MANAGER']), validate(updateBranchSchema), BranchController.update);

/**
 * @swagger
 * /branches/{id}:
 *   delete:
 *     summary: Delete Branch
 *     description: Permanently remove a branch. Requires SUPER_ADMIN or ORG_ADMIN.
 *     tags:
 *       - Branch
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Branch ID
 *     responses:
 *       200:
 *         description: Branch deleted successfully.
 */
router.delete('/:id', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN']), BranchController.delete);

/**
 * @swagger
 * /branches/{id}:
 *   get:
 *     summary: Get Branch Details
 *     description: Retrieve details of a specific branch. Allowed for all roles.
 *     tags:
 *       - Branch
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Branch ID
 *     responses:
 *       200:
 *         description: Branch details retrieved.
 */
router.get('/:id', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'BRANCH_MANAGER', 'EMPLOYEE']), BranchController.get);

/**
 * @swagger
 * /branches:
 *   get:
 *     summary: List Branches
 *     description: Retrieve list of all branches for the organization. Requires admin, HR, or manager permissions.
 *     tags:
 *       - Branch
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of branches.
 */
router.get('/', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'BRANCH_MANAGER']), BranchController.list);

export default router;
