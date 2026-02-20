import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { groomersAPI, ordersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

function GroomerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [groomer, setGroomer] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGroomer();
  }, [id]);

  const loadGroomer = async () => {
    try {
      const res = await groomersAPI.getById(id);
      setGroomer(res.data.profile);
      setReviews(res.data.reviews || []);
    } catch (error) {
      console.error('Load groomer error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGroomer = async (orderId) => {
    try {
      await ordersAPI.update(orderId, { groomerId: id });
      navigate('/orders');
    } catch (error) {
      alert('选择美容师失败');
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= rating ? 'star filled' : 'star'}>★</span>
      );
    }
    return stars;
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (!groomer) {
    return <div className="error">美容师不存在</div>;
  }

  return (
    <div className="groomer-profile-page">
      <header className="page-header">
        <button onClick={() => navigate(-1)} className="btn-back">←</button>
        <h1>美容师资料</h1>
      </header>

      <div className="profile-header">
        <div className="profile-avatar">
          {groomer.userId?.name?.[0] || '?'}
        </div>
        <h2>{groomer.userId?.name}</h2>
        
        <div className="rating">
          {renderStars(Math.round(groomer.rating || 0))}
          <span>{groomer.rating?.toFixed(1) || '0.0'}</span>
        </div>

        {groomer.isOnline && <span className="online-badge">🟢 在线接单</span>}
      </div>

      <div className="profile-stats">
        <div className="stat">
          <span className="stat-value">{groomer.completedJobs || 0}</span>
          <span className="stat-label">完成订单</span>
        </div>
        <div className="stat">
          <span className="stat-value">{groomer.totalReviews || 0}</span>
          <span className="stat-label">评价</span>
        </div>
        <div className="stat">
          <span className="stat-value">{(groomer.responseTime || 60)}分钟</span>
          <span className="stat-label">平均响应</span>
        </div>
      </div>

      {groomer.bio && (
        <section className="profile-section">
          <h3>个人简介</h3>
          <p>{groomer.bio}</p>
        </section>
      )}

      <section className="profile-section">
        <h3>擅长服务</h3>
        <div className="skills-grid">
          {groomer.skills?.map(skill => (
            <span key={skill} className="skill-tag">{skill}</span>
          ))}
        </div>
      </section>

      {groomer.serviceAreas?.length > 0 && (
        <section className="profile-section">
          <h3>服务区域</h3>
          <div className="service-areas">
            {groomer.serviceAreas.map((area, i) => (
              <p key={i}>{area.city} - {area.districts?.join(', ')}</p>
            ))}
          </div>
        </section>
      )}

      {reviews.length > 0 && (
        <section className="profile-section">
          <h3>用户评价</h3>
          <div className="reviews-list">
            {reviews.map((review, i) => (
              <div key={i} className="review-item">
                <div className="review-header">
                  <span className="reviewer-name">
                    {review.customerId?.name || '匿名'}
                  </span>
                  <span className="review-rating">
                    {renderStars(review.rating)}
                  </span>
                </div>
                {review.review && (
                  <p className="review-text">{review.review}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {user?.role === 'customer' && (
        <div className="profile-actions">
          <button 
            className="btn-primary"
            onClick={() => navigate('/orders/new')}
          >
            选择这位美容师
          </button>
        </div>
      )}
    </div>
  );
}

export default GroomerProfile;
