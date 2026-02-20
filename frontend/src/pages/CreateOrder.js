import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI } from '../services/api';

const SERVICES = [
  { id: 'bath', name: '🛁 洗澡', price: 80 },
  { id: 'haircut', name: '✂️ 剪毛', price: 150 },
  { id: 'nail_trim', name: '💅 修甲', price: 30 },
  { id: 'teeth_cleaning', name: '🦷 刷牙', price: 50 },
  { id: 'ear_cleaning', name: '🧹 清理耳朵', price: 40 },
  { id: 'flea_treatment', name: '🐛 驱虫', price: 60 },
  { id: 'styling', name: '🎀 美容造型', price: 200 },
];

const PET_SIZES = [
  { id: 'small', name: '小型 (5kg以下)', multiplier: 1 },
  { id: 'medium', name: '中型 (5-15kg)', multiplier: 1.3 },
  { id: 'large', name: '大型 (15-30kg)', multiplier: 1.6 },
  { id: 'extra_large', name: '超大型 (30kg以上)', multiplier: 2 },
];

function CreateOrder() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    petName: '',
    petType: 'dog',
    petSize: 'medium',
    services: [],
    petNotes: '',
    address: {
      street: '',
      city: '',
      district: ''
    },
    scheduledDate: '',
    scheduledTime: ''
  });

  const handleServiceToggle = (serviceId) => {
    setFormData(prev => {
      const services = prev.services.includes(serviceId)
        ? prev.services.filter(id => id !== serviceId)
        : [...prev.services, serviceId];
      return { ...prev, services };
    });
  };

  const calculatePrice = () => {
    if (formData.services.length === 0) return 0;
    
    const size = PET_SIZES.find(s => s.id === formData.petSize);
    const total = formData.services.reduce((sum, serviceId) => {
      const service = SERVICES.find(s => s.id === serviceId);
      return sum + (service?.price || 0);
    }, 0);
    
    return Math.round(total * (size?.multiplier || 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const price = calculatePrice();
      await ordersAPI.create({
        ...formData,
        price,
        deposit: Math.round(price * 0.3)
      });
      navigate('/orders');
    } catch (error) {
      alert('创建订单失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-order-page">
      <header className="page-header">
        <button onClick={() => navigate(-1)} className="btn-back">←</button>
        <h1>发布订单</h1>
      </header>

      <form onSubmit={handleSubmit} className="order-form">
        <section className="form-section">
          <h3>🐕 宠物信息</h3>
          
          <div className="form-group">
            <label>宠物名字</label>
            <input
              type="text"
              value={formData.petName}
              onChange={e => setFormData({...formData, petName: e.target.value})}
              placeholder="例如: 小白"
              required
            />
          </div>

          <div className="form-group">
            <label>宠物类型</label>
            <select
              value={formData.petType}
              onChange={e => setFormData({...formData, petType: e.target.value})}
            >
              <option value="dog">🐕 狗狗</option>
              <option value="cat">🐈 猫咪</option>
              <option value="other">🐾 其他</option>
            </select>
          </div>

          <div className="form-group">
            <label>体型</label>
            <div className="size-options">
              {PET_SIZES.map(size => (
                <button
                  key={size.id}
                  type="button"
                  className={`size-option ${formData.petSize === size.id ? 'active' : ''}`}
                  onClick={() => setFormData({...formData, petSize: size.id})}
                >
                  {size.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="form-section">
          <h3>✂️ 服务项目</h3>
          <div className="service-grid">
            {SERVICES.map(service => (
              <button
                key={service.id}
                type="button"
                className={`service-option ${formData.services.includes(service.id) ? 'active' : ''}`}
                onClick={() => handleServiceToggle(service.id)}
              >
                <span className="service-name">{service.name}</span>
                <span className="service-price">¥{service.price}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="form-section">
          <h3>📍 服务地址</h3>
          
          <div className="form-group">
            <label>城市</label>
            <input
              type="text"
              value={formData.address.city}
              onChange={e => setFormData({
                ...formData,
                address: {...formData.address, city: e.target.value}
              })}
              placeholder="例如: 上海"
              required
            />
          </div>

          <div className="form-group">
            <label>区/县</label>
            <input
              type="text"
              value={formData.address.district}
              onChange={e => setFormData({
                ...formData,
                address: {...formData.address, district: e.target.value}
              })}
              placeholder="例如: 徐汇区"
            />
          </div>

          <div className="form-group">
            <label>详细地址</label>
            <input
              type="text"
              value={formData.address.street}
              onChange={e => setFormData({
                ...formData,
                address: {...formData.address, street: e.target.value}
              })}
              placeholder="街道、门牌号"
            />
          </div>
        </section>

        <section className="form-section">
          <h3>📅 预约时间</h3>
          
          <div className="form-group">
            <label>日期</label>
            <input
              type="date"
              value={formData.scheduledDate}
              onChange={e => setFormData({...formData, scheduledDate: e.target.value})}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div className="form-group">
            <label>时间</label>
            <input
              type="time"
              value={formData.scheduledTime}
              onChange={e => setFormData({...formData, scheduledTime: e.target.value})}
              required
            />
          </div>
        </section>

        <section className="form-section">
          <h3>📝 备注</h3>
          <textarea
            value={formData.petNotes}
            onChange={e => setFormData({...formData, petNotes: e.target.value})}
            placeholder="宠物的特殊需求、注意事项等"
            rows={3}
          />
        </section>

        <div className="price-summary">
          <div className="price-row">
            <span>预计价格</span>
            <span className="price">¥{calculatePrice()}</span>
          </div>
          <div className="price-row small">
            <span>定金 (30%)</span>
            <span>¥{Math.round(calculatePrice() * 0.3)}</span>
          </div>
        </div>

        <button type="submit" className="btn-primary btn-large" disabled={loading}>
          {loading ? '提交中...' : '发布订单'}
        </button>
      </form>
    </div>
  );
}

export default CreateOrder;
