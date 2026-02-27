import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Settings.css';

export default function Settings() {
  const { logout } = useAuth();

  const handleLogout = () => {
    if (confirm('确定要退出登录吗?')) {
      logout();
    }
  };

  return (
    <div className="settings-page">
      <nav className="page-nav">
        <Link to="/" className="nav-back">← 返回信息流</Link>
        <div className="nav-links">
          <Link to="/vault" className="nav-link">📚 知识库</Link>
          <Link to="/settings" className="nav-link active">⚙️ 设置</Link>
        </div>
      </nav>
      
      <div className="page-header">
        <h1>⚙️ 系统设置</h1>
      </div>

      <div className="settings-section">
        <h2>账户</h2>
        <button className="btn btn-danger" onClick={handleLogout} style={{ width: '100%' }}>
          退出登录
        </button>
      </div>

      <div className="settings-section">
        <h2>关于</h2>
        <div className="card">
          <p><strong>Brain-Sync 大脑外脑</strong></p>
          <p>版本: 1.0.0</p>
          <p>个人知识管理系统</p>
        </div>
      </div>
    </div>
  );
}
