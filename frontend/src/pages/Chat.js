import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function Chat() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (conversationId) {
      loadMessages();
      // Connect to socket for real-time updates
      const socket = window.socket; // Assume socket is initialized
      if (socket) {
        socket.on('new_message', handleNewMessage);
      }
    }
    return () => {
      if (socket) {
        socket.off('new_message', handleNewMessage);
      }
    };
  }, [conversationId]);

  const handleNewMessage = (message) => {
    if (message.conversationId === conversationId) {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    }
  };

  const loadMessages = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/chat/conversations/${conversationId}/messages`);
      setMessages(res.data.messages);
      scrollToBottom();
    } catch (error) {
      console.error('Load messages error:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const res = await api.post('/chat/messages', {
        conversationId,
        message: newMessage.trim()
      });
      setMessages(prev => [...prev, res.data.message]);
      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Send message error:', error);
    } finally {
      setSending(false);
    }
  };

  const sendLocation = async () => {
    if (!navigator.geolocation) {
      alert('您的浏览器不支持地理位置');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await api.post('/chat/location', {
            conversationId,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            address: '当前位置'
          });
          setMessages(prev => [...prev, res.data.message]);
          scrollToBottom();
        } catch (error) {
          console.error('Send location error:', error);
        }
      },
      (error) => {
        alert('无法获取位置: ' + error.message);
      }
    );
  };

  const formatTime = (date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-page">
      <header className="chat-header">
        <button onClick={() => navigate(-1)} className="btn-back">←</button>
        <h2>聊天</h2>
        <button onClick={sendLocation} className="btn-icon" title="发送位置">📍</button>
      </header>

      <div className="chat-messages">
        {loading ? (
          <div className="loading">加载中...</div>
        ) : messages.length === 0 ? (
          <div className="empty-state">
            <p>暂无消息</p>
            <p className="hint">开始对话吧!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.senderId?._id === user?.id || msg.senderId === user?.id;
            return (
              <div key={index} className={`message ${isMe ? 'sent' : 'received'}`}>
                <div className="message-bubble">
                  {msg.type === 'location' ? (
                    <div className="location-message">
                      <span>📍</span>
                      <span>{msg.metadata?.address || '位置信息'}</span>
                    </div>
                  ) : (
                    msg.message
                  )}
                </div>
                <div className="message-time">{formatTime(msg.createdAt)}</div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="chat-input">
        <input
          ref={inputRef}
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="输入消息..."
          disabled={sending}
        />
        <button type="submit" disabled={sending || !newMessage.trim()}>
          ➤
        </button>
      </form>
    </div>
  );
}

export default Chat;
