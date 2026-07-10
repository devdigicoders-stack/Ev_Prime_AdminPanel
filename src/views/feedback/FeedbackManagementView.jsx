import { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Star, Eye, EyeOff, Trash2, Reply, X, ChevronDown, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const API = import.meta.env.VITE_API_BASE_URL || 'https://e-bharatev-backend.onrender.com/api';

const TYPE_COLORS = {
  app: 'bg-green-100 text-green-700',
  station: 'bg-blue-100 text-blue-700',
  product: 'bg-purple-100 text-purple-700',
  support: 'bg-orange-100 text-orange-700',
};

export default function FeedbackManagementView() {
  const [feedback, setFeedback] = useState([]);
  const [stats, setStats] = useState({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: 'All', rating: '', page: 1 });
  const [replyModal, setReplyModal] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  const token = localStorage.getItem('adminToken');

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: filters.page, limit: 15 });
      if (filters.type !== 'All') params.set('type', filters.type);
      if (filters.rating) params.set('rating', filters.rating);
      const res = await fetch(`${API}/feedback/admin/all?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setFeedback(data.data);
        setTotal(data.total);
        setStats(data.stats || {});
      }
    } catch {
      toast.error('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  }, [filters, token]);

  useEffect(() => { fetchFeedback(); }, [fetchFeedback]);

  const toggleVisibility = async (id) => {
    try {
      const res = await fetch(`${API}/feedback/admin/${id}/visibility`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setFeedback(prev => prev.map(f => f._id === id ? { ...f, isPublic: data.data.isPublic } : f));
        toast.success(data.data.isPublic ? 'Feedback made public' : 'Feedback hidden');
      }
    } catch { toast.error('Failed'); }
  };

  const deleteFeedback = async (id) => {
    if (!window.confirm('Delete this feedback?')) return;
    try {
      await fetch(`${API}/feedback/admin/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setFeedback(prev => prev.filter(f => f._id !== id));
      setTotal(t => t - 1);
      toast.success('Deleted');
    } catch { toast.error('Failed'); }
  };

  const submitReply = async () => {
    if (!replyText.trim()) return;
    setReplyLoading(true);
    try {
      const res = await fetch(`${API}/feedback/admin/${replyModal.id}/reply`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ adminReply: replyText.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback(prev => prev.map(f => f._id === replyModal.id ? { ...f, adminReply: replyText.trim() } : f));
        toast.success('Reply sent!');
        setReplyModal(null);
        setReplyText('');
      }
    } catch { toast.error('Failed'); }
    finally { setReplyLoading(false); }
  };

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const statCards = [
    { label: 'Total Feedback', value: stats.total ?? 0, color: 'bg-blue-50 text-blue-600' },
    { label: 'Avg Rating', value: stats.avg ? Number(stats.avg).toFixed(1) + ' ★' : '0.0 ★', color: 'bg-yellow-50 text-yellow-600' },
    { label: 'App Reviews', value: stats.app ?? 0, color: 'bg-green-50 text-green-600' },
    { label: 'Station Reviews', value: stats.station ?? 0, color: 'bg-indigo-50 text-indigo-600' },
    { label: 'Product Reviews', value: stats.product ?? 0, color: 'bg-purple-50 text-purple-600' },
    { label: 'Support Reviews', value: stats.support ?? 0, color: 'bg-orange-50 text-orange-600' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feedback Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage user reviews and feedback</p>
        </div>
        <button onClick={fetchFeedback} className="flex items-center gap-2 px-4 py-2 bg-[#8CC63F] text-white rounded-xl text-sm font-semibold hover:bg-[#7ab535] transition-colors">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.color.split(' ')[1]}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="relative">
          <select
            value={filters.type}
            onChange={e => setFilters(f => ({ ...f, type: e.target.value, page: 1 }))}
            className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 font-medium focus:outline-none focus:ring-2 focus:ring-[#8CC63F]"
          >
            {['All', 'app', 'station', 'product', 'support'].map(t => (
              <option key={t} value={t}>{t === 'All' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2 top-3 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={filters.rating}
            onChange={e => setFilters(f => ({ ...f, rating: e.target.value, page: 1 }))}
            className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 font-medium focus:outline-none focus:ring-2 focus:ring-[#8CC63F]"
          >
            <option value="">All Ratings</option>
            {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} Star</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-2 top-3 text-gray-400 pointer-events-none" />
        </div>
        <span className="ml-auto text-sm text-gray-500 font-medium">{total} total results</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#8CC63F] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : feedback.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <MessageSquare size={48} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No feedback found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['User', 'Type', 'Rating', 'Feedback', 'Date', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {feedback.map((f) => (
                  <tr key={f._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">{f.user?.name || 'User'}</div>
                      <div className="text-xs text-gray-400">{f.user?.mobile || f.user?.email || ''}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${TYPE_COLORS[f.type] || 'bg-gray-100 text-gray-600'}`}>
                        {f.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 font-bold text-yellow-500">
                        <Star size={13} fill="currentColor" /> {f.rating}
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      {f.title && <div className="font-semibold text-gray-800 text-xs mb-0.5">{f.title}</div>}
                      <div className="text-gray-600 text-xs line-clamp-2">{f.comment}</div>
                      {f.adminReply && (
                        <div className="mt-1.5 p-2 bg-green-50 rounded-lg border border-green-100">
                          <span className="text-xs font-bold text-green-700">Admin: </span>
                          <span className="text-xs text-green-600 line-clamp-1">{f.adminReply}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{formatDate(f.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${f.isPublic ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {f.isPublic ? 'Public' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setReplyModal({ id: f._id }); setReplyText(f.adminReply || ''); }}
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                          title="Reply"
                        >
                          <Reply size={14} />
                        </button>
                        <button
                          onClick={() => toggleVisibility(f._id)}
                          className={`p-1.5 rounded-lg transition-colors ${f.isPublic ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                          title={f.isPublic ? 'Hide' : 'Show'}
                        >
                          {f.isPublic ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button
                          onClick={() => deleteFeedback(f._id)}
                          className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
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

      {/* Pagination */}
      {total > 15 && (
        <div className="flex items-center justify-center gap-3">
          <button
            disabled={filters.page === 1}
            onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
            className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500 font-medium">Page {filters.page} of {Math.ceil(total / 15)}</span>
          <button
            disabled={filters.page >= Math.ceil(total / 15)}
            onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
            className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Reply Modal */}
      {replyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Reply to Feedback</h3>
              <button onClick={() => setReplyModal(null)} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              rows={4}
              placeholder="Write your reply..."
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setReplyModal(null)}
                className="flex-1 py-2.5 text-sm font-bold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitReply}
                disabled={replyLoading || !replyText.trim()}
                className="flex-1 py-2.5 text-sm font-bold text-white bg-[#8CC63F] rounded-xl hover:bg-[#7ab535] disabled:opacity-50 transition-colors"
              >
                {replyLoading ? 'Sending...' : 'Send Reply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
