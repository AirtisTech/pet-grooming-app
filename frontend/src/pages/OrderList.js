import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ordersAPI, groomersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

function OrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const res = await ordersAPI.list();
      setOrders(res.data.orders);
    } catch (error) {
      console.error('Load orders error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (orderId) => {
    try {
      await groomersAPI.accept(orderId);
      loadOrders();
    } catch (error) {
      alert('接单失败');
    }
  };

  const handleComplete = async (orderId) => {
    try {
      await groomersAPI.complete(orderId);
      loadOrders();
    } catch (error) {
      alert('操作失败');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#FFA500',
      accepted: '#4CAF50',
      in_progress: '#2196F3',
      completed: '#9C27B0',
      cancelled: '#F44336'
    };
    return colors[status] || '#999';
  };

  const isGroomer = user?.role === 'groomer';

  return (
    <div className="order-list-page">
      <header className="page-header">
        <button onClick={() => navigate(-1)} className="btn-back">←</button>
        <h1>我的订单</h1>
        {isGroomer && (
          <Link to="/orders/available" className="btn-small">新订单</Link>
        )}
      </header>

      <div className="orders-container">
        {loading ? (
          <div className="loading">加载中...</div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <p>暂无订单</p>
            {user?.role === 'customer' && (
              <Link to="/orders/new" className="btn-primary">
                发布订单
              </Link>
            )}
          </div>
        ) : (
          orders.map(order => (
            <div key={order._id} className="order-card">
              <div className="order-header">
                <span className="pet-name">{order.petName}</span>
                <span 
                  className="order-status"
                  style={{ backgroundColor: getStatusColor(order.status) }}
                >
                  {order.status}
                </span>
              </div>
              
              <div className="order-body">
                <p className="services">
                  {order.services?.join(', ')}
                </p>
                <p className="address">
                  📍 {order.address?.city} {order.address?.district}
                </p>
                <p className="time">
                  📅 {order.scheduledDate} {order.scheduledTime}
                </p>
              </div>

              <div className="order-footer">
                <span className="price">¥{order.price}</span>
                
                {isGroomer && order.status === 'pending' && (
                  <button 
                    className="btn-primary btn-small"
                    onClick={() => handleAccept(order._id)}
                  >
                    接单
                  </button>
                )}
                
                {isGroomer && order.status === 'accepted' && (
                  <button 
                    className="btn-success btn-small"
                    onClick={() => handleComplete(order._id)}
                  >
                    完成
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default OrderList;
