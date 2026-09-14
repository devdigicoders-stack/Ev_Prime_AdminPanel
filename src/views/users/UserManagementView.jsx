import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, ChevronDown, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2, 
  AlertCircle, X, Eye, EyeOff, Lock, Unlock, Shield, ShieldAlert, CheckCircle2, XCircle, 
  Wallet, RotateCcw, Zap, User, Users, UserCheck, UserPlus, Car, FileText, Leaf, Award, 
  ArrowUpRight, ArrowDownLeft, Clock, Square, Gift, Star, TrendingUp, Plus,
  Calendar, Sparkles, ShieldCheck, Copy, MapPin, BatteryCharging,
  IndianRupee, CreditCard, Receipt, Coins,
  LifeBuoy, MessageSquare, AlertTriangle, MessageCircle, Send, CheckCircle, ClipboardList
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const getMediaUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace('/api', '');
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

// Last Active Formatter (e.g. "Today, 2:30 PM", "2 days ago", "45 days ago", "Never")
const formatLastActive = (dateInput) => {
  if (!dateInput) return { label: 'Never', isNever: true };
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return { label: 'Never', isNever: true };

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  if (diffMs < 0) return { label: `Today, ${timeStr}`, isToday: true };

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  // Today
  if (diffDays === 0 && date.getDate() === now.getDate()) {
    return { label: `Today, ${timeStr}`, isToday: true };
  }

  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (diffDays <= 1 && date.getDate() === yesterday.getDate()) {
    return { label: `Yesterday, ${timeStr}`, isRecent: true };
  }

  // 2 to 6 days
  if (diffDays < 7) {
    return { label: `${diffDays} days ago`, isRecent: true };
  }

  // 7+ days (e.g. "15 days ago", "45 days ago")
  return { label: `${diffDays} days ago`, isOlder: true };
};

