import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTheme } from '../contexts/ThemeContext';
import { 
  LayoutDashboard, Users, Handshake, Store, Wallet, RotateCcw, 
  BrainCircuit, Leaf, Landmark, Map, Building, FileText, Headphones, 
  Ticket, BarChart3, ClipboardList, ShieldCheck, Settings, Zap, X, LogOut,
  AlertTriangle, Tag, Newspaper, CalendarCheck, Banknote,
  ShoppingBag, Package, ListOrdered, ChevronDown, ChevronRight, Grid3X3, MessageSquare, Tag as TagIcon
} from 'lucide-react';

const Sidebar = ({ onClose }) => {
  const navigate = useNavigate();
  const { themeMode } = useTheme();
  const [isSystemDark, setIsSystemDark] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsSystemDark(mediaQuery.matches);
    const handler = (e) => setIsSystemDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const isDarkMode = themeMode === 'dark' || (themeMode === 'system' && isSystemDark);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [marketplaceOpen, setMarketplaceOpen] = useState(false);

  // TOP priority items
  const topItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'User Management', icon: Users, path: '/users' },
    { name: 'Booking Management', icon: CalendarCheck, path: '/bookings' },
    { name: 'Station Management', icon: Zap, path: '/stations' },
    { name: 'Partner Management', icon: Handshake, path: '/partners' },
    { name: 'Payment Monitoring', icon: Wallet, path: '/payments' },
    { name: 'Payout Requests', icon: Banknote, path: '/payouts' },
    { name: 'Refund Management', icon: RotateCcw, path: '/refunds' },
    { name: 'Offers Management', icon: Tag, path: '/offers' },
    { name: 'News Management', icon: Newspaper, path: '/news' },
    { name: 'Roadside Assistance', icon: AlertTriangle, path: '/emergency' },
    { name: 'Feedback Management', icon: MessageSquare, path: '/feedback' },
    { name: 'Pricing Management', icon: TagIcon, path: '/pricing' },
    { name: 'Ticket Management', icon: Ticket, path: '/tickets' },
    { name: 'Support Center', icon: Headphones, path: '/support' },
  ];

  // Bottom items
  const bottomItems = [
    { name: 'Franchise Management', icon: Store, path: '/franchise' },
    { name: 'AI Analytics', icon: BrainCircuit, path: '/analytics' },
    { name: 'Carbon Dashboard', icon: Leaf, path: '/carbon' },
    { name: 'Government Dashboard', icon: Landmark, path: '/gov' },
    { name: 'EV Heat Map', icon: Map, path: '/heatmap' },
    { name: 'City Analytics', icon: Building, path: '/cities' },
    { name: 'CMS', icon: FileText, path: '/cms' },
    { name: 'Reports', icon: BarChart3, path: '/reports' },
    { name: 'Audit Logs', icon: ClipboardList, path: '/audit' },
    { name: 'Security Center', icon: ShieldCheck, path: '/security' },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ];

  const marketplaceItems = [
    { name: 'Products', icon: Package, path: '/marketplace/products' },
    { name: 'Orders', icon: ListOrdered, path: '/marketplace/orders' },
    { name: 'Categories', icon: Grid3X3, path: '/marketplace/categories' },
  ];

  const handleLogoutClick = () => setIsLogoutModalOpen(true);

  const confirmLogout = async () => {
    setIsLogoutModalOpen(false);
    const token = localStorage.getItem('adminToken');
    if (token) {
      try {
        await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/fcm-token`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (err) {
        console.error('Failed to unlink FCM token on logout:', err);
      }
    }
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    toast.success('Logged out securely');
    navigate('/login');
    if (onClose) onClose();
  };

  const renderNavLink = (item) => (
    <NavLink
      key={item.name}
      to={item.path}
      onClick={onClose}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-semibold ${
          isActive
            ? 'bg-[#8CC63F] text-white shadow-md shadow-emerald-900/20'
            : 'text-gray-600 hover:bg-emerald-50/50 hover:text-gray-900'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <div className={`flex items-center justify-center ${isActive ? 'text-white' : 'text-[#8CC63F]'}`}>
            <item.icon size={18} strokeWidth={2.5} />
          </div>
          <span>{item.name}</span>
        </>
      )}
    </NavLink>
  );

  return (
    <>
      <div className="w-64 h-full bg-white border-r border-gray-100 flex flex-col flex-shrink-0 shadow-sm z-40 relative">
        {/* Logo */}
        <div className="p-3 flex items-start justify-between border-b border-gray-100 mb-2">
          <div className="flex items-center gap-3">
            {isDarkMode ? (
              <img src="/logo.png" alt="E-Bharat Logo" className="w-[68px] h-[68px] object-contain flex-shrink-0" />
            ) : (
              <img src="/logo/2nd%20Theme%20No%20Background.png" alt="E-Bharat Logo" className="w-[68px] h-[68px] object-contain flex-shrink-0" />
            )}
            <div className="flex flex-col">
              <div className="flex items-center gap-1 font-semibold text-xl tracking-tight text-gray-900">
                e-Bharat <span className="bg-[#ED811B] text-white px-1.5 py-0.5 rounded text-xs ml-0.5 mt-0.5">EV</span>
              </div>
              <span className="text-[#8CC63F] text-[10px] font-semibold tracking-wider uppercase mt-0.5">
                Powering Green Future
              </span>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="md:hidden text-gray-400 hover:text-gray-800 transition-colors p-1 -mr-2">
              <X size={24} />
            </button>
          )}
        </div>

        {/* Menu */}
        <div className="flex-1 px-4 py-2 space-y-1 overflow-y-auto no-scrollbar pb-6">

          {/* Top priority items */}
          {topItems.map(renderNavLink)}

          {/* Marketplace Dropdown - after top items */}
          <div>
            <button
              onClick={() => setMarketplaceOpen(!marketplaceOpen)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-semibold text-gray-600 hover:bg-emerald-50/50 hover:text-gray-900 w-full"
            >
              <div className="flex items-center justify-center text-[#8CC63F]">
                <ShoppingBag size={18} strokeWidth={2.5} />
              </div>
              <span className="flex-1 text-left">Marketplace</span>
              {marketplaceOpen
                ? <ChevronDown size={16} className="text-gray-400" />
                : <ChevronRight size={16} className="text-gray-400" />}
            </button>
            {marketplaceOpen && (
              <div className="ml-4 mt-1 space-y-1 border-l-2 border-[#8CC63F]/20 pl-3">
                {marketplaceItems.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-semibold ${
                        isActive
                          ? 'bg-[#8CC63F] text-white shadow-md shadow-emerald-900/20'
                          : 'text-gray-600 hover:bg-emerald-50/50 hover:text-gray-900'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className={`flex items-center justify-center ${isActive ? 'text-white' : 'text-[#8CC63F]'}`}>
                          <item.icon size={16} strokeWidth={2.5} />
                        </div>
                        <span>{item.name}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          {/* Bottom items */}
          {bottomItems.map(renderNavLink)}

        </div>

        {/* Logout */}
        <div className="p-4 border-t border-gray-100 bg-white z-10">
          <button
            onClick={handleLogoutClick}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200 text-sm font-semibold text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <div className="flex items-center justify-center text-red-500">
              <LogOut size={18} strokeWidth={2.5} />
            </div>
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Logout Modal */}
      {isLogoutModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} strokeWidth={2} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Logout Confirmation</h2>
              <p className="text-gray-500 text-sm font-medium mb-6">
                Are you sure you want to log out? You will need to enter your credentials again.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-100 bg-gray-50 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut size={16} strokeWidth={2.5} />
                  Yes, Logout
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default Sidebar;
