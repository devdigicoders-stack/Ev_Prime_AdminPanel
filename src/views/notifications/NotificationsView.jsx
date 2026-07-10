import React, { useState } from 'react';
import { Bell, Check, CheckCircle2, ShieldAlert, AlertTriangle, Zap, MessageSquare, Star } from 'lucide-react';

const NotificationsView = () => {
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'alert', title: 'Station Offline: DLF Cyber City', desc: 'Charger #4 has gone offline unexpectedly. Maintenance required.', time: '10 minutes ago', isRead: false, icon: AlertTriangle, color: 'text-orange-500 bg-orange-50' },
    { id: 2, type: 'message', title: 'New Support Ticket #1256', desc: 'User Rahul Sharma reported an issue with payment processing.', time: '1 hour ago', isRead: false, icon: MessageSquare, color: 'text-blue-500 bg-blue-50' },
    { id: 3, type: 'success', title: 'Weekly Payout Successful', desc: 'Payout of ₹1,45,000 processed to Partner EV Connect.', time: '3 hours ago', isRead: true, icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-50' },
    { id: 4, type: 'system', title: 'System Maintenance Scheduled', desc: 'Server upgrade scheduled for tonight at 2:00 AM IST.', time: '5 hours ago', isRead: true, icon: Zap, color: 'text-purple-500 bg-purple-50' },
    { id: 5, type: 'alert', title: 'High Server Load Detected', desc: 'API latency increased by 40% in the last 15 minutes.', time: 'Yesterday', isRead: true, icon: ShieldAlert, color: 'text-red-500 bg-red-50' },
    { id: 6, type: 'success', title: 'New Franchise Registered', desc: 'GreenCharge Network has joined as a new franchise.', time: 'Yesterday', isRead: true, icon: Star, color: 'text-emerald-500 bg-emerald-50' },
  ]);

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const markAsRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="flex flex-col h-full space-y-6 pb-6 max-w-5xl mx-auto w-full">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1 flex items-center gap-3">
            Notifications 
            {unreadCount > 0 && (
              <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                {unreadCount} New
              </span>
            )}
          </h1>
          <p className="text-gray-500 text-sm font-medium">Stay updated with system alerts and messages</p>
        </div>
        
        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead}
            className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm"
          >
            <Check size={16} /> Mark all as read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="divide-y divide-gray-50">
          {notifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`p-5 md:p-6 flex gap-4 transition-colors ${notification.isRead ? 'bg-white hover:bg-gray-50' : 'bg-emerald-50/30 hover:bg-emerald-50/60'}`}
              onClick={() => markAsRead(notification.id)}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${notification.color}`}>
                <notification.icon size={22} strokeWidth={2.5} />
              </div>
              <div className="flex-1 cursor-pointer">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                  <h3 className={`text-base font-semibold ${notification.isRead ? 'text-gray-900' : 'text-emerald-900'}`}>
                    {notification.title}
                  </h3>
                  <span className="text-xs font-semibold text-gray-400 whitespace-nowrap">
                    {notification.time}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-600 mb-3">{notification.desc}</p>
                
                {!notification.isRead && (
                  <button className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                    Mark as read
                  </button>
                )}
              </div>
              {!notification.isRead && (
                <div className="w-3 h-3 bg-orange-500 rounded-full mt-2"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationsView;
