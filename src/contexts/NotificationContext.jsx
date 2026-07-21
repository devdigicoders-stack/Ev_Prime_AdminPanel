import React, { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setNotifications(data.data);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const addNotification = (newNotification) => {
    setNotifications((prev) => [newNotification, ...prev]);
    setUnreadCount((prev) => prev + 1);
  };

  const markAllAsRead = async () => {
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/notifications/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notificationIds: [] }) // Empty means all
      });
      if (res.ok) {
        setNotifications((prev) => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all as read', error);
    }
  };

  const markAsRead = async (id) => {
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/notifications/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notificationIds: [id] })
      });
      if (res.ok) {
        setNotifications((prev) => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, fetchNotifications, addNotification, markAllAsRead, markAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
};
