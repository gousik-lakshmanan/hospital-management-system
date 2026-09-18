import notificationService from '../services/notificationService.js';

// GET /api/notifications - Get paginated notifications for authenticated user
export const getNotifications = async (req, res) => {
  try {
    const { page, limit, unreadOnly } = req.query;
    const result = await notificationService.getUserNotifications(req.user._id, {
      page,
      limit,
      unreadOnly: unreadOnly === 'true'
    });

    return res.status(200).json({
      success: true,
      count: result.total,
      unreadCount: result.unreadCount,
      data: result.notifications,
      pagination: {
        page: result.page,
        totalPages: result.totalPages,
        total: result.total
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications.',
      error: error.message
    });
  }
};

// GET /api/notifications/unread-count - Get unread count for authenticated user
export const getUnreadCount = async (req, res) => {
  try {
    const count = await notificationService.getUnreadCount(req.user._id);
    return res.status(200).json({
      success: true,
      count,
      unreadCount: count
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch unread notification count.',
      error: error.message
    });
  }
};

// PATCH /api/notifications/:id/read - Mark single notification as read
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await notificationService.markNotificationRead(id, req.user._id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or unauthorized.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
      data: notification
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update notification.',
      error: error.message
    });
  }
};

// PATCH /api/notifications/read-all - Mark all notifications as read for current user
export const markAllAsRead = async (req, res) => {
  try {
    await notificationService.markAllNotificationsRead(req.user._id);
    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read.'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read.',
      error: error.message
    });
  }
};

// DELETE /api/notifications/:id - Delete a notification
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await notificationService.deleteNotification(id, req.user._id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or unauthorized.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification deleted successfully.'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete notification.',
      error: error.message
    });
  }
};
