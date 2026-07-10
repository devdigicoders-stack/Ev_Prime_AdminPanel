import { useState, useEffect, useCallback } from 'react';
import { Search, ChevronDown, ChevronLeft, ChevronRight, Loader2, Eye, CheckCircle, XCircle, RefreshCw, ClipboardList, Zap, IndianRupee, CalendarCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const STATUS_COLORS = {
  Confirmed: { bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500' },
  Completed: { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  Cancelled: { bg: 'bg-red-50', text: 'text-red-500', dot: 'bg-red-500' },
  'No Show': { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' },
};

const PAYMENT_COLORS = {
  Paid: 'text-emerald-600',
  Pending: 'text-amber-500',
  Failed: 'text-red-500',
  Refunded: 'text-purple-500',
};

const StatCard = ({ label, value, icon: Icon, iconBg, iconColor }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between hover:shadow-md hover:border-emerald-100 transition-all group overflow-hidden relative">
    <div className="flex flex-col z-10">
      <span className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-1.5">{label}</span>
      <span className="text-2xl font-bold text-gray-900">{value}</span>
    </div>
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 z-10 ${iconBg} ${iconColor}`}>
      <Icon size={20} strokeWidth={2} />
    </div>
    <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-50/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
  </div>
);

const BookingManagementView = () => {
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        ...(statusFilter !== 'All' && { status: statusFilter }),
        ...(search && { search }),
      });
      const res = await fetch(`${API_BASE_URL}/booking/admin/all?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch bookings');
      const data = await res.json();
      setBookings(data.data || []);
      setStats(data.stats || {});
      setTotal(data.total || 0);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, statusFilter, search]);

  useEffect(() => {
    const timer = setTimeout(fetchBookings, 300);
    return () => clearTimeout(timer);
  }, [fetchBookings]);

  useEffect(() => { setCurrentPage(1); }, [search, statusFilter]);

  const updateStatus = async (id, status) => {
    setActionLoading(id);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/booking/admin/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      const updated = await res.json();
      toast.success(`Booking marked as ${status}`);
      fetchBookings();
      if (selectedBooking?._id === id) setSelectedBooking(updated.data ?? { ...selectedBooking, status });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = Math.ceil(total / itemsPerPage);

  return (
    <div className="flex flex-col space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Booking Management</h1>
        <p className="text-gray-500 text-sm font-medium">Manage all EV charging bookings in real-time.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Bookings" value={stats.total ?? 0} icon={ClipboardList} iconBg="bg-blue-50" iconColor="text-blue-600" />
        <StatCard label="Confirmed" value={stats.confirmed ?? 0} icon={CalendarCheck} iconBg="bg-indigo-50" iconColor="text-indigo-600" />
        <StatCard label="Completed" value={stats.completed ?? 0} icon={Zap} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <StatCard label="Cancelled" value={stats.cancelled ?? 0} icon={XCircle} iconBg="bg-red-50" iconColor="text-red-500" />
        <StatCard label="Revenue" value={`₹${(stats.totalRevenue ?? 0).toLocaleString('en-IN')}`} icon={IndianRupee} iconBg="bg-amber-50" iconColor="text-amber-600" />
      </div>

      <div className="flex gap-6">
        {/* Main Table */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col min-w-0">
          {/* Toolbar */}
          <div className="p-4 sm:p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-gray-100">
            <div className="relative w-full xl:max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by ID, user, station..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F]"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 rounded-xl pl-4 pr-9 py-2.5 text-sm text-gray-600 font-medium focus:outline-none focus:ring-2 focus:ring-[#8CC63F]"
                >
                  {['All', 'Confirmed', 'Completed', 'Cancelled', 'No Show'].map(s => (
                    <option key={s} value={s}>{s === 'All' ? 'All Status' : s}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              <button
                onClick={fetchBookings}
                className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition text-gray-500"
                title="Refresh"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-auto flex-1 min-h-[400px] relative">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-20">
                <Loader2 className="animate-spin text-[#8CC63F]" size={32} />
              </div>
            )}
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead className="sticky top-0 bg-white z-10 shadow-sm">
                <tr className="border-b border-gray-100">
                  {['Booking ID', 'User', 'Station', 'Date & Time', 'Amount', 'Payment', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap bg-white">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {!loading && bookings.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-gray-400 font-medium">
                      No bookings found
                    </td>
                  </tr>
                )}
                {!loading && bookings.map((b) => {
                  const sc = STATUS_COLORS[b.status] || STATUS_COLORS.Confirmed;
                  return (
                    <tr key={b._id} className={`hover:bg-gray-50/50 transition-colors ${selectedBooking?._id === b._id ? 'bg-emerald-50/30' : ''}`}>
                      <td className="px-5 py-4">
                        <span className="text-sm font-bold text-gray-800">#{b.bookingId}</span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-gray-800 whitespace-nowrap">{b.user?.name || 'N/A'}</p>
                        <p className="text-xs text-gray-400">{b.user?.mobile || ''}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-gray-800 whitespace-nowrap">{b.station?.name || 'N/A'}</p>
                        <p className="text-xs text-gray-400">{b.station?.city || ''}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-gray-700 whitespace-nowrap">{b.scheduledDate}</p>
                        <p className="text-xs text-gray-400">{b.scheduledTime}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-bold text-gray-800">₹{b.estimatedCost?.toLocaleString('en-IN')}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-sm font-semibold ${PAYMENT_COLORS[b.paymentStatus] || 'text-gray-600'}`}>
                          {b.paymentStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${sc.bg} ${sc.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}></span>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedBooking(b)}
                            className="p-1.5 text-gray-400 hover:text-[#8CC63F] hover:bg-emerald-50 rounded-lg transition"
                            title="View Details"
                          >
                            <Eye size={15} />
                          </button>
                          {b.status === 'Confirmed' && (
                            <>
                              <button
                                onClick={() => updateStatus(b._id, 'Completed')}
                                disabled={actionLoading === b._id}
                                className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition disabled:opacity-40"
                                title="Mark Completed"
                              >
                                {actionLoading === b._id
                                  ? <Loader2 size={15} className="animate-spin" />
                                  : <CheckCircle size={15} />}
                              </button>
                              <button
                                onClick={() => updateStatus(b._id, 'Cancelled')}
                                disabled={actionLoading === b._id}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-40"
                                title="Cancel Booking"
                              >
                                <XCircle size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > 0 && (
            <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100 bg-white">
              <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                <span>
                  Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, total)} of {total}
                </span>
                <div className="relative ml-2 border-l border-gray-200 pl-2">
                  <select
                    value={itemsPerPage}
                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className="appearance-none bg-transparent pl-2 pr-6 py-1 focus:outline-none cursor-pointer text-gray-700"
                  >
                    {[10, 20, 50].map(n => <option key={n} value={n}>{n}/page</option>)}
                  </select>
                  <ChevronDown size={12} className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-40 transition"
                >
                  <ChevronLeft size={18} />
                </button>
                {[...Array(Math.min(totalPages, 7))].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`min-w-[32px] h-8 rounded-lg text-sm font-medium transition ${
                      currentPage === i + 1 ? 'bg-[#8CC63F] text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-40 transition"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Detail Side Panel */}
        {selectedBooking && (
          <div className="w-72 xl:w-80 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4 h-fit sticky top-0 shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-base">Booking Details</h3>
              <button
                onClick={() => setSelectedBooking(null)}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-sm">
              {[
                ['Booking ID', `#${selectedBooking.bookingId}`],
                ['User', selectedBooking.user?.name],
                ['Mobile', selectedBooking.user?.mobile],
                ['Email', selectedBooking.user?.email],
              ].map(([l, v]) => v && (
                <div key={l} className="flex justify-between gap-2">
                  <span className="text-gray-400 shrink-0">{l}</span>
                  <span className="font-semibold text-gray-800 text-right">{v}</span>
                </div>
              ))}

              <hr className="border-gray-100 my-1" />

              {[
                ['Station', selectedBooking.station?.name],
                ['City', selectedBooking.station?.city],
                ['Date', selectedBooking.scheduledDate],
                ['Time', selectedBooking.scheduledTime],
                ['Connector', selectedBooking.connectorType],
                ['Power', selectedBooking.connectorPower],
                ['Charge Upto', `${selectedBooking.chargeUpTo}%`],
                ['Est. Energy', `${selectedBooking.estimatedEnergy} kWh`],
                ['Est. Time', `${selectedBooking.estimatedTime} min`],
              ].map(([l, v]) => v && (
                <div key={l} className="flex justify-between gap-2">
                  <span className="text-gray-400 shrink-0">{l}</span>
                  <span className="font-semibold text-gray-800 text-right">{v}</span>
                </div>
              ))}

              <hr className="border-gray-100 my-1" />

              <div className="flex justify-between gap-2">
                <span className="text-gray-400">Amount</span>
                <span className="font-bold text-gray-900">₹{selectedBooking.estimatedCost?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-gray-400">Payment</span>
                <span className={`font-semibold ${PAYMENT_COLORS[selectedBooking.paymentStatus] || ''}`}>
                  {selectedBooking.paymentStatus}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-gray-400">Method</span>
                <span className="font-semibold capitalize">{selectedBooking.paymentMethod}</span>
              </div>

              {selectedBooking.pin && (
                <div className="flex justify-between gap-2">
                  <span className="text-gray-400">PIN</span>
                  <span className="font-bold tracking-[0.3em] text-gray-900">{selectedBooking.pin}</span>
                </div>
              )}

              {selectedBooking.cancellationReason && (
                <div className="flex justify-between gap-2">
                  <span className="text-gray-400 shrink-0">Cancel Reason</span>
                  <span className="font-semibold text-right text-gray-700">{selectedBooking.cancellationReason}</span>
                </div>
              )}

              {selectedBooking.refundAmount > 0 && (
                <div className="flex justify-between gap-2">
                  <span className="text-gray-400">Refund</span>
                  <span className="font-bold text-purple-600">₹{selectedBooking.refundAmount?.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between gap-2">
                <span className="text-gray-400">Status</span>
                <span className={`font-bold ${STATUS_COLORS[selectedBooking.status]?.text || 'text-gray-700'}`}>
                  {selectedBooking.status}
                </span>
              </div>
            </div>

            {selectedBooking.status === 'Confirmed' && (
              <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => updateStatus(selectedBooking._id, 'Completed')}
                  disabled={actionLoading === selectedBooking._id}
                  className="w-full py-2.5 bg-emerald-500 text-white rounded-xl font-semibold text-sm hover:bg-emerald-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading === selectedBooking._id
                    ? <Loader2 size={16} className="animate-spin" />
                    : <CheckCircle size={16} />}
                  Mark Completed
                </button>
                <button
                  onClick={() => updateStatus(selectedBooking._id, 'Cancelled')}
                  disabled={actionLoading === selectedBooking._id}
                  className="w-full py-2.5 bg-red-50 text-red-500 border border-red-200 rounded-xl font-semibold text-sm hover:bg-red-100 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <XCircle size={16} />
                  Cancel Booking
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingManagementView;
