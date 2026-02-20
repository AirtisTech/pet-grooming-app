import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { groomersAPI, authAPI } from '../services/api';

function MyProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bio: '',
    skills: [],
    serviceAreas: [{ city: '', districts: [] }],
    basePrice: 0,
    availability: {}
  });

  useEffect(() => {
    if (user?.role === 'groomer') {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const res = await groomersAPI.profile();
      setProfile(res.data.profile);
      if (res.data.profile) {
        setFormData({
          bio: res.data.profile.bio || '',
          skills: res.data.profile.skills || [],
          serviceAreas: res.data.profile.serviceAreas || [{ city: '', districts: [] }],
          basePrice: res.data.profile.basePrice || 0,
          availability: res.data.profile.availability || {}
        });
      }
    } catch (error) {
      console.error('Load profile error:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await groomersAPI.updateProfile(formData);
      alert('资料已更新');
    } catch (error) {
      alert('更新失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSkillToggle = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const SERVICES = [
    'bath', 'haircut', 'nail_trim', 'teeth_cleaning', 
    'ear_cleaning', 'flea_treatment', 'styling'
  ];

  const isGroomer = user?.role === 'groomer';

  return (
    <div className="profile-page">
      <header className="page-header">
        <h1>我的资料</h1>
      </header>

      <div className="profile-content">
        <div className="user-info-card">
          <div className="avatar-large">
            {user?.name?.[0]}
          </div>
          <h2>{user?.name}</h2>
          <p>{user?.email}</p>
          <span className={`role-badge ${user?.role}`}>
            {user?.role === 'customer' ? '🐕 宠物主人' : '✂️ 美容师'}
          </span>
        </div>

        {isGroomer && (
          <form onSubmit={handleSubmit} className="profile-form">
            <section className="form-section">
              <h3>个人简介</h3>
              <textarea
                value={formData.bio}
                onChange={e => setFormData({...formData, bio: e.target.value})}
                placeholder="介绍一下你自己..."
                rows={4}
              />
            </section>

            <section className="form-section">
              <h3>擅长服务</h3>
              <div className="skills-select">
                {SERVICES.map(skill => (
                  <button
                    key={skill}
                    type="button"
                    className={`skill-btn ${formData.skills.includes(skill) ? 'active' : ''}`}
                    onClick={() => handleSkillToggle(skill)}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </section>

            <section className="form-section">
              <h3>基础价格 (¥)</h3>
              <input
                type="number"
                value={formData.basePrice}
                onChange={e => setFormData({...formData, basePrice: parseInt(e.target.value)})}
                min={0}
              />
            </section>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? '保存中...' : '保存资料'}
            </button>
          </form>
        )}

        <div className="profile-actions">
          <button onClick={() => navigate('/orders')} className="btn-secondary">
            我的订单
          </button>
          <button onClick={logout} className="btn-danger">
            退出登录
          </button>
        </div>
      </div>
    </div>
  );
}

export default MyProfile;
