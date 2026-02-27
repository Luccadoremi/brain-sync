import React, { useState, useEffect } from 'react';
import { notesAPI } from '../services/api';
import ReactMarkdown from 'react-markdown';
import './Vault.css';

export default function Vault() {
  const [notes, setNotes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', content: '', category: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
    loadNotes();
  }, [selectedCategory, searchQuery]);

  const loadCategories = async () => {
    try {
      const response = await notesAPI.getCategories();
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadNotes = async () => {
    setLoading(true);
    try {
      const response = await notesAPI.getNotes({
        category: selectedCategory || undefined,
        search: searchQuery || undefined,
      });
      setNotes(response.data);
    } catch (error) {
      console.error('Failed to load notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!confirm('确定要删除这条笔记吗?')) return;

    try {
      await notesAPI.deleteNote(noteId);
      alert('删除成功');
      setSelectedNote(null);
      loadNotes();
    } catch (error) {
      alert('删除失败');
    }
  };

  const handleCreateNote = async (e) => {
    e.preventDefault();
    
    if (!newNote.title || !newNote.content || !newNote.category) {
      alert('请填写完整信息');
      return;
    }

    try {
      await notesAPI.createNote(newNote);
      alert('创建成功');
      setShowCreateModal(false);
      setNewNote({ title: '', content: '', category: '' });
      loadNotes();
    } catch (error) {
      alert('创建失败: ' + (error.response?.data?.detail || error.message));
    }
  };

  if (selectedNote) {
    return (
      <div className="vault-detail">
        <div className="detail-header">
          <button className="btn-back" onClick={() => { setSelectedNote(null); setIsEditing(false); }}>
            ← 返回
          </button>
          <div className="header-actions">
            <button className="btn btn-danger btn-small" onClick={() => handleDeleteNote(selectedNote.id)}>
              删除
            </button>
          </div>
        </div>

        <div className="note-detail card">
          <div className="note-category-badge">
            {categories.find(c => c.id === selectedNote.category)?.name}
          </div>
          
          <h2 className="note-title">{selectedNote.title}</h2>
          
          {selectedNote.tags && selectedNote.tags.length > 0 && (
            <div className="note-tags">
              {selectedNote.tags.map(tag => (
                <span key={tag.id} className="tag">#{tag.name}</span>
              ))}
            </div>
          )}

          <div className="note-content">
            <ReactMarkdown>{selectedNote.content}</ReactMarkdown>
          </div>

          {selectedNote.original_link && (
            <a href={selectedNote.original_link} target="_blank" rel="noopener noreferrer" className="original-link">
              📎 查看原文
            </a>
          )}

          <div className="note-meta">
            <span>创建: {new Date(selectedNote.created_at).toLocaleString('zh-CN')}</span>
            <span>更新: {new Date(selectedNote.updated_at).toLocaleString('zh-CN')}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="vault-page">
      <div className="page-header">
        <h1>📚 个人知识库</h1>
        <button className="btn btn-primary btn-small" onClick={() => setShowCreateModal(true)}>
          + 新建
        </button>
      </div>

      <input
        type="search"
        className="input search-input"
        placeholder="搜索笔记..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      <div className="category-tabs">
        <button
          className={`category-tab ${!selectedCategory ? 'active' : ''}`}
          onClick={() => setSelectedCategory('')}
        >
          全部
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`category-tab ${selectedCategory === cat.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="page-loading">加载中...</div>
      ) : notes.length === 0 ? (
        <div className="empty-state">
          <p>暂无笔记</p>
          <p className="empty-hint">从信息流保存内容或手动创建笔记</p>
        </div>
      ) : (
        <div className="notes-list">
          {notes.map((note) => (
            <div key={note.id} className="card note-item" onClick={() => setSelectedNote(note)}>
              <div className="note-item-category">
                {categories.find(c => c.id === note.category)?.name}
              </div>
              <h3 className="note-item-title">{note.title}</h3>
              <p className="note-item-preview">
                {note.content.substring(0, 100)}...
              </p>
              <div className="note-item-meta">
                {note.tags && note.tags.slice(0, 3).map(tag => (
                  <span key={tag.id} className="tag-small">#{tag.name}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>新建笔记</h3>
            <form onSubmit={handleCreateNote} className="create-note-form">
              <input
                type="text"
                className="input"
                placeholder="标题"
                value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                required
              />
              
              <textarea
                className="input"
                placeholder="内容 (支持 Markdown)"
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                required
                rows="10"
              />

              <select 
                className="input"
                value={newNote.category}
                onChange={(e) => setNewNote({ ...newNote, category: e.target.value })}
                required
              >
                <option value="">选择分类</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
