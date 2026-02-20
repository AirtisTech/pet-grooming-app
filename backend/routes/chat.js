const express = require('express');
const { Message, Conversation } = require('../models/Chat');

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

// Create or get conversation
router.post('/conversations', auth, async (req, res) => {
  try {
    const { participantId, orderId } = req.body;
    
    let conversation = await Conversation.findOne({
      participants: { $all: [req.userId, participantId] },
      orderId: orderId || null
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [req.userId, participantId],
        orderId,
        unreadCount: new Map()
      });
      await conversation.save();
    }

    res.json({ conversation });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's conversations
router.get('/conversations', auth, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.userId
    })
      .populate('participants', 'name avatar')
      .populate('orderId', 'petName services')
      .sort({ lastMessageAt: -1 });

    const result = conversations.map(conv => {
      const unread = conv.unreadCount?.get(req.userId.toString()) || 0;
      return {
        ...conv.toObject(),
        unreadCount: unread
      };
    });

    res.json({ conversations: result });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get messages in a conversation
router.get('/conversations/:id/messages', auth, async (req, res) => {
  try {
    const { before, limit = 50 } = req.query;
    
    let query = { conversationId: req.params.id };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .populate('senderId', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    await Message.updateMany(
      {
        conversationId: req.params.id,
        senderId: { $ne: req.userId },
        read: false
      },
      { read: true }
    );

    await Conversation.findByIdAndUpdate(req.params.id, {
      [`unreadCount.${req.userId}`]: 0
    });

    res.json({ messages: messages.reverse() });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send a message
router.post('/messages', auth, async (req, res) => {
  try {
    const { conversationId, message, type, metadata } = req.body;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (!conversation.participants.includes(req.userId)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const newMessage = new Message({
      conversationId,
      senderId: req.userId,
      message,
      type: type || 'text',
      metadata
    });

    await newMessage.save();

    conversation.participants.forEach(p => {
      if (p.toString() !== req.userId.toString()) {
        const current = conversation.unreadCount?.get(p.toString()) || 0;
        conversation.unreadCount.set(p.toString(), current + 1);
      }
    });
    await conversation.save();

    await newMessage.populate('senderId', 'name avatar');

    const io = req.app.get('io');
    conversation.participants.forEach(p => {
      if (p.toString() !== req.userId.toString()) {
        io.to(`user_${p}`).emit('new_message', newMessage);
      }
    });

    res.status(201).json({ message: newMessage });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send location message
router.post('/location', auth, async (req, res) => {
  try {
    const { conversationId, latitude, longitude, address } = req.body;

    const message = await Message.create({
      conversationId,
      senderId: req.userId,
      message: address || '位置信息',
      type: 'location',
      metadata: { latitude, longitude, address }
    });

    await message.populate('senderId', 'name avatar');

    const io = req.app.get('io');
    const conversation = await Conversation.findById(conversationId);
    conversation.participants.forEach(p => {
      if (p.toString() !== req.userId.toString()) {
        io.to(`user_${p}`).emit('new_message', message);
      }
    });

    res.json({ message });
  } catch (error) {
    console.error('Send location error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
