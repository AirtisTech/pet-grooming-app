import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import socketService from './socket';
import { authAPI } from './api';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [permission, setPermission] = useState('default');

  useEffect(() => {
    // Check initial permission
    setPermission(socketService.getNotificationPermission());

    // Request permission on mount
    const requestPermission = async () => {
      const granted = await socketService.requestNotificationPermission();
      setPermission(granted ? 'granted' : 'denied');
    };
    requestPermission();

    // Subscribe to notification events
    const unsubscribeNotification = socketService.on('notification', handleNotification);
    const unsubscribeOrderStatus = socketService.on('order_status', handleOrderNotification);
    const unsubscribeNewMessage = socketService.on('new_message', handleMessageNotification);

    return () => {
      unsubscribeNotification();
      unsubscribeOrderStatus();
      unsubscribeNewMessage();
    };
  }, []);

  const handleNotification = useCallback((data) => {
    const notification = {
      id: Date.now(),
      ...data,
      read: false,
      timestamp: new Date(),
    };
    
    setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep last 50
    setUnreadCount(prev => prev + 1);
  }, []);

  const handleOrderNotification = useCallback((data) => {
    const notification = {
      id: Date.now(),
      type: 'order',
      title: '订单更新',
      message: getOrderStatusMessage(data.status),
      data,
      read: false,
      timestamp: new Date(),
    };
    
    setNotifications(prev => [notification, ...prev].slice(0, 50));
    setUnreadCount(prev => prev + 1);
  }, []);

  const handleMessageNotification = useCallback((data) => {
    const notification = {
      id: Date.now(),
      type: 'message',
      title: '新消息',
      message: data.message?.substring(0, 50) || '您有新消息',
      data,
      read: false,
      timestamp: new Date(),
    };
    
    setNotifications(prev => [notification, ...prev].slice(0, 50));
    setUnreadCount(prev => prev + 1);
  }, []);

  const getOrderStatusMessage = (status) => {
    const messages = {
      pending: '等待处理',
      accepted: '已接单',
      in_progress: '服务中',
      completed: '已完成',
      cancelled: '已取消',
    };
    return messages[status] || '状态更新';
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const requestPermission = async () => {
    const granted = await socketService.requestNotificationPermission();
    setPermission(granted ? 'granted' : 'denied');
    return granted;
  };

  const value = {
    notifications,
    unreadCount,
    permission,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    requestPermission,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}

export default NotificationContext;
