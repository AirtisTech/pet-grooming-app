const express = require('express');
const Order = require('../models/Order');
const User = require('../models/User');
const GroomerProfile = require('../models/GroomerProfile');

const router = express.Router();

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

// Payment initialization (mock)
router.post('/initiate', auth, async (req, res) => {
  try {
    const { orderId, amount, paymentMethod } = req.body;
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Verify ownership
    if (order.customerId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // In production, integrate with payment provider (Stripe, PayPal, etc.)
    // Here we simulate payment
    const paymentId = 'pay_' + Date.now();
    const mockPayment = {
      id: paymentId,
      orderId,
      amount,
      paymentMethod: paymentMethod || 'alipay',
      status: 'pending',
      createdAt: new Date()
    };

    res.json({
      success: true,
      payment: mockPayment,
      message: 'Payment initiated successfully'
    });
  } catch (error) {
    console.error('Payment init error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Payment callback (webhook)
router.post('/callback', async (req, res) => {
  try {
    const { paymentId, orderId, status } = req.body;

    // Verify payment (in production, verify signature)
    if (status === 'success') {
      const order = await Order.findById(orderId);
      if (order) {
        order.paymentStatus = 'paid';
        order.paymentId = paymentId;
        await order.save();

        // Notify groomer
        const io = req.app.get('io');
        if (order.groomerId) {
          io.to(`user_${order.groomerId}`).emit('payment_received', {
            orderId: order._id,
            amount: order.price
          });
        }
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Payment callback error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get payment status
router.get('/status/:orderId', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      orderId: order._id,
      paymentStatus: order.paymentStatus || 'unpaid',
      amount: order.price
    });
  } catch (error) {
    console.error('Payment status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Withdraw earnings (for groomers)
router.post('/withdraw', auth, async (req, res) => {
  try {
    const { amount, bankAccount } = req.body;

    // Verify user is groomer
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'groomer') {
      return res.status(403).json({ error: 'Only groomers can withdraw' });
    }

    // Get groomer profile
    const profile = await GroomerProfile.findOne({ userId: req.userId });
    if (!profile || !profile.earnings || profile.earnings < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // In production, process withdrawal through payment provider
    const withdrawalId = 'wd_' + Date.now();
    
    profile.earnings -= amount;
    await profile.save();

    res.json({
      success: true,
      withdrawalId,
      amount,
      message: 'Withdrawal initiated'
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get earnings (for groomers)
router.get('/earnings', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'groomer') {
      return res.status(403).json({ error: 'Only groomers can view earnings' });
    }

    const profile = await GroomerProfile.findOne({ userId: req.userId });
    
    res.json({
      balance: profile?.earnings || 0,
      pending: profile?.pendingEarnings || 0,
      withdrawn: profile?.withdrawn || 0
    });
  } catch (error) {
    console.error('Earnings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
