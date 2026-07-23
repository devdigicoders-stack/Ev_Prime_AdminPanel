import { useState, useEffect } from 'react';
import { 
  Search, ChevronDown, Trash2, ChevronLeft, ChevronRight, Loader2, 
  AlertCircle, X, Eye, Lock, Unlock, ShieldAlert, CheckCircle2, XCircle, 
  Wallet, RotateCcw, Zap, User, Car, FileText, Leaf, Award, 
  ArrowUpRight, ArrowDownLeft, Calendar, Clock, DollarSign, AlertTriangle, ExternalLink, Square, Play
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const getMediaUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace('/api', '');
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

const UserManagementView = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Block/Unblock Modal State
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [userToBlock, setUserToBlock] = useState(null);
  const [blockLoading, setBlockLoading] = useState(false);

  // User Detail Drawer State
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
  }, []);

  // Filtered Data
  const filteredUsers = users.filter(user => {
    const searchString = `${user.name} ${user.email || ''} ${user.mobile || ''}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination Calculation
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Handle Delete User
  const confirmDelete = (user) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    
    setDeleteLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/user/${userToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete user');
      
      await fetchUsers();
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      toast.success('User deleted successfully');
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
          'Content-[#8CC63F]': 'application/json'
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
  const handleOpenDrawer = async (user) => {
    setSelectedUser(user);
    setIsDrawerOpen(true);
    setActiveTab('overview');
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
    } catch (err) {
      toast.error('Failed to fetch updated profile');
    } finally {
      setDrawerLoading(false);
    }
  };

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
      }
    } catch (err) {
      toast.error('Failed to fetch charging history');
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
        setWalletData(result.data || { wallet: null, transactions: [], refunds: [] });
      }
    } catch (err) {
      toast.error('Failed to fetch wallet information');
    } finally {
      setWalletLoading(false);
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
    } else if (activeTab === 'kyc') {
      fetchKYCData(selectedUser._id);
    } else if (activeTab === 'wallet') {
      fetchWalletData(selectedUser._id);
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

  const getMediaUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${API_BASE_URL.replace('/api', '')}${path}`;
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1 tracking-tight">App User Management</h1>
          <p className="text-gray-500 text-sm font-medium">Manage mobile app users, block access, review KYC, and issue wallet refunds.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 text-emerald-700 px-3.5 py-1.5 rounded-xl border border-emerald-200/60 text-xs font-bold flex items-center gap-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Total Users: {users.length}
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col flex-1">
        
        {/* Toolbar */}
        <div className="p-4 sm:p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-gray-100">
          
          {/* Search */}
          <div className="relative w-full xl:max-w-md">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name, email, or mobile number..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-[#8CC63F] transition-all placeholder:text-gray-400"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full xl:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto appearance-none bg-white border border-gray-200 rounded-xl pl-4 pr-10 py-2.5 text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#8CC63F] hover:bg-gray-50 transition cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="blocked">Blocked</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto w-full relative flex-1 min-h-[400px]">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-20 space-y-3">
               <Loader2 className="animate-spin text-[#8CC63F]" size={36} />
               <p className="text-sm font-medium text-gray-500">Loading user directory...</p>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 font-medium z-20 p-6">
               <AlertCircle size={36} className="mb-2" />
               <p>{error}</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 font-medium z-20 space-y-2">
               <User size={40} strokeWidth={1.5} className="text-gray-300" />
               <p>No users found matching your criteria.</p>
            </div>
          ) : null}

          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead className="sticky top-0 bg-gray-50/80 backdrop-blur-md z-10 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Mobile</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Tier</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Joined On</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {!loading && paginatedUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50/70 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {user.profileImage ? (
                        <img src={getMediaUrl(user.profileImage)} alt={user.name} className="w-9 h-9 rounded-full object-cover border border-gray-200 shadow-sm" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#8CC63F] to-[#74aa2f] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-semibold text-gray-900 group-hover:text-[#8CC63F] transition-colors">{user.name}</div>
                        <div className="text-xs text-gray-400 font-mono">ID: {user._id.slice(-6)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-700 font-mono">{user.mobile || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-600">{user.email || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                      <Award size={12} />
                      {user.tier || 'Silver'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full capitalize ${
                      user.status === 'blocked' ? 'bg-red-50 text-red-600 border border-red-200' :
                      user.status === 'inactive' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        user.status === 'blocked' ? 'bg-red-500' :
                        user.status === 'inactive' ? 'bg-amber-500' :
                        'bg-emerald-500'
                      }`}></span>
                      {user.status || 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-xs font-medium text-gray-500">{formatDate(user.createdAt)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* View Drawer Button */}
                      <button 
                        onClick={() => handleOpenDrawer(user)} 
                        title="View Full Profile & Drawer"
                        className="text-gray-500 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        <Eye size={17} strokeWidth={2} />
                      </button>

                      {/* Block / Unblock Toggle Button */}
                      {user.status === 'blocked' ? (
                        <button 
                          onClick={() => confirmBlockToggle(user)} 
                          title="Unblock User"
                          className="text-emerald-600 hover:text-emerald-700 p-2 rounded-lg hover:bg-emerald-50 transition-colors bg-emerald-50/50"
                        >
                          <Unlock size={17} strokeWidth={2} />
                        </button>
                      ) : (
                        <button 
                          onClick={() => confirmBlockToggle(user)} 
                          title="Block User"
                          className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Lock size={17} strokeWidth={2} />
                        </button>
                      )}

                      {/* Delete Button */}
                      <button 
                        onClick={() => confirmDelete(user)} 
                        title="Delete User"
                        className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={17} strokeWidth={2} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredUsers.length > 0 && (
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100 bg-white">
            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} entries
              <select 
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="ml-2 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#8CC63F] cursor-pointer"
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent transition"
              >
                <ChevronLeft size={16} />
              </button>
              
              <div className="flex items-center gap-1 max-w-[200px] overflow-x-auto no-scrollbar">
                {[...Array(totalPages)].map((_, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setCurrentPage(idx + 1)}
                    className={`w-8 h-8 flex items-center justify-center rounded-xl font-medium text-xs transition ${
                      currentPage === idx + 1 
                        ? 'bg-[#8CC63F] text-white font-bold shadow-sm' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
              <AlertCircle size={28} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Delete User Account?</h3>
              <p className="text-xs text-gray-500 font-medium mt-1">
                Are you sure you want to delete <strong className="text-gray-800">{userToDelete?.name}</strong>? This operation is permanent.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={deleteLoading}
                className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 border border-gray-200 rounded-xl transition w-full"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                disabled={deleteLoading}
                className="px-4 py-2.5 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition flex items-center justify-center gap-2 w-full"
              >
                {deleteLoading ? <Loader2 className="animate-spin" size={14} /> : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block / Unblock Modal */}
      {isBlockModalOpen && userToBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center space-y-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${
              userToBlock.status === 'blocked' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
            }`}>
              {userToBlock.status === 'blocked' ? <Unlock size={28} /> : <ShieldAlert size={28} />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {userToBlock.status === 'blocked' ? 'Unblock User Account?' : 'Block User Account?'}
              </h3>
              <p className="text-xs text-gray-500 font-medium mt-1">
                {userToBlock.status === 'blocked' ? (
                  <>Unblocking <strong className="text-gray-800">{userToBlock.name}</strong> will restore their app login and charging privileges.</>
                ) : (
                  <>Blocking <strong className="text-gray-800">{userToBlock.name}</strong> will immediately prevent them from logging in or starting charging sessions.</>
                )}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button 
                onClick={() => setIsBlockModalOpen(false)}
                disabled={blockLoading}
                className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 border border-gray-200 rounded-xl transition w-full"
              >
                Cancel
              </button>
              <button 
                onClick={handleBlockToggle}
                disabled={blockLoading}
                className={`px-4 py-2.5 text-xs font-bold text-white rounded-xl transition flex items-center justify-center gap-2 w-full ${
                  userToBlock.status === 'blocked' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {blockLoading ? <Loader2 className="animate-spin" size={14} /> : (userToBlock.status === 'blocked' ? 'Unblock User' : 'Block User')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ENHANCED USER DETAIL DRAWER */}
      {isDrawerOpen && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-gray-900/50 backdrop-blur-xs animate-in fade-in duration-300">
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-3xl bg-white shadow-2xl flex flex-col h-full transform transition-transform duration-300">
              
              {/* Drawer Header */}
              <div className="p-6 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-between border-b border-gray-800 relative">
                <div className="flex items-center gap-4">
                  {selectedUser.profileImage ? (
                    <img src={getMediaUrl(selectedUser.profileImage)} alt={selectedUser.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-white/20 shadow-md" />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#8CC63F] to-emerald-400 text-white flex items-center justify-center font-bold text-2xl shadow-md border-2 border-white/20">
                      {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold tracking-tight">{selectedUser.name}</h2>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                        selectedUser.status === 'blocked' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                        'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {selectedUser.status || 'Active'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 font-mono mt-1">{selectedUser.mobile} • {selectedUser.email || 'No email'}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Joined {formatDate(selectedUser.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => confirmBlockToggle(selectedUser)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                      selectedUser.status === 'blocked' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40'
                    }`}
                  >
                    {selectedUser.status === 'blocked' ? <Unlock size={14} /> : <Lock size={14} />}
                    {selectedUser.status === 'blocked' ? 'Unblock' : 'Block'}
                  </button>
                  <button 
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition"
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
                  { id: 'kyc', label: 'KYC Document', icon: FileText },
                  { id: 'wallet', label: 'Wallet & Refunds', icon: Wallet },
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
                      {tab.label}
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
                              <Zap size={16} />
                              <span className="text-[11px] font-bold text-gray-400 uppercase">Energy</span>
                            </div>
                            <div className="text-lg font-bold text-gray-900">{selectedUser.totalEnergyConsumedKwh || 0} kWh</div>
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

                        {/* Referrals & Info */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
                          <h4 className="text-sm font-bold text-gray-900 mb-2">Account Meta Details</h4>
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <span className="text-gray-400 block font-medium">Referral Code</span>
                              <span className="font-mono font-bold text-gray-800">{selectedUser.referralCode || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-gray-400 block font-medium">Account Tier</span>
                              <span className="font-bold text-amber-600">{selectedUser.tier || 'Silver'}</span>
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
                          <span className="text-xs text-gray-400 font-medium">{chargingHistory.length} Sessions Total</span>
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
                          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <table className="w-full text-left border-collapse">
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

                    {/* TAB 3: KYC DOCUMENT VERIFICATION */}
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

                              {/* Actions */}
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleUpdateKYC('verified')}
                                  disabled={kycActionLoading || kycData?.status === 'verified'}
                                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
                                >
                                  <CheckCircle2 size={14} /> Approve KYC
                                </button>
                                <button
                                  onClick={() => setIsRejectionModalOpen(true)}
                                  disabled={kycActionLoading || kycData?.status === 'rejected'}
                                  className="px-3.5 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
                                >
                                  <XCircle size={14} /> Reject
                                </button>
                              </div>
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
                          <div className="py-12 text-center text-gray-400">
                            <Loader2 className="animate-spin mx-auto text-[#8CC63F] mb-2" size={24} />
                            <p className="text-xs font-medium">Loading wallet balance...</p>
                          </div>
                        ) : (
                          <>
                            {/* Wallet Balance Hero Card */}
                            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="relative z-10 space-y-1">
                                <div className="text-xs text-gray-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
                                  <Wallet size={14} className="text-[#8CC63F]" />
                                  Current Wallet Balance
                                </div>
                                <div className="text-3xl font-extrabold tracking-tight text-white">
                                  ₹{(walletData.wallet?.balance || 0).toFixed(2)}
                                </div>
                                <div className="text-[11px] text-gray-400">
                                  Currency: INR (₹) • Wallet ID: {walletData.wallet?._id ? walletData.wallet._id.slice(-8) : 'N/A'}
                                </div>
                              </div>

                              <button
                                onClick={() => setIsRefundModalOpen(true)}
                                className="relative z-10 px-4 py-2.5 bg-[#8CC63F] hover:bg-[#7db534] text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg hover:shadow-xl cursor-pointer"
                              >
                                <RotateCcw size={15} />
                                Initiate Refund
                              </button>
                            </div>

                            {/* Transactions Timeline */}
                            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
                              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                <ArrowUpRight size={16} className="text-emerald-500" />
                                Transaction History ({walletData.transactions?.length || 0})
                              </h4>

                              {walletData.transactions && walletData.transactions.length > 0 ? (
                                <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto custom-scrollbar">
                                  {walletData.transactions.map((txn) => (
                                    <div key={txn._id} className="py-3 flex items-center justify-between hover:bg-gray-50/50 px-2 rounded-lg transition">
                                      <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                          txn.type === 'CREDIT' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                                        }`}>
                                          {txn.type === 'CREDIT' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                                        </div>
                                        <div>
                                          <div className="text-xs font-bold text-gray-900">{txn.description || 'Wallet Transaction'}</div>
                                          <div className="text-[10px] text-gray-400 font-mono">{formatDate(txn.createdAt)}</div>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className={`text-xs font-bold ${txn.type === 'CREDIT' ? 'text-emerald-600' : 'text-red-500'}`}>
                                          {txn.type === 'CREDIT' ? '+' : '-'} ₹{txn.amount?.toFixed(2)}
                                        </div>
                                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-gray-100 text-gray-600">
                                          {txn.status}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-gray-400 italic">No wallet transactions recorded yet.</p>
                              )}
                            </div>

                            {/* Refund Records */}
                            {walletData.refunds && walletData.refunds.length > 0 && (
                              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
                                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                                  Refund Log ({walletData.refunds.length})
                                </h4>
                                <div className="divide-y divide-gray-100">
                                  {walletData.refunds.map((ref) => (
                                    <div key={ref._id} className="py-2.5 flex items-center justify-between text-xs">
                                      <div>
                                        <div className="font-bold text-gray-800">{ref.reason}</div>
                                        <div className="text-[10px] text-gray-400 font-mono">ID: {ref.refundId} • {formatDate(ref.createdAt)}</div>
                                      </div>
                                      <div className="text-right">
                                        <div className="font-bold text-emerald-600">+ ₹{ref.amount?.toFixed(2)}</div>
                                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                                          {ref.status}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
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

    </div>
  );
};

export default UserManagementView;
