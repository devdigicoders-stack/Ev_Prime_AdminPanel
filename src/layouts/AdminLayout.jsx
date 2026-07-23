import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Menu, Search, Bell, User } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import { requestFirebaseNotificationPermission, setupOnMessageListener } from '../firebase';
import { toast } from 'react-hot-toast';

const routeTitles = {
  '/dashboard': 'DASHBOARD',
  '/users': 'USER MANAGEMENT',
  '/stations': 'STATION MANAGEMENT',
  '/partners': 'PARTNER MANAGEMENT',
  '/partner-complaints': 'PARTNER COMPLAINTS',
  '/franchise': 'FRANCHISE MANAGEMENT',
  '/payments': 'PAYMENT MONITORING',
  '/payouts': 'PAYOUT REQUESTS',
  '/refunds': 'REFUND MANAGEMENT',
  '/analytics': 'AI ANALYTICS',
  '/carbon': 'CARBON DASHBOARD',
  '/gov': 'GOVERNMENT DASHBOARD',
  '/heatmap': 'EV HEAT MAP',
  '/cities': 'CITY ANALYTICS',
  '/cms': 'CMS',
  '/support': 'SUPPORT CENTER',
  '/tickets': 'TICKET MANAGEMENT',
  '/reports': 'REPORTS',
  '/audit': 'AUDIT LOGS',
  '/security': 'SECURITY CENTER',
  '/settings': 'SETTINGS',
  '/notifications': 'NOTIFICATIONS',
  '/news': 'NEWS MANAGEMENT',
  '/bookings': 'BOOKING MANAGEMENT',
  '/profile': 'MY PROFILE',
  '/marketplace/products': 'PRODUCT MANAGEMENT',
  '/marketplace/orders': 'ORDER MANAGEMENT',
  '/marketplace/categories': 'CATEGORY MANAGEMENT',
};

function FirebaseSetup() {
  const { addNotification } = useNotification();

  useEffect(() => {
    const initFirebase = async () => {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) return; // Ensure we only generate token if logged in

      const token = await requestFirebaseNotificationPermission();
      if (token) {
        console.log("🔥 FCM Token generated successfully. Copy this for Firebase testing:", token);
        try {
          await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/update-fcm-token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({ fcmToken: token })
          });
        } catch (error) {
          console.error('Failed to update FCM token', error);
        }
      }
    };
    
    initFirebase();

    const unsubscribe = setupOnMessageListener((payload) => {
      console.log('Foreground message received: ', payload);
      const title = payload.notification?.title || 'Notification';
      const body = payload.notification?.body || '';
      
      const newNotification = {
        _id: payload.data?.notificationId || Date.now().toString(),
        title,
        body,
        type: payload.data?.type || 'alert',
        isRead: false,
        createdAt: new Date().toISOString()
      };
      
      addNotification(newNotification);

      toast(`${title}\n${body}`, {
        icon: '🔔',
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
        duration: 5000,
      });
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [addNotification]);

  return null;
}

const AdminLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const currentTitle = routeTitles[location.pathname] || 'ADMIN PANEL';
  const { unreadCount } = useNotification();

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden font-sans">
      <FirebaseSetup />
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      <div className={`fixed inset-y-0 left-0 z-50 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out h-full`}>
        <Sidebar onClose={() => setIsMobileMenuOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
        
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-30 shadow-sm">
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
            >
              <Menu size={24} />
            </button>
            <button className="hidden lg:block p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors">
              <Menu size={24} />
            </button>

            <div className="text-[#ED811B] px-5 py-2 font-semibold text-sm tracking-wide hidden sm:block">
              {currentTitle}
            </div>
          </div>

          <div className="flex items-center gap-4">
            
            <div className="relative hidden md:block w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search here..." 
                className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all"
              />
            </div>

            <button onClick={() => navigate('/notifications')} className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-orange-500 text-white text-[10px] font-semibold flex items-center justify-center rounded-full border-2 border-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <div onClick={() => navigate('/profile')} className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center cursor-pointer text-[#8CC63F] hover:bg-emerald-100 transition-colors">
              <User size={18} strokeWidth={2.5} />
            </div>
            
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 w-full bg-gray-50/50">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
