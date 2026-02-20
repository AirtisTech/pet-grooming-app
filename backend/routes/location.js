const express = require('express');
const Location = require('../models/Location');

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

// Update current location
router.post('/update', auth, async (req, res) => {
  try {
    const { orderId, latitude, longitude, address, accuracy, speed, heading, type } = req.body;

    const location = new Location({
      userId: req.userId,
      orderId,
      type: type || 'groomer_tracking',
      coordinates: { latitude, longitude },
      address,
      accuracy,
      speed,
      heading
    });

    await location.save();

    // Broadcast to relevant users
    const io = req.app.get('io');
    
    if (orderId) {
      // Notify people related to this order
      io.to(`order_${orderId}`).emit('location_update', {
        userId: req.userId,
        orderId,
        coordinates: { latitude, longitude },
        timestamp: location.timestamp
      });
    }

    res.json({ success: true, location });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get location history
router.get('/history', auth, async (req, res) => {
  try {
    const { orderId, userId, startTime, endTime, limit = 100 } = req.query;
    
    let query = {};
    
    if (orderId) query.orderId = orderId;
    if (userId) query.userId = userId;
    
    if (startTime || endTime) {
      query.timestamp = {};
      if (startTime) query.timestamp.$gte = new Date(startTime);
      if (endTime) query.timestamp.$lte = new Date(endTime);
    }

    const locations = await Location.find(query)
      .populate('userId', 'name')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json({ locations });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get latest location
router.get('/latest', auth, async (req, res) => {
  try {
    const { userId, orderId } = req.query;
    
    let query = {};
    if (userId) query.userId = userId;
    if (orderId) query.orderId = orderId;

    const location = await Location.findOne(query)
      .populate('userId', 'name avatar')
      .sort({ timestamp: -1 });

    res.json({ location });
  } catch (error) {
    console.error('Get latest error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Subscribe to order location tracking
router.post('/subscribe/:orderId', auth, async (req, res) => {
  try {
    const io = req.app.get('io');
    io.join(`order_${req.params.orderId}`);
    
    res.json({ success: true, message: `Subscribed to order ${req.params.orderId}` });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Unsubscribe from order tracking
router.post('/unsubscribe/:orderId', auth, async (req, res) => {
  try {
    const io = req.app.get('io');
    io.leave(`order_${req.params.orderId}`);
    
    res.json({ success: true, message: `Unsubscribed from order ${req.params.orderId}` });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Calculate distance between two points (Haversine formula)
router.get('/distance', auth, async (req, res) => {
  try {
    const { lat1, lng1, lat2, lng2 } = req.query;
    
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    res.json({ distance: Math.round(distance * 100) / 100 });
  } catch (error) {
    console.error('Distance calculation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
