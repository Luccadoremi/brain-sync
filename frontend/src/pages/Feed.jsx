import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { feedsAPI, notesAPI, rssAPI } from '../services/api';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import './Feed.css';

export default function Feed() {
  const [feeds, setFeeds] = useState([]);
  const [sources, setSources] = useState([]);
  const [selectedSource, setSelectedSource] = useState(null);
  const [selectedFeed, setSelectedFeed] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [categories, setCategories] = useState([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [readFilter, setReadFilter] = useState('unread'); // 'all', 'unread', 'read'
  const [showAddRSSModal, setShowAddRSSModal] = useState(false);
  const [newRSS, setNewRSS] = useState({ name: '', url: '', type: 'rss' });

  useEffect(() => {
    loadFeeds();
    loadCategories();
    loadSources();
  }, []);

  const loadFeeds = async () => {
    setLoading(true);
    try {
      const response = await feedsAPI.getFeeds({ unarchived_only: true });
      setFeeds(response.data);
    } catch (error) {
      console.error('Failed to load feeds:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSources = async () => {
    try {
      const response = await rssAPI.getSources();
      setSources(response.data.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error('Failed to load sources:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await notesAPI.getCategories();
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleAnalyzeFeed = async (feed) => {
    setSelectedFeed(feed);
    setAnalysis(null); // Clear previous analysis
    
    // Mark as read
    if (!feed.is_read) {
      try {
        await feedsAPI.markRead(feed.id);
        // Update local state
        setFeeds(feeds.map(f => f.id === feed.id ? { ...f, is_read: true } : f));
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }
  };

  const handleMarkAllRead = async () => {
    if (displayFeeds.length === 0) return;
    
    if (!confirm(`确定要标记全部 ${displayFeeds.length} 条内容为已读吗？`)) {
      return;
    }
    
    try {
      // Mark all displayed feeds as read
      const unreadFeeds = displayFeeds.filter(f => !f.is_read);
      await Promise.all(unreadFeeds.map(feed => feedsAPI.markRead(feed.id)));
      
      // Update local state
      setFeeds(feeds.map(f => 
        displayFeeds.find(df => df.id === f.id) ? { ...f, is_read: true } : f
      ));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      alert('标记失败，请重试');
    }
  };

  const handleAIAnalysis = async () => {
    if (!selectedFeed) return;
    
    setAnalyzing(true);
    try {
      const response = await feedsAPI.analyzeFeed(selectedFeed.id);
      setAnalysis(response.data);
    } catch (error) {
      console.error('Failed to analyze feed:', error);
      alert('AI 分析失败,请重试');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveToVault = async () => {
    if (!selectedCategory) {
      alert('请选择分类');
      return;
    }

    try {
      const noteContent = `## ${analysis.translated_title || selectedFeed.title}

**原文链接**: ${selectedFeed.link}

### 核心总结
${analysis.summary}

### 专属见解
${analysis.insight}

---
原始内容:
${selectedFeed.content || ''}
`;

      await notesAPI.createNote({
        title: analysis.translated_title || selectedFeed.title,
        content: noteContent,
        category: selectedCategory,
        feed_id: selectedFeed.id,
        original_link: selectedFeed.link,
      });

      alert('已成功保存到知识库!');
      setShowSaveModal(false);
      setSelectedFeed(null);
      setAnalysis(null);
      loadFeeds();
    } catch (error) {
      console.error('Failed to save note:', error);
      alert('保存失败,请重试');
    }
  };

  const handleRefreshFeeds = async () => {
    setFetching(true);
    try {
      const response = await rssAPI.fetchFeeds();
      alert(response.data.message || '更新完成');
      loadFeeds();
    } catch (error) {
      alert('更新失败: ' + (error.response?.data?.detail || error.message));
    } finally {
      setFetching(false);
    }
  };

  const handleAddRSS = async () => {
    if (!newRSS.name.trim() || !newRSS.url.trim()) {
      alert('请填写订阅源名称和 URL');
      return;
    }

    try {
      await rssAPI.createSource(newRSS);
      alert('添加成功！');
      setShowAddRSSModal(false);
      setNewRSS({ name: '', url: '', type: 'rss' });
      loadSources();
    } catch (error) {
      alert('添加失败: ' + (error.response?.data?.detail || error.message));
    }
  };

  if (loading) {
    return <div className="page-loading">加载中...</div>;
  }

  // Filter feeds by selected source and read status
  const displayFeeds = feeds
    .filter(f => !selectedSource || f.source_id === selectedSource.id)
    .filter(f => {
      if (readFilter === 'unread') return !f.is_read;
      if (readFilter === 'read') return f.is_read;
      return true; // 'all'
    });

  return (
    <div className={`feed-page-layout ${selectedFeed ? 'detail-active' : ''}`}>
      {/* Left Sidebar - Source List */}
      <aside className="sources-sidebar">
        <div className="main-nav">
          <Link to="/" className="nav-link active">
            <span>📰</span>
            <span>信息流</span>
          </Link>
          <Link to="/vault" className="nav-link">
            <span>📚</span>
            <span>知识库</span>
          </Link>
          <Link to="/settings" className="nav-link">
            <span>⚙️</span>
            <span>设置</span>
          </Link>
        </div>
        
        <div className="sidebar-header">
          <h2>📚 订阅源</h2>
          <div className="header-buttons">
            <button 
              className="btn-add-rss" 
              onClick={() => setShowAddRSSModal(true)}
              title="添加订阅源"
            >
              +
            </button>
            <button 
              className="btn-refresh" 
              onClick={handleRefreshFeeds}
              disabled={fetching}
              title="更新所有源"
            >
              {fetching ? '⏳' : '🔄'}
            </button>
          </div>
        </div>
        
        <div className="source-list">
          <button
            className={`source-item ${!selectedSource ? 'active' : ''}`}
            onClick={() => setSelectedSource(null)}
          >
            <span className="source-icon">📰</span>
            <span className="source-name">全部内容</span>
            <span className="source-count">{feeds.length}</span>
          </button>
          
          {sources.map(source => {
            const count = feeds.filter(f => f.source_id === source.id).length;
            return (
              <button
                key={source.id}
                className={`source-item ${selectedSource?.id === source.id ? 'active' : ''}`}
                onClick={() => setSelectedSource(source)}
              >
                <span className="source-icon">{source.type === 'podcast' ? '🎙️' : '📝'}</span>
                <span className="source-name">{source.name}</span>
                <span className="source-count">{count}</span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Middle - Feed List Panel */}
      <main className="feed-list-panel">
        {/* Feed List Section - Always visible on desktop */}
        <div className="feed-list-section">
            <div className="panel-header">
              <div className="panel-header-top">
                <h3>{selectedSource ? selectedSource.name : '全部内容'}</h3>
                <span className="feed-count">{displayFeeds.length} 条</span>
              </div>
              <div className="header-actions">
                <button 
                  className="btn-mark-all-read"
                  onClick={handleMarkAllRead}
                  disabled={displayFeeds.filter(f => !f.is_read).length === 0}
                  title="标记全部已读"
                >
                  ✓ 全部已读
                </button>
                <div className="read-filter-buttons">
                  <button
                    className={`filter-btn ${readFilter === 'unread' ? 'active' : ''}`}
                    onClick={() => setReadFilter('unread')}
                  >
                    未读
                  </button>
                  <button
                    className={`filter-btn ${readFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setReadFilter('all')}
                  >
                    全部
                  </button>
                  <button
                    className={`filter-btn ${readFilter === 'read' ? 'active' : ''}`}
                    onClick={() => setReadFilter('read')}
                  >
                    已读
                  </button>
                </div>
              </div>
            </div>

        {displayFeeds.length === 0 ? (
          <div className="empty-state">
            <p>暂无内容</p>
            <p className="empty-hint">点击左上角刷新按钮获取最新内容</p>
          </div>
        ) : (
          <div className="feed-items">
            {displayFeeds.map(feed => (
              <div
                key={feed.id}
                className={`feed-card ${selectedFeed?.id === feed.id ? 'active' : ''} ${feed.is_read ? 'read' : 'unread'}`}
                onClick={() => handleAnalyzeFeed(feed)}
              >
                {!feed.is_read && <span className="unread-indicator"></span>}
                <div className="feed-card-header">
                  <span className="feed-source">{feed.source?.name}</span>
                  <span className="feed-date">
                    {feed.published_at 
                      ? new Date(feed.published_at).toLocaleString('zh-CN', {
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : ''}
                  </span>
                </div>
                <h4 className="feed-card-title">{feed.title}</h4>
                {feed.content && (
                  <p className="feed-card-excerpt">
                    {feed.content.substring(0, 120)}...
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
        </div>
      </main>

      {/* Right - Detail Panel */}
      <aside className="feed-detail-panel">
        {!selectedFeed ? (
          <div className="detail-empty">
            <p>👈 选择一篇文章查看详情</p>
          </div>
        ) : (
          /* Detail Section */
          <div className="feed-detail-section">
            <div className="detail-content">
              <div className="detail-header">
                <button 
                  className="btn-close-detail" 
                  onClick={() => {
                    setSelectedFeed(null);
                    setAnalysis(null);
                  }}
                  title="关闭详情"
                >
                  ✕
                </button>
                
                <h2>
                  <a 
                    href={selectedFeed.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="article-title-link"
                  >
                    {selectedFeed.title}
                  </a>
                </h2>
                
                <div className="detail-meta">
                  <span>{selectedFeed.source?.name} · {new Date(selectedFeed.published_at).toLocaleString('zh-CN')}</span>
                </div>

                {/* AI Summary Button */}
                {!analysis && !analyzing && (
                  <button 
                    className="btn btn-primary btn-ai-summary-inline" 
                    onClick={handleAIAnalysis}
                  >
                    🤖 AI 总结
                  </button>
                )}

                {analyzing && (
                  <div className="analyzing-hint">
                    <span>🤖 AI 正在分析中...</span>
                  </div>
                )}
              </div>

            {/* Original Content */}
            <div className="article-content">
              <ReactMarkdown 
                rehypePlugins={[rehypeRaw]}
                components={{
                  img: ({node, ...props}) => (
                    <img {...props} style={{maxWidth: '100%', height: 'auto', borderRadius: '8px'}} />
                  ),
                }}
              >
                {selectedFeed.content || '暂无内容'}
              </ReactMarkdown>
            </div>

            {/* AI Summary Section */}
            {analysis && (
              <>
                <div className="ai-summary-section">
                  <h3>🤖 AI 总结</h3>
                  <details open>
                    <summary>查看总结</summary>
                    <div className="summary-content">
                      <h4>标题翻译</h4>
                      <p>{analysis.translated_title}</p>
                      
                      <h4>核心总结</h4>
                      <ReactMarkdown>{analysis.summary}</ReactMarkdown>
                      
                      <h4>专属见解</h4>
                      <p>{analysis.insight}</p>
                    </div>
                  </details>
                </div>

                <div className="detail-actions">
                  <button className="btn btn-primary" onClick={() => setShowSaveModal(true)}>
                    💾 保存到知识库
                  </button>
                </div>
              </>
            )}
          </div>
          </div>
        )}
      </aside>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>选择知识库分类</h3>
            <div className="category-list">
              {categories.map((cat) => (
                <label key={cat.id} className="category-item">
                  <input
                    type="radio"
                    name="category"
                    value={cat.id}
                    checked={selectedCategory === cat.id}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  />
                  <span>{cat.name}</span>
                </label>
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowSaveModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleSaveToVault}>
                确认保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add RSS Modal */}
      {showAddRSSModal && (
        <div className="modal-overlay" onClick={() => setShowAddRSSModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>添加 RSS 订阅源</h3>
            <div className="form-group">
              <label>订阅源名称</label>
              <input
                type="text"
                className="input"
                placeholder="例如：TechCrunch"
                value={newRSS.name}
                onChange={(e) => setNewRSS({ ...newRSS, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>RSS URL</label>
              <input
                type="url"
                className="input"
                placeholder="https://example.com/rss"
                value={newRSS.url}
                onChange={(e) => setNewRSS({ ...newRSS, url: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>类型</label>
              <select
                className="input"
                value={newRSS.type}
                onChange={(e) => setNewRSS({ ...newRSS, type: e.target.value })}
              >
                <option value="rss">RSS/Atom</option>
                <option value="podcast">播客</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowAddRSSModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleAddRSS}>
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
