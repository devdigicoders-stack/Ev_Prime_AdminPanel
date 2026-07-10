import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, ShoppingBag, Loader2, X, CheckCircle, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const STATUS_STYLES = {
  Pending:   { bg: 'bg-orange-100', text: 'text-orange-700' },
  Confirmed: { bg: 'bg-blue-100',   text: 'text-blue-700' },
  Shipped:   { bg: 'bg-purple-100', text: 'text-purple-700' },
  Delivered: { bg: 'bg-green-100',  text: 'text-green-700' },
  Cancelled: { bg: 'bg-red-100',    text: 'text-red-500' },
};

const PAYMENT_STYLES = {
  wallet:   { bg: 'bg-violet-100', text: 'text-violet-700', label: 'Wallet' },
  razorpay: { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Razorpay' },
};

// ─── Update Modal ────────────────────────────────────────────────
const UpdateModal = ({ order, onClose, onUpdated }) => {
  const [status, setStatus] = useState(order.status);
  const [trackingId, setTrackingId] = useState(order.trackingId || '');
  const [adminNote, setAdminNote] = useState(order.adminNote || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/market/admin/orders/${order._id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, trackingId, adminNote }),
      });
      const data = await res.json();
      if (data.success) { toast.success('Order updated!'); onUpdated(); onClose(); }
      else toast.error(data.message || 'Failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center p-5 border-b">
          <h3 className="font-bold text-gray-900 text-lg">Update Order #{order.orderId}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wide">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F]">
              {['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wide">Tracking ID</label>
            <input value={trackingId} onChange={e => setTrackingId(e.target.value)} placeholder="e.g. DTDC123456789" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F]" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wide">Note for Customer</label>
            <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} rows={3} placeholder="e.g. Dispatched via DTDC, expected delivery in 3-5 days" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] resize-none" />
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t">
          <button onClick={onClose} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-[#8CC63F] hover:bg-[#7ab535] disabled:opacity-60 text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
            Update Order
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Order Detail Modal ──────────────────────────────────────────
const DetailModal = ({ order, onClose }) => {
  if (!order) return null;
  const s = STATUS_STYLES[order.status] || STATUS_STYLES.Pending;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-5 border-b sticky top-0 bg-white z-10">
          <h3 className="font-bold text-gray-900 text-lg">Order #{order.orderId}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {/* Status & Date */}
          <div className="flex items-center justify-between">
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${s.bg} ${s.text}`}>{order.status}</span>
            <span className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          </div>
          {/* Customer */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Customer</div>
            <div className="font-semibold text-gray-900">{order.user?.name || 'N/A'}</div>
            <div className="text-sm text-gray-500">{order.user?.mobile}</div>
            <div className="text-sm text-gray-500">{order.user?.email}</div>
          </div>
          {/* Items */}
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Items ({order.items?.length})</div>
            <div className="space-y-2">
              {order.items?.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  {item.image && <img src={item.image} className="w-10 h-10 rounded-lg object-cover" alt="" onError={e => e.target.style.display='none'} />}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{item.name}</div>
                    <div className="text-xs text-gray-500">Qty: {item.qty} × ₹{item.price}</div>
                  </div>
                  <div className="text-sm font-bold text-gray-900">₹{item.qty * item.price}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Payment & Total */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Payment Method</span>
              <span className="font-semibold capitalize">{order.paymentMethod}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Payment Status</span>
              <span className={`font-semibold ${order.paymentStatus === 'Paid' ? 'text-green-600' : 'text-red-500'}`}>{order.paymentStatus}</span>
            </div>
            <div className="border-t pt-2 flex justify-between">
              <span className="font-bold text-gray-900">Total Amount</span>
              <span className="font-bold text-[#8CC63F] text-lg">₹{order.totalAmount}</span>
            </div>
          </div>
          {/* Delivery */}
          {order.deliveryAddress && (
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Delivery Address</div>
              <div className="text-sm text-gray-700">{order.deliveryAddress}</div>
            </div>
          )}
          {/* Tracking */}
          {order.trackingId && (
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-1">Tracking ID</div>
              <div className="text-sm font-bold text-blue-700">{order.trackingId}</div>
            </div>
          )}
          {/* Admin Note */}
          {order.adminNote && (
            <div className="bg-yellow-50 rounded-xl p-4">
              <div className="text-xs font-semibold text-yellow-600 uppercase tracking-wide mb-1">Admin Note</div>
              <div className="text-sm text-yellow-800">{order.adminNote}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main View ───────────────────────────────────────────────────
const ITEMS_PER_PAGE = 10;

const OrderManagementView = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState(null);
  const [detailOrder, setDetailOrder] = useState(null);
  const [page, setPage] = useState(1);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const params = filter !== 'All' ? `?status=${encodeURIComponent(filter)}` : '';
      const res = await fetch(`${API_BASE_URL}/market/admin/orders${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) { setOrders(data.data); setStats(data.stats || {}); setPage(1); }
    } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const formatDate = (d) => {
    if (!d) return '—';
    const dt = new Date(d);
    return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Pagination
  const totalPages = Math.ceil(orders.length / ITEMS_PER_PAGE);
  const paginated = orders.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const statCards = [
    { label: 'Total Orders', value: stats.total ?? 0, color: 'text-gray-900', bg: 'bg-gray-50' },
    { label: 'Pending', value: stats.pending ?? 0, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Confirmed', value: stats.confirmed ?? 0, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Shipped', value: stats.shipped ?? 0, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Delivered', value: stats.delivered ?? 0, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Cancelled', value: stats.cancelled ?? 0, color: 'text-red-500', bg: 'bg-red-50' },
  ];

  return (
    <div className="space-y-5 pb-8">
      {selected && <UpdateModal order={selected} onClose={() => setSelected(null)} onUpdated={fetchOrders} />}
      {detailOrder && <DetailModal order={detailOrder} onClose={() => setDetailOrder(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-500 text-sm mt-0.5">{orders.length} total orders</p>
        </div>
        <button onClick={fetchOrders} className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 shadow-sm transition-colors">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} rounded-2xl border border-gray-100 p-4`}>
            <div className="text-xs font-semibold text-gray-500 mb-1 truncate">{label}</div>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Revenue Banner */}
      <div className="bg-gradient-to-r from-[#8CC63F] to-[#5a9e2f] rounded-2xl p-5 text-white flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold opacity-80">Total Revenue (Paid Orders)</div>
          <div className="text-3xl font-bold mt-1">₹{(stats.revenue ?? 0).toLocaleString('en-IN')}</div>
        </div>
        <ShoppingBag size={48} className="opacity-20" />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {['All', 'Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              filter === f
                ? 'bg-[#8CC63F] text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-[#8CC63F]" size={36} />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <ShoppingBag size={48} className="mb-3 opacity-30" />
            <p className="font-semibold text-gray-500">No orders found</p>
            <p className="text-sm mt-1">Try changing the filter</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-[120px]">Order ID</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-[160px]">Customer</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-[80px]">Items</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-[100px]">Total</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-[100px]">Payment</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-[110px]">Status</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-[100px]">Date</th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-[120px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.map(order => {
                    const s = STATUS_STYLES[order.status] || STATUS_STYLES.Pending;
                    const p = PAYMENT_STYLES[order.paymentMethod] || { bg: 'bg-gray-100', text: 'text-gray-600', label: order.paymentMethod };
                    return (
                      <tr key={order._id} className="hover:bg-gray-50/60 transition-colors">
                        {/* Order ID */}
                        <td className="px-4 py-3.5">
                          <span className="text-sm font-bold text-gray-900">{order.orderId || '—'}</span>
                        </td>
                        {/* Customer */}
                        <td className="px-4 py-3.5">
                          <div className="text-sm font-semibold text-gray-900 truncate max-w-[140px]">{order.user?.name || 'N/A'}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{order.user?.mobile || '—'}</div>
                        </td>
                        {/* Items */}
                        <td className="px-4 py-3.5">
                          <span className="text-sm text-gray-700 font-medium">{order.items?.length ?? 0}</span>
                        </td>
                        {/* Total */}
                        <td className="px-4 py-3.5">
                          <span className="text-sm font-bold text-gray-900">₹{(order.totalAmount ?? 0).toLocaleString('en-IN')}</span>
                        </td>
                        {/* Payment */}
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${p.bg} ${p.text}`}>
                            {p.label}
                          </span>
                        </td>
                        {/* Status */}
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
                            {order.status}
                          </span>
                        </td>
                        {/* Date */}
                        <td className="px-4 py-3.5">
                          <span className="text-xs text-gray-500">{formatDate(order.createdAt)}</span>
                        </td>
                        {/* Actions */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setDetailOrder(order)}
                              className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors"
                              title="View Details"
                            >
                              <Eye size={14} />
                            </button>
                            {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                              <button
                                onClick={() => setSelected(order)}
                                className="bg-[#8CC63F]/10 hover:bg-[#8CC63F]/20 text-[#5a9e2f] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
                              >
                                Update
                              </button>
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
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50/50">
                <p className="text-sm text-gray-500">
                  Showing <span className="font-semibold text-gray-700">{(page - 1) * ITEMS_PER_PAGE + 1}</span>–<span className="font-semibold text-gray-700">{Math.min(page * ITEMS_PER_PAGE, orders.length)}</span> of <span className="font-semibold text-gray-700">{orders.length}</span> orders
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} className="text-gray-600" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                    .reduce((acc, n, idx, arr) => {
                      if (idx > 0 && n - arr[idx - 1] > 1) acc.push('...');
                      acc.push(n);
                      return acc;
                    }, [])
                    .map((n, i) =>
                      n === '...' ? (
                        <span key={`dots-${i}`} className="px-2 text-gray-400 text-sm">…</span>
                      ) : (
                        <button
                          key={n}
                          onClick={() => setPage(n)}
                          className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${
                            page === n
                              ? 'bg-[#8CC63F] text-white shadow-sm'
                              : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {n}
                        </button>
                      )
                    )}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={16} className="text-gray-600" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OrderManagementView;
