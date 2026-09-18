import express from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from '../controllers/notificationController.js';
import authenticate from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

// User notification endpoints
router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/read-all', markAllAsRead);
router.patch('/mark-all-read', markAllAsRead);
router.patch('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

export default router;
