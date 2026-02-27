import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import './Layout.css';

export default function Layout({ children }) {
  const location = useLocation();

  const navItems = [
    { path: '/', label: '📰 信息流', id: 'feed' },
    { path: '/vault', label: '📚 知识库', id: 'vault' },
    { path: '/settings', label: '⚙️ 设置', id: 'settings' },
  ];

  return (
    <div className="layout">
      <div className="content">{children}</div>
      
      <nav className="bottom-nav">
        {navItems.map((item) => (
          <Link
            key={item.id}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
