import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, RefreshCw, MapPin, Phone, User, Clock, CheckCircle, Loader2, X } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const STATUS_STYLES = {
  Pending:       { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  Assigned:      { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500' },
  'In Progress': { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
  Resolved:      { bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500' },
  Cancelled:     { bg: 'bg-gray-100',   text: 'text-gray-500',   dot: 'bg-gray-400' },
};

const StatCard = ({ label, value, color }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-1">
    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
    <span className={`text-2xl font-bold ${color}`}>{value}</span>
  </div>
);

const UpdateModal = ({ request, onClose, onUpdated }) => {
  const [status, setStatus] = useState(request.status);
  const [assignedTo, setAssignedTo] = useState(request.assignedTo || '');
  const [adminNote, setAdminNote] = useState(request.adminNote || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/emergency/admin/${request._id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, assignedTo, adminNote }),
      });
      const data = await res.json();
      if (data.success) { onUpdated(); onClose(); }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center p-5 border-b">
          <h3 className="font-bold text-gray-900 text-lg">Update Request</h3>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400">
              {['Pending', 'Assigned', 'In Progress', 'Resolved', 'Cancelled'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Assigned To</label>
            <input value={assignedTo} onChange={e => setAssignedTo(e.target.value)}
              placeholder="Agent name / team"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Note for User</label>
            <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)}
              rows={3} placeholder="e.g. Team dispatched, ETA 15 mins"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" />
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t">
          <button onClick={onClose} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
            Update
          </button>
        </div>
      </div>
    </div>
  );
};

const EmergencyManagementView = () => {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const params = filter !== 'All' ? `?status=${encodeURIComponent(filter)}` : '';
      const res = await fetch(`${API_BASE_URL}/emergency/admin/all${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) { setData(json.data); setStats(json.stats || {}); }
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const formatDate = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    return `${dt.getDate()}/${dt.getMonth() + 1}/${dt.getFullYear()} ${dt.getHours()}:${String(dt.getMinutes()).padStart(2, '0')}`;
  };

  const filters = ['All', 'Pending', 'Assigned', 'In Progress', 'Resolved', 'Cancelled'];

  return (
    <div className="flex flex-col h-full space-y-6 pb-6">
      {selected && <UpdateModal request={selected} onClose={() => setSelected(null)} onUpdated={fetchData} />}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Roadside Assistance</h1>
          <p className="text-gray-500 text-sm font-medium">Manage emergency SOS requests</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 shadow-sm">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Total" value={stats.total ?? 0} color="text-gray-900" />
        <StatCard label="Pending" value={stats.pending ?? 0} color="text-orange-600" />
        <StatCard label="Assigned" value={stats.assigned ?? 0} color="text-blue-600" />
        <StatCard label="In Progress" value={stats.inProgress ?? 0} color="text-purple-600" />
        <StatCard label="Resolved" value={stats.resolved ?? 0} color="text-green-600" />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filter === f ? 'bg-red-500 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-red-500" size={36} />
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <AlertTriangle size={48} className="mb-3 opacity-30" />
            <p className="font-medium">No emergency requests found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['User', 'Issue Type', 'Location', 'Status', 'Assigned To', 'Time', 'Action'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.map(req => {
                  const s = STATUS_STYLES[req.status] || STATUS_STYLES.Pending;
                  return (
                    <tr key={req._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                            <User size={14} className="text-red-500" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{req.user?.name || 'N/A'}</div>
                            <div className="text-xs text-gray-400 flex items-center gap-1">
                              <Phone size={10} /> {req.user?.mobile || ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-medium text-gray-800">{req.issueType}</span>
                        {req.description && (
                          <div className="text-xs text-gray-400 mt-0.5 max-w-[160px] truncate">{req.description}</div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <a href={`https://maps.google.com/?q=${req.location?.lat},${req.location?.lng}`}
                          target="_blank" rel="noreferrer"
                          className="flex items-center gap-1 text-xs text-blue-500 hover:underline font-medium">
                          <MapPin size={12} />
                          {req.location?.lat?.toFixed(4)}, {req.location?.lng?.toFixed(4)}
                        </a>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}></span>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">
                        {req.assignedTo || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock size={11} /> {formatDate(req.createdAt)}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {req.status !== 'Resolved' && req.status !== 'Cancelled' && (
                          <button onClick={() => setSelected(req)}
                            className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors">
                            Update
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmergencyManagementView;
