import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { groomersAPI } from '../services/api';

function GroomerList() {
  const [groomers, setGroomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    loadGroomers();
  }, []);

  const loadGroomers = async () => {
    try {
      const res = await groomersAPI.list();
      setGroomers(res.data.groomers);
    } catch (error) {
      console.error('Load groomers error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredGroomers = groomers.filter(g => {
    if (!filter) return true;
    const name = g.userId?.name?.toLowerCase() || '';
    const bio = g.bio?.toLowerCase() || '';
    return name.includes(filter.toLowerCase()) || bio.includes(filter.toLowerCase());
  });

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= rating ? 'star filled' : 'star'}>★</span>
      );
    }
    return stars;
  };

  return (
    <div className="groomer-list-page">
      <header className="page-header">
        <h1>美容师列表</h1>
      </header>

      <div className="search-bar">
        <input
          type="text"
          placeholder="搜索美容师..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <div className="groomers-container">
        {loading ? (
          <div className="loading">加载中...</div>
        ) : filteredGroomers.length === 0 ? (
          <div className="empty-state">
            <p>暂无美容师</p>
          </div>
        ) : (
          filteredGroomers.map(groomer => (
            <Link 
              to={`/groomers/${groomer._id}`} 
              key={groomer._id}
              className="groomer-card"
            >
              <div className="groomer-avatar">
                {groomer.userId?.name?.[0] || '?'}
              </div>
              
              <div className="groomer-info">
                <h3>{groomer.userId?.name}</h3>
                
                <div className="rating">
                  {renderStars(Math.round(groomer.rating || 0))}
                  <span className="rating-value">
                    {groomer.rating?.toFixed(1) || '0.0'}
                  </span>
                  <span className="review-count">
                    ({groomer.totalReviews || 0} 评价)
                  </span>
                </div>
                
                {groomer.bio && (
                  <p className="bio">{groomer.bio}</p>
                )}
                
                <div className="stats">
                  <span>📋 已完成 {groomer.completedJobs || 0} 单</span>
                  {groomer.isOnline && <span className="online-badge">🟢 在线</span>}
                </div>
                
                <div className="skills">
                  {groomer.skills?.slice(0, 3).map(skill => (
                    <span key={skill} className="skill-tag">{skill}</span>
                  ))}
                </div>
              </div>
              
              <div className="groomer-price">
                ¥{groomer.basePrice || '起'}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export default GroomerList;
