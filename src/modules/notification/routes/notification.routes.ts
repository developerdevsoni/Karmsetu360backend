import { Router } from 'express';
import { NotificationController } from '../controller/notification.controller';
import { authenticate } from '../../../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', NotificationController.list);
router.put('/mark-all-read', NotificationController.markAllRead);
router.put('/:id/mark-read', NotificationController.markRead);
router.delete('/:id', NotificationController.delete);

export default router;
