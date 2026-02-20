const express = require('express');
const GroomerProfile = require('../models/GroomerProfile');
const Order = require('../models/Order');
const User = require('../models/User');

const router = express.Router();

// Middleware to verify token
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

// Get all groomers (public)
router.get('/', async (req, res) => {
  try {
    const { city, service, rating } = req.query;
    
    let query = { isApproved: true };
    
    const groomers = await User.find({ role: 'groomer', isApproved: true })
      .select('name avatar createdAt');
    
    const profiles = await GroomerProfile.find(query)
      .populate('userId', 'name avatar')
      .sort({ rating: -1 });

    res.json({ groomers: profiles });
  } catch (error) {
    console.error('Get groomers error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get groomer profile
router.get('/profile', auth, async (req, res) => {
  try {
    let profile = await GroomerProfile.findOne({ userId: req.userId })
      .populate('userId', 'name email phone avatar');

    if (!profile) {
      // Create default profile
      profile = await GroomerProfile.create({ userId: req.userId });
    }

    res.json({ profile });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update groomer profile
router.put('/profile', auth, async (req, res) => {
  try {
    const {
      bio,
      skills,
      serviceAreas,
      availability,
      basePrice,
      images
    } = req.body;

    let profile = await GroomerProfile.findOneAndUpdate(
      { userId: req.userId },
      {
        bio,
        skills,
        serviceAreas,
        availability,
        basePrice,
        images
      },
      { new: true, upsert: true }
    ).populate('userId', 'name email phone');

    res.json({ profile });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get groomer by ID
router.get('/:id', async (req, res) => {
  try {
    const profile = await GroomerProfile.findById(req.params.id)
      .populate('userId', 'name avatar email phone');

    if (!profile) {
      return res.status(404).json({ error: 'Groomer not found' });
    }

    // Get reviews
    const reviews = await Order.find({
      groomerId: profile.userId._id,
      rating: { $exists: true }
    })
      .populate('customerId', 'name')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ profile, reviews });
  } catch (error) {
    console.error('Get groomer error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Accept order
router.post('/accept/:orderId', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Order not available' });
    }

    order.groomerId = req.userId;
    order.status = 'accepted';
    await order.save();

    // Notify customer
    const io = req.app.get('io');
    io.to(`user_${order.customerId}`).emit('order_accepted', {
      orderId: order._id,
      groomerId: req.userId
    });

    res.json({ message: 'Order accepted', order });
  } catch (error) {
    console.error('Accept order error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Complete order
router.post('/complete/:orderId', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.groomerId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    order.status = 'completed';
    await order.save();

    // Update groomer stats
    await GroomerProfile.findOneAndUpdate(
      { userId: req.userId },
      {
        $inc: { completedJobs: 1, totalJobs: 1 }
      }
    );

    res.json({ message: 'Order completed', order });
  } catch (error) {
    console.error('Complete order error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Set online status
router.post('/status', auth, async (req, res) => {
  try {
    const { isOnline } = req.body;

    await GroomerProfile.findOneAndUpdate(
      { userId: req.userId },
      { isOnline }
    );

    res.json({ message: 'Status updated', isOnline });
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
