import { useState, useEffect } from 'react';
import { Check, CheckCircle2, AlertTriangle, Star, Send, X, Bell, Trash2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNotification } from '../../contexts/NotificationContext';

const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  if (seconds < 30) return "Just now";
  return Math.floor(seconds) + " seconds ago";
};

const getNotificationIconAndColor = (type) => {
  switch (type) {
    case 'booking': return { icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-50' };
    case 'alert': return { icon: AlertTriangle, color: 'text-orange-500 bg-orange-50' };
    case 'promo': return { icon: Star, color: 'text-purple-500 bg-purple-50' };
    case 'general': 
    default:
      return { icon: Bell, color: 'text-blue-500 bg-blue-50' };
  }
};

const NotificationsView = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();

  const [activeTab, setActiveTab] = useState('inbox');
  const [broadcasts, setBroadcasts] = useState([]);
  const [isLoadingBroadcasts, setIsLoadingBroadcasts] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    type: 'alert',
    userId: ''
  });

  const fetchBroadcasts = async () => {
    setIsLoadingBroadcasts(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/notifications/broadcasts`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setBroadcasts(data);
      }
    } catch (error) {
      toast.error('Failed to load broadcast history');
    } finally {
      setIsLoadingBroadcasts(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'sent') {
      fetchBroadcasts();
    }
  }, [activeTab]);

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.body) {
      toast.error('Title and body are required');
      return;
    }

    setIsSending(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      
      if (response.ok) {
        toast.success(data.message || 'Notification sent successfully');
        setShowModal(false);
        setFormData({ title: '', body: '', type: 'alert', userId: '' });
        if (activeTab === 'sent') {
          fetchBroadcasts();
        }
      } else {
        toast.error(data.message || 'Failed to send notification');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteBroadcast = async (id) => {
    if (!window.confirm('Are you sure you want to delete this broadcast record?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/notifications/broadcasts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        toast.success('Broadcast deleted');
        fetchBroadcasts();
      } else {
        toast.error('Failed to delete broadcast');
      }
    } catch (error) {
      toast.error('Error deleting broadcast');
    }
  };

  const handleResendBroadcast = async (id) => {
    if (!window.confirm('Are you sure you want to resend this notification?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/notifications/broadcasts/${id}/resend`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        toast.success('Notification resent successfully');
        fetchBroadcasts();
      } else {
        toast.error(data.message || 'Failed to resend broadcast');
      }
    } catch (error) {
      toast.error('Error resending broadcast');
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6 pb-6 max-w-5xl mx-auto w-full">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1 flex items-center gap-3">
            Notifications 
            {activeTab === 'inbox' && unreadCount > 0 && (
              <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                {unreadCount} New
              </span>
            )}
          </h1>
          <p className="text-gray-500 text-sm font-medium">Stay updated with system alerts and messages</p>
        </div>
        
        <div className="flex items-center gap-3">
          {activeTab === 'inbox' && unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm"
            >
              <Check size={16} /> Mark all read
            </button>
          )}
          <button 
            onClick={() => setShowModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm"
          >
            <Send size={16} /> Send Notification
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm border border-gray-100 w-fit">
        <button
          onClick={() => setActiveTab('inbox')}
          className={`px-6 py-2 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === 'inbox' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          Inbox
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`px-6 py-2 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === 'sent' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          Sent History
        </button>
      </div>

      {/* Content Area */}
      {activeTab === 'inbox' ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 font-medium">No notifications yet.</div>
            ) : (
              notifications.map((notification) => {
                const { icon: Icon, color } = getNotificationIconAndColor(notification.type);
                return (
                  <div 
                    key={notification._id} 
                    className={`p-5 md:p-6 flex gap-4 transition-colors ${notification.isRead ? 'bg-white hover:bg-gray-50' : 'bg-emerald-50/30 hover:bg-emerald-50/60'}`}
                    onClick={() => {
                      if (!notification.isRead) markAsRead(notification._id);
                    }}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
                      <Icon size={22} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 cursor-pointer">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                        <h3 className={`text-base font-semibold ${notification.isRead ? 'text-gray-900' : 'text-emerald-900'}`}>
                          {notification.title}
                        </h3>
                        <span className="text-xs font-semibold text-gray-400 whitespace-nowrap">
                          {notification.createdAt ? timeAgo(notification.createdAt) : 'Just now'}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-600 mb-3">{notification.body}</p>
                      
                      {!notification.isRead && (
                        <button className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                          Mark as read
                        </button>
                      )}
                    </div>
                    {!notification.isRead && (
                      <div className="w-3 h-3 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
          {isLoadingBroadcasts ? (
            <div className="p-12 flex justify-center">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : broadcasts.length === 0 ? (
            <div className="p-12 text-center text-gray-500 font-medium flex flex-col items-center">
              <Send size={48} className="text-gray-300 mb-4" />
              <p>No broadcast history found.</p>
              <p className="text-sm text-gray-400 mt-1">Sent notifications will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                    <th className="p-4 pl-6">Date</th>
                    <th className="p-4">Notification</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Target</th>
                    <th className="p-4 text-right pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {broadcasts.map((b) => (
                    <tr key={b._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 pl-6 align-top">
                        <div className="text-sm font-semibold text-gray-900">{new Date(b.createdAt).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-500">{new Date(b.createdAt).toLocaleTimeString()}</div>
                      </td>
                      <td className="p-4 align-top max-w-xs">
                        <div className="text-sm font-semibold text-gray-900 mb-1">{b.title}</div>
                        <div className="text-sm text-gray-600 line-clamp-2" title={b.body}>{b.body}</div>
                      </td>
                      <td className="p-4 align-top">
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-semibold capitalize">
                          {b.type}
                        </span>
                      </td>
                      <td className="p-4 align-top">
                        {b.targetUserId ? (
                          <div className="text-sm font-semibold text-blue-600">Specific User</div>
                        ) : (
                          <div className="text-sm font-semibold text-emerald-600">All Users</div>
                        )}
                        {b.targetUserId && b.targetUserId.name && (
                          <div className="text-xs text-gray-500">{b.targetUserId.name}</div>
                        )}
                      </td>
                      <td className="p-4 pr-6 align-top text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleResendBroadcast(b._id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors tooltip"
                            title="Resend"
                          >
                            <RefreshCw size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteBroadcast(b._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors tooltip"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Send Notification Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Send size={20} className="text-emerald-600" />
                Send Notification
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSendNotification} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notification Title *</label>
                <input 
                  type="text" 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                  placeholder="e.g. Special Weekend Offer!"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Message Body *</label>
                <textarea 
                  value={formData.body}
                  onChange={(e) => setFormData({...formData, body: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none min-h-[100px] resize-y"
                  placeholder="Enter the notification message..."
                  required
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Type</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                  >
                    <option value="general">General</option>
                    <option value="alert">Alert</option>
                    <option value="promo">Promo</option>
                    <option value="booking">Booking</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Target User ID</label>
                  <input 
                    type="text" 
                    value={formData.userId}
                    onChange={(e) => setFormData({...formData, userId: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                    placeholder="Leave empty for all"
                  />
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSending}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={16} /> Send Now
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsView;
