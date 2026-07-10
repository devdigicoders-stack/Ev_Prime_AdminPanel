import { useState, useEffect } from 'react';
import { Search, ChevronDown, Trash2, ChevronLeft, ChevronRight, Loader2, AlertCircle, X, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const UserManagementView = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // View Modal State
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

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
    const searchString = `${user.name} ${user.email} ${user.mobile}`.toLowerCase();
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
      
      await fetchUsers(); // Refresh the list
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      toast.success('User deleted successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to delete user');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle View User
  const handleView = async (user) => {
    setIsViewModalOpen(true);
    setViewLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/user/${user._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch user details');
      const data = await response.json();
      setSelectedUser(data);
    } catch (err) {
      toast.error(err.message || 'Failed to fetch user details');
      setIsViewModalOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  // Format Date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-GB', options);
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Header Area */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">App Users</h1>
        <p className="text-gray-500 text-sm font-medium">Manage all users registered via the App.</p>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col flex-1">
        
        {/* Toolbar */}
        <div className="p-4 sm:p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-gray-100">
          
          {/* Search */}
          <div className="relative w-full xl:max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name, email, or mobile..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-[#8CC63F] transition-all"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full xl:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto appearance-none bg-white border border-gray-200 rounded-xl pl-4 pr-10 py-2.5 text-sm text-gray-600 font-medium focus:outline-none focus:ring-2 focus:ring-[#8CC63F] hover:bg-gray-50 transition"
              >
                <option value="All">All Status</option>
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
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-20">
               <Loader2 className="animate-spin text-[#8CC63F]" size={32} />
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex items-center justify-center text-red-500 font-medium z-20">
               {error}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500 font-medium z-20">
               No users found matching the criteria.
            </div>
          ) : null}

          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="sticky top-0 bg-white z-10 shadow-sm">
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-white">User</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-white">Mobile</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-white">Email</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-white">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-white">Joined On</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center bg-white">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {!loading && paginatedUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3">
                    {user.profileImage ? (
                      <img src={user.profileImage.startsWith('http') ? user.profileImage : `${API_BASE_URL.replace('/api', '')}${user.profileImage}`} alt={user.name} className="w-8 h-8 rounded-full object-cover border border-gray-200" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#8CC63F]/20 text-[#8CC63F] flex items-center justify-center font-bold text-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">{user.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-600 whitespace-nowrap">{user.mobile || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-600 whitespace-nowrap">{user.email || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap capitalize ${
                      user.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 
                      user.status === 'blocked' ? 'bg-red-50 text-red-600 border border-red-200' :
                      'bg-gray-50 text-gray-600 border border-gray-200'
                    }`}>
                      {user.status || 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-600 whitespace-nowrap">{formatDate(user.createdAt)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => handleView(user)} className="text-gray-400 hover:text-blue-500 transition-colors p-1.5 rounded-lg hover:bg-blue-50">
                        <Eye size={18} strokeWidth={2.5} />
                      </button>
                      <button onClick={() => confirmDelete(user)} className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50">
                        <Trash2 size={18} strokeWidth={2.5} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Info */}
        {filteredUsers.length > 0 && (
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100 bg-white">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-600 font-medium w-full sm:w-auto justify-between sm:justify-start order-2 sm:order-1">
              <span className="whitespace-nowrap">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length}
              </span>
              <div className="relative ml-2 border-l border-gray-200 pl-2">
                <select 
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="appearance-none bg-transparent pl-2 pr-6 py-1 focus:outline-none cursor-pointer text-gray-700"
                >
                  <option value={5}>5 / page</option>
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                </select>
                <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-1 w-full sm:w-auto order-1 sm:order-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 text-gray-400 hover:text-gray-700 transition disabled:opacity-50"
              >
                <ChevronLeft size={18} />
              </button>
              
              <div className="flex items-center gap-1 max-w-[150px] sm:max-w-none overflow-x-auto no-scrollbar">
                {[...Array(totalPages)].map((_, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setCurrentPage(idx + 1)}
                    className={`min-w-[32px] h-8 flex items-center justify-center rounded-lg font-medium text-sm transition ${
                      currentPage === idx + 1 
                        ? 'bg-[#8CC63F] text-white font-semibold' 
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
                className="p-1.5 text-gray-400 hover:text-gray-700 transition disabled:opacity-50"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-2 text-red-500">
                <AlertCircle size={32} strokeWidth={2} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Delete User?</h2>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">
                Are you sure you want to permanently delete <strong className="text-gray-800">{userToDelete?.name}</strong>? This action cannot be undone and will remove all their app access.
              </p>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-center gap-3">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={deleteLoading}
                className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-200 bg-white border border-gray-200 rounded-xl transition-colors shadow-sm disabled:opacity-50 w-full"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                disabled={deleteLoading}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 w-full"
              >
                {deleteLoading ? <Loader2 className="animate-spin" size={16} /> : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View User Modal */}
      {isViewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 sticky top-0 z-10">
              <h2 className="text-lg font-bold text-gray-900">User Details</h2>
              <button 
                onClick={() => setIsViewModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-200 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar">
              {viewLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin text-[#8CC63F]" size={32} />
                </div>
              ) : selectedUser ? (
                <div className="space-y-8">
                  {/* User Profile Section */}
                  <div className="flex items-start gap-6">
                    {selectedUser.profileImage ? (
                      <img 
                        src={selectedUser.profileImage.startsWith('http') ? selectedUser.profileImage : `${API_BASE_URL.replace('/api', '')}${selectedUser.profileImage}`} 
                        alt={selectedUser.name} 
                        className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-md" 
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#8CC63F] to-[#7AB52E] text-white flex items-center justify-center font-bold text-3xl shadow-md border-4 border-white">
                        {selectedUser.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    
                    <div className="flex-1 space-y-1 mt-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-bold text-gray-900">{selectedUser.name}</h3>
                        <span className={`text-xs font-semibold px-3 py-1.5 rounded-full capitalize ${
                          selectedUser.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 
                          selectedUser.status === 'blocked' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {selectedUser.status || 'Active'}
                        </span>
                      </div>
                      <p className="text-gray-500 font-medium">{selectedUser.email || 'No email provided'}</p>
                      <p className="text-gray-500 font-medium">Mobile: <span className="text-gray-800">{selectedUser.mobile}</span></p>
                      <p className="text-gray-400 text-sm mt-2">Joined {formatDate(selectedUser.createdAt)}</p>
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  {/* Registered Vehicles Section */}
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a2 2 0 0 0-1.6-.8H8.3a2 2 0 0 0-1.6.8L4 11l-5.16.86a1 1 0 0 0-.84.99V16h3m10 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0ZM2 16a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z"/></svg>
                      </div>
                      Registered Vehicles
                    </h4>
                    
                    {selectedUser.vehicles && selectedUser.vehicles.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {selectedUser.vehicles.map(vehicle => (
                          <div key={vehicle._id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="text-sm text-gray-500 font-medium mb-0.5">{vehicle.brand}</p>
                                <h5 className="text-lg font-bold text-gray-900">{vehicle.model}</h5>
                              </div>
                              <div className="bg-gray-100 text-gray-600 text-xs font-bold px-2.5 py-1 rounded-md">
                                {vehicle.registrationNumber}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm font-medium text-gray-600 bg-gray-50 w-fit px-3 py-1.5 rounded-lg border border-gray-100">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#8CC63F]"><path d="M4 8h16"/><path d="M4 16h16"/></svg>
                              Connector: <span className="text-gray-900">{vehicle.connectorType}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-8 text-center">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a2 2 0 0 0-1.6-.8H8.3a2 2 0 0 0-1.6.8L4 11l-5.16.86a1 1 0 0 0-.84.99V16h3m10 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0ZM2 16a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z"/></svg>
                        </div>
                        <h5 className="text-base font-semibold text-gray-700 mb-1">No vehicles found</h5>
                        <p className="text-sm text-gray-500 font-medium">This user hasn't registered any vehicles yet.</p>
                      </div>
                    )}
                  </div>

                  <hr className="border-gray-100" />

                  {/* Wallet & Transactions Section */}
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-green-50 text-green-500 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
                      </div>
                      Wallet & Transactions
                    </h4>
                    
                    {selectedUser.wallet ? (
                      <div className="space-y-4">
                        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex justify-between items-center">
                          <div>
                            <p className="text-sm text-gray-500 font-medium mb-1">Current Balance</p>
                            <h5 className="text-2xl font-bold text-gray-900">₹{selectedUser.wallet.balance.toFixed(2)}</h5>
                          </div>
                          <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${selectedUser.wallet.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {selectedUser.wallet.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        {selectedUser.transactions && selectedUser.transactions.length > 0 ? (
                          <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
                              <h6 className="text-sm font-bold text-gray-700">Recent Transactions</h6>
                            </div>
                            <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto custom-scrollbar">
                              {selectedUser.transactions.map(txn => (
                                <div key={txn._id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${txn.type === 'CREDIT' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        {txn.type === 'CREDIT' ? <path d="M12 5v14M5 12l7-7 7 7"/> : <path d="M12 19V5M5 12l7 7 7-7"/>}
                                      </svg>
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-gray-900">{txn.description || txn.type}</p>
                                      <p className="text-xs text-gray-500 font-medium">{formatDate(txn.createdAt)}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className={`text-sm font-bold ${txn.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                                      {txn.type === 'CREDIT' ? '+' : '-'} ₹{txn.amount.toFixed(2)}
                                    </p>
                                    <p className={`text-[10px] font-bold px-2 py-0.5 mt-1 rounded-md inline-block ${txn.status === 'SUCCESS' ? 'bg-green-100 text-green-700' : txn.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                      {txn.status}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                            <p className="text-sm text-gray-500 font-medium">No transactions yet.</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-6 text-center">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm text-gray-400">
                           <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
                        </div>
                        <h5 className="text-sm font-semibold text-gray-700 mb-1">No Wallet Found</h5>
                        <p className="text-xs text-gray-500">This user hasn't activated their wallet yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">Failed to load user data.</div>
              )}
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementView;