// Full date-time formatter for hover tooltips
const formatFullDateTime = (dateInput) => {
  if (!dateInput) return 'N/A';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

// Last Charging Session Formatter (Point 9: e.g. "Today, 11:45 AM", "Yesterday, 4:20 PM", "12 Sep 2026, 11:45 AM", "No charging session yet")
const formatSessionDate = (dateInput) => {
  if (!dateInput) return { label: 'No charging session yet', isNone: true };
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return { label: 'No charging session yet', isNone: true };

  const now = new Date();
  const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  if (date.toDateString() === now.toDateString()) {
    return { label: `Today, ${timeStr}`, isToday: true };
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return { label: `Yesterday, ${timeStr}`, isRecent: true };
  }

  const formattedDate = date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  return { label: formattedDate, isNormal: true };
};

// Tier badge helper with distinct luxury styling
const getTierBadge = (tier) => {
  const t = (tier || 'Silver').toLowerCase();
  if (t === 'platinum') {
    return {
      label: 'Platinum',
      className: 'bg-gradient-to-r from-slate-900 to-indigo-950 text-indigo-100 border border-indigo-700/60 shadow-2xs font-extrabold',
      icon: Sparkles
    };
  }
  if (t === 'gold') {
    return {
      label: 'Gold',
      className: 'bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs font-bold',
      icon: Award
    };
  }
  if (t === 'bronze') {
    return {
      label: 'Bronze',
      className: 'bg-orange-50 text-orange-800 border border-orange-200 shadow-2xs font-semibold',
      icon: Award
    };
  }
  // Silver / default
  return {
    label: tier || 'Silver',
    className: 'bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs font-semibold',
    icon: Award
  };
};

// KYC Badge helper with clear visual indicators
const getKycBadge = (status) => {
  const s = (status || 'not_submitted').toLowerCase();
  if (s === 'verified') {
    return {
      label: 'Verified',
      className: 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold',
      icon: CheckCircle2,
      dot: 'bg-emerald-500'
    };
  }
  if (s === 'pending') {
    return {
      label: 'Pending',
      className: 'bg-amber-50 text-amber-800 border border-amber-300 font-bold',
      icon: Clock,
      dot: 'bg-amber-500'
    };
  }
  if (s === 'rejected') {
    return {
      label: 'Rejected',
      className: 'bg-rose-50 text-rose-700 border border-rose-200 font-bold',
      icon: XCircle,
      dot: 'bg-rose-500'
    };
  }
  return {
    label: 'Not Submitted',
    className: 'bg-gray-100 text-gray-500 border border-gray-200 font-medium',
    icon: AlertCircle,
    dot: 'bg-gray-400'
  };
};

// Fallback Avatar Component (Fixes Broken Profile Images with Initial Avatar)
const UserAvatar = ({ user, size = 'md', className = '' }) => {
  const [hasError, setHasError] = useState(false);
  const name = (user?.name || '').trim();
  const initial = name ? name.charAt(0).toUpperCase() : 'U';

  const colorPalettes = [
    'from-emerald-500 to-teal-600',
    'from-blue-500 to-indigo-600',
    'from-violet-500 to-purple-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-pink-600',
    'from-cyan-500 to-blue-600',
  ];
  const colorIndex = (name.charCodeAt(0) || 0) % colorPalettes.length;
  const gradientClass = colorPalettes[colorIndex];

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-2xl font-bold rounded-2xl',
  };

  const imgUrl = !hasError && user?.profileImage ? getMediaUrl(user.profileImage) : null;

  if (imgUrl) {
    return (
      <img
        src={imgUrl}
        alt={name || 'User'}
        onError={() => setHasError(true)}
        className={`${sizeClasses[size] || sizeClasses.md} rounded-full object-cover border border-gray-200 shadow-2xs ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size] || sizeClasses.md} rounded-full bg-gradient-to-br ${gradientClass} text-white flex items-center justify-center font-bold shadow-2xs shrink-0 select-none ${className}`}
    >
      {initial}
    </div>
  );
};

const UserManagementView = () => {
  const { hasPermission, isSuperAdmin } = useAuth();

  // Role-Based Access Permissions (Client Requirement 10.4)
  const canViewUsers = isSuperAdmin || hasPermission('users', 'view');
  const canRevealSensitive = isSuperAdmin || hasPermission('users', 'reveal_sensitive');
  const canBlock = isSuperAdmin || hasPermission('users', 'block');
  const canUnblock = isSuperAdmin || hasPermission('users', 'unblock');
  const canKyc = isSuperAdmin || hasPermission('users', 'kyc');
  const canRefund = isSuperAdmin || hasPermission('users', 'refund');
  const canDelete = isSuperAdmin || hasPermission('users', 'delete');

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  // Sensitive PII Reveal State (Section 10.2)
  const [revealedUsers, setRevealedUsers] = useState(new Set());
  const toggleRevealUser = (userId, e) => {
    if (e) e.stopPropagation();
    if (!canRevealSensitive) {
      toast.error('Restricted: Senior Admin / Super Admin permission required to reveal sensitive customer information');
      return;
    }
    setRevealedUsers(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  // Audit Trail State (Section 10.3)
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const fetchUserAuditTrail = async (userId) => {
    setAuditLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/user/${userId}/audit-trail`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        setAuditLogs(result.data || []);
      }
    } catch (err) {
      console.error('Failed to load user audit trail', err);
    } finally {
      setAuditLoading(false);
    }
  };

  // Filters & Search (Multi-field & Multi-condition)
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [tierFilter, setTierFilter] = useState('All');
  const [kycFilter, setKycFilter] = useState('All');
  const [regDateFrom, setRegDateFrom] = useState('');
  const [regDateTo, setRegDateTo] = useState('');
  const [lastActiveFilter, setLastActiveFilter] = useState('All');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Reset pagination whenever any filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, tierFilter, kycFilter, regDateFrom, regDateTo, lastActiveFilter]);

  // Check if any filter is active
  const isAnyFilterActive = 
    searchTerm.trim() !== '' ||
    statusFilter !== 'All' ||
    tierFilter !== 'All' ||
    kycFilter !== 'All' ||
    regDateFrom !== '' ||
    regDateTo !== '' ||
    lastActiveFilter !== 'All';

  const activeFilterCount = [
    searchTerm.trim() !== '',
    statusFilter !== 'All',
    tierFilter !== 'All',
    kycFilter !== 'All',
    (regDateFrom !== '' || regDateTo !== ''),
    lastActiveFilter !== 'All'
  ].filter(Boolean).length;

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setTierFilter('All');
    setKycFilter('All');
    setRegDateFrom('');
    setRegDateTo('');
    setLastActiveFilter('All');
    setCurrentPage(1);
    toast.success('All filters reset to default');
  };

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Block/Unblock Modal State
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [userToBlock, setUserToBlock] = useState(null);
  const [blockLoading, setBlockLoading] = useState(false);

  // User Detail Drawer State
  const [searchParams, setSearchParams] = useSearchParams();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'history' | 'kyc' | 'wallet'

  // Sub-data states inside Drawer
  const [chargingHistory, setChargingHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [kycData, setKycData] = useState(null);
  const [kycLoading, setKycLoading] = useState(false);
  const [kycActionLoading, setKycActionLoading] = useState(false);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const [walletData, setWalletData] = useState({ wallet: null, transactions: [], refunds: [] });
  const [walletLoading, setWalletLoading] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundSubmitLoading, setRefundSubmitLoading] = useState(false);
  const [walletSubTab, setWalletSubTab] = useState('payments'); // 'payments' | 'refunds'
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('ALL'); // 'ALL' | 'CREDIT' | 'DEBIT'

  // Support state (Complaints, Feedback, Ticket History)
  const [supportData, setSupportData] = useState({ tickets: [], complaints: [], feedbacks: [], stats: {} });
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportSubTab, setSupportSubTab] = useState('complaints'); // 'complaints' | 'feedback' | 'tickets'
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketReplyText, setTicketReplyText] = useState('');
  const [ticketReplyLoading, setTicketReplyLoading] = useState(false);
  const [isCreateTicketModalOpen, setIsCreateTicketModalOpen] = useState(false);
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketCategory, setNewTicketCategory] = useState('Charging Issue');
  const [newTicketPriority, setNewTicketPriority] = useState('Medium');
  const [newTicketMessage, setNewTicketMessage] = useState('');
  const [createTicketLoading, setCreateTicketLoading] = useState(false);
  const [feedbackReplyModal, setFeedbackReplyModal] = useState({ isOpen: false, feedback: null, replyText: '' });
  const [feedbackReplyLoading, setFeedbackReplyLoading] = useState(false);

  // Rewards state
  const [rewardsData, setRewardsData] = useState(null);
  const [rewardsLoading, setRewardsLoading] = useState(false);
  const [addPointsAmount, setAddPointsAmount] = useState('');
  const [addPointsReason, setAddPointsReason] = useState('');
  const [addPointsLoading, setAddPointsLoading] = useState(false);

  // Summary KPIs State
  const [summaryKpis, setSummaryKpis] = useState(null);
  const [kpisLoading, setKpisLoading] = useState(false);

  const fetchSummaryKpis = async () => {
    try {
      setKpisLoading(true);
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/user/summary/kpis`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setSummaryKpis(result.data);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch user summary KPIs, using local counts', err);
    } finally {
      setKpisLoading(false);
    }
  };

  // Fetch Users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/user`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchSummaryKpis();
  }, []);

  // Dynamic date helpers
  const now = new Date();
  const startOfMonth = useMemo(() => new Date(now.getFullYear(), now.getMonth(), 1), []);

  // Extract all available tiers dynamically from user list
  const availableTiers = useMemo(() => {
    const set = new Set(['Bronze', 'Silver', 'Gold', 'Platinum']);
    users.forEach(u => {
      if (u.tier) set.add(u.tier);
    });
    return Array.from(set);
  }, [users]);

  // Filtered Data (Multi-field search & 5-tier filtering)
  const filteredUsers = useMemo(() => {
    const currentNow = new Date();
    return users.filter(user => {
      // 1. Search across: Name, Email, Mobile, User ID
      if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        const cleanTerm = term.replace(/^(usr-|user-|#)/i, '');
        const nameMatch = (user.name || '').toLowerCase().includes(term);
        const emailMatch = (user.email || '').toLowerCase().includes(term);
        const mobileMatch = (user.mobile || '').toLowerCase().includes(term);
        
        // Match customId (e.g. USR1005), formatted User ID (e.g. USER-XXXXXX), or raw ObjectId
        const customIdMatch = user.customId ? user.customId.toLowerCase().includes(term) : false;
        const rawId = (user._id || '').toLowerCase();
        const formattedId1 = `usr-${rawId.slice(-6)}`.toLowerCase();
        const formattedId2 = `user-${rawId.slice(-6)}`.toLowerCase();
        const idMatch = rawId.includes(cleanTerm) || formattedId1.includes(term) || formattedId2.includes(term);

        if (!nameMatch && !emailMatch && !mobileMatch && !customIdMatch && !idMatch) {
          return false;
        }
      }

      // 2. Status Filter
      if (statusFilter !== 'All') {
        if (statusFilter === 'new_this_month') {
          if (!user.createdAt || new Date(user.createdAt) < startOfMonth) return false;
        } else {
          if (user.status !== statusFilter) return false;
        }
      }

      // 3. Tier Filter (Dynamic & case-insensitive)
      if (tierFilter !== 'All') {
        if ((user.tier || '').toLowerCase() !== tierFilter.toLowerCase()) return false;
      }

      // 4. KYC Status Filter
      if (kycFilter !== 'All') {
        const userKyc = (user.kycStatus || 'not_submitted').toLowerCase();
        if (userKyc !== kycFilter.toLowerCase()) return false;
      }

      // 5. Registration Date Range Filter
      if (regDateFrom) {
        const fromDate = new Date(regDateFrom);
        fromDate.setHours(0, 0, 0, 0);
        if (!user.createdAt || new Date(user.createdAt) < fromDate) return false;
      }
      if (regDateTo) {
        const toDate = new Date(regDateTo);
        toDate.setHours(23, 59, 59, 999);
        if (!user.createdAt || new Date(user.createdAt) > toDate) return false;
      }

      // 6. Last Active Filter (handles Today, 7 Days, 30 Days, Inactive >30 Days, and Never Active)
      if (lastActiveFilter !== 'All') {
        if (lastActiveFilter === 'never') {
          if (user.lastActiveAt) return false;
        } else {
          if (!user.lastActiveAt) return false;
          const activeDate = new Date(user.lastActiveAt);
          const diffMs = currentNow.getTime() - activeDate.getTime();
          const diffHours = diffMs / (1000 * 60 * 60);
          const diffDays = diffMs / (1000 * 60 * 60 * 24);

          if (lastActiveFilter === 'today') {
            if (diffHours > 24 && activeDate.toDateString() !== currentNow.toDateString()) return false;
          } else if (lastActiveFilter === '7days') {
            if (diffDays > 7) return false;
          } else if (lastActiveFilter === '30days') {
            if (diffDays > 30) return false;
          } else if (lastActiveFilter === 'older30') {
            if (diffDays <= 30) return false;
          }
        }
      }

      return true;
    });
  }, [users, searchTerm, statusFilter, tierFilter, kycFilter, regDateFrom, regDateTo, lastActiveFilter, startOfMonth]);

  // Pagination Calculation
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push('...');
      }
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      pages.push(totalPages);
    }
    return pages;
  };

  // Handle Delete / Deactivate User
  const confirmDelete = (user) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleDeactivate = async () => {
    if (!userToDelete) return;
    setDeleteLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/user/${userToDelete._id}/deactivate`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: 'Deactivated by Admin' })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to deactivate user');

      setUsers(prev => prev.map(u => u._id === userToDelete._id ? { ...u, status: 'inactive' } : u));
      if (selectedUser && selectedUser._id === userToDelete._id) {
        setSelectedUser(prev => ({ ...prev, status: 'inactive' }));
      }
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      toast.success('User deactivated (Soft Deleted). Charging & payment history preserved!');
    } catch (err) {
      toast.error(err.message || 'Failed to deactivate user');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleReactivate = async (user) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/user/${user._id}/reactivate`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to reactivate user');

      setUsers(prev => prev.map(u => u._id === user._id ? { ...u, status: 'active' } : u));
      if (selectedUser && selectedUser._id === user._id) {
        setSelectedUser(prev => ({ ...prev, status: 'active' }));
      }
      toast.success('User account reactivated successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to reactivate user');
    }
  };

  const handlePermanentDelete = async () => {
    if (!userToDelete) return;
    setDeleteLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/user/${userToDelete._id}?mode=permanent`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to delete user');

      setUsers(prev => prev.filter(u => u._id !== userToDelete._id));
      if (selectedUser && selectedUser._id === userToDelete._id) {
        handleCloseDrawer();
      }
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      toast.success('User permanently deleted from system');
    } catch (err) {
      toast.error(err.message || 'Failed to delete user');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle Block / Unblock User
  const confirmBlockToggle = (user) => {
    setUserToBlock(user);
    setIsBlockModalOpen(true);
  };

  const handleBlockToggle = async () => {
    if (!userToBlock) return;
    setBlockLoading(true);
    const isCurrentlyBlocked = userToBlock.status === 'blocked';
    const endpoint = isCurrentlyBlocked ? `unblock` : `block`;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/user/${userToBlock._id}/${endpoint}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error(`Failed to ${endpoint} user`);
      
      // Update local state
      setUsers(prev => prev.map(u => u._id === userToBlock._id ? { ...u, status: isCurrentlyBlocked ? 'active' : 'blocked' } : u));
      if (selectedUser && selectedUser._id === userToBlock._id) {
        setSelectedUser(prev => ({ ...prev, status: isCurrentlyBlocked ? 'active' : 'blocked' }));
      }

      setIsBlockModalOpen(false);
      setUserToBlock(null);
      toast.success(`User ${isCurrentlyBlocked ? 'unblocked' : 'blocked'} successfully`);
    } catch (err) {
      toast.error(err.message || 'Action failed');
    } finally {
      setBlockLoading(false);
    }
  };

  // Handle Open User Drawer
  const handleOpenDrawer = async (user, initialTab = 'overview') => {
    setSelectedUser(user);
    setIsDrawerOpen(true);
    setActiveTab(initialTab);
    setDrawerLoading(true);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/user/${user._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedUser(data);
      }
      // Pre-fetch charging history so activity metrics & session records are instantly ready
      fetchChargingHistory(user._id);
      // Pre-fetch wallet data so Financial metrics & records are instantly ready
      fetchWalletData(user._id);
      // Pre-fetch support & complaints data so support metrics are instantly ready
      fetchSupportData(user._id);
      // Pre-fetch audit trail so security action logs are instantly ready
      fetchUserAuditTrail(user._id);
    } catch (err) {
      toast.error('Failed to fetch updated profile');
    } finally {
      setDrawerLoading(false);
    }
  };

  // Handle Close User Drawer (clears query param if present)
  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedUser(null);
    if (searchParams.get('id')) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('id');
      setSearchParams(nextParams, { replace: true });
    }
  };

  // Auto-open drawer when navigated from Bookings or external view with ?id=<userId>
  useEffect(() => {
    const queryUserId = searchParams.get('id');
    if (!queryUserId) return;

    if (users.length > 0) {
      const found = users.find(u => u._id === queryUserId);
      handleOpenDrawer(found || { _id: queryUserId });
    } else if (!loading) {
      handleOpenDrawer({ _id: queryUserId });
    }
  }, [searchParams.get('id'), users.length, loading]);

  // Fetch Charging History for User
  const fetchChargingHistory = async (userId) => {
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/user/${userId}/charging-history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        setChargingHistory(result.data || []);
        if (result.chargingActivity) {
          setSelectedUser(prev => prev ? { ...prev, chargingActivity: result.chargingActivity } : prev);
        }
      }
    } catch (err) {
      toast.error('Failed to fetch charging sessions');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Fetch KYC Data for User
  const fetchKYCData = async (userId) => {
    setKycLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/user/${userId}/kyc`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        setKycData(result.data || null);
      }
    } catch (err) {
      toast.error('Failed to fetch KYC data');
    } finally {
      setKycLoading(false);
    }
  };

  // Fetch Wallet & Refunds Data for User
  const fetchWalletData = async (userId) => {
    setWalletLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/user/${userId}/wallet`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        const data = result.data || { wallet: null, transactions: [], refunds: [] };
        setWalletData(data);
        // Keep selectedUser in sync with live financials
        setSelectedUser(prev => (prev && prev._id === userId) ? {
          ...prev,
          wallet: data.wallet,
          totalAmountSpent: data.totalAmountSpent ?? prev.totalAmountSpent,
          financials: {
            ...(prev.financials || {}),
            walletBalance: data.balance ?? (data.wallet?.balance || 0),
            totalAmountSpent: data.totalAmountSpent ?? 0,
            chargingSpent: data.chargingSpent ?? 0,
            orderSpent: data.orderSpent ?? 0,
            paidSessionsCount: data.paidSessionsCount ?? 0,
          }
        } : prev);
      }
    } catch (err) {
      toast.error('Failed to fetch wallet information');
    } finally {
      setWalletLoading(false);
    }
  };

  // Fetch Support & Complaints Data for User
  const fetchSupportData = async (userId) => {
    setSupportLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/user/${userId}/support`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        const data = result.data || { tickets: [], complaints: [], feedbacks: [], stats: {} };
        setSupportData(data);
      }
    } catch (err) {
      toast.error('Failed to fetch support records');
    } finally {
      setSupportLoading(false);
    }
  };

  // Handle Create Support Ticket / Complaint
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!newTicketSubject.trim()) {
      toast.error('Ticket subject is required');
      return;
    }
    setCreateTicketLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/user/${selectedUser._id}/support/ticket`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subject: newTicketSubject.trim(),
          category: newTicketCategory,
          priority: newTicketPriority,
          message: newTicketMessage.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create ticket');
      toast.success('Support ticket / complaint logged! 🎫');
      setIsCreateTicketModalOpen(false);
      setNewTicketSubject('');
      setNewTicketMessage('');
      fetchSupportData(selectedUser._id);
    } catch (err) {
      toast.error(err.message || 'Error creating ticket');
    } finally {
      setCreateTicketLoading(false);
    }
  };

  // Handle Reply to Ticket or Update Status
  const handleReplyTicket = async (ticketId, newStatus = null) => {
    if (!ticketReplyText.trim() && !newStatus) return;
    setTicketReplyLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/user/${selectedUser._id}/support/ticket/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          replyMessage: ticketReplyText.trim() || undefined,
          status: newStatus || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update ticket');
      toast.success('Reply sent & ticket updated! ✅');
      setTicketReplyText('');
      if (data.data) setSelectedTicket(data.data);
      fetchSupportData(selectedUser._id);
    } catch (err) {
      toast.error(err.message || 'Error updating ticket');
    } finally {
      setTicketReplyLoading(false);
    }
  };

  // Handle Reply to Feedback
  const handleReplyFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackReplyModal.replyText.trim()) {
      toast.error('Reply text is required');
      return;
    }
    setFeedbackReplyLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/user/${selectedUser._id}/support/feedback/${feedbackReplyModal.feedback._id}/reply`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ adminReply: feedbackReplyModal.replyText.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send reply');
      toast.success('Feedback response sent successfully! ⭐');
      setFeedbackReplyModal({ isOpen: false, feedback: null, replyText: '' });
      fetchSupportData(selectedUser._id);
    } catch (err) {
      toast.error(err.message || 'Error replying to feedback');
    } finally {
      setFeedbackReplyLoading(false);
    }
  };

  // Fetch Rewards Data for User — uses already-loaded selectedUser data (no separate endpoint needed)
  const fetchRewardsData = (userId) => {
    setRewardsLoading(true);
    // selectedUser already has rewardPoints and tier from the profile fetch
    // We just sync rewardsData state with the latest selectedUser values
    setRewardsData(prev => ({
      ...prev,
      rewardPoints: selectedUser?.rewardPoints ?? 0,
      tier: selectedUser?.tier ?? 'Bronze',
    }));
    setRewardsLoading(false);
  };

  const handleAddPoints = async (e) => {
    e.preventDefault();
    if (!addPointsAmount || parseInt(addPointsAmount) <= 0) {
      toast.error('Enter valid points amount');
      return;
    }
    setAddPointsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/rewards/add-points`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser._id, points: parseInt(addPointsAmount), reason: addPointsReason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed');
      toast.success(`${addPointsAmount} points added successfully!`);
      setAddPointsAmount('');
      setAddPointsReason('');
      const updatedUser = { ...selectedUser, rewardPoints: data.data.rewardPoints, tier: data.data.tier };
      setUsers(prev => prev.map(u => u._id === selectedUser._id ? { ...u, rewardPoints: data.data.rewardPoints, tier: data.data.tier } : u));
      setSelectedUser(updatedUser);
      setRewardsData({ rewardPoints: data.data.rewardPoints, tier: data.data.tier });
    } catch (err) {
      toast.error(err.message || 'Failed to add points');
    } finally {
      setAddPointsLoading(false);
    }
  };

  // Remote Charging Control (Start / Stop)
  const handleStartChargingRemote = async (bookingId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/booking/${bookingId}/start-charging`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to start charging');
      toast.success('Charging session started remotely! ⚡');
      if (selectedUser) fetchChargingHistory(selectedUser._id);
    } catch (err) {
      toast.error(err.message || 'Failed to start charging');
    }
  };

  const handleStopChargingRemote = async (bookingId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/booking/${bookingId}/stop-charging`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to stop charging');
      toast.success('Charging session stopped & completed remotely! ✅');
      if (selectedUser) fetchChargingHistory(selectedUser._id);
    } catch (err) {
      toast.error(err.message || 'Failed to stop charging');
    }
  };

  // Tab switch handler
  useEffect(() => {
    if (!selectedUser || !isDrawerOpen) return;
    if (activeTab === 'history') {
      fetchChargingHistory(selectedUser._id);
    } else if (activeTab === 'rewards') {
      fetchRewardsData(selectedUser._id);
    } else if (activeTab === 'kyc') {
      fetchKYCData(selectedUser._id);
    } else if (activeTab === 'wallet') {
      fetchWalletData(selectedUser._id);
    } else if (activeTab === 'support') {
      fetchSupportData(selectedUser._id);
    } else if (activeTab === 'audit') {
      fetchUserAuditTrail(selectedUser._id);
    }
  }, [activeTab, isDrawerOpen, selectedUser?._id]);

  // Handle KYC Status update (Verify / Reject)
  const handleUpdateKYC = async (status, reason = '') => {
    if (!selectedUser) return;
    setKycActionLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/user/${selectedUser._id}/kyc/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, rejectionReason: reason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update KYC');

      setKycData(data.data);
      setIsRejectionModalOpen(false);
      setRejectionReason('');
      toast.success(`KYC ${status === 'verified' ? 'Approved' : 'Rejected'} successfully`);
    } catch (err) {
      toast.error(err.message || 'Error updating KYC status');
    } finally {
      setKycActionLoading(false);
    }
  };

  // Handle Admin Initiate Refund
  const handleInitiateRefund = async (e) => {
    e.preventDefault();
    if (!refundAmount || parseFloat(refundAmount) <= 0) {
      toast.error('Please enter a valid refund amount');
      return;
    }
    setRefundSubmitLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/user/${selectedUser._id}/refund`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: parseFloat(refundAmount),
          reason: refundReason || 'Admin initiated refund'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to process refund');

      toast.success(`₹${refundAmount} credited to user wallet`);
      setIsRefundModalOpen(false);
      setRefundAmount('');
      setRefundReason('');
      // Refresh wallet & transactions
      fetchWalletData(selectedUser._id);
    } catch (err) {
      toast.error(err.message || 'Refund initiation failed');
    } finally {
      setRefundSubmitLoading(false);
    }
  };

  // Format Date Helper
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-IN', options);
  };

  // Point 9: Derive real-time Charging Activity metrics (fallback computation)
  const userChargingActivity = useMemo(() => {
    if (selectedUser?.chargingActivity) {
      return selectedUser.chargingActivity;
    }
    if (chargingHistory && chargingHistory.length > 0) {
      let energy = 0;
      let lastDate = null;
      const stCounts = {};
      chargingHistory.forEach(b => {
        energy += Number(b.unitsConsumed || b.estimatedEnergy || 0);
        const d = b.chargingStartTime || b.createdAt;
        if (!lastDate || new Date(d) > new Date(lastDate)) lastDate = d;
        if (b.station?.name) {
          const name = b.station.name + (b.station.city ? ` - ${b.station.city}` : '');
          stCounts[name] = (stCounts[name] || 0) + 1;
        }
      });
      let mostSt = 'None';
      let maxC = 0;
      Object.entries(stCounts).forEach(([st, c]) => {
        if (c > maxC) { maxC = c; mostSt = st; }
      });
      return {
        totalSessions: chargingHistory.length,
        totalEnergyConsumed: parseFloat(energy.toFixed(1)),
        totalEnergyConsumedKwh: `${parseFloat(energy.toFixed(1))} kWh`,
        lastChargingSession: lastDate,
        mostUsedStation: mostSt !== 'None' ? mostSt : 'N/A',
        mostUsedStationVisits: maxC
      };
    }
    const fallbackEnergy = Number(selectedUser?.totalEnergyConsumedKwh || 0);
    return {
      totalSessions: 0,
      totalEnergyConsumed: parseFloat(fallbackEnergy.toFixed(1)),
      totalEnergyConsumedKwh: `${parseFloat(fallbackEnergy.toFixed(1))} kWh`,
      lastChargingSession: null,
      mostUsedStation: 'N/A',
      mostUsedStationVisits: 0
    };
  }, [selectedUser?.chargingActivity, selectedUser?.totalEnergyConsumedKwh, chargingHistory]);

  // Dynamic Summary KPI Calculations (with API data and fallback to local state)
  const totalUsersCount = summaryKpis?.totalUsers ?? users.length;
  const activeUsersCount = summaryKpis?.activeUsers ?? users.filter(u => u.status === 'active').length;
  const blockedUsersCount = summaryKpis?.blockedUsers ?? users.filter(u => u.status === 'blocked').length;
  const newThisMonthCount = summaryKpis?.newThisMonth ?? users.filter(u => new Date(u.createdAt) >= startOfMonth).length;

  return (
    <div className="flex flex-col space-y-6 pb-12 w-full">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1 tracking-tight">App User Management</h1>
          <p className="text-gray-500 text-sm font-medium">Manage mobile app users, block access, review KYC, and issue wallet refunds.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 text-emerald-700 px-3.5 py-1.5 rounded-xl border border-emerald-200/60 text-xs font-bold flex items-center gap-2 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Directory Live • {totalUsersCount} Registered</span>
          </div>
        </div>
      </div>

      {/* 4 Compact User Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Users */}
        <div 
          onClick={() => setStatusFilter('All')}
          className={`bg-white rounded-2xl border p-4 sm:p-5 flex flex-col justify-between transition-all cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-0.5 group ${
            statusFilter === 'All' ? 'border-blue-400 ring-2 ring-blue-500/10' : 'border-gray-100 hover:border-blue-200'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Users</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
              <Users size={19} strokeWidth={2.2} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              {totalUsersCount.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
              System Total
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
            <span>Registered platform base</span>
            <span className="text-blue-600 font-semibold group-hover:translate-x-0.5 transition-transform">Filter →</span>
          </div>
        </div>

        {/* 2. Active Users */}
        <div 
          onClick={() => setStatusFilter('active')}
          className={`bg-white rounded-2xl border p-4 sm:p-5 flex flex-col justify-between transition-all cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-0.5 group ${
            statusFilter === 'active' ? 'border-emerald-400 ring-2 ring-emerald-500/10' : 'border-gray-100 hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Active Users</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
              <UserCheck size={19} strokeWidth={2.2} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-emerald-950 tracking-tight">
              {activeUsersCount.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              {Math.round((activeUsersCount / (totalUsersCount || 1)) * 100)}% of total
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-emerald-50 flex items-center justify-between text-xs text-gray-400">
            <span>Operational & charging enabled</span>
            <span className="text-emerald-600 font-semibold group-hover:translate-x-0.5 transition-transform">Filter →</span>
          </div>
        </div>

        {/* 3. Blocked Users */}
        <div 
          onClick={() => setStatusFilter('blocked')}
          className={`bg-white rounded-2xl border p-4 sm:p-5 flex flex-col justify-between transition-all cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-0.5 group ${
            statusFilter === 'blocked' ? 'border-rose-400 ring-2 ring-rose-500/10' : 'border-gray-100 hover:border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Blocked Users</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
              <ShieldAlert size={19} strokeWidth={2.2} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-rose-950 tracking-tight">
              {blockedUsersCount.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
              {blockedUsersCount > 0 ? `${Math.round((blockedUsersCount / (totalUsersCount || 1)) * 100)}% restricted` : 'None'}
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-rose-50 flex items-center justify-between text-xs text-gray-400">
            <span>Access restricted by admin</span>
            <span className="text-rose-600 font-semibold group-hover:translate-x-0.5 transition-transform">Filter →</span>
          </div>
        </div>

        {/* 4. New Users This Month */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'new_this_month' ? 'All' : 'new_this_month')}
          className={`bg-white rounded-2xl border p-4 sm:p-5 flex flex-col justify-between transition-all cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-0.5 group ${
            statusFilter === 'new_this_month' ? 'border-purple-400 ring-2 ring-purple-500/10' : 'border-gray-100 hover:border-purple-200'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">New This Month</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
              <UserPlus size={19} strokeWidth={2.2} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-purple-950 tracking-tight">
              {newThisMonthCount.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] font-bold text-purple-800 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
              {now.toLocaleString('en-IN', { month: 'short' })} Growth
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-purple-50 flex items-center justify-between text-xs text-gray-400">
            <span>Joined in {now.toLocaleString('en-IN', { month: 'long' })}</span>
            <span className="text-purple-600 font-semibold group-hover:translate-x-0.5 transition-transform">Filter →</span>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        
        {/* Toolbar: Global Search & Comprehensive Multi-Filters */}
        <div className="p-4 sm:p-5 flex flex-col gap-3.5 border-b border-gray-100 bg-white">
          
          {/* Row 1: Global Search Box (Name, Email, Mobile Number, User ID) */}
          <div className="relative w-full">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search users by Name, Email, Mobile Number, or User ID (e.g. USR1005, rahul@gmail.com, 9876543210)..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-28 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-[#8CC63F] transition-all placeholder:text-gray-400 bg-gray-50/50 hover:bg-white focus:bg-white font-medium shadow-2xs"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition cursor-pointer"
                  title="Clear search"
                >
                  <X size={15} />
                </button>
              )}
              <span className="text-[11px] font-bold text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md hidden sm:inline-block">
                {filteredUsers.length} found
              </span>
            </div>
          </div>

          {/* Row 2: 5 Filter Dropdowns & Reset Button */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-0.5">
            
            {/* Filter controls group */}
            <div className="flex flex-wrap items-center gap-2 flex-1">
              
              {/* 1. Status Filter */}
              <div className="relative min-w-[130px] flex-1 sm:flex-none">
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`w-full appearance-none rounded-xl pl-3 pr-8 py-2 text-xs font-semibold border transition cursor-pointer ${
                    statusFilter !== 'All' 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-400/30 shadow-2xs' 
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <option value="All">Status: All</option>
                  <option value="active">Active</option>
                  <option value="blocked">Blocked</option>
                  <option value="inactive">Inactive</option>
                  <option value="new_this_month">New This Month</option>
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              {/* 2. Tier Filter */}
              <div className="relative min-w-[125px] flex-1 sm:flex-none">
                <select 
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value)}
                  className={`w-full appearance-none rounded-xl pl-3 pr-8 py-2 text-xs font-semibold border transition cursor-pointer ${
                    tierFilter !== 'All' 
                      ? 'bg-amber-50 text-amber-800 border-amber-300 ring-1 ring-amber-400/30 shadow-2xs' 
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <option value="All">Tier: All</option>
                  {availableTiers.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              {/* 3. KYC Status Filter */}
              <div className="relative min-w-[140px] flex-1 sm:flex-none">
                <select 
                  value={kycFilter}
                  onChange={(e) => setKycFilter(e.target.value)}
                  className={`w-full appearance-none rounded-xl pl-3 pr-8 py-2 text-xs font-semibold border transition cursor-pointer ${
                    kycFilter !== 'All' 
                      ? 'bg-blue-50 text-blue-800 border-blue-300 ring-1 ring-blue-400/30 shadow-2xs' 
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <option value="All">KYC: All</option>
                  <option value="verified">Verified</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                  <option value="not_submitted">Not Submitted</option>
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              {/* 4. Registration Date Range */}
              <div className={`flex items-center gap-1.5 border rounded-xl px-2.5 py-1.5 text-xs text-gray-700 flex-1 sm:flex-none transition ${
                regDateFrom || regDateTo 
                  ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-400/20' 
                  : 'bg-gray-50/70 border-gray-200'
              }`}>
                <Calendar size={13} className="text-gray-400 shrink-0" />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">From</span>
                <input 
                  type="date"
                  value={regDateFrom}
                  onChange={(e) => setRegDateFrom(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer w-[105px]"
                  title="Filter Registration Date From"
                />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">To</span>
                <input 
                  type="date"
                  value={regDateTo}
                  onChange={(e) => setRegDateTo(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer w-[105px]"
                  title="Filter Registration Date To"
                />
                {(regDateFrom || regDateTo) && (
                  <button 
                    onClick={() => { setRegDateFrom(''); setRegDateTo(''); }}
                    className="p-0.5 text-gray-400 hover:text-rose-500 rounded transition cursor-pointer"
                    title="Clear registration dates"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* 5. Last Active Filter */}
              <div className="relative min-w-[140px] flex-1 sm:flex-none">
                <select 
                  value={lastActiveFilter}
                  onChange={(e) => setLastActiveFilter(e.target.value)}
                  className={`w-full appearance-none rounded-xl pl-3 pr-8 py-2 text-xs font-semibold border transition cursor-pointer ${
                    lastActiveFilter !== 'All' 
                      ? 'bg-purple-50 text-purple-800 border-purple-300 ring-1 ring-purple-400/30 shadow-2xs' 
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <option value="All">Last Active: All</option>
                  <option value="today">Today (&lt;24h)</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="older30">Inactive (&gt;30 Days)</option>
                  <option value="never">Never Active</option>
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Reset Filters button */}
            <div className="flex items-center gap-2 shrink-0">
              {isAnyFilterActive && (
                <button 
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition shadow-2xs cursor-pointer"
                  title="Reset all active search and filter options"
                >
                  <RotateCcw size={12} className="shrink-0" />
                  <span>Reset Filters</span>
                  <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-black">
                    {activeFilterCount}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table Container (Horizontal scroll on mobile only, naturally expands vertically for 10 rows without inner scrollbar) */}
        <div className="overflow-x-auto w-full relative">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center bg-white space-y-3">
               <Loader2 className="animate-spin text-[#8CC63F]" size={36} />
               <p className="text-sm font-medium text-gray-500">Loading user directory...</p>
            </div>
          ) : error ? (
            <div className="py-24 flex flex-col items-center justify-center text-rose-500 font-medium p-6">
               <AlertCircle size={36} className="mb-2" />
               <p>{error}</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center text-gray-400 font-medium space-y-2">
               <User size={40} strokeWidth={1.5} className="text-gray-300" />
               <p className="text-gray-600 font-semibold">No users found matching your search & filter criteria.</p>
               {isAnyFilterActive && (
                 <button
                   onClick={handleResetFilters}
                   className="text-xs text-blue-600 font-bold hover:underline cursor-pointer pt-1"
                 >
                   Clear all filters
                 </button>
               )}
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[950px]">
              <thead className="bg-gray-50/90 border-b border-gray-100">
              <tr>
                <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">User & ID</th>
                <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Mobile Number</th>
                <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Email Address</th>
                <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Tier</th>
                <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">KYC Status</th>
                <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Last Active</th>
                <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Joined On</th>
                <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {!loading && paginatedUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50/70 transition-colors group">
                  {/* 1. User & ID */}
                  <td className="px-5 py-3.5">
                    <div 
                      className="flex items-center gap-3 cursor-pointer group/user"
                      onClick={() => handleOpenDrawer(user)}
                      title="Click to view detailed user profile"
                    >
                      <UserAvatar user={user} size="md" />
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-gray-900 group-hover/user:text-[#8CC63F] transition-colors truncate">
                          {user.name}
                        </div>
                        <div className="text-[11px] text-gray-400 font-mono tracking-tight flex items-center gap-1 mt-0.5">
                          <span className="bg-gray-100 text-gray-700 font-semibold px-1.5 py-0.2 rounded text-[10px] border border-gray-200">
                            {user.userId || user.customId || `USR-${user._id.slice(-6).toUpperCase()}`}
                          </span>
                          {/* Zero-Placeholder Guarantee & Test Account Identifier (Client Requirement 10.1) */}
                          {(user.customId?.toLowerCase().includes('demo') || 
                            user.customId?.toLowerCase().includes('test') || 
                            user.mobile?.startsWith('0000') || 
                            user.mobile?.startsWith('+910000') || 
                            user.name?.toLowerCase().includes('test') || 
                            user.isTestUser) && (
                            <span className="bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded text-[9px] border border-amber-300">
                              🧪 Demo
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* 2. Mobile (Sensitive Data Masking - Client Requirement 10.2) */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {(() => {
                      const isRevealed = revealedUsers.has(user._id);
                      const displayMobile = isRevealed && user.rawMobile ? user.rawMobile : (user.mobile || 'N/A');
                      const isMaskedMobile = user.isMasked && !isRevealed;
                      return (
                        <div className="flex items-center gap-1.5">
                          {isMaskedMobile && (
                            <span title="Masked for security (Role-Based Access)"><Lock size={11} className="text-gray-400 shrink-0" /></span>
                          )}
                          <span className="text-sm font-semibold text-gray-800 font-mono tracking-tight">
                            {displayMobile}
                          </span>
                          {canRevealSensitive && (user.rawMobile || user.rawEmail) && (
                            <button
                              type="button"
                              onClick={(e) => toggleRevealUser(user._id, e)}
                              title={isRevealed ? "Click to mask sensitive info" : "Senior Admin: Click to reveal full phone & email"}
                              className="p-1 text-gray-400 hover:text-emerald-700 rounded hover:bg-gray-100 transition cursor-pointer"
                            >
                              {isRevealed ? <EyeOff size={12} /> : <Eye size={12} />}
                            </button>
                          )}
                        </div>
                      );
                    })()}
                  </td>

                  {/* 3. Email (No fake data, masked where appropriate) */}
                  <td className="px-5 py-3.5">
                    {(() => {
                      const isRevealed = revealedUsers.has(user._id);
                      const displayEmail = isRevealed && user.rawEmail ? user.rawEmail : user.email;
                      if (!displayEmail || displayEmail.trim() === '') {
                        return <span className="text-xs text-gray-400 italic">Not Provided</span>;
                      }
                      return (
                        <span className="text-sm font-medium text-gray-600 truncate block max-w-[180px]" title={displayEmail}>
                          {displayEmail}
                        </span>
                      );
                    })()}
                  </td>

                  {/* 4. Tier */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {(() => {
                      const tier = getTierBadge(user.tier);
                      const Icon = tier.icon;
                      return (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs ${tier.className}`}>
                          <Icon size={12} className="shrink-0" />
                          <span>{tier.label}</span>
                        </span>
                      );
                    })()}
                  </td>

                  {/* 5. KYC Status (Option 1: Prominent Table Column with 1-Click Review) */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {(() => {
                      const kyc = getKycBadge(user.kycStatus);
                      return (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDrawer(user, 'kyc');
                          }}
                          title={`KYC Status: ${kyc.label} • Click to review user documents`}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-2xs ${kyc.className}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${kyc.dot}`} />
                          <span>{kyc.label}</span>
                          <Eye size={11} className="opacity-60 hover:opacity-100 ml-0.5" />
                        </button>
                      );
                    })()}
                  </td>

                  {/* 6. Status */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full capitalize ${
                      user.status === 'blocked' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                      user.status === 'inactive' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        user.status === 'blocked' ? 'bg-rose-500' :
                        user.status === 'inactive' ? 'bg-amber-500' :
                        'bg-emerald-500'
                      }`}></span>
                      {user.status || 'Active'}
                    </span>
                  </td>

                  {/* 7. Last Active */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {(() => {
                      const la = formatLastActive(user.lastActiveAt);
                      if (la.isNever) {
                        return (
                          <span 
                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-400 border border-gray-200 shadow-2xs"
                            title="User has never logged in or opened the app"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                            <span>Never</span>
                          </span>
                        );
                      }
                      if (la.isToday) {
                        return (
                          <div 
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg shadow-2xs" 
                            title={`Last activity: ${formatFullDateTime(user.lastActiveAt)}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                            <span>{la.label}</span>
                          </div>
                        );
                      }
                      if (la.isRecent) {
                        return (
                          <div 
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg shadow-2xs" 
                            title={`Last activity: ${formatFullDateTime(user.lastActiveAt)}`}
                          >
                            <Clock size={12} className="text-blue-500 shrink-0" />
                            <span>{la.label}</span>
                          </div>
                        );
                      }
                      return (
                        <div 
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-800 bg-amber-50/70 border border-amber-200 px-2.5 py-1 rounded-lg shadow-2xs" 
                          title={`Last activity: ${formatFullDateTime(user.lastActiveAt)}`}
                        >
                          <Clock size={12} className="text-amber-500 shrink-0" />
                          <span>{la.label}</span>
                        </div>
                      );
                    })()}
                  </td>

                  {/* 8. Joined On */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="text-xs font-medium text-gray-500">{formatDate(user.createdAt)}</span>
                  </td>

                  {/* 7. Clear Actions */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-2">
                      {/* View User Detail Button */}
                      <button 
                        onClick={() => handleOpenDrawer(user)} 
                        title="View Detailed User Profile"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-lg transition-all cursor-pointer shadow-2xs group/btn"
                      >
                        <Eye size={13} strokeWidth={2.2} className="group-hover/btn:scale-110 transition-transform" />
                        <span>View</span>
                      </button>

                      {/* Explicit Block / Unblock Action Button (Client Requirement 10.4) */}
                      {user.status === 'blocked' ? (
                        canUnblock ? (
                          <button 
                            onClick={() => confirmBlockToggle(user)} 
                            title="Click to Unblock User"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-lg transition-all cursor-pointer shadow-2xs"
                          >
                            <Unlock size={13} strokeWidth={2.2} />
                            <span>Unblock</span>
                          </button>
                        ) : null
                      ) : (
                        canBlock ? (
                          <button 
                            onClick={() => confirmBlockToggle(user)} 
                            title="Click to Block User"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 rounded-lg transition-all cursor-pointer shadow-2xs"
                          >
                            <Lock size={13} strokeWidth={2.2} />
                            <span>Block</span>
                          </button>
                        ) : null
                      )}

                      {/* Deactivate / Delete Button (Requires users.delete permission) */}
                      {canDelete && (
                        <button 
                          onClick={() => confirmDelete(user)} 
                          title="Deactivate or Delete User Account"
                          className="text-gray-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 size={16} strokeWidth={2} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>

        {/* Modern Full-Featured Pagination Footer */}
        {filteredUsers.length > 0 && (
          <div className="px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-gray-100 bg-gray-50/50">
            {/* Left: Summary Count & Page size selector */}
            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-gray-600">
              <span>
                Showing <strong className="text-gray-900 font-bold">{(currentPage - 1) * itemsPerPage + 1}</strong> to{' '}
                <strong className="text-gray-900 font-bold">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</strong> of{' '}
                <strong className="text-gray-900 font-bold">{filteredUsers.length}</strong> users
              </span>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">Per page:</span>
                <select 
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8CC63F] cursor-pointer shadow-2xs hover:bg-gray-50 transition"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {/* Right: Modern Pagination Controls */}
            <div className="flex items-center gap-1.5 select-none">
              {/* First Page */}
              <button 
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                title="First Page"
                className="inline-flex items-center justify-center p-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-white disabled:cursor-not-allowed transition shadow-2xs cursor-pointer"
              >
                <ChevronsLeft size={16} />
              </button>

              {/* Prev Page */}
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                title="Previous Page"
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-white disabled:cursor-not-allowed transition text-xs font-semibold shadow-2xs cursor-pointer"
              >
                <ChevronLeft size={15} />
                <span className="hidden sm:inline">Prev</span>
              </button>
              
              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {getPageNumbers().map((item, idx) => {
                  if (item === '...') {
                    return (
                      <span key={`ellipsis-${idx}`} className="w-8 text-center text-gray-400 font-bold select-none text-xs">
                        ...
                      </span>
                    );
                  }
                  const isCurrent = currentPage === item;
                  return (
                    <button 
                      key={`page-${item}`}
                      onClick={() => setCurrentPage(item)}
                      className={`min-w-8 h-8 px-2.5 flex items-center justify-center rounded-xl font-bold text-xs transition cursor-pointer ${
                        isCurrent 
                          ? 'bg-[#8CC63F] text-white shadow-xs font-black' 
                          : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>

              {/* Next Page */}
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                title="Next Page"
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-white disabled:cursor-not-allowed transition text-xs font-semibold shadow-2xs cursor-pointer"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight size={15} />
              </button>

              {/* Last Page */}
              <button 
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages || totalPages === 0}
                title="Last Page"
                className="inline-flex items-center justify-center p-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-white disabled:cursor-not-allowed transition shadow-2xs cursor-pointer"
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete / Deactivate Confirmation Modal (Preserves EV Charging & Financial History) */}
      {isDeleteModalOpen && userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-6 space-y-4 border border-gray-100">
            <div className="w-14 h-14 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center mx-auto text-amber-600 shadow-xs">
              <ShieldAlert size={28} />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-gray-900">Manage Account Access</h3>
              <p className="text-sm font-semibold text-gray-800">{userToDelete.name}</p>
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500 font-mono">
                <span>{userToDelete.mobile || 'No Mobile'}</span>
                <span>•</span>
                <span>USER-{userToDelete._id.slice(-6).toUpperCase()}</span>
              </div>
            </div>

            {/* EV History & Audit Preservation Notice */}
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 text-left text-xs space-y-2 text-amber-900">
              <div className="font-bold flex items-center gap-1.5 text-amber-800">
                <AlertCircle size={14} className="shrink-0 text-amber-600" />
                <span>EV History & Audit Trail Preservation</span>
              </div>
              <p className="text-amber-800/90 leading-relaxed">
                Permanent deletion will completely remove this user from the system. If they have completed charging sessions, payments, or wallet invoices, permanent deletion will break financial audit records.
              </p>
              <div className="font-semibold text-emerald-800 bg-emerald-100/70 p-2 rounded-lg border border-emerald-200/60 flex items-start gap-1.5">
                <CheckCircle2 size={14} className="shrink-0 text-emerald-600 mt-0.5" />
                <span><strong>Recommended:</strong> Deactivating (Soft Delete) blocks login & app access immediately while preserving all historical data safely.</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              {/* Option 1: Deactivate (Soft Delete - Recommended) */}
              {userToDelete.status !== 'inactive' ? (
                <button 
                  onClick={handleDeactivate}
                  disabled={deleteLoading}
                  className="w-full px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  {deleteLoading ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={15} />}
                  <span>Deactivate User (Soft Delete - Recommended)</span>
                </button>
              ) : (
                <button 
                  onClick={() => { handleReactivate(userToDelete); setIsDeleteModalOpen(false); }}
                  disabled={deleteLoading}
                  className="w-full px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Unlock size={15} />
                  <span>Reactivate User Account</span>
                </button>
              )}

              {/* Option 2: Permanent Delete */}
              <button 
                onClick={handlePermanentDelete}
                disabled={deleteLoading}
                className="w-full px-4 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200/60 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Permanently Delete From Database</span>
              </button>

              {/* Cancel */}
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={deleteLoading}
                className="w-full px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block / Unblock Modal */}
      {isBlockModalOpen && userToBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center space-y-4 border border-gray-100">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto border shadow-xs ${
              userToBlock.status === 'blocked' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'
            }`}>
              {userToBlock.status === 'blocked' ? <Unlock size={28} /> : <Lock size={28} />}
            </div>

            <div className="space-y-1">
              <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                userToBlock.status === 'blocked' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                Action: {userToBlock.status === 'blocked' ? 'Unblock User' : 'Block User'}
              </span>
              <h3 className="text-lg font-bold text-gray-900 pt-1">
                {userToBlock.status === 'blocked' ? 'Unblock Account Access?' : 'Block Account Access?'}
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                {userToBlock.status === 'blocked' ? (
                  <>You are about to <strong className="text-emerald-700 font-bold">Unblock {userToBlock.name}</strong>. Their mobile app login and EV charging privileges will be restored immediately.</>
                ) : (
                  <>You are about to <strong className="text-rose-700 font-bold">Block {userToBlock.name}</strong>. They will be logged out and prevented from starting any charging sessions.</>
                )}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button 
                onClick={() => setIsBlockModalOpen(false)}
                disabled={blockLoading}
                className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 border border-gray-200 rounded-xl transition w-full cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleBlockToggle}
                disabled={blockLoading}
                className={`px-4 py-2.5 text-xs font-bold text-white rounded-xl transition flex items-center justify-center gap-2 w-full cursor-pointer shadow-xs ${
                  userToBlock.status === 'blocked' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {blockLoading ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : userToBlock.status === 'blocked' ? (
                  <>
                    <Unlock size={14} />
                    <span>Unblock User</span>
                  </>
                ) : (
                  <>
                    <Lock size={14} />
                    <span>Block User</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ENHANCED USER DETAIL DRAWER */}
      {isDrawerOpen && selectedUser && (
        <div 
          className="fixed inset-0 z-50 overflow-hidden bg-gray-900/50 backdrop-blur-xs animate-in fade-in duration-300"
          onClick={handleCloseDrawer}
        >
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div 
              className="w-screen max-w-3xl bg-white shadow-2xl flex flex-col h-full transform transition-transform duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              
              {/* Drawer Header */}
              <div className="p-6 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-between border-b border-gray-800 relative">
                <div className="flex items-center gap-4">
                  <UserAvatar user={selectedUser} size="xl" />
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-xl font-bold tracking-tight">{selectedUser.name}</h2>
                      {/* Section 10: Clear Demo/Test Account Badge */}
                      {(selectedUser.isDemoUser || selectedUser.email?.toLowerCase().includes('test') || selectedUser.email?.toLowerCase().includes('demo') || selectedUser.mobile === '9999999999') && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <span>🧪</span> Demo Account
                        </span>
                      )}
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                        selectedUser.status === 'blocked' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                        selectedUser.status === 'inactive' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {selectedUser.status || 'Active'}
                      </span>
                      {/* Prominent KYC Status Pill in User Details Header (Option 2) */}
                      {(() => {
                        const kyc = getKycBadge(selectedUser.kycStatus);
                        return (
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-2xs ${
                            selectedUser.kycStatus === 'verified' ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/40' :
                            selectedUser.kycStatus === 'pending' ? 'bg-amber-500/25 text-amber-300 border border-amber-400/40' :
                            selectedUser.kycStatus === 'rejected' ? 'bg-rose-500/25 text-rose-300 border border-rose-400/40' :
                            'bg-gray-700/60 text-gray-300 border border-gray-600'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${kyc.dot}`} />
                            <span>KYC: {kyc.label}</span>
                          </span>
                        );
                      })()}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-300 font-mono mt-1">
                      <span>
                        {canRevealSensitive && revealedUsers[selectedUser._id]
                          ? selectedUser.mobile
                          : (selectedUser.maskedMobile || selectedUser.mobile)}
                      </span>
                      <span>•</span>
                      <span>
                        {canRevealSensitive && revealedUsers[selectedUser._id]
                          ? (selectedUser.email || 'No email')
                          : (selectedUser.maskedEmail || selectedUser.email || 'No email')}
                      </span>
                      {canRevealSensitive && (
                        <button
                          onClick={() => toggleReveal(selectedUser._id)}
                          className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition cursor-pointer"
                          title={revealedUsers[selectedUser._id] ? "Mask Personal Details" : "Unmask Personal Details"}
                        >
                          {revealedUsers[selectedUser._id] ? <EyeOff size={13} className="text-emerald-400" /> : <Eye size={13} />}
                        </button>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                      <span>Joined {formatDate(selectedUser.createdAt)}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-gray-300">
                        <span>Last Active:</span>
                        {(() => {
                          const la = formatLastActive(selectedUser.lastActiveAt);
                          if (la.isNever) {
                            return <span className="font-semibold text-gray-400">Never</span>;
                          }
                          if (la.isToday) {
                            return (
                              <span className="font-bold text-emerald-400 inline-flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                                {la.label}
                              </span>
                            );
                          }
                          return <span className="font-semibold text-blue-300">{la.label}</span>;
                        })()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {(selectedUser.status === 'blocked' ? canUnblock : canBlock) && (
                    <button 
                      onClick={() => confirmBlockToggle(selectedUser)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
                        selectedUser.status === 'blocked' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white'
                      }`}
                    >
                      {selectedUser.status === 'blocked' ? <Unlock size={14} /> : <Lock size={14} />}
                      <span>{selectedUser.status === 'blocked' ? 'Unblock User' : 'Block User'}</span>
                    </button>
                  )}
                  <button 
                    onClick={handleCloseDrawer}
                    className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Drawer Tabs Navigation */}
              <div className="bg-gray-50 border-b border-gray-200 px-6 pt-3 flex gap-2 overflow-x-auto no-scrollbar">
                {[
                  { id: 'overview', label: 'Overview', icon: User },
                  { id: 'history', label: 'Charging History', icon: Zap },
                  { id: 'rewards', label: 'Rewards & Points', icon: Gift },
                  { id: 'kyc', label: 'KYC Document', icon: FileText },
                  { id: 'wallet', label: 'Wallet & Refunds', icon: Wallet },
                  { id: 'support', label: 'Support & Tickets', icon: LifeBuoy },
                  { id: 'audit', label: 'Audit Trail 📋', icon: ClipboardList },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition border-b-2 cursor-pointer whitespace-nowrap ${
                        isActive
                          ? 'bg-white text-[#8CC63F] border-[#8CC63F] shadow-sm'
                          : 'text-gray-500 hover:text-gray-800 border-transparent hover:bg-gray-100/50'
                      }`}
                    >
                      <Icon size={15} />
                      <span>{tab.label}</span>
                      {tab.id === 'kyc' && selectedUser?.kycStatus && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                          selectedUser.kycStatus === 'verified' ? 'bg-emerald-100 text-emerald-800' :
                          selectedUser.kycStatus === 'pending' ? 'bg-amber-100 text-amber-800' :
                          selectedUser.kycStatus === 'rejected' ? 'bg-rose-100 text-rose-800' :
                          'bg-gray-200 text-gray-600'
                        }`}>
                          {selectedUser.kycStatus === 'verified' ? 'Verified' :
                           selectedUser.kycStatus === 'pending' ? 'Pending' :
                           selectedUser.kycStatus === 'rejected' ? 'Rejected' :
                           'Not Submitted'}
                        </span>
                      )}
                      {tab.id === 'support' && ((supportData.stats?.openTickets || 0) > 0 || (selectedUser?.supportSummary?.openTickets || 0) > 0) && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 animate-pulse">
                          {supportData.stats?.openTickets ?? selectedUser?.supportSummary?.openTickets} Open
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Drawer Content Body */}
              <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 custom-scrollbar">
                {drawerLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400 space-y-3">
                    <Loader2 className="animate-spin text-[#8CC63F]" size={36} />
                    <p className="text-xs font-medium">Loading details...</p>
                  </div>
                ) : (
                  <>
                    {/* TAB 1: OVERVIEW */}
                    {activeTab === 'overview' && (
                      <div className="space-y-6">
                        {/* Point 8: User Detail Page - Recommended Information (Exact 9 Information Fields) */}
                        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden">
                          {/* Card Header matching client requirement */}
                          <div className="px-6 py-3.5 bg-gradient-to-r from-slate-900 via-gray-900 to-slate-900 text-white flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white shadow-2xs">
                                <User size={16} />
                              </div>
                              <div>
                                <h3 className="text-sm font-extrabold tracking-wider uppercase text-white">User Profile</h3>
                                <p className="text-[11px] text-gray-300 font-medium">Core account credentials & identification</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold bg-white/10 text-white px-2.5 py-1 rounded-lg border border-white/20">
                                {selectedUser.userId || selectedUser.customId || `USR-${selectedUser._id?.slice(-6).toUpperCase()}`}
                              </span>
                            </div>
                          </div>

                          {/* Profile Fields Container: 2-column table/grid matching client diagram */}
                          <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4">
                              
                              {/* Left Column: Personal Identifiers */}
                              <div className="space-y-3.5 divide-y divide-gray-100">
                                
                                {/* 1. Name */}
                                <div className="flex items-center justify-between pt-1 first:pt-0">
                                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Name</span>
                                  <span className="text-sm font-bold text-gray-900">{selectedUser.name || 'N/A'}</span>
                                </div>

                                {/* 2. Mobile */}
                                <div className="flex items-center justify-between pt-3.5">
                                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Mobile</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-mono font-bold text-gray-800">
                                      {canRevealSensitive && revealedUsers[selectedUser._id]
                                        ? (selectedUser.mobile || 'N/A')
                                        : (selectedUser.maskedMobile || selectedUser.mobile || 'N/A')}
                                    </span>
                                    {canRevealSensitive && (
                                      <button
                                        onClick={() => toggleReveal(selectedUser._id)}
                                        className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition cursor-pointer"
                                        title={revealedUsers[selectedUser._id] ? "Mask personal details" : "Unmask personal details"}
                                      >
                                        {revealedUsers[selectedUser._id] ? <EyeOff size={14} className="text-blue-600" /> : <Eye size={14} />}
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* 3. Email */}
                                <div className="flex items-center justify-between pt-3.5">
                                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email</span>
                                  <span className="text-sm font-medium text-gray-800 break-all">
                                    {canRevealSensitive && revealedUsers[selectedUser._id]
                                      ? (selectedUser.email || 'Not provided')
                                      : (selectedUser.maskedEmail || selectedUser.email || 'Not provided')}
                                  </span>
                                </div>

                                {/* 4. User ID */}
                                <div className="flex items-center justify-between pt-3.5">
                                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">User ID</span>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-mono font-bold text-gray-900 bg-gray-100 px-2.5 py-0.5 rounded-lg border border-gray-200">
                                      {selectedUser.userId || selectedUser.customId || `USR-${selectedUser._id?.slice(-6).toUpperCase()}`}
                                    </span>
                                    <button 
                                      onClick={() => {
                                        const id = selectedUser.userId || selectedUser.customId || `USR-${selectedUser._id?.slice(-6).toUpperCase()}`;
                                        navigator.clipboard?.writeText(id);
                                        toast.success(`User ID ${id} copied!`);
                                      }}
                                      title="Copy User ID"
                                      className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition cursor-pointer"
                                    >
                                      <Copy size={13} />
                                    </button>
                                  </div>
                                </div>

                              </div>

                              {/* Right Column: Platform Status & Activity */}
                              <div className="space-y-3.5 divide-y divide-gray-100">
                                
                                {/* 5. Joined On */}
                                <div className="flex items-center justify-between pt-1 first:pt-0">
                                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Joined On</span>
                                  <span className="text-xs font-semibold text-gray-800" title={`Registered: ${formatFullDateTime(selectedUser.createdAt)}`}>
                                    {formatDate(selectedUser.createdAt)}
                                  </span>
                                </div>

                                {/* 6. Last Active */}
                                <div className="flex items-center justify-between pt-3.5">
                                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Last Active</span>
                                  {(() => {
                                    const la = formatLastActive(selectedUser.lastActiveAt);
                                    if (la.isNever) {
                                      return (
                                        <span 
                                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200"
                                          title="User has never logged in or opened the app"
                                        >
                                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                          Never
                                        </span>
                                      );
                                    }
                                    if (la.isToday) {
                                      return (
                                        <span 
                                          className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs"
                                          title={`Full timestamp: ${formatFullDateTime(selectedUser.lastActiveAt)}`}
                                        >
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                          {la.label}
                                        </span>
                                      );
                                    }
                                    return (
                                      <span 
                                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-full shadow-2xs"
                                        title={`Full timestamp: ${formatFullDateTime(selectedUser.lastActiveAt)}`}
                                      >
                                        <Clock size={11} className="text-blue-500" />
                                        <span>{la.label}</span>
                                      </span>
                                    );
                                  })()}
                                </div>

                                {/* 7. Status */}
                                <div className="flex items-center justify-between pt-3.5">
                                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Status</span>
                                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full capitalize ${
                                    selectedUser.status === 'blocked' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                    selectedUser.status === 'inactive' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                    'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                      selectedUser.status === 'blocked' ? 'bg-rose-500' :
                                      selectedUser.status === 'inactive' ? 'bg-amber-500' :
                                      'bg-emerald-500'
                                    }`} />
                                    <span>{selectedUser.status === 'blocked' ? 'Blocked' : selectedUser.status === 'inactive' ? 'Inactive' : 'Active'}</span>
                                  </span>
                                </div>

                                {/* 8. Tier */}
                                <div className="flex items-center justify-between pt-3.5">
                                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tier</span>
                                  {(() => {
                                    const tier = getTierBadge(selectedUser.tier);
                                    const Icon = tier.icon;
                                    const tierLower = (selectedUser.tier || 'Silver').toLowerCase();
                                    const medalEmoji = tierLower === 'platinum' ? '💎' : tierLower === 'gold' ? '🥇' : tierLower === 'bronze' ? '🥉' : '🥈';
                                    return (
                                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${tier.className}`}>
                                        <span>{medalEmoji}</span>
                                        <span>{tier.label}</span>
                                      </span>
                                    );
                                  })()}
                                </div>

                                {/* 9. KYC Status */}
                                <div className="flex items-center justify-between pt-3.5">
                                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">KYC Status</span>
                                  {(() => {
                                    const kyc = getKycBadge(selectedUser.kycStatus);
                                    return (
                                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${kyc.className}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${kyc.dot}`} />
                                        <span>{kyc.label}</span>
                                      </span>
                                    );
                                  })()}
                                </div>

                              </div>

                            </div>
                          </div>
                        </div>

                        {/* Point 9: Charging Activity Section - Redesigned Modern Executive 4-Tile Card */}
                        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden">
                          {/* Sleek Modern Header */}
                          <div className="px-6 py-4 bg-white border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-bold shadow-2xs shrink-0">
                                <Zap size={20} className="text-[#8CC63F]" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="text-base font-extrabold text-gray-900 tracking-tight">Charging Activity</h3>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">Live Telemetry</span>
                                </div>
                                <p className="text-xs text-gray-500 font-medium mt-0.5">Session records, electricity consumption & station usage metrics</p>
                              </div>
                            </div>
                            <button
                              onClick={() => setActiveTab('history')}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-gray-700 hover:text-emerald-700 bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-200 rounded-xl transition-all cursor-pointer shadow-2xs group self-start sm:self-auto shrink-0"
                            >
                              <span>View All Sessions</span>
                              <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </button>
                          </div>

                          {/* 4 Dedicated Modern Metric Tiles in 2x2 Grid */}
                          <div className="p-5 bg-gray-50/40">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              
                              {/* 1. Total Charging Sessions */}
                              <div className="p-4.5 rounded-2xl bg-white border border-gray-100 shadow-2xs hover:shadow-xs hover:border-emerald-200 transition-all flex flex-col justify-between group">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Charging Sessions</span>
                                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                                    <BatteryCharging size={16} />
                                  </div>
                                </div>
                                <div className="flex items-baseline gap-2">
                                  <span className="text-3xl font-black text-gray-900 font-mono tracking-tight">
                                    {userChargingActivity.totalSessions}
                                  </span>
                                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sessions Completed</span>
                                </div>
                                <div className="mt-3.5 pt-2.5 border-t border-gray-50 flex items-center justify-between text-[11px]">
                                  <span className="text-gray-400 font-medium">Session frequency</span>
                                  <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                                    {userChargingActivity.totalSessions > 0 ? 'Active EV Driver' : 'No Sessions Yet'}
                                  </span>
                                </div>
                              </div>

                              {/* 2. Total Energy Consumed */}
                              <div className="p-4.5 rounded-2xl bg-white border border-gray-100 shadow-2xs hover:shadow-xs hover:border-blue-200 transition-all flex flex-col justify-between group">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Energy Consumed</span>
                                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                                    <Zap size={16} />
                                  </div>
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-3xl font-black text-gray-900 font-mono tracking-tight">
                                    {userChargingActivity.totalEnergyConsumed.toFixed(1)}
                                  </span>
                                  <span className="text-sm font-black text-blue-600">kWh</span>
                                </div>
                                <div className="mt-3.5 pt-2.5 border-t border-gray-50 flex items-center justify-between text-[11px]">
                                  <span className="text-gray-400 font-medium">Electricity delivered</span>
                                  <span className="font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full font-mono">
                                    {(userChargingActivity.totalSessions > 0 ? (userChargingActivity.totalEnergyConsumed / userChargingActivity.totalSessions).toFixed(1) : '0.0')} kWh / avg
                                  </span>
                                </div>
                              </div>

                              {/* 3. Last Charging Session */}
                              <div className="p-4.5 rounded-2xl bg-white border border-gray-100 shadow-2xs hover:shadow-xs hover:border-amber-200 transition-all flex flex-col justify-between group">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Last Charging Session</span>
                                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                                    <Clock size={16} />
                                  </div>
                                </div>
                                {(() => {
                                  const sess = formatSessionDate(userChargingActivity.lastChargingSession);
                                  if (sess.isNone) {
                                    return (
                                      <div>
                                        <div className="text-base font-bold text-gray-400 italic">No charging session yet</div>
                                        <p className="text-[11px] text-gray-400 mt-0.5">User has not charged on platform</p>
                                      </div>
                                    );
                                  }
                                  return (
                                    <div>
                                      <div className="text-lg font-extrabold text-gray-900 tracking-tight flex items-center gap-2 truncate" title={sess.label}>
                                        {sess.isToday && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />}
                                        <span className="truncate">{sess.label}</span>
                                      </div>
                                      <p className="text-[11px] text-gray-400 mt-0.5">Most recent session timestamp</p>
                                    </div>
                                  );
                                })()}
                                <div className="mt-3.5 pt-2.5 border-t border-gray-50 flex items-center justify-between text-[11px]">
                                  <span className="text-gray-400 font-medium">Activity state</span>
                                  <span className="font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                                    {userChargingActivity.lastChargingSession ? 'Logged' : 'None'}
                                  </span>
                                </div>
                              </div>

                              {/* 4. Most Used Station */}
                              <div className="p-4.5 rounded-2xl bg-white border border-gray-100 shadow-2xs hover:shadow-xs hover:border-purple-200 transition-all flex flex-col justify-between group">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Most Used Station</span>
                                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                                    <MapPin size={16} />
                                  </div>
                                </div>
                                <div>
                                  <div className="text-lg font-extrabold text-gray-900 tracking-tight truncate" title={userChargingActivity.mostUsedStation}>
                                    {userChargingActivity.mostUsedStation}
                                  </div>
                                  <p className="text-[11px] text-gray-400 mt-0.5 truncate">User's preferred charging hub</p>
                                </div>
                                <div className="mt-3.5 pt-2.5 border-t border-gray-50 flex items-center justify-between text-[11px]">
                                  <span className="text-gray-400 font-medium">Station preference</span>
                                  {userChargingActivity.mostUsedStationVisits > 0 ? (
                                    <span className="font-bold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full">
                                      {userChargingActivity.mostUsedStationVisits} session{userChargingActivity.mostUsedStationVisits > 1 ? 's' : ''} here
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 font-medium">N/A</span>
                                  )}
                                </div>
                              </div>

                            </div>
                          </div>
                        </div>

                        {/* Financial / Wallet Section - Executive 2-Tile Card */}
                        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden">
                          {/* Modern Executive Header */}
                          <div className="px-6 py-4 bg-white border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-bold shadow-2xs shrink-0">
                                <Wallet size={20} className="text-[#8CC63F]" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="text-base font-extrabold text-gray-900 tracking-tight">Financial / Wallet</h3>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">Live Balance & Ledger</span>
                                </div>
                                <p className="text-xs text-gray-500 font-medium mt-0.5">Wallet balance, lifetime platform spend, payment & refund records</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                              {hasPermission('users', 'edit') && (
                                <button
                                  onClick={() => setIsRefundModalOpen(true)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition cursor-pointer shadow-2xs"
                                >
                                  <RotateCcw size={13} />
                                  <span>Issue Refund</span>
                                </button>
                              )}
                              <button
                                onClick={() => setActiveTab('wallet')}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-gray-700 hover:text-emerald-700 bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-200 rounded-xl transition-all cursor-pointer shadow-2xs group"
                              >
                                <span>View Financial Ledger</span>
                                <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                              </button>
                            </div>
                          </div>

                          {/* 2 Dedicated Modern Metric Tiles in 2-Column Grid */}
                          <div className="p-5 bg-gray-50/40 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              
                              {/* 1. Wallet Balance */}
                              <div className="p-4.5 rounded-2xl bg-white border border-gray-100 shadow-2xs hover:shadow-xs hover:border-emerald-200 transition-all flex flex-col justify-between group">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Wallet Balance</span>
                                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                                    <Wallet size={16} className="text-[#8CC63F]" />
                                  </div>
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-3xl font-black text-gray-900 font-mono tracking-tight">
                                    ₹{((selectedUser.wallet?.balance ?? walletData.wallet?.balance ?? walletData.balance ?? 0)).toFixed(2)}
                                  </span>
                                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">INR</span>
                                </div>
                                <div className="mt-3.5 pt-2.5 border-t border-gray-50 flex items-center justify-between text-[11px]">
                                  <span className="text-gray-400 font-medium">Wallet status</span>
                                  <span className={`font-bold px-2 py-0.5 rounded-full border ${
                                    (selectedUser.wallet?.balance ?? walletData.wallet?.balance ?? walletData.balance ?? 0) > 0
                                      ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                                      : 'text-gray-500 bg-gray-50 border-gray-200'
                                  }`}>
                                    {(selectedUser.wallet?.balance ?? walletData.wallet?.balance ?? walletData.balance ?? 0) > 0 ? 'Funded & Active' : 'Zero Balance'}
                                  </span>
                                </div>
                              </div>

                              {/* 2. Total Amount Spent */}
                              <div className="p-4.5 rounded-2xl bg-white border border-gray-100 shadow-2xs hover:shadow-xs hover:border-blue-200 transition-all flex flex-col justify-between group">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Amount Spent</span>
                                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                                    <IndianRupee size={16} />
                                  </div>
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-3xl font-black text-gray-900 font-mono tracking-tight">
                                    ₹{((selectedUser.totalAmountSpent ?? walletData.totalAmountSpent ?? 0)).toFixed(2)}
                                  </span>
                                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Lifetime Spend</span>
                                </div>
                                <div className="mt-3.5 pt-2.5 border-t border-gray-50 flex items-center justify-between text-[11px]">
                                  <span className="text-gray-400 font-medium">Charging expenditure</span>
                                  <span className="font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full font-mono">
                                    ₹{((selectedUser.financials?.chargingSpent ?? walletData.chargingSpent ?? selectedUser.totalAmountSpent ?? 0)).toFixed(2)} on EV Charging
                                  </span>
                                </div>
                              </div>

                            </div>

                            {/* Dual Preview: 3. Payment History & 4. Refund History */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                              {/* Payment History Preview */}
                              <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-2xs space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                                    <CreditCard size={14} className="text-emerald-600" />
                                    Payment History
                                  </span>
                                  <button 
                                    onClick={() => { setActiveTab('wallet'); setWalletSubTab('payments'); }}
                                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                                  >
                                    View All ({walletData.transactions?.length || 0}) →
                                  </button>
                                </div>
                                {walletData.transactions && walletData.transactions.length > 0 ? (
                                  <div className="divide-y divide-gray-100">
                                    {walletData.transactions.slice(0, 3).map((txn) => (
                                      <div key={txn._id} className="py-2.5 flex items-center justify-between text-xs">
                                        <div className="truncate pr-2">
                                          <p className="font-bold text-gray-800 truncate">{txn.description || 'Wallet Transaction'}</p>
                                          <p className="text-[10px] text-gray-400 font-mono">{formatDate(txn.createdAt)}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                          <span className={`font-mono font-bold ${txn.type === 'CREDIT' ? 'text-emerald-600' : 'text-gray-900'}`}>
                                            {txn.type === 'CREDIT' ? '+' : '-'} ₹{(txn.amount || 0).toFixed(2)}
                                          </span>
                                          <span className="block text-[9px] font-bold text-gray-500 uppercase">{txn.status}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="py-4 text-center">
                                    <p className="text-xs text-gray-400 italic">No payment history found</p>
                                  </div>
                                )}
                              </div>

                              {/* Refund History Preview */}
                              <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-2xs space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                                    <RotateCcw size={14} className="text-amber-600" />
                                    Refund History
                                  </span>
                                  <button 
                                    onClick={() => { setActiveTab('wallet'); setWalletSubTab('refunds'); }}
                                    className="text-[11px] font-bold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer"
                                  >
                                    View All ({walletData.refunds?.length || 0}) →
                                  </button>
                                </div>
                                {walletData.refunds && walletData.refunds.length > 0 ? (
                                  <div className="divide-y divide-gray-100">
                                    {walletData.refunds.slice(0, 3).map((ref) => (
                                      <div key={ref._id} className="py-2.5 flex items-center justify-between text-xs">
                                        <div className="truncate pr-2">
                                          <p className="font-bold text-gray-800 truncate">{ref.reason || 'Admin Refund'}</p>
                                          <p className="text-[10px] text-gray-400 font-mono">ID: {ref.refundId} • {formatDate(ref.createdAt)}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                          <span className="font-mono font-bold text-emerald-600">+ ₹{(ref.amount || 0).toFixed(2)}</span>
                                          <span className="block text-[9px] font-bold text-emerald-700">{ref.status}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="py-4 text-center">
                                    <p className="text-xs text-gray-400 italic">No refunds recorded yet</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Support & Complaints Section - Executive 3-Tile Card */}
                        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden">
                          {/* Modern Executive Header */}
                          <div className="px-6 py-4 bg-white border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center font-bold shadow-2xs shrink-0">
                                <LifeBuoy size={20} className="text-amber-600" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="text-base font-extrabold text-gray-900 tracking-tight">Support & Complaints</h3>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">Helpdesk Telemetry</span>
                                </div>
                                <p className="text-xs text-gray-500 font-medium mt-0.5">User complaints, feedback ratings & support ticket records</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                              <button
                                onClick={() => setIsCreateTicketModalOpen(true)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition cursor-pointer shadow-2xs"
                              >
                                <Plus size={13} />
                                <span>Log Ticket</span>
                              </button>
                              <button
                                onClick={() => setActiveTab('support')}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-gray-700 hover:text-amber-700 bg-gray-50 hover:bg-amber-50 border border-gray-200 hover:border-amber-200 rounded-xl transition-all cursor-pointer shadow-2xs group"
                              >
                                <span>View Support Center</span>
                                <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                              </button>
                            </div>
                          </div>

                          {/* 3 Dedicated Modern Metric Tiles in 3-Column Grid */}
                          <div className="p-5 bg-gray-50/40 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              
                              {/* 1. Complaints */}
                              <div className="p-4.5 rounded-2xl bg-white border border-gray-100 shadow-2xs hover:shadow-xs hover:border-rose-200 transition-all flex flex-col justify-between group">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Complaints</span>
                                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                                    <AlertTriangle size={16} />
                                  </div>
                                </div>
                                <div className="flex items-baseline gap-2">
                                  <span className="text-3xl font-black text-gray-900 font-mono tracking-tight">
                                    {supportData.stats?.complaintsCount ?? selectedUser?.supportSummary?.complaintsCount ?? 0}
                                  </span>
                                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Issues Logged</span>
                                </div>
                                <div className="mt-3.5 pt-2.5 border-t border-gray-50 flex items-center justify-between text-[11px]">
                                  <span className="text-gray-400 font-medium">Issue status</span>
                                  <span className={`font-bold px-2 py-0.5 rounded-full border ${
                                    (supportData.stats?.complaintsCount || selectedUser?.supportSummary?.complaintsCount || 0) > 0
                                      ? 'text-rose-700 bg-rose-50 border-rose-100'
                                      : 'text-emerald-700 bg-emerald-50 border-emerald-100'
                                  }`}>
                                    {(supportData.stats?.complaintsCount || selectedUser?.supportSummary?.complaintsCount || 0) > 0 ? 'Action Needed' : 'Zero Complaints'}
                                  </span>
                                </div>
                              </div>

                              {/* 2. Feedback Rating */}
                              <div className="p-4.5 rounded-2xl bg-white border border-gray-100 shadow-2xs hover:shadow-xs hover:border-amber-200 transition-all flex flex-col justify-between group">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">User Feedback</span>
                                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                                    <Star size={16} />
                                  </div>
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-3xl font-black text-gray-900 font-mono tracking-tight">
                                    {(supportData.stats?.avgRating ?? selectedUser?.supportSummary?.avgRating ?? 0) > 0 ? (supportData.stats?.avgRating ?? selectedUser?.supportSummary?.avgRating).toFixed(1) : '5.0'}
                                  </span>
                                  <span className="text-xs font-bold text-amber-500">★ / 5.0</span>
                                </div>
                                <div className="mt-3.5 pt-2.5 border-t border-gray-50 flex items-center justify-between text-[11px]">
                                  <span className="text-gray-400 font-medium">Total Reviews</span>
                                  <span className="font-bold text-gray-700 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
                                    {supportData.stats?.totalFeedbacks ?? selectedUser?.supportSummary?.totalFeedbacks ?? 0} Submissions
                                  </span>
                                </div>
                              </div>

                              {/* 3. Support / Ticket History */}
                              <div className="p-4.5 rounded-2xl bg-white border border-gray-100 shadow-2xs hover:shadow-xs hover:border-blue-200 transition-all flex flex-col justify-between group">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Support / Ticket History</span>
                                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                                    <MessageSquare size={16} />
                                  </div>
                                </div>
                                <div className="flex items-baseline gap-2">
                                  <span className="text-3xl font-black text-gray-900 font-mono tracking-tight">
                                    {supportData.stats?.totalTickets ?? selectedUser?.supportSummary?.totalTickets ?? 0}
                                  </span>
                                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Tickets</span>
                                </div>
                                <div className="mt-3.5 pt-2.5 border-t border-gray-50 flex items-center justify-between text-[11px]">
                                  <span className="text-gray-400 font-medium">Ticket pipeline</span>
                                  <span className={`font-bold px-2 py-0.5 rounded-full border ${
                                    (supportData.stats?.openTickets || selectedUser?.supportSummary?.openTickets || 0) > 0
                                      ? 'text-amber-700 bg-amber-50 border-amber-100'
                                      : 'text-emerald-700 bg-emerald-50 border-emerald-100'
                                  }`}>
                                    {(supportData.stats?.openTickets ?? selectedUser?.supportSummary?.openTickets ?? 0)} Active
                                  </span>
                                </div>
                              </div>

                            </div>

                            {/* Dual Quick Preview: Recent Tickets & Recent Feedback */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                              {/* Recent Tickets Preview */}
                              <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-2xs space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                                    <MessageSquare size={14} className="text-blue-600" />
                                    Recent Tickets / Complaints
                                  </span>
                                  <button 
                                    onClick={() => { setActiveTab('support'); setSupportSubTab('tickets'); }}
                                    className="text-[11px] font-bold text-blue-700 hover:underline cursor-pointer"
                                  >
                                    View All ({supportData.tickets?.length || 0}) →
                                  </button>
                                </div>
                                {supportData.tickets && supportData.tickets.length > 0 ? (
                                  <div className="divide-y divide-gray-100">
                                    {supportData.tickets.slice(0, 3).map((tkt) => (
                                      <div key={tkt._id} className="py-2.5 flex items-center justify-between text-xs">
                                        <div className="truncate pr-2">
                                          <p className="font-bold text-gray-800 truncate">{tkt.subject}</p>
                                          <p className="text-[10px] text-gray-400 font-mono">ID: {tkt.ticketId} • {formatDate(tkt.createdAt)}</p>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                                          tkt.status === 'Open' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                          tkt.status === 'In Progress' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                          'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        }`}>
                                          {tkt.status}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-400 italic py-3 text-center">No support tickets or complaints recorded.</p>
                                )}
                              </div>

                              {/* Recent Feedback Preview */}
                              <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-2xs space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                                    <Star size={14} className="text-amber-500" />
                                    Recent Feedback
                                  </span>
                                  <button 
                                    onClick={() => { setActiveTab('support'); setSupportSubTab('feedback'); }}
                                    className="text-[11px] font-bold text-amber-700 hover:underline cursor-pointer"
                                  >
                                    View All ({supportData.feedbacks?.length || 0}) →
                                  </button>
                                </div>
                                {supportData.feedbacks && supportData.feedbacks.length > 0 ? (
                                  <div className="divide-y divide-gray-100">
                                    {supportData.feedbacks.slice(0, 3).map((fb) => (
                                      <div key={fb._id} className="py-2.5 text-xs space-y-1">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-1 text-amber-500 font-bold">
                                            {'★'.repeat(fb.rating || 5)}
                                            <span className="text-gray-400 font-normal text-[10px] ml-1">({fb.type})</span>
                                          </div>
                                          <span className="text-[10px] text-gray-400">{formatDate(fb.createdAt)}</span>
                                        </div>
                                        <p className="text-gray-700 line-clamp-1 italic text-[11px]">"{fb.comment}"</p>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-400 italic py-3 text-center">No feedback ratings submitted yet.</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-2 text-emerald-600 mb-1">
                              <Leaf size={16} />
                              <span className="text-[11px] font-bold text-gray-400 uppercase">CO2 Saved</span>
                            </div>
                            <div className="text-lg font-bold text-gray-900">{selectedUser.totalCarbonSavedKg || 0} kg</div>
                          </div>
                          <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-2 text-blue-500 mb-1">
                              <TrendingUp size={16} />
                              <span className="text-[11px] font-bold text-gray-400 uppercase">Fuel Saved</span>
                            </div>
                            <div className="text-lg font-bold text-gray-900">{selectedUser.totalFuelSavedLiters || 0} L</div>
                          </div>
                          <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-2 text-amber-500 mb-1">
                              <Award size={16} />
                              <span className="text-[11px] font-bold text-gray-400 uppercase">Points</span>
                            </div>
                            <div className="text-lg font-bold text-gray-900">{selectedUser.rewardPoints || 0} pts</div>
                          </div>
                          <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-2 text-purple-500 mb-1">
                              <Car size={16} />
                              <span className="text-[11px] font-bold text-gray-400 uppercase">Vehicles</span>
                            </div>
                            <div className="text-lg font-bold text-gray-900">{selectedUser.vehicles ? selectedUser.vehicles.length : 0}</div>
                          </div>
                        </div>

                        {/* Registered Vehicles */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                          <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Car size={18} className="text-[#8CC63F]" />
                            Registered Vehicles
                          </h4>
                          {selectedUser.vehicles && selectedUser.vehicles.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {selectedUser.vehicles.map((v) => (
                                <div key={v._id} className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="text-xs text-gray-400 font-bold">{v.brand}</p>
                                      <p className="text-sm font-bold text-gray-900">{v.model}</p>
                                    </div>
                                    <span className="text-xs font-mono bg-white px-2 py-0.5 rounded border border-gray-200 font-bold text-gray-700">
                                      {v.registrationNumber}
                                    </span>
                                  </div>
                                  <div className="mt-2 text-xs text-gray-500 flex items-center gap-1 font-medium">
                                    <Zap size={12} className="text-emerald-500" />
                                    Connector: <span className="font-bold text-gray-800">{v.connectorType || 'Type 2 / CCS2'}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 italic">No vehicles added yet.</p>
                          )}
                        </div>

                        {/* Option 2 Requirement: Prominent KYC Status in User Details */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <ShieldCheck size={18} className="text-[#8CC63F]" />
                              <h4 className="text-sm font-bold text-gray-900">Identity & KYC Verification</h4>
                            </div>
                            <button
                              onClick={() => setActiveTab('kyc')}
                              className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <span>View Documents</span>
                              <span>→</span>
                            </button>
                          </div>

                          {(() => {
                            const kyc = getKycBadge(selectedUser.kycStatus);
                            return (
                              <div className="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/70 border-gray-100">
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${kyc.className}`}>
                                    <kyc.icon size={20} />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-bold text-gray-900">KYC Status:</span>
                                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${kyc.className}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${kyc.dot}`} />
                                        <span>{kyc.label}</span>
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      {selectedUser.kycStatus === 'verified' && 'User identity documents have been verified and approved.'}
                                      {selectedUser.kycStatus === 'pending' && 'Documents submitted by user. Awaiting admin review.'}
                                      {selectedUser.kycStatus === 'rejected' && 'Documents were rejected. User must re-upload.'}
                                      {(!selectedUser.kycStatus || selectedUser.kycStatus === 'not_submitted') && 'User has not yet uploaded Aadhaar or PAN documents.'}
                                    </p>
                                  </div>
                                </div>

                                <button
                                  onClick={() => setActiveTab('kyc')}
                                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gray-900 hover:bg-black transition shadow-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                                >
                                  <FileText size={13} />
                                  <span>Review KYC</span>
                                </button>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Loyalty & Referral Summary */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
                          <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <Sparkles size={16} className="text-amber-500" />
                            Loyalty & Referral Summary
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                              <span className="text-gray-400 block font-medium">Referral Code</span>
                              <span className="font-mono font-bold text-gray-800 text-sm">{selectedUser.referralCode || 'None Assigned'}</span>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                              <span className="text-gray-400 block font-medium">Current Tier Standing</span>
                              <span className="font-bold text-amber-700 text-sm">{selectedUser.tier || 'Silver'} Member</span>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                              <span className="text-gray-400 block font-medium">Reward Points Balance</span>
                              <span className="font-bold text-emerald-700 text-sm">{selectedUser.rewardPoints || 0} pts</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 2: CHARGING HISTORY */}
                    {activeTab === 'history' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <Zap size={16} className="text-[#8CC63F]" />
                            User Session History
                          </h3>
                          <span className="text-xs text-gray-400 font-medium">{userChargingActivity.totalSessions} Sessions Total</span>
                        </div>

                        {/* 4-KPI Charging Activity Ribbon */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-2xs">
                            <span className="text-[10px] font-bold text-gray-400 uppercase block">Total Sessions</span>
                            <span className="text-base font-black text-gray-900 font-mono">{userChargingActivity.totalSessions}</span>
                          </div>
                          <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-2xs">
                            <span className="text-[10px] font-bold text-gray-400 uppercase block">Total Energy</span>
                            <span className="text-base font-black text-blue-700 font-mono">{userChargingActivity.totalEnergyConsumed.toFixed(1)} kWh</span>
                          </div>
                          <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-2xs">
                            <span className="text-[10px] font-bold text-gray-400 uppercase block">Last Session</span>
                            <span className="text-xs font-bold text-gray-800 block truncate" title={formatSessionDate(userChargingActivity.lastChargingSession).label}>
                              {formatSessionDate(userChargingActivity.lastChargingSession).label}
                            </span>
                          </div>
                          <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-2xs">
                            <span className="text-[10px] font-bold text-gray-400 uppercase block">Top Station</span>
                            <span className="text-xs font-bold text-purple-700 block truncate" title={userChargingActivity.mostUsedStation}>
                              {userChargingActivity.mostUsedStation}
                            </span>
                          </div>
                        </div>

                        {historyLoading ? (
                          <div className="py-12 text-center text-gray-400">
                            <Loader2 className="animate-spin mx-auto text-[#8CC63F] mb-2" size={24} />
                            <p className="text-xs">Fetching charging records...</p>
                          </div>
                        ) : chargingHistory.length === 0 ? (
                          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center text-gray-400">
                            <Zap size={32} className="mx-auto mb-2 text-gray-300" />
                            <p className="text-xs font-semibold text-gray-600">No Charging History</p>
                            <p className="text-[11px] text-gray-400 mt-1">This user has not completed any charging sessions yet.</p>
                          </div>
                        ) : (
                          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
                            <table className="w-full min-w-[800px] text-left border-collapse">
                              <thead className="bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase">
                                <tr>
                                  <th className="px-4 py-3">Date</th>
                                  <th className="px-4 py-3">Station</th>
                                  <th className="px-4 py-3">Duration</th>
                                  <th className="px-4 py-3">Energy</th>
                                  <th className="px-4 py-3">Amount</th>
                                  <th className="px-4 py-3">Status</th>
                                  <th className="px-4 py-3 text-right">Remote Control</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50 text-xs">
                                {chargingHistory.map((session) => (
                                  <tr key={session._id} className="hover:bg-gray-50/50">
                                    <td className="px-4 py-3 font-mono text-gray-500 whitespace-nowrap">
                                      {formatDate(session.createdAt)}
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="font-bold text-gray-900">{session.station?.name || 'Charging Station'}</div>
                                      <div className="text-[10px] text-gray-400">{session.station?.city || 'Location N/A'}</div>
                                    </td>
                                    <td className="px-4 py-3 font-medium text-gray-600">
                                      {session.duration ? `${session.duration} mins` : 'N/A'}
                                    </td>
                                    <td className="px-4 py-3 font-bold text-emerald-600">
                                      {session.unitsConsumed || session.energyConsumed || 0} kWh
                                    </td>
                                    <td className="px-4 py-3 font-bold text-gray-900">
                                      ₹{session.totalAmount || session.amount || 0}
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                                        session.status === 'Completed' || session.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                                        session.status === 'Ongoing' || session.status === 'ongoing' ? 'bg-blue-50 text-blue-600 animate-pulse' :
                                        'bg-red-50 text-red-600'
                                      }`}>
                                        {session.status || 'Completed'}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                      {session.status === 'Confirmed' || session.status === 'Pending' ? (
                                        <button
                                          onClick={() => handleStartChargingRemote(session._id)}
                                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg transition shadow-sm flex items-center gap-1 ml-auto cursor-pointer"
                                        >
                                          <Zap size={12} /> Start Charging
                                        </button>
                                      ) : session.status === 'Ongoing' ? (
                                        <button
                                          onClick={() => handleStopChargingRemote(session._id)}
                                          className="px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white font-bold text-[10px] rounded-lg transition shadow-sm flex items-center gap-1 ml-auto cursor-pointer"
                                        >
                                          <Square size={12} /> Stop Charging
                                        </button>
                                      ) : (
                                        <span className="text-[10px] font-medium text-gray-400">Session Ended</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB 3: REWARDS & POINTS */}
                    {activeTab === 'rewards' && (
                      <div className="space-y-5">
                        {rewardsLoading ? (
                          <div className="py-12 text-center text-gray-400">
                            <Loader2 className="animate-spin mx-auto text-[#8CC63F] mb-2" size={24} />
                            <p className="text-xs font-medium">Loading rewards data...</p>
                          </div>
                        ) : (
                          <>
                            {/* Points Hero */}
                            <div className="bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-2xl p-6 shadow-xl flex items-center justify-between">
                              <div>
                                <div className="text-xs font-bold uppercase tracking-wider text-amber-100 mb-1 flex items-center gap-1.5">
                                  <Award size={14} /> Reward Points
                                </div>
                                <div className="text-4xl font-extrabold tracking-tight">
                                  {rewardsData?.rewardPoints ?? selectedUser.rewardPoints ?? 0}
                                </div>
                                <div className="text-xs text-amber-100 mt-1">pts</div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-amber-100 font-bold uppercase mb-1">Tier</div>
                                <div className="text-2xl font-extrabold">{rewardsData?.tier ?? selectedUser.tier ?? 'Bronze'}</div>
                                <div className="mt-2 text-xs bg-white/20 px-3 py-1 rounded-full font-bold">
                                  {Math.floor((rewardsData?.rewardPoints ?? selectedUser.rewardPoints ?? 0) / 500)} discount(s) available
                                </div>
                              </div>
                            </div>

                            {/* Tier Progress */}
                            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
                              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                <TrendingUp size={15} className="text-amber-500" /> Tier Progress
                              </h4>
                              {[{ label: 'Bronze → Silver', min: 0, max: 500 }, { label: 'Silver → Gold', min: 500, max: 2000 }, { label: 'Gold → Platinum', min: 2000, max: 5000 }].map((tier) => {
                                const pts = rewardsData?.rewardPoints ?? selectedUser.rewardPoints ?? 0;
                                const progress = Math.min(1, Math.max(0, (pts - tier.min) / (tier.max - tier.min)));
                                const done = pts >= tier.max;
                                return (
                                  <div key={tier.label}>
                                    <div className="flex justify-between text-[11px] font-medium text-gray-500 mb-1">
                                      <span>{tier.label}</span>
                                      <span className={done ? 'text-emerald-600 font-bold' : ''}>{done ? '✓ Achieved' : `${Math.min(pts, tier.max)} / ${tier.max}`}</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                      <div className={`h-full rounded-full transition-all ${done ? 'bg-emerald-500' : 'bg-amber-400'}`} style={{ width: `${progress * 100}%` }} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Add Points Form */}
                            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 mb-4">
                                <Plus size={15} className="text-[#8CC63F]" /> Manually Add Points
                              </h4>
                              <form onSubmit={handleAddPoints} className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Points to Add</label>
                                    <input
                                      type="number"
                                      min="1"
                                      required
                                      placeholder="e.g. 50"
                                      value={addPointsAmount}
                                      onChange={(e) => setAddPointsAmount(e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#8CC63F] focus:outline-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Reason (optional)</label>
                                    <input
                                      type="text"
                                      placeholder="e.g. Bonus reward"
                                      value={addPointsReason}
                                      onChange={(e) => setAddPointsReason(e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#8CC63F] focus:outline-none"
                                    />
                                  </div>
                                </div>
                                <button
                                  type="submit"
                                  disabled={addPointsLoading}
                                  className="w-full py-2.5 bg-[#8CC63F] hover:bg-[#7ab52e] text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
                                >
                                  {addPointsLoading ? <Loader2 className="animate-spin" size={14} /> : <><Plus size={14} /> Add Points</>}
                                </button>
                              </form>
                            </div>

                            {/* How Points Are Earned */}
                            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Star size={14} className="text-amber-500" /> How Points Are Earned
                              </h4>
                              <div className="space-y-2 text-xs">
                                {[
                                  { action: 'Submit a Review', pts: '+50 pts', color: 'text-amber-600 bg-amber-50' },
                                  { action: 'Refer a Friend (first charge)', pts: '+500 pts', color: 'text-purple-600 bg-purple-50' },
                                  { action: 'Every ₹100 spent on charging', pts: '+10 pts', color: 'text-emerald-600 bg-emerald-50' },
                                  { action: 'Redeem 500 pts → ₹50 discount', pts: '-500 pts', color: 'text-red-600 bg-red-50' },
                                ].map((item) => (
                                  <div key={item.action} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                    <span className="text-gray-700 font-medium">{item.action}</span>
                                    <span className={`px-2 py-0.5 rounded-lg font-bold text-[11px] ${item.color}`}>{item.pts}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* TAB 4: KYC DOCUMENT VERIFICATION */}
                    {activeTab === 'kyc' && (
                      <div className="space-y-5">
                        {kycLoading ? (
                          <div className="py-12 text-center text-gray-400">
                            <Loader2 className="animate-spin mx-auto text-[#8CC63F] mb-2" size={24} />
                            <p className="text-xs font-medium">Fetching KYC details...</p>
                          </div>
                        ) : (
                          <>
                            {/* KYC Status Banner */}
                            <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                              kycData?.status === 'verified' ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800' :
                              kycData?.status === 'rejected' ? 'bg-red-50/80 border-red-200 text-red-800' :
                              kycData?.status === 'pending' ? 'bg-amber-50/80 border-amber-200 text-amber-800' :
                              'bg-gray-100 border-gray-200 text-gray-700'
                            }`}>
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                                  kycData?.status === 'verified' ? 'bg-emerald-500 text-white' :
                                  kycData?.status === 'rejected' ? 'bg-red-500 text-white' :
                                  'bg-amber-500 text-white'
                                }`}>
                                  {kycData?.status === 'verified' ? <CheckCircle2 size={20} /> :
                                   kycData?.status === 'rejected' ? <XCircle size={20} /> :
                                   <Clock size={20} />}
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold capitalize">KYC Status: {kycData?.status || 'Not Submitted'}</h4>
                                  {kycData?.rejectionReason && (
                                    <p className="text-xs text-red-600 font-medium mt-0.5">Reason: {kycData.rejectionReason}</p>
                                  )}
                                  {kycData?.verifiedAt && (
                                    <p className="text-[11px] text-emerald-700 font-medium mt-0.5">Verified on {formatDate(kycData.verifiedAt)}</p>
                                  )}
                                </div>
                              </div>

                              {/* Actions (Client Requirement 10.4: KYC Admin Only) */}
                              {canKyc ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleUpdateKYC('verified')}
                                    disabled={kycActionLoading || kycData?.status === 'verified'}
                                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                                  >
                                    <CheckCircle2 size={14} /> Approve KYC
                                  </button>
                                  <button
                                    onClick={() => setIsRejectionModalOpen(true)}
                                    disabled={kycActionLoading || kycData?.status === 'rejected'}
                                    className="px-3.5 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                                  >
                                    <XCircle size={14} /> Reject
                                  </button>
                                </div>
                              ) : (
                                <div className="text-[11px] text-amber-800 font-semibold bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200 flex items-center gap-1.5">
                                  <Lock size={12} className="text-amber-600" />
                                  <span>Read-Only: KYC Admin permission required to verify</span>
                                </div>
                              )}
                            </div>

                            {/* Document Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {/* Aadhaar Document Card */}
                              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-3">
                                <div className="flex items-center justify-between">
                                  <h5 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Aadhaar Card</h5>
                                  <span className="text-xs font-mono text-gray-500 font-semibold">{kycData?.aadhaarNumber || 'Not provided'}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div 
                                    onClick={() => kycData?.aadhaarFront && setPreviewImage({ url: getMediaUrl(kycData.aadhaarFront), title: 'Aadhaar Card (Front)' })}
                                    className="relative group border border-gray-200 rounded-xl overflow-hidden bg-gray-50 aspect-video flex items-center justify-center cursor-pointer hover:border-emerald-500 transition"
                                  >
                                    {kycData?.aadhaarFront ? (
                                      <>
                                        <img src={getMediaUrl(kycData.aadhaarFront)} alt="Aadhaar Front" className="w-full h-full object-contain p-1 group-hover:scale-105 transition" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white text-xs font-bold gap-1">
                                          <Eye size={16} /> Click to View
                                        </div>
                                      </>
                                    ) : (
                                      <div className="text-[10px] text-gray-400 font-medium">Front Image N/A</div>
                                    )}
                                  </div>
                                  <div 
                                    onClick={() => kycData?.aadhaarBack && setPreviewImage({ url: getMediaUrl(kycData.aadhaarBack), title: 'Aadhaar Card (Back)' })}
                                    className="relative group border border-gray-200 rounded-xl overflow-hidden bg-gray-50 aspect-video flex items-center justify-center cursor-pointer hover:border-emerald-500 transition"
                                  >
                                    {kycData?.aadhaarBack ? (
                                      <>
                                        <img src={getMediaUrl(kycData.aadhaarBack)} alt="Aadhaar Back" className="w-full h-full object-contain p-1 group-hover:scale-105 transition" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white text-xs font-bold gap-1">
                                          <Eye size={16} /> Click to View
                                        </div>
                                      </>
                                    ) : (
                                      <div className="text-[10px] text-gray-400 font-medium">Back Image N/A</div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* PAN Card Document */}
                              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-3">
                                <div className="flex items-center justify-between">
                                  <h5 className="text-xs font-bold text-gray-900 uppercase tracking-wider">PAN Card</h5>
                                  <span className="text-xs font-mono text-gray-500 font-semibold">{kycData?.panNumber || 'Not provided'}</span>
                                </div>
                                <div 
                                  onClick={() => kycData?.panImage && setPreviewImage({ url: getMediaUrl(kycData.panImage), title: 'PAN Card' })}
                                  className="relative group border border-gray-200 rounded-xl overflow-hidden bg-gray-50 aspect-video flex items-center justify-center cursor-pointer hover:border-emerald-500 transition"
                                >
                                  {kycData?.panImage ? (
                                    <>
                                      <img src={getMediaUrl(kycData.panImage)} alt="PAN Card" className="w-full h-full object-contain p-1 group-hover:scale-105 transition" />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white text-xs font-bold gap-1">
                                        <Eye size={16} /> Click to View
                                      </div>
                                    </>
                                  ) : (
                                    <div className="text-[10px] text-gray-400 font-medium">PAN Image N/A</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* TAB 4: WALLET & REFUNDS */}
                    {activeTab === 'wallet' && (
                      <div className="space-y-6">
                        {walletLoading ? (
                          <div className="py-16 text-center text-gray-400 space-y-3">
                            <Loader2 className="animate-spin mx-auto text-[#8CC63F]" size={32} />
                            <p className="text-xs font-semibold text-gray-500">Loading live financial records...</p>
                          </div>
                        ) : (
                          <>
                            {/* 2 Executive Financial KPI Header Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              
                              {/* 1. Wallet Balance Hero Card */}
                              <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 text-white rounded-2xl p-5 shadow-lg border border-gray-800 relative overflow-hidden flex flex-col justify-between group">
                                <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-[#8CC63F]/10 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform" />
                                
                                <div className="flex items-start justify-between relative z-10">
                                  <div className="space-y-1">
                                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                      <Wallet size={14} className="text-[#8CC63F]" />
                                      Wallet Balance
                                    </div>
                                    <div className="text-3xl font-black tracking-tight text-white font-mono">
                                      ₹{((walletData.balance ?? walletData.wallet?.balance ?? selectedUser?.wallet?.balance ?? 0)).toFixed(2)}
                                    </div>
                                    <div className="text-[11px] text-gray-400 flex items-center gap-2 pt-0.5">
                                      <span>Currency: INR (₹)</span>
                                      <span>•</span>
                                      <span className="font-mono">ID: {walletData.wallet?._id ? walletData.wallet._id.slice(-8).toUpperCase() : (selectedUser?.wallet?._id ? selectedUser.wallet._id.slice(-8).toUpperCase() : 'N/A')}</span>
                                    </div>
                                  </div>

                                  {/* Client Requirement 10.4: Refund only for Finance Admin & Super Admin */}
                                  {canRefund && (
                                    <button
                                      onClick={() => setIsRefundModalOpen(true)}
                                      className="relative z-10 px-3.5 py-2 bg-[#8CC63F] hover:bg-[#7db534] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-md hover:shadow-lg cursor-pointer shrink-0"
                                    >
                                      <RotateCcw size={14} />
                                      <span>Issue Refund</span>
                                    </button>
                                  )}
                                </div>

                                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-gray-400 relative z-10">
                                  <span>Wallet Status</span>
                                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                                    (walletData.balance ?? walletData.wallet?.balance ?? selectedUser?.wallet?.balance ?? 0) > 0
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                      : 'bg-white/10 text-gray-300 border border-white/10'
                                  }`}>
                                    {(walletData.balance ?? walletData.wallet?.balance ?? selectedUser?.wallet?.balance ?? 0) > 0 ? 'Active & Funded' : 'Zero Balance'}
                                  </span>
                                </div>
                              </div>

                              {/* 2. Total Amount Spent Hero Card */}
                              <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-5 shadow-lg border border-blue-900/40 relative overflow-hidden flex flex-col justify-between group">
                                <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-blue-500/10 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform" />
                                
                                <div className="space-y-1 relative z-10">
                                  <div className="text-[11px] font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                                    <IndianRupee size={14} className="text-blue-400" />
                                    Total Amount Spent
                                  </div>
                                  <div className="text-3xl font-black tracking-tight text-white font-mono">
                                    ₹{((walletData.totalAmountSpent ?? selectedUser?.totalAmountSpent ?? 0)).toFixed(2)}
                                  </div>
                                  <div className="text-[11px] text-blue-200/70 pt-0.5">
                                    Lifetime user expenditure across all platform services
                                  </div>
                                </div>

                                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-blue-200/80 relative z-10">
                                  <span className="truncate">EV Charging Spend:</span>
                                  <span className="font-mono font-bold text-white shrink-0">
                                    ₹{((walletData.chargingSpent ?? selectedUser?.financials?.chargingSpent ?? selectedUser?.totalAmountSpent ?? 0)).toFixed(2)}
                                  </span>
                                </div>
                              </div>

                            </div>

                            {/* Sub-Navigation: Payment History vs Refund History */}
                            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden">
                              {/* Sub-tabs header bar */}
                              <div className="p-3 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-1.5 bg-gray-200/70 p-1 rounded-xl w-fit">
                                  <button
                                    onClick={() => setWalletSubTab('payments')}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                      walletSubTab === 'payments'
                                        ? 'bg-white text-gray-900 shadow-xs'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                                    }`}
                                  >
                                    <CreditCard size={14} className={walletSubTab === 'payments' ? 'text-emerald-600' : 'text-gray-500'} />
                                    <span>Payment History</span>
                                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-gray-100 text-gray-700 font-mono">
                                      {(walletData.transactions?.length || 0) + (walletData.chargingPayments?.length || 0)}
                                    </span>
                                  </button>

                                  <button
                                    onClick={() => setWalletSubTab('refunds')}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                      walletSubTab === 'refunds'
                                        ? 'bg-white text-gray-900 shadow-xs'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                                    }`}
                                  >
                                    <RotateCcw size={14} className={walletSubTab === 'refunds' ? 'text-amber-600' : 'text-gray-500'} />
                                    <span>Refund History</span>
                                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-gray-100 text-gray-700 font-mono">
                                      {walletData.refunds?.length || 0}
                                    </span>
                                  </button>
                                </div>

                                {walletSubTab === 'refunds' && hasPermission('users', 'edit') && (
                                  <button
                                    onClick={() => setIsRefundModalOpen(true)}
                                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition flex items-center gap-1.5 shadow-2xs cursor-pointer self-start sm:self-auto"
                                  >
                                    <Plus size={14} />
                                    <span>Initiate Refund</span>
                                  </button>
                                )}
                              </div>

                              {/* SUB-TAB 1: PAYMENT HISTORY */}
                              {walletSubTab === 'payments' && (
                                <div className="p-5 space-y-4">
                                  {/* Filter & Search Bar */}
                                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                                    <div className="relative flex-1 max-w-sm">
                                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                      <input
                                        type="text"
                                        placeholder="Search by ID, station, description..."
                                        value={paymentSearch}
                                        onChange={(e) => setPaymentSearch(e.target.value)}
                                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                      />
                                    </div>

                                    {/* Type Filter Pill Buttons */}
                                    <div className="flex items-center gap-1">
                                      {['ALL', 'CREDIT', 'DEBIT'].map((type) => (
                                        <button
                                          key={type}
                                          onClick={() => setPaymentTypeFilter(type)}
                                          className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                            paymentTypeFilter === type
                                              ? 'bg-gray-900 text-white shadow-2xs'
                                              : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                                          }`}
                                        >
                                          {type === 'ALL' ? 'All' : type === 'CREDIT' ? 'Credits (+)' : 'Debits (-)'}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Payments List / Table */}
                                  {(() => {
                                    const rawTxns = (walletData.transactions || []).map(t => ({
                                      id: t.referenceId || t._id,
                                      displayId: t.referenceId || `TXN-${t._id?.slice(-6).toUpperCase()}`,
                                      type: t.type || 'CREDIT',
                                      category: t.description?.toLowerCase().includes('refund') ? 'Refund Credit' : (t.type === 'CREDIT' ? 'Wallet Top-up' : 'Platform Payment'),
                                      description: t.description || 'Wallet Transaction',
                                      amount: t.amount || 0,
                                      status: t.status || 'SUCCESS',
                                      date: t.createdAt,
                                      method: 'Wallet / Gateway'
                                    }));

                                    const chargingTxns = (walletData.chargingPayments || []).map(b => ({
                                      id: b.bookingId || b._id,
                                      displayId: b.bookingId || `BK-${b._id?.slice(-6).toUpperCase()}`,
                                      type: 'DEBIT',
                                      category: 'EV Charging',
                                      description: `EV Session: ${b.station?.name || 'Charging Station'}${b.station?.city ? ` (${b.station.city})` : ''}`,
                                      amount: b.estimatedCost || 0,
                                      status: b.paymentStatus === 'Paid' ? 'SUCCESS' : (b.paymentStatus || 'SUCCESS'),
                                      date: b.createdAt || b.scheduledDate,
                                      method: (b.paymentMethod === 'razorpay' ? 'Razorpay' : (b.paymentMethod === 'wallet' ? 'Wallet Balance' : 'Online Gateway'))
                                    }));

                                    const seenIds = new Set();
                                    const combined = [...rawTxns, ...chargingTxns].filter(item => {
                                      if (!item.id || seenIds.has(item.id)) return false;
                                      seenIds.add(item.id);
                                      return true;
                                    }).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

                                    const filtered = combined.filter(t => {
                                      if (paymentTypeFilter === 'CREDIT' && t.type !== 'CREDIT') return false;
                                      if (paymentTypeFilter === 'DEBIT' && t.type !== 'DEBIT') return false;
                                      if (paymentSearch.trim()) {
                                        const q = paymentSearch.toLowerCase();
                                        const matchDesc = (t.description || '').toLowerCase().includes(q);
                                        const matchId = (t.displayId || '').toLowerCase().includes(q);
                                        const matchCat = (t.category || '').toLowerCase().includes(q);
                                        const matchMethod = (t.method || '').toLowerCase().includes(q);
                                        if (!matchDesc && !matchId && !matchCat && !matchMethod) return false;
                                      }
                                      return true;
                                    });

                                    if (filtered.length === 0) {
                                      return (
                                        <div className="py-12 text-center text-gray-400 space-y-2 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                                          <Receipt size={32} className="mx-auto text-gray-300" />
                                          <p className="text-xs font-medium">No payment records found matching the filter.</p>
                                        </div>
                                      );
                                    }

                                    return (
                                      <div className="overflow-x-auto border border-gray-100 rounded-xl">
                                        <table className="w-full text-left border-collapse text-xs">
                                          <thead>
                                            <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                              <th className="py-3 px-4">Transaction / Ref ID</th>
                                              <th className="py-3 px-4">Type & Purpose</th>
                                              <th className="py-3 px-4">Payment Method</th>
                                              <th className="py-3 px-4">Date & Time</th>
                                              <th className="py-3 px-4 text-right">Amount</th>
                                              <th className="py-3 px-4 text-center">Status</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-gray-100 bg-white">
                                            {filtered.map((item) => (
                                              <tr key={item.id} className="hover:bg-gray-50/60 transition">
                                                {/* ID */}
                                                <td className="py-3 px-4 font-mono font-bold text-gray-900">
                                                  <div className="flex items-center gap-1.5">
                                                    <span>{item.displayId}</span>
                                                    <button 
                                                      onClick={() => {
                                                        navigator.clipboard?.writeText(item.displayId);
                                                        toast.success(`Copied: ${item.displayId}`);
                                                      }}
                                                      className="text-gray-400 hover:text-gray-700 transition"
                                                      title="Copy ID"
                                                    >
                                                      <Copy size={11} />
                                                    </button>
                                                  </div>
                                                </td>

                                                {/* Purpose */}
                                                <td className="py-3 px-4">
                                                  <div className="font-semibold text-gray-900 max-w-xs truncate" title={item.description}>
                                                    {item.description}
                                                  </div>
                                                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                    {item.category}
                                                  </span>
                                                </td>

                                                {/* Method */}
                                                <td className="py-3 px-4">
                                                  <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-medium text-[11px]">
                                                    {item.method}
                                                  </span>
                                                </td>

                                                {/* Date */}
                                                <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                                                  {formatDate(item.date)}
                                                </td>

                                                {/* Amount */}
                                                <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-bold">
                                                  <span className={item.type === 'CREDIT' ? 'text-emerald-600' : 'text-gray-900'}>
                                                    {item.type === 'CREDIT' ? '+' : '-'} ₹{Number(item.amount).toFixed(2)}
                                                  </span>
                                                </td>

                                                {/* Status Badge */}
                                                <td className="py-3 px-4 text-center whitespace-nowrap">
                                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                    item.status?.toLowerCase() === 'success' || item.status?.toLowerCase() === 'paid'
                                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                      : item.status?.toLowerCase() === 'pending'
                                                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                                                  }`}>
                                                    {item.status}
                                                  </span>
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}

                              {/* SUB-TAB 2: REFUND HISTORY */}
                              {walletSubTab === 'refunds' && (
                                <div className="p-5 space-y-4">
                                  {/* Refund Summary Ribbon */}
                                  <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                                        <RotateCcw size={16} />
                                      </div>
                                      <div>
                                        <h5 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Refund History Log</h5>
                                        <p className="text-[11px] text-gray-500">All refunds processed, approved or pending for this user</p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-xs font-bold text-gray-700">
                                      <div>
                                        <span className="text-gray-400 block text-[10px] uppercase font-bold">Total Refunded</span>
                                        <span className="font-mono text-emerald-700 text-sm">
                                          ₹{((walletData.refunds || []).filter(r => r.status === 'Approved').reduce((s, r) => s + (Number(r.amount) || 0), 0)).toFixed(2)}
                                        </span>
                                      </div>
                                      <div className="border-l border-amber-200 pl-4">
                                        <span className="text-gray-400 block text-[10px] uppercase font-bold">Total Requests</span>
                                        <span className="font-mono text-gray-900 text-sm">{walletData.refunds?.length || 0}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Refunds Table */}
                                  {walletData.refunds && walletData.refunds.length > 0 ? (
                                    <div className="overflow-x-auto border border-gray-100 rounded-xl">
                                      <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                          <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                            <th className="py-3 px-4">Refund ID</th>
                                            <th className="py-3 px-4">Linked Booking</th>
                                            <th className="py-3 px-4">Reason / Notes</th>
                                            <th className="py-3 px-4">Destination</th>
                                            <th className="py-3 px-4">Date & Time</th>
                                            <th className="py-3 px-4 text-right">Amount</th>
                                            <th className="py-3 px-4 text-center">Status</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 bg-white">
                                          {walletData.refunds.map((ref) => (
                                            <tr key={ref._id} className="hover:bg-gray-50/60 transition">
                                              {/* Refund ID */}
                                              <td className="py-3 px-4 font-mono font-bold text-gray-900">
                                                <div className="flex items-center gap-1.5">
                                                  <span>{ref.refundId}</span>
                                                  <button 
                                                    onClick={() => {
                                                      navigator.clipboard?.writeText(ref.refundId);
                                                      toast.success(`Copied: ${ref.refundId}`);
                                                    }}
                                                    className="text-gray-400 hover:text-gray-700 transition"
                                                    title="Copy Refund ID"
                                                  >
                                                    <Copy size={11} />
                                                  </button>
                                                </div>
                                              </td>

                                              {/* Linked Booking */}
                                              <td className="py-3 px-4 text-gray-600 font-mono">
                                                {ref.booking?.bookingId || (ref.booking ? `BK-${ref.booking.toString().slice(-6).toUpperCase()}` : 'Direct / Manual')}
                                              </td>

                                              {/* Reason */}
                                              <td className="py-3 px-4">
                                                <div className="font-semibold text-gray-800 max-w-xs truncate" title={ref.reason}>
                                                  {ref.reason || 'Admin initiated refund'}
                                                </div>
                                              </td>

                                              {/* Destination */}
                                              <td className="py-3 px-4">
                                                <span className="capitalize px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-medium text-[11px]">
                                                  {ref.refundDestination || ref.paymentMethod || 'Wallet'}
                                                </span>
                                              </td>

                                              {/* Date */}
                                              <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                                                {formatDate(ref.createdAt)}
                                              </td>

                                              {/* Amount */}
                                              <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-bold text-emerald-600">
                                                + ₹{Number(ref.amount || 0).toFixed(2)}
                                              </td>

                                              {/* Status */}
                                              <td className="py-3 px-4 text-center whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                  ref.status === 'Approved'
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : ref.status === 'Pending'
                                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                                }`}>
                                                  {ref.status}
                                                </span>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  ) : (
                                    <div className="py-12 text-center text-gray-400 space-y-2 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                                      <RotateCcw size={32} className="mx-auto text-gray-300" />
                                      <p className="text-xs font-semibold text-gray-600">No refunds have been issued for this user yet.</p>
                                      <p className="text-[11px] text-gray-400">You can initiate a wallet refund at any time using the button above.</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* TAB 5: SUPPORT & COMPLAINTS */}
                    {activeTab === 'support' && (
                      <div className="space-y-6">
                        {supportLoading ? (
                          <div className="py-16 text-center text-gray-400 space-y-3">
                            <Loader2 className="animate-spin mx-auto text-[#8CC63F]" size={32} />
                            <p className="text-xs font-semibold text-gray-500">Loading support records, complaints & feedback...</p>
                          </div>
                        ) : (
                          <>
                            {/* 4 Executive KPI Header Tiles */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                              {/* 1. Total Tickets */}
                              <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-2xs">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Tickets</span>
                                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <MessageSquare size={14} />
                                  </div>
                                </div>
                                <div className="text-2xl font-black text-gray-900 font-mono">
                                  {supportData.stats?.totalTickets || 0}
                                </div>
                                <p className="text-[11px] text-gray-400 mt-1">All-time helpdesk history</p>
                              </div>

                              {/* 2. Open Issues */}
                              <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-2xs">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Open Issues</span>
                                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                                    (supportData.stats?.openTickets || 0) > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                                  }`}>
                                    <AlertCircle size={14} />
                                  </div>
                                </div>
                                <div className="flex items-baseline gap-2">
                                  <span className="text-2xl font-black text-gray-900 font-mono">
                                    {supportData.stats?.openTickets || 0}
                                  </span>
                                  {(supportData.stats?.openTickets || 0) > 0 && (
                                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                                  )}
                                </div>
                                <p className="text-[11px] text-gray-400 mt-1">Awaiting staff resolution</p>
                              </div>

                              {/* 3. Complaints */}
                              <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-2xs">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Complaints</span>
                                  <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                                    <AlertTriangle size={14} />
                                  </div>
                                </div>
                                <div className="text-2xl font-black text-gray-900 font-mono">
                                  {supportData.stats?.complaintsCount || 0}
                                </div>
                                <p className="text-[11px] text-gray-400 mt-1">Reported technical/billing issues</p>
                              </div>

                              {/* 4. Feedback Rating */}
                              <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-2xs">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Feedback Rating</span>
                                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
                                    <Star size={14} />
                                  </div>
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-2xl font-black text-gray-900 font-mono">
                                    {(supportData.stats?.avgRating || 0) > 0 ? supportData.stats.avgRating.toFixed(1) : '5.0'}
                                  </span>
                                  <span className="text-xs font-bold text-amber-500">★</span>
                                </div>
                                <p className="text-[11px] text-gray-400 mt-1">{supportData.stats?.totalFeedbacks || 0} Reviews submitted</p>
                              </div>
                            </div>

                            {/* Sub-Tabs & Action Bar */}
                            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden">
                              <div className="p-3 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-1.5 bg-gray-200/70 p-1 rounded-xl w-fit">
                                  <button
                                    onClick={() => setSupportSubTab('complaints')}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                      supportSubTab === 'complaints'
                                        ? 'bg-white text-gray-900 shadow-xs'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                                    }`}
                                  >
                                    <AlertTriangle size={13} className={supportSubTab === 'complaints' ? 'text-rose-600' : 'text-gray-500'} />
                                    <span>Complaints</span>
                                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-gray-100 text-gray-700 font-mono">
                                      {supportData.complaints?.length || 0}
                                    </span>
                                  </button>

                                  <button
                                    onClick={() => setSupportSubTab('feedback')}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                      supportSubTab === 'feedback'
                                        ? 'bg-white text-gray-900 shadow-xs'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                                    }`}
                                  >
                                    <Star size={13} className={supportSubTab === 'feedback' ? 'text-amber-500' : 'text-gray-500'} />
                                    <span>Feedback</span>
                                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-gray-100 text-gray-700 font-mono">
                                      {supportData.feedbacks?.length || 0}
                                    </span>
                                  </button>

                                  <button
                                    onClick={() => setSupportSubTab('tickets')}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                      supportSubTab === 'tickets'
                                        ? 'bg-white text-gray-900 shadow-xs'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                                    }`}
                                  >
                                    <MessageSquare size={13} className={supportSubTab === 'tickets' ? 'text-blue-600' : 'text-gray-500'} />
                                    <span>Support / Ticket History</span>
                                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-gray-100 text-gray-700 font-mono">
                                      {supportData.tickets?.length || 0}
                                    </span>
                                  </button>
                                </div>

                                <button
                                  onClick={() => setIsCreateTicketModalOpen(true)}
                                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-gray-900 hover:bg-black rounded-xl transition flex items-center gap-1.5 shadow-2xs cursor-pointer self-start sm:self-auto"
                                >
                                  <Plus size={14} />
                                  <span>Log Ticket / Complaint</span>
                                </button>
                              </div>

                              {/* SUB-TAB 1: COMPLAINTS */}
                              {supportSubTab === 'complaints' && (
                                <div className="p-5 space-y-4">
                                  {supportData.complaints && supportData.complaints.length > 0 ? (
                                    <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden bg-white">
                                      {supportData.complaints.map((c) => (
                                        <div key={c._id} className="p-4 hover:bg-gray-50/70 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                          <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <span className="font-mono font-bold text-xs text-gray-900 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                                                {c.ticketId}
                                              </span>
                                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                                {c.category}
                                              </span>
                                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                c.priority === 'High' ? 'bg-rose-100 text-rose-800' :
                                                c.priority === 'Medium' ? 'bg-amber-100 text-amber-800' :
                                                'bg-blue-100 text-blue-800'
                                              }`}>
                                                {c.priority} Priority
                                              </span>
                                            </div>
                                            <h5 className="font-bold text-gray-900 text-sm">{c.subject}</h5>
                                            {c.messages && c.messages[0] && (
                                              <p className="text-xs text-gray-600 line-clamp-2 italic bg-gray-50 p-2 rounded-lg border border-gray-100">
                                                "{c.messages[0].text}"
                                              </p>
                                            )}
                                            <p className="text-[11px] text-gray-400">Reported: {formatDate(c.createdAt)}</p>
                                          </div>

                                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                              c.status === 'Open' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                              c.status === 'In Progress' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                              'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                            }`}>
                                              {c.status}
                                            </span>
                                            <button
                                              onClick={() => setSelectedTicket(c)}
                                              className="px-3 py-1.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition cursor-pointer flex items-center gap-1"
                                            >
                                              <MessageCircle size={13} />
                                              <span>Resolve Thread</span>
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="py-16 text-center text-gray-400 space-y-2 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                                      <CheckCircle size={36} className="mx-auto text-emerald-500" />
                                      <p className="text-xs font-bold text-gray-700">Zero Active Complaints</p>
                                      <p className="text-[11px] text-gray-400">No unresolved complaints or critical issues reported by this user.</p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* SUB-TAB 2: FEEDBACK & RATINGS */}
                              {supportSubTab === 'feedback' && (
                                <div className="p-5 space-y-4">
                                  {supportData.feedbacks && supportData.feedbacks.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {supportData.feedbacks.map((fb) => (
                                        <div key={fb._id} className="p-4 rounded-xl border border-gray-200/80 bg-white shadow-2xs space-y-3 flex flex-col justify-between">
                                          <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center gap-1 text-amber-500 font-bold">
                                                {'★'.repeat(fb.rating || 5)}
                                                <span className="text-xs text-gray-800 font-black ml-1.5">{fb.rating}.0</span>
                                              </div>
                                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600">
                                                {fb.type}
                                              </span>
                                            </div>

                                            {fb.stationId && (
                                              <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                                                <MapPin size={12} />
                                                <span>{fb.stationId.name} {fb.stationId.city ? `(${fb.stationId.city})` : ''}</span>
                                              </div>
                                            )}

                                            {fb.title && <h5 className="font-bold text-xs text-gray-900">{fb.title}</h5>}
                                            <p className="text-xs text-gray-700 leading-relaxed bg-gray-50/70 p-2.5 rounded-lg border border-gray-100 italic">
                                              "{fb.comment}"
                                            </p>

                                            {fb.adminReply && (
                                              <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100 text-xs space-y-1">
                                                <div className="flex items-center justify-between font-bold text-[10px] text-emerald-800 uppercase tracking-wider">
                                                  <span>Official Admin Response</span>
                                                  {fb.repliedAt && <span className="font-normal text-emerald-600">{formatDate(fb.repliedAt)}</span>}
                                                </div>
                                                <p className="text-gray-800">{fb.adminReply}</p>
                                              </div>
                                            )}
                                          </div>

                                          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
                                            <span className="text-gray-400">{formatDate(fb.createdAt)}</span>
                                            {!fb.adminReply && (
                                              <button
                                                onClick={() => setFeedbackReplyModal({ isOpen: true, feedback: fb, replyText: '' })}
                                                className="font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer"
                                              >
                                                <Send size={11} />
                                                <span>Reply to Review</span>
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="py-16 text-center text-gray-400 space-y-2 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                                      <Star size={36} className="mx-auto text-amber-400" />
                                      <p className="text-xs font-bold text-gray-700">No Feedback Submitted</p>
                                      <p className="text-[11px] text-gray-400">User has not left any star ratings or platform feedback yet.</p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* SUB-TAB 3: SUPPORT / TICKET HISTORY */}
                              {supportSubTab === 'tickets' && (
                                <div className="p-5 space-y-4">
                                  {supportData.tickets && supportData.tickets.length > 0 ? (
                                    <div className="overflow-x-auto border border-gray-100 rounded-xl">
                                      <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                          <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                            <th className="py-3 px-4">Ticket ID</th>
                                            <th className="py-3 px-4">Subject</th>
                                            <th className="py-3 px-4">Category</th>
                                            <th className="py-3 px-4">Priority</th>
                                            <th className="py-3 px-4">Messages</th>
                                            <th className="py-3 px-4">Created Date</th>
                                            <th className="py-3 px-4 text-center">Status</th>
                                            <th className="py-3 px-4 text-right">Action</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 bg-white">
                                          {supportData.tickets.map((tkt) => (
                                            <tr key={tkt._id} className="hover:bg-gray-50/60 transition">
                                              <td className="py-3 px-4 font-mono font-bold text-gray-900">
                                                <div className="flex items-center gap-1.5">
                                                  <span>{tkt.ticketId}</span>
                                                  <button
                                                    onClick={() => {
                                                      navigator.clipboard?.writeText(tkt.ticketId);
                                                      toast.success(`Copied: ${tkt.ticketId}`);
                                                    }}
                                                    className="text-gray-400 hover:text-gray-700"
                                                    title="Copy Ticket ID"
                                                  >
                                                    <Copy size={11} />
                                                  </button>
                                                </div>
                                              </td>
                                              <td className="py-3 px-4 font-bold text-gray-900 max-w-xs truncate" title={tkt.subject}>
                                                {tkt.subject}
                                              </td>
                                              <td className="py-3 px-4">
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">
                                                  {tkt.category}
                                                </span>
                                              </td>
                                              <td className="py-3 px-4">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                  tkt.priority === 'High' ? 'bg-rose-100 text-rose-800' :
                                                  tkt.priority === 'Medium' ? 'bg-amber-100 text-amber-800' :
                                                  'bg-blue-100 text-blue-800'
                                                }`}>
                                                  {tkt.priority}
                                                </span>
                                              </td>
                                              <td className="py-3 px-4 font-mono text-gray-600">
                                                {tkt.messages?.length || 0} msg{tkt.messages?.length === 1 ? '' : 's'}
                                              </td>
                                              <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                                                {formatDate(tkt.createdAt)}
                                              </td>
                                              <td className="py-3 px-4 text-center whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                  tkt.status === 'Open' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                                  tkt.status === 'In Progress' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                                  'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                }`}>
                                                  {tkt.status}
                                                </span>
                                              </td>
                                              <td className="py-3 px-4 text-right">
                                                <button
                                                  onClick={() => setSelectedTicket(tkt)}
                                                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 transition cursor-pointer"
                                                >
                                                  View / Reply
                                                </button>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  ) : (
                                    <div className="py-16 text-center text-gray-400 space-y-2 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                                      <MessageSquare size={36} className="mx-auto text-gray-300" />
                                      <p className="text-xs font-bold text-gray-700">No Ticket History</p>
                                      <p className="text-[11px] text-gray-400">User has not created any support tickets yet.</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* TAB 7: IMMUTABLE AUDIT TRAIL (SECTION 10) */}
                    {activeTab === 'audit' && (
                      <div className="space-y-6 animate-in fade-in duration-200">
                        {/* Audit Header Card */}
                        <div className="bg-gradient-to-r from-gray-900 via-slate-900 to-gray-900 rounded-2xl p-5 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-gray-800">
                          <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 shadow-inner shrink-0">
                              <Shield size={22} className="text-[#8CC63F]" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-bold text-base text-white">Immutable Security Audit Trail</h4>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#8CC63F]/20 text-[#8CC63F] border border-[#8CC63F]/30">
                                  Section 10 Compliance
                                </span>
                              </div>
                              <p className="text-xs text-gray-300 mt-0.5">
                                Logged records for all administrative status changes, blocks, KYC decisions, and wallet refunds.
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => selectedUser && fetchUserAuditTrail(selectedUser._id)}
                            disabled={auditLoading}
                            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition flex items-center gap-2 self-start sm:self-auto border border-white/10 cursor-pointer"
                          >
                            <RotateCcw size={13} className={auditLoading ? 'animate-spin' : ''} />
                            <span>Refresh Logs</span>
                          </button>
                        </div>

                        {/* Audit Trail List */}
                        {auditLoading ? (
                          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                            <Loader2 className="animate-spin text-[#8CC63F]" size={32} />
                            <p className="text-xs font-medium text-gray-500">Fetching audit logs...</p>
                          </div>
                        ) : auditLogs && auditLogs.length > 0 ? (
                          <div className="space-y-3">
                            {auditLogs.map((log) => {
                              const actionBadgeStyles = {
                                'BLOCK_USER': 'bg-rose-50 text-rose-700 border-rose-200',
                                'UNBLOCK_USER': 'bg-emerald-50 text-emerald-700 border-emerald-200',
                                'DEACTIVATE_USER': 'bg-amber-50 text-amber-700 border-amber-200',
                                'REACTIVATE_USER': 'bg-blue-50 text-blue-700 border-blue-200',
                                'DELETE_USER': 'bg-red-50 text-red-700 border-red-200',
                                'KYC_STATUS_UPDATE': 'bg-purple-50 text-purple-700 border-purple-200',
                                'ADMIN_WALLET_REFUND': 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              };
                              const badgeClass = actionBadgeStyles[log.action] || 'bg-gray-100 text-gray-700 border-gray-200';

                              return (
                                <div
                                  key={log._id}
                                  className="bg-white rounded-xl border border-gray-200/80 p-4 hover:border-gray-300 transition shadow-2xs space-y-2.5"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider ${badgeClass}`}>
                                        {log.action?.replace(/_/g, ' ')}
                                      </span>
                                      <span className="text-xs text-gray-400">•</span>
                                      <span className="text-xs font-bold text-gray-900">
                                        {log.user || log.adminId?.name || 'Admin'}
                                      </span>
                                      {log.adminId?.email && (
                                        <span className="text-[11px] text-gray-400 font-mono">
                                          ({log.adminId.email})
                                        </span>
                                      )}
                                      {(log.role || log.adminId?.role) && (
                                        <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-gray-100 text-gray-600 uppercase">
                                          {log.role || log.adminId?.role}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] text-gray-400 font-mono">
                                      <Clock size={12} />
                                      <span>{formatDate(log.createdAt)}</span>
                                      {(log.ip || log.ipAddress) && (
                                        <>
                                          <span>•</span>
                                          <span className="px-1.5 py-0.2 bg-gray-50 border border-gray-200 rounded text-gray-500">
                                            IP: {log.ip || log.ipAddress}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>

                                  {/* Details / Reason */}
                                  <div className="bg-gray-50/90 rounded-lg p-3 text-xs text-gray-700 border border-gray-100 space-y-1">
                                    {typeof log.details === 'string' ? (
                                      <div className="font-medium text-gray-900 leading-relaxed">
                                        {log.details}
                                      </div>
                                    ) : (
                                      <>
                                        {log.details?.reason && (
                                          <div className="flex items-start gap-1.5">
                                            <span className="font-bold text-gray-600 shrink-0">Reason:</span>
                                            <span className="text-gray-900 font-medium">{log.details.reason}</span>
                                          </div>
                                        )}
                                        {log.details?.status && (
                                          <div className="flex items-center gap-1.5">
                                            <span className="font-bold text-gray-600">Updated Status:</span>
                                            <span className="font-semibold text-gray-900 capitalize">{log.details.status}</span>
                                          </div>
                                        )}
                                        {log.details?.amount !== undefined && (
                                          <div className="flex items-center gap-1.5">
                                            <span className="font-bold text-gray-600">Refund Amount:</span>
                                            <span className="font-bold text-emerald-600">₹{log.details.amount}</span>
                                          </div>
                                        )}
                                        {log.details?.previousBalance !== undefined && log.details?.newBalance !== undefined && (
                                          <div className="text-[11px] text-gray-500">
                                            Balance Movement: ₹{log.details.previousBalance} → ₹{log.details.newBalance}
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="py-16 text-center text-gray-400 space-y-2 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                            <Shield size={36} className="mx-auto text-gray-300" />
                            <p className="text-xs font-bold text-gray-700">No Audit Events Recorded Yet</p>
                            <p className="text-[11px] text-gray-400">Actions such as User Block/Unblock, KYC status updates, or Wallet refunds will appear in this timeline.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* KYC Rejection Reason Modal */}
      {isRejectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-900">Specify KYC Rejection Reason</h3>
            <textarea
              rows={3}
              placeholder="Enter reason for rejecting documents..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setIsRejectionModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateKYC('rejected', rejectionReason)}
                disabled={kycActionLoading}
                className="px-4 py-2 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition flex items-center gap-1.5"
              >
                {kycActionLoading ? <Loader2 className="animate-spin" size={14} /> : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Initiate Refund Modal */}
      {isRefundModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <form onSubmit={handleInitiateRefund} className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <RotateCcw size={18} className="text-[#8CC63F]" />
                Initiate Wallet Refund
              </h3>
              <button type="button" onClick={() => setIsRefundModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Refund Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="e.g. 250.00"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-[#8CC63F] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Reason / Admin Note</label>
              <textarea
                rows={3}
                placeholder="Specify reason for issuing refund..."
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8CC63F] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRefundModalOpen(false)}
                className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl w-full"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={refundSubmitLoading}
                className="px-4 py-2.5 text-xs font-bold text-white bg-[#8CC63F] hover:bg-[#7ab52e] rounded-xl transition flex items-center justify-center gap-2 w-full shadow-md"
              >
                {refundSubmitLoading ? <Loader2 className="animate-spin" size={16} /> : 'Process Refund'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Image Lightbox Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h4 className="font-bold text-gray-900 text-sm">{previewImage.title}</h4>
              <button onClick={() => setPreviewImage(null)} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center overflow-auto max-h-[80vh] bg-gray-900">
              <img src={previewImage.url} alt={previewImage.title} className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-xl" />
            </div>
          </div>
        </div>
      )}

      {/* 1. Log Ticket / Complaint Modal */}
      {isCreateTicketModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <form onSubmit={handleCreateTicket} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 bg-gray-50/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gray-900 text-white flex items-center justify-center shadow-xs">
                  <LifeBuoy size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Log Ticket / Complaint</h3>
                  <p className="text-[11px] text-gray-500">Record a customer issue or helpdesk inquiry for {selectedUser?.name || 'this user'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateTicketModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-200/60 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Subject */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Subject / Issue Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Connector locked in socket or Refund pending for Session #..."
                  value={newTicketSubject}
                  onChange={(e) => setNewTicketSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:ring-2 focus:ring-gray-900 focus:outline-none transition"
                />
              </div>

              {/* Category & Priority Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Category</label>
                  <select
                    value={newTicketCategory}
                    onChange={(e) => setNewTicketCategory(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-gray-900 focus:outline-none transition bg-white"
                  >
                    <option value="Charging Issue">⚡ Charging Issue</option>
                    <option value="Payment Issue">💳 Payment Issue</option>
                    <option value="Refund Issue">🔄 Refund Issue</option>
                    <option value="App Issue">📱 App Issue</option>
                    <option value="Station Issue">⛽ Station Issue</option>
                    <option value="Hardware Issue">🔌 Hardware Issue</option>
                    <option value="Other">❓ Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Priority Level</label>
                  <select
                    value={newTicketPriority}
                    onChange={(e) => setNewTicketPriority(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-gray-900 focus:outline-none transition bg-white"
                  >
                    <option value="High">🔴 High (Urgent)</option>
                    <option value="Medium">🟡 Medium (Normal)</option>
                    <option value="Low">🔵 Low (Inquiry)</option>
                  </select>
                </div>
              </div>

              {/* Description / Initial Message */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Issue Description / Complaint Details
                </label>
                <textarea
                  rows={4}
                  placeholder="Provide complete breakdown: station location, charger ID, error codes, or customer statement..."
                  value={newTicketMessage}
                  onChange={(e) => setNewTicketMessage(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-gray-900 focus:outline-none transition"
                />
              </div>

              {/* Notice pill */}
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-start gap-2.5 text-blue-900">
                <AlertCircle size={15} className="text-blue-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  A unique Ticket ID (<span className="font-mono font-bold">TKT-YYYY-XXXX</span>) will be automatically generated and linked to this user's profile audit trail.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsCreateTicketModalOpen(false)}
                className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-200/70 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createTicketLoading}
                className="px-5 py-2.5 text-xs font-bold text-white bg-gray-900 hover:bg-black rounded-xl transition flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-60"
              >
                {createTicketLoading ? <Loader2 className="animate-spin" size={15} /> : <Plus size={15} />}
                <span>Create & Log Ticket</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Ticket Details & Conversation Thread Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/80 flex items-start justify-between gap-3 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-black text-sm text-gray-900 bg-white px-2.5 py-0.5 rounded-lg border border-gray-200 shadow-2xs">
                    {selectedTicket.ticketId}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    selectedTicket.priority === 'High' ? 'bg-rose-100 text-rose-800' :
                    selectedTicket.priority === 'Medium' ? 'bg-amber-100 text-amber-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {selectedTicket.priority}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">
                    {selectedTicket.category}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    selectedTicket.status === 'Open' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                    selectedTicket.status === 'In Progress' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    {selectedTicket.status}
                  </span>
                </div>
                <h3 className="text-base font-bold text-gray-900 leading-snug">{selectedTicket.subject}</h3>
                <p className="text-[11px] text-gray-500">
                  Opened on {formatDate(selectedTicket.createdAt)} for {selectedUser?.name || 'User'}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-200/60 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Quick Status Control Bar */}
            <div className="px-5 py-2.5 bg-gray-100/70 border-b border-gray-200 flex items-center justify-between text-xs gap-2 shrink-0 flex-wrap">
              <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Change Status:</span>
              <div className="flex items-center gap-1.5">
                {['Open', 'In Progress', 'Resolved', 'Closed'].map((st) => (
                  <button
                    key={st}
                    onClick={() => handleReplyTicket(selectedTicket._id, st)}
                    disabled={ticketReplyLoading || selectedTicket.status === st}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      selectedTicket.status === st
                        ? 'bg-gray-900 text-white shadow-xs'
                        : 'bg-white text-gray-700 hover:bg-gray-200/80 border border-gray-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Conversation Messages Thread */}
            <div className="p-5 space-y-3 overflow-y-auto flex-1 bg-gray-50/40">
              {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                selectedTicket.messages.map((m, idx) => {
                  const isAdmin = m.sender === 'Admin';
                  return (
                    <div
                      key={idx}
                      className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-2 mb-1 px-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isAdmin ? 'text-emerald-700 font-mono' : 'text-gray-600'}`}>
                          {isAdmin ? '🛡️ Staff Support' : (m.senderName || selectedUser?.name || 'Customer')}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {formatDate(m.createdAt || selectedTicket.createdAt)}
                        </span>
                      </div>
                      <div
                        className={`p-3.5 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                          isAdmin
                            ? 'bg-[#8CC63F]/15 border border-[#8CC63F]/30 text-gray-900 rounded-tr-none'
                            : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-2xs'
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 bg-white rounded-xl border border-gray-200 text-xs text-gray-600">
                  <p className="font-semibold text-gray-800 mb-1">Ticket Description:</p>
                  <p>{selectedTicket.description || 'No initial message text recorded.'}</p>
                </div>
              )}
            </div>

            {/* Reply Input Box */}
            <div className="p-4 border-t border-gray-200 bg-white space-y-2.5 shrink-0">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <MessageCircle size={14} className="text-[#8CC63F]" />
                  <span>Send Staff Response</span>
                </label>
                <span className="text-[11px] text-gray-400">Visible to customer</span>
              </div>
              <textarea
                rows={2}
                placeholder="Type your response to the user or note updates on resolution..."
                value={ticketReplyText}
                onChange={(e) => setTicketReplyText(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-[#8CC63F] focus:outline-none transition resize-none"
              />
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="text-[11px] text-gray-400">
                  Tip: Change status above or send a message directly.
                </div>
                <button
                  type="button"
                  onClick={() => handleReplyTicket(selectedTicket._id)}
                  disabled={ticketReplyLoading || !ticketReplyText.trim()}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#8CC63F] hover:bg-[#7ab52e] rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {ticketReplyLoading ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                  <span>Send Reply</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Reply to Feedback Modal */}
      {feedbackReplyModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <form onSubmit={handleReplyFeedback} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 bg-gray-50/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                  <Star size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Reply to User Review</h3>
                  <p className="text-[11px] text-gray-500">Respond directly to customer feedback</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFeedbackReplyModal({ isOpen: false, feedback: null, replyText: '' })}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-200/60 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content preview */}
            <div className="p-5 space-y-4">
              <div className="p-3.5 bg-amber-50/50 border border-amber-200/70 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span
                        key={s}
                        className={`text-xs ${
                          s <= (feedbackReplyModal.feedback?.rating || 0) ? 'text-amber-500' : 'text-gray-300'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                    <span className="ml-1 text-xs font-bold text-gray-800">
                      {feedbackReplyModal.feedback?.rating || 0}.0 Stars
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400">
                    {formatDate(feedbackReplyModal.feedback?.createdAt)}
                  </span>
                </div>
                {feedbackReplyModal.feedback?.title && (
                  <p className="text-xs font-bold text-gray-900">"{feedbackReplyModal.feedback.title}"</p>
                )}
                <p className="text-xs text-gray-700 italic bg-white/70 p-2.5 rounded-lg border border-amber-100">
                  "{feedbackReplyModal.feedback?.comment || 'No comment provided'}"
                </p>
              </div>

              {/* Reply Textarea */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Official Response <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Thank the user for feedback or explain corrective measures taken..."
                  value={feedbackReplyModal.replyText}
                  onChange={(e) => setFeedbackReplyModal({ ...feedbackReplyModal, replyText: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-[#8CC63F] focus:outline-none transition"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setFeedbackReplyModal({ isOpen: false, feedback: null, replyText: '' })}
                className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-200/70 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={feedbackReplyLoading}
                className="px-5 py-2.5 text-xs font-bold text-white bg-gray-900 hover:bg-black rounded-xl transition flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-60"
              >
                {feedbackReplyLoading ? <Loader2 className="animate-spin" size={15} /> : <CheckCircle size={15} />}
                <span>Publish Response</span>
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default UserManagementView;
