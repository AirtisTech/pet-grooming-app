import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

function ConversationList() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const res = await api.get('/chat/conversations');
      setConversations(res.data.conversations);
    } catch (error) {
      console.error('Load conversations error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
    if (diff < 86400000) return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('zh-CN', { month: 'day', day: 'numeric' });
  };

  const getOtherParticipant = (participants) => {
    return participants?.find(p => p._id !== window.currentUserId) || {};
  };

  return (
    <div className="conversation-list-page">
      <header className="page-header">
        <button onClick={() => navigate(-1)} className="btn-back">←</button>
        <h1>消息</h1>
      </header>

      <div className="conversations-container">
        {loading ? (
          <div className="loading">加载中...</div>
        ) : conversations.length === 0 ? (
          <div className="empty-state">
            <p>暂无对话</p>
            <p className="hint">选择美容师开始聊天</p>
            <Link to="/groomers" className="btn-primary">
              浏览美容师
            </Link>
          </div>
        ) : (
          conversations.map(conv => {
            const other = getOtherParticipant(conv.participants);
            return (
              <Link
                to={`/chat/${conv._id}`}
                key={conv._id}
                className="conversation-item"
              >
                <div className="avatar">
                  {other.name?.[0] || '?'}
                </div>
                <div className="conversation-info">
                  <div className="conversation-header">
                    <span className="name">{other.name || '未知用户'}</span>
                    <span className="time">
                      {formatTime(conv.lastMessageAt)}
                    </span>
                  </div>
                  <div className="conversation-preview">
                    <span className="last-message">
                      {conv.lastMessage || '暂无消息'}
                    </span>
                    {conv.unreadCount > 0 && (
                      <span className="badge">{conv.unreadCount}</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

export default ConversationList;
