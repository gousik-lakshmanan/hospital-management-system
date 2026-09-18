import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

/**
 * Dispatch a single notification with recipient-safe deduplication and failure isolation.
 */
const ALLOWED_TYPES = [
  'APPOINTMENT',
  'BED_REQUEST',
  'BED_ALLOCATION',
  'PRESCRIPTION',
  'PHARMACY',
  'BLOOD_REQUEST',
  'BLOOD_STOCK',
  'VISITOR',
  'BILLING',
  'DIET_PLAN',
  'SYSTEM'
];

export const createNotification = async ({
  recipient,
  recipientId,
  recipientRole,
  type = 'SYSTEM',
  title,
  message,
  entityType = null,
  entityId = null,
  priority = 'NORMAL',
  link = null,
  metadata = null,
  dedupeKey = null
}) => {
  try {
    const targetRecipientId = recipientId || recipient;
    if (!targetRecipientId || !title || !message) {
      return null;
    }

    // Determine recipient role if not provided
    let resolvedRole = recipientRole;
    if (!resolvedRole) {
      const user = await User.findById(targetRecipientId).select('role');
      if (user) {
        resolvedRole = user.role;
      } else {
        resolvedRole = 'patient';
      }
    }

    let normalizedType = String(type || 'SYSTEM').toUpperCase().replace(/[-\s]/g, '_');
    if (normalizedType === 'BLOOD_BANK') normalizedType = 'BLOOD_REQUEST';
    if (!ALLOWED_TYPES.includes(normalizedType)) {
      normalizedType = 'SYSTEM';
    }

    let normalizedPriority = String(priority || 'NORMAL').toUpperCase();
    if (!['LOW', 'NORMAL', 'HIGH', 'URGENT'].includes(normalizedPriority)) {
      normalizedPriority = 'NORMAL';
    }

    // Normalize recipient-safe dedupeKey: ${baseDedupeKey}-${recipientId}
    const finalDedupeKey = dedupeKey ? `${dedupeKey}-${targetRecipientId}` : null;

    const notification = await Notification.create({
      recipientId: targetRecipientId,
      recipientRole: resolvedRole,
      type: normalizedType,
      title: title.trim(),
      message: message.trim(),
      entityType,
      entityId: entityId && mongoose.Types.ObjectId.isValid(entityId) ? entityId : null,
      priority: normalizedPriority,
      link,
      metadata,
      dedupeKey: finalDedupeKey,
      isRead: false
    });

    return notification;
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error - already notified for this event, ignore safely
      return null;
    }
    console.error('Notification dispatch error (non-blocking):', error.message);
    return null;
  }
};

/**
 * Dispatch multiple notifications in batch safely.
 */
export const createNotifications = async (notificationsArray = []) => {
  const results = [];
  for (const item of notificationsArray) {
    const res = await createNotification(item);
    if (res) results.push(res);
  }
  return results;
};

/**
 * Notify all active users matching a specific role (e.g., all admins or pharmacists).
 */
export const notifyRole = async (role, notificationData) => {
  try {
    const users = await User.find({ role, isActive: true }).select('_id role');
    const promises = users.map((u) =>
      createNotification({
        ...notificationData,
        recipientId: u._id,
        recipientRole: u.role
      })
    );
    return await Promise.all(promises);
  } catch (error) {
    console.error(`Failed to notify role ${role}:`, error.message);
    return [];
  }
};

/**
 * Notify multiple roles at once.
 */
export const notifyRoles = async (roles = [], notificationData) => {
  const roleArray = Array.isArray(roles) ? roles : [roles];
  const results = [];
  for (const r of roleArray) {
    const res = await notifyRole(r, notificationData);
    if (Array.isArray(res)) results.push(...res);
  }
  return results;
};

/**
 * Notify a specific user by ID.
 */
export const notifyUser = async (userId, notificationData) => {
  return createNotification({
    ...notificationData,
    recipientId: userId
  });
};

/**
 * Retrieve paginated notifications for an authenticated user.
 */
export const getUserNotifications = async (userId, { page = 1, limit = 20, unreadOnly = false } = {}) => {
  const filter = { recipientId: userId };
  if (unreadOnly) {
    filter.isRead = false;
  }

  const numericPage = Math.max(1, parseInt(page, 10) || 1);
  const numericLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (numericPage - 1) * numericLimit;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(numericLimit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipientId: userId, isRead: false })
  ]);

  return {
    notifications,
    total,
    unreadCount,
    page: numericPage,
    totalPages: Math.ceil(total / numericLimit) || 1
  };
};

/**
 * Get accurate unread count for an authenticated user.
 */
export const getUnreadCount = async (userId) => {
  return Notification.countDocuments({ recipientId: userId, isRead: false });
};

/**
 * Mark a single notification as read if owned by the user.
 */
export const markNotificationRead = async (notificationId, userId) => {
  return Notification.findOneAndUpdate(
    { _id: notificationId, recipientId: userId },
    { $set: { isRead: true, readAt: new Date() } },
    { new: true }
  );
};

/**
 * Mark all notifications as read for an authenticated user.
 */
export const markAllNotificationsRead = async (userId) => {
  return Notification.updateMany(
    { recipientId: userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );
};

/**
 * Delete a notification if owned by the user.
 */
export const deleteNotification = async (notificationId, userId) => {
  return Notification.findOneAndDelete({ _id: notificationId, recipientId: userId });
};

export default {
  createNotification,
  createNotifications,
  notifyRole,
  notifyUser,
  getUserNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification
};
