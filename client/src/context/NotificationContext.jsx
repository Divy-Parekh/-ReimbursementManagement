import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

// Configure standard axios with auth header
const api = axios.create({ baseURL: '/api/notifications' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuth();
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Initial fetch and polling
  useEffect(() => {
    if (isAuthenticated) {
      loadUnreadCount();
      loadRecent();
      
      const interval = setInterval(() => {
        loadUnreadCount();
      }, 30000); // 30s
      
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated]);

  const loadUnreadCount = async () => {
    try {
      const res = await api.get('/unread-count');
      setUnreadCount(res.data.data.count);
    } catch (err) {
      console.error('Failed to get unread count', err);
    }
  };

  const loadRecent = async () => {
    setLoading(true);
    try {
      const res = await api.get('/recent');
      setNotifications(res.data.data.notifications);
    } catch (err) {
      console.error('Failed to get recent notifications', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const res = await api.get('/');
      setNotifications(res.data.data.notifications);
    } catch (err) {
      console.error('Failed to get all notifications', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.patch(`/${id}/read`);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    loadRecent,
    loadAll,
    markAsRead,
    markAllAsRead
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
