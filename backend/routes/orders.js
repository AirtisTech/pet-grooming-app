const express = require('express');
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

// Create order
router.post('/', auth, async (req, res) => {
  try {
    const order = new Order({
      ...req.body,
      customerId: req.userId
    });

    await order.save();

    // Notify groomers via Socket.io
    const io = req.app.get('io');
    io.emit('new_order', {
      orderId: order._id,
      petType: order.petType,
      services: order.services,
      price: order.price
    });

    res.status(201).json({ order });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get orders (different for customer and groomer)
router.get('/', auth, async (req, res) => {
  try {
    const { role } = await User.findById(req.userId);
    let query = {};

    if (role === 'customer') {
      query.customerId = req.userId;
    } else if (role === 'groomer') {
      query.groomerId = req.userId;
    }

    const orders = await Order.find(query)
      .populate('customerId', 'name phone')
      .populate('groomerId', 'name')
      .sort({ createdAt: -1 });

    res.json({ orders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get available orders for groomers
router.get('/available', auth, async (req, res) => {
  try {
    const orders = await Order.find({
      status: 'pending',
      groomerId: null
    })
      .populate('customerId', 'name')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ orders });
  } catch (error) {
    console.error('Get available orders error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single order
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customerId', 'name phone')
      .populate('groomerId', 'name');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update order status
router.put('/:id', auth, async (req, res) => {
  try {
    const { status, price, groomerId } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update fields
    if (status) order.status = status;
    if (price) order.price = price;
    if (groomerId) order.groomerId = groomerId;

    await order.save();

    // Notify via Socket.io
    const io = req.app.get('io');
    io.to(`user_${order.customerId}`).emit('order_status', {
      orderId: order._id,
      status: order.status,
      groomerId: order.groomerId
    });

    res.json({ order });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Cancel order
router.delete('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Only customer can cancel pending orders
    if (order.customerId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Cannot cancel this order' });
    }

    order.status = 'cancelled';
    await order.save();

    res.json({ message: 'Order cancelled' });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add review
router.post('/:id/review', auth, async (req, res) => {
  try {
    const { rating, review } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    order.rating = rating;
    order.review = review;
    order.customerReviewed = true;
    await order.save();

    res.json({ message: 'Review added', order });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
