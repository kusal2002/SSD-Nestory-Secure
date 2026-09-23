const Notification = require('../models/Notification');
const User = require('../models/User');
const { getIo } = require('../realtime/socketServer');

/**
 * Creates and sends a notification to a single recipient
 * @param {Object} params
 * @param {string} params.recipient - The user ID of the recipient
 * @param {string} [params.sender] - The user ID of the sender (optional)
 * @param {string} params.type - The notification type (search_request, assignment, badge, system)
 * @param {string} params.title - Notification title
 * @param {string} params.message - Notification message
 * @param {Object} [params.data] - Additional data for the notification
 */
const sendNotification = async ({ recipient, sender, type, title, message, data = {} }) => {
  try {
    const notification = await Notification.create({
      recipient,
      sender,
      type,
      title,
      message,
      data,
    });

    try {
      const io = getIo();
      if (io) {
        io.to(`user:${recipient}`).emit('notification:new', {
          notification,
        });
      }
    } catch (socketError) {
      console.warn('[NotificationHelper] Socket emit failed:', socketError.message);
    }

    return notification;
  } catch (error) {
    console.error('[NotificationHelper] Failed to create notification:', error.message);
    return null;
  }
};

/**
 * Sends a notification to all active admins
 */
const notifyAdmins = async ({ sender, type, title, message, data = {} }) => {
  try {
    const admins = await User.find({ role: 'admin', isActive: true });
    const notifications = [];

    for (const admin of admins) {
      const n = await sendNotification({
        recipient: admin._id,
        sender,
        type,
        title,
        message,
        data,
      });
      if (n) notifications.push(n);
    }

    return notifications;
  } catch (error) {
    console.error('[NotificationHelper] notifyAdmins failed:', error.message);
    return [];
  }
};

/**
 * Sends a notification to all family members (except sender)
 * @param {Object} params
 * @param {string} params.sender - The user ID of the sender
 * @param {Array} params.recipientIds - Array of user IDs to notify
 * @param {string} params.type - The notification type (e.g., 'chat')
 * @param {string} params.title - Notification title
 * @param {string} params.message - Notification message
 * @param {Object} [params.data] - Additional data for the notification
 */
const sendNotificationToMultiple = async ({ sender, recipientIds = [], type, title, message, data = {} }) => {
  try {
    const notifications = [];
    
    // Filter out the sender from recipients to avoid self-notifications
    const uniqueRecipients = [...new Set(recipientIds)];
    const recipientsToNotify = uniqueRecipients.filter(
      (id) => id.toString() !== sender.toString()
    );

    for (const recipientId of recipientsToNotify) {
      const n = await sendNotification({
        recipient: recipientId,
        sender,
        type,
        title,
        message,
        data,
      });
      if (n) notifications.push(n);
    }

    return notifications;
  } catch (error) {
    console.error('[NotificationHelper] sendNotificationToMultiple failed:', error.message);
    return [];
  }
};

module.exports = {
  sendNotification,
  notifyAdmins,
  sendNotificationToMultiple,
};
