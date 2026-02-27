import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  verifyToken: (token) => api.post('/auth/verify', { access_token: token }),
};

// RSS API
export const rssAPI = {
  getSources: () => api.get('/rss/sources'),
  createSource: (source) => api.post('/rss/sources', source),
  deleteSource: (id) => api.delete(`/rss/sources/${id}`),
  fetchFeeds: () => api.post('/rss/fetch'),
  fetchSourceFeeds: (id) => api.post(`/rss/sources/${id}/fetch`),
  syncFromConfig: () => api.post('/rss/sources/sync-from-config'),
};

// Feeds API
export const feedsAPI = {
  getFeeds: (params) => api.get('/feeds/', { params }),
  getFeed: (id) => api.get(`/feeds/${id}`),
  analyzeFeed: (id) => api.post(`/feeds/${id}/analyze`),
  markRead: (id) => api.patch(`/feeds/${id}/mark-read`),
  archiveFeed: (id) => api.patch(`/feeds/${id}/archive`),
};

// Notes API
export const notesAPI = {
  getNotes: (params) => api.get('/notes/', { params }),
  getNote: (id) => api.get(`/notes/${id}`),
  createNote: (note) => api.post('/notes/', note),
  updateNote: (id, note) => api.put(`/notes/${id}`, note),
  deleteNote: (id) => api.delete(`/notes/${id}`),
  getCategories: () => api.get('/notes/categories/list'),
  getTags: () => api.get('/notes/tags/list'),
};

export default api;
