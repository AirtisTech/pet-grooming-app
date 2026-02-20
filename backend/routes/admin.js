const express = require('express');
const Order = require('../models/Order');
const User = require('../models/User');
const GroomerProfile = require('../models/GroomerProfile');

const router = express.Router();

// Middleware to verify admin
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

const adminAuth = async (req, res, next) => {
  const user = await User.findById(req.userId);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Dashboard stats
router.get('/stats', auth, adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalGroomers = await User.countDocuments({ role: 'groomer', isApproved: true });
    const pendingGroomers = await User.countDocuments({ role: 'groomer', isApproved: false });
    const totalOrders = await Order.countDocuments();
    const completedOrders = await Order.countDocuments({ status: 'completed' });
    
    const recentOrders = await Order.find()
      .populate('customerId', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      stats: {
        totalUsers,
        totalGroomers,
        pendingGroomers,
        totalOrders,
        completedOrders,
        completionRate: totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0
      },
      recentOrders
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all users
router.get('/users', auth, adminAuth, async (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    
    let query = {};
    if (role) query.role = role;

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Approve/reject groomer
router.put('/groomers/:id/approve', auth, adminAuth, async (req, res) => {
  try {
    const { isApproved } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'groomer') {
      return res.status(404).json({ error: 'Groomer not found' });
    }

    user.isApproved = isApproved;
    await user.save();

    res.json({ 
      message: isApproved ? 'Groomer approved' : 'Groomer rejected',
      user: { id: user._id, isApproved: user.isApproved }
    });
  } catch (error) {
    console.error('Approve error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all orders (admin view)
router.get('/orders', auth, adminAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    let query = {};
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('customerId', 'name email')
      .populate('groomerId', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Cancel order (admin)
router.put('/orders/:id/cancel', auth, adminAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    order.status = 'cancelled';
    await order.save();

    res.json({ message: 'Order cancelled', order });
  } catch (error) {
    console.error('Cancel error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Platform settings
router.get('/settings', auth, adminAuth, async (req, res) => {
  // In production, load from database
  res.json({
    settings: {
      commission: 15,
      minWithdraw: 100,
      platformName: 'PetGroom',
      supportEmail: 'support@petgroom.com'
    }
  });
});

router.put('/settings', auth, adminAuth, async (req, res) => {
  // In production, save to database
  res.json({ message: 'Settings updated' });
});

module.exports = router;
