import { useState, useEffect } from 'react';
import { Search, ChevronDown, Eye, ChevronLeft, ChevronRight, Loader2, X, AlertCircle, Trash2, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const getStatusColor = (status) => {
  switch (status) {
    case 'Approved':
      return 'text-emerald-500 bg-emerald-50 border border-emerald-200';
    case 'Pending':
      return 'text-amber-500 bg-amber-50 border border-amber-200';
    case 'Rejected':
      return 'text-red-500 bg-red-50 border border-red-200';
    default:
      return 'text-gray-500 bg-gray-50 border border-gray-200';
  }
};

const RefundManagementView = () => {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal States
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Fetch Refunds
  const fetchRefunds = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/refund`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch refunds');
      const data = await response.json();
      setRefunds(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, []);

  // Filtered Data
  const filteredRefunds = refunds.filter(refund => {
    const searchString = `${refund.refundId} ${refund.user?.name || refund.user} ${refund.booking?.bookingId || ''}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || refund.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination Calculation
  const totalPages = Math.ceil(filteredRefunds.length / itemsPerPage);
  const paginatedRefunds = filteredRefunds.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Format Date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-GB', options);
  };

  // Actions
  const handleUpdateStatus = async (status) => {
    if (!selectedRefund) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/refund/${selectedRefund._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) throw new Error('Failed to update refund status');
      
      toast.success('Refund status updated successfully');
      await fetchRefunds();
      setIsViewModalOpen(false);
      setSelectedRefund(null);
    } catch (err) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRefund) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/refund/${selectedRefund._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete refund');
      
      toast.success('Refund deleted successfully');
      await fetchRefunds();
      setIsDeleteModalOpen(false);
      setSelectedRefund(null);
    } catch (err) {
      toast.error(err.message || 'Failed to delete refund');
    } finally {
      setActionLoading(false);
    }
  };

  const openViewModal = (refund) => {
    setSelectedRefund(refund);
    setIsViewModalOpen(true);
  };

  const confirmDelete = (refund) => {
    setSelectedRefund(refund);
    setIsDeleteModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Header Area */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Refund Management</h1>
        <p className="text-gray-500 text-sm font-medium">Manage and review all refund requests.</p>
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
              placeholder="Search by Refund ID or User..." 
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
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
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
          ) : filteredRefunds.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500 font-medium z-20">
               No refunds found matching the criteria.
            </div>
          ) : null}

          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="sticky top-0 bg-white z-10 shadow-sm">
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-white">Refund ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-white">User</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-white">Amount</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-white">Reason</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-white">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-white">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center bg-white">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {!loading && paginatedRefunds.map((refund) => (
                <tr key={refund._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-gray-800">{refund.refundId}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-600">{refund.user?.name || refund.user}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-gray-800">₹{refund.amount?.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-600">{refund.reason}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${getStatusColor(refund.status)}`}>
                      {refund.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-600">{formatDate(refund.createdAt)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => openViewModal(refund)} className="text-gray-400 hover:text-emerald-600 transition-colors p-1.5 rounded-lg hover:bg-emerald-50" title="Review">
                        <Eye size={18} strokeWidth={2.5} />
                      </button>
                      <button onClick={() => confirmDelete(refund)} className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50" title="Delete">
                        <Trash2 size={18} strokeWidth={2.5} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredRefunds.length > 0 && (
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100 bg-white">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-600 font-medium w-full sm:w-auto justify-between sm:justify-start order-2 sm:order-1">
              <span className="whitespace-nowrap">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredRefunds.length)} of {filteredRefunds.length}
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

      {/* Review Refund Modal */}
      {isViewModalOpen && selectedRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="text-lg font-semibold text-gray-900">Review Refund Request</h2>
              <button 
                onClick={() => setIsViewModalOpen(false)}
                className="text-gray-400 hover:bg-gray-100 hover:text-gray-600 p-1.5 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-sm text-gray-500 font-medium">Refund ID</span>
                  <span className="text-sm font-semibold text-gray-900">{selectedRefund.refundId}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-sm text-gray-500 font-medium">Booking ID</span>
                  <span className="text-sm font-semibold text-gray-900">{selectedRefund.booking?.bookingId || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-sm text-gray-500 font-medium">User</span>
                  <span className="text-sm font-semibold text-gray-900">{selectedRefund.user?.name || selectedRefund.user}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-sm text-gray-500 font-medium">Amount</span>
                  <span className="text-lg font-bold text-gray-900">₹{selectedRefund.amount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-sm text-gray-500 font-medium">Reason</span>
                  <span className="text-sm font-medium text-gray-800">{selectedRefund.reason}</span>
                </div>
                
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-sm text-gray-500 font-medium">Destination</span>
                  <span className="text-sm font-bold text-gray-800 capitalize">
                    {selectedRefund.refundDestination === 'bank_transfer' ? 'Bank Transfer' : 
                     selectedRefund.refundDestination === 'upi' ? 'UPI' : 'Wallet'}
                  </span>
                </div>

                {selectedRefund.refundDestination === 'bank_transfer' && selectedRefund.bankDetails && (
                  <div className="pb-3 border-b border-gray-200 space-y-2">
                    <span className="text-sm text-gray-500 font-medium block">Bank Details</span>
                    <div className="bg-white p-3 rounded-lg border border-gray-100 space-y-1">
                      <div className="flex justify-between"><span className="text-xs text-gray-500">Name</span><span className="text-xs font-semibold">{selectedRefund.bankDetails.accountName}</span></div>
                      <div className="flex justify-between"><span className="text-xs text-gray-500">A/C No</span><span className="text-xs font-semibold">{selectedRefund.bankDetails.accountNumber}</span></div>
                      <div className="flex justify-between"><span className="text-xs text-gray-500">IFSC</span><span className="text-xs font-semibold">{selectedRefund.bankDetails.ifsc}</span></div>
                    </div>
                  </div>
                )}

                {selectedRefund.refundDestination === 'upi' && selectedRefund.upiDetails && (
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <span className="text-sm text-gray-500 font-medium">UPI ID</span>
                    <span className="text-sm font-semibold text-gray-800">{selectedRefund.upiDetails.upiId}</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 font-medium">Current Status</span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${getStatusColor(selectedRefund.status)}`}>
                    {selectedRefund.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3 rounded-b-2xl">
              <button 
                onClick={() => setIsViewModalOpen(false)}
                disabled={actionLoading}
                className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-200 bg-white border border-gray-200 rounded-xl transition-colors shadow-sm disabled:opacity-50"
              >
                Close
              </button>
              {selectedRefund.status === 'Pending' && (
                <>
                  <button 
                    onClick={() => handleUpdateStatus('Rejected')}
                    disabled={actionLoading}
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    {actionLoading ? <Loader2 className="animate-spin" size={16} /> : <XCircle size={18} />}
                    Reject
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus('Approved')}
                    disabled={actionLoading}
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-[#8CC63F] hover:bg-[#116631] rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    {actionLoading ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={18} />}
                    Approve
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-2 text-red-500">
                <AlertCircle size={32} strokeWidth={2} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Delete Refund Record?</h2>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">
                Are you sure you want to delete the record for <strong className="text-gray-800">{selectedRefund?.refundId}</strong>? This action cannot be undone.
              </p>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-center gap-3">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={actionLoading}
                className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-200 bg-white border border-gray-200 rounded-xl transition-colors shadow-sm disabled:opacity-50 w-full"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                disabled={actionLoading}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 w-full"
              >
                {actionLoading ? <Loader2 className="animate-spin" size={16} /> : 'Delete Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RefundManagementView;
