import { Router } from 'express';
import { HolidayController } from '../controller/holiday.controller';
import { validate } from '../../../middlewares/validation.middleware';
import { createHolidaySchema, updateHolidaySchema } from '../validator/holiday.validator';
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
 *     HolidayType:
 *       type: string
 *       enum: [NATIONAL, STATE, ORGANIZATION]
 *       example: NATIONAL
 *     Holiday:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "holiday_uuid_123"
 *         organizationId:
 *           type: string
 *           format: uuid
 *         branchId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           example: "branch_uuid_123"
 *         name:
 *           type: string
 *           example: "Independence Day"
 *         date:
 *           type: string
 *           format: date
 *           example: "2026-08-15"
 *         type:
 *           $ref: '#/components/schemas/HolidayType'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreateHolidayRequest:
 *       type: object
 *       required:
 *         - name
 *         - date
 *       properties:
 *         name:
 *           type: string
 *           example: "Independence Day"
 *         date:
 *           type: string
 *           format: date
 *           example: "2026-08-15"
 *         type:
 *           $ref: '#/components/schemas/HolidayType'
 *         branchId:
 *           type: string
 *           format: uuid
 *           example: "branch_uuid_123"
 */

// Holiday endpoints with role permissions validation

/**
 * @swagger
 * /holidays:
 *   post:
 *     summary: Create Holiday
 *     description: Define a new public or organizational holiday. Requires SUPER_ADMIN, ORG_ADMIN, or HR roles.
 *     tags:
 *       - Holiday
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateHolidayRequest'
 *     responses:
 *       201:
 *         description: Holiday created successfully.
 */
router.post('/', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR']), validate(createHolidaySchema), HolidayController.create);

/**
 * @swagger
 * /holidays/{id}:
 *   put:
 *     summary: Update Holiday
 *     description: Update name, date or type of an existing holiday. Requires SUPER_ADMIN, ORG_ADMIN, or HR.
 *     tags:
 *       - Holiday
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Holiday ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateHolidayRequest'
 *     responses:
 *       200:
 *         description: Holiday updated.
 */
router.put('/:id', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR']), validate(updateHolidaySchema), HolidayController.update);

/**
 * @swagger
 * /holidays/{id}:
 *   delete:
 *     summary: Delete Holiday
 *     description: Remove a holiday configuration. Requires SUPER_ADMIN, ORG_ADMIN, or HR.
 *     tags:
 *       - Holiday
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Holiday ID
 *     responses:
 *       200:
 *         description: Holiday deleted.
 */
router.delete('/:id', authorizeRole(['SUPER_ADMIN', 'ORG_ADMIN', 'HR']), HolidayController.delete);

/**
 * @swagger
 * /holidays:
 *   get:
 *     summary: List Holidays
 *     description: Retrieve list of all upcoming holidays. Available to all authenticated employees.
 *     tags:
 *       - Holiday
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of holidays.
 */
router.get('/', HolidayController.list);

export default router;
