import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

export default function Login() {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(token);
    } catch (err) {
      setError('访问密码错误,请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">🧠 Brain-Sync</h1>
        <p className="login-subtitle">大脑外脑 - 个人知识管理系统</p>
        
        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="password"
            className="input"
            placeholder="请输入访问密码"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
          />
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? '验证中...' : '进入系统'}
          </button>
        </form>
        
        <div className="login-info">
          <p>💡 这是您的个人知识库,需要访问密码才能进入</p>
        </div>
      </div>
    </div>
  );
}
