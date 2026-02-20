const express = require('express');
const router = express.Router();

// Notification types
const NOTIFICATION_TYPES = {
  NEW_ORDER: 'new_order',
  ORDER_ACCEPTED: 'order_accepted',
  ORDER_COMPLETED: 'order_completed',
  ORDER_CANCELLED: 'order_cancelled',
  NEW_REVIEW: 'new_review',
  PAYMENT_RECEIVED: 'payment_received',
  SYSTEM: 'system'
};

// In-memory notification store (use Redis in production)
let notifications = new Map();

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'petgroom_secret_key_2024');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Create notification
const createNotification = async (userId, type, title, message, data = {}) => {
  const notification = {
    id: Date.now().toString(),
    userId,
    type,
    title,
    message,
    data,
    read: false,
    createdAt: new Date()
  };
  
  if (!notifications.has(userId)) {
    notifications.set(userId, []);
  }
  notifications.get(userId).unshift(notification);
  
  // Keep only last 100 notifications
  const userNotifs = notifications.get(userId);
  if (userNotifs.length > 100) {
    userNotifs.length = 100;
  }
  
  return notification;
};

// Get user notifications
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.userId.toString();
    const userNotifs = notifications.get(userId) || [];
    
    const { unreadOnly } = req.query;
    let result = userNotifs;
    
    if (unreadOnly === 'true') {
      result = userNotifs.filter(n => !n.read);
    }
    
    res.json({ 
      notifications: result,
      unreadCount: userNotifs.filter(n => !n.read).length 
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const userId = req.userId.toString();
    const userNotifs = notifications.get(userId) || [];
    
    const notification = userNotifs.find(n => n.id === req.params.id);
    if (notification) {
      notification.read = true;
      res.json({ message: 'Marked as read' });
    } else {
      res.status(404).json({ error: 'Notification not found' });
    }
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark all as read
router.put('/read-all', auth, async (req, res) => {
  try {
    const userId = req.userId.toString();
    const userNotifs = notifications.get(userId) || [];
    
    userNotifs.forEach(n => n.read = true);
    
    res.json({ message: 'All marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete notification
router.delete('/:id', auth, async (req, res) => {
  try {
    const userId = req.userId.toString();
    const userNotifs = notifications.get(userId) || [];
    
    const index = userNotifs.findIndex(n => n.id === req.params.id);
    if (index > -1) {
      userNotifs.splice(index, 1);
      res.json({ message: 'Deleted' });
    } else {
      res.status(404).json({ error: 'Notification not found' });
    }
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Push notification helper (for Socket.io)
module.exports = {
  router,
  createNotification,
  NOTIFICATION_TYPES
};
