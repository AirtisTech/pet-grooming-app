import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ordersAPI } from '../services/api';

function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    loadRecentOrders();
  }, []);

  const loadRecentOrders = async () => {
    try {
      const res = await ordersAPI.list();
      setRecentOrders(res.data.orders.slice(0, 5));
    } catch (error) {
      console.error('Load orders error:', error);
    }
  };

  const isCustomer = user?.role === 'customer';
  const isGroomer = user?.role === 'groomer';

  return (
    <div className="home-page">
      <header className="app-header">
        <div className="header-left">
          <h1>🐾 PetGroom</h1>
        </div>
        <div className="header-right">
          <Link to="/profile" className="user-info">
            <span className="avatar">{user?.name?.[0]}</span>
            <span>{user?.name}</span>
          </Link>
          <button onClick={logout} className="btn-logout">退出</button>
        </div>
      </header>

      <main className="main-content">
        <div className="welcome-section">
          <h2>欢迎回来, {user?.name}!</h2>
          <p>
            {isCustomer && '找到完美的宠物美容师'}
            {isGroomer && '接收新订单，开始服务'}
          </p>
        </div>

        <div className="action-cards">
          {isCustomer && (
            <>
              <Link to="/orders/new" className="action-card primary">
                <div className="card-icon">📝</div>
                <div className="card-text">
                  <h3>发布订单</h3>
                  <p>描述您的宠物护理需求</p>
                </div>
              </Link>

              <Link to="/groomers" className="action-card">
                <div className="card-icon">🔍</div>
                <div className="card-text">
                  <h3>浏览美容师</h3>
                  <p>找到可靠的美容师</p>
                </div>
              </Link>
            </>
          )}

          {isGroomer && (
            <>
              <Link to="/orders" className="action-card primary">
                <div className="card-icon">📥</div>
                <div className="card-text">
                  <h3>我的订单</h3>
                  <p>管理您的接单</p>
                </div>
              </Link>

              <Link to="/orders/available" className="action-card">
                <div className="card-icon">🎯</div>
                <div className="card-text">
                  <h3>新订单</h3>
                  <p>查看可接订单</p>
                </div>
              </Link>
            </>
          )}
        </div>

        {recentOrders.length > 0 && (
          <div className="recent-orders">
            <h3>最近订单</h3>
            <div className="orders-list">
              {recentOrders.map(order => (
                <div key={order._id} className="order-item">
                  <div className="order-info">
                    <span className="pet-name">{order.petName}</span>
                    <span className={`status status-${order.status}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="order-meta">
                    {order.services?.join(', ')}
                  </div>
                </div>
              ))}
            </div>
            <Link to="/orders" className="view-all">查看全部 →</Link>
          </div>
        )}
      </main>

      <nav className="bottom-nav">
        <Link to="/" className="nav-item active">
          <span>🏠</span>
          <span>首页</span>
        </Link>
        <Link to="/orders" className="nav-item">
          <span>📋</span>
          <span>订单</span>
        </Link>
        <Link to="/groomers" className="nav-item">
          <span>✂️</span>
          <span>美容师</span>
        </Link>
        <Link to="/profile" className="nav-item">
          <span>👤</span>
          <span>我的</span>
        </Link>
      </nav>
    </div>
  );
}

export default Home;
