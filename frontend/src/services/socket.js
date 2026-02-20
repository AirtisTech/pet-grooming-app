import { io } from 'socket.io-client';
import { authAPI } from './api';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect() {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token, skipping socket connection');
      return null;
    }

    if (this.socket?.connected) {
      return this.socket;
    }

    const socketUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
    
    this.socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
    });

    this.setupEventHandlers();
    return this.socket;
  }

  setupEventHandlers() {
    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
      this.reconnectAttempts = 0;
      
      // Re-join user room after connection
      const userId = localStorage.getItem('userId');
      if (userId) {
        this.socket.emit('join', userId);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      this.reconnectAttempts++;
    });

    // Order notifications
    this.socket.on('order_available', (data) => {
      this.emit('order_available', data);
    });

    this.socket.on('order_status', (data) => {
      this.emit('order_status', data);
    });

    this.socket.on('order_accepted', (data) => {
      this.emit('order_accepted', data);
    });

    this.socket.on('new_message', (data) => {
      this.emit('new_message', data);
    });

    this.socket.on('notification', (data) => {
      this.emit('notification', data);
      // Show browser notification if permitted
      this.showBrowserNotification(data);
    });

    this.socket.on('payment_received', (data) => {
      this.emit('payment_received', data);
    });
  }

  join(userId) {
    if (this.socket?.connected) {
      this.socket.emit('join', userId);
    }
  }

  // Emit new order (for customers)
  emitNewOrder(orderData) {
    if (this.socket?.connected) {
      this.socket.emit('new_order', orderData);
    }
  }

  // Emit order accepted (for groomers)
  emitOrderAccepted(data) {
    if (this.socket?.connected) {
      this.socket.emit('order_accepted', data);
    }
  }

  // Subscribe to events
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  // Emit to local listeners
  emit(event, data) {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in socket listener for ${event}:`, error);
      }
    });
  }

  // Show browser notification
  showBrowserNotification(data) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(data.title || 'PetGroom', {
        body: data.message || data.body,
        icon: '/logo192.png',
        badge: '/logo192.png',
        tag: data.tag || 'petgroom-notification',
        requireInteraction: data.urgent || false,
      });
    }
  }

  // Request notification permission
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  // Check notification permission status
  getNotificationPermission() {
    if (!('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected() {
    return this.socket?.connected || false;
  }

  getSocket() {
    return this.socket;
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;
