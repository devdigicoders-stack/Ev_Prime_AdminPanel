import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, X, RefreshCw, Zap, Clock, IndianRupee, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const CONNECTOR_TYPES = ['CCS2', 'CHAdeMO', 'Type2', 'AC Type1', 'GB/T', 'Bharat AC', 'Bharat DC'];

const defaultForm = {
  scope: 'global',
  stationId: '',
  name: '',
  description: '',
  basePricePerUnit: 18,
  connectorPrices: [],
  peakHours: [],
  sessionFee: 0,
  gstPercent: 18,
  minChargeAmount: 10,
  isActive: true,
};

export default function PricingManagementView() {
  const [pricings, setPricings] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem('adminToken');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, sRes] = await Promise.all([
        fetch(`${API}/pricing/admin/all`, { headers }),
        fetch(`${API}/station`, { headers }),
      ]);
      const pData = await pRes.json();
      const sData = await sRes.json();
      if (pData.success) setPricings(pData.data);
      if (sData.data || Array.isArray(sData)) setStations(Array.isArray(sData) ? sData : sData.data || []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openCreate = () => { setEditItem(null); setForm(defaultForm); setShowModal(true); };
  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      scope: item.scope,
      stationId: item.station?._id || '',
      name: item.name,
      description: item.description || '',
      basePricePerUnit: item.basePricePerUnit,
      connectorPrices: item.connectorPrices || [],
      peakHours: item.peakHours || [],
      sessionFee: item.sessionFee || 0,
      gstPercent: item.gstPercent ?? 18,
      minChargeAmount: item.minChargeAmount || 10,
      isActive: item.isActive,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Name is required');
    if (!form.basePricePerUnit) return toast.error('Base price is required');
    setSaving(true);
    try {
      const url = editItem ? `${API}/pricing/admin/${editItem._id}` : `${API}/pricing/admin`;
      const method = editItem ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editItem ? 'Updated!' : 'Created!');
        setShowModal(false);
        fetchAll();
      } else toast.error(data.message || 'Failed');
    } catch { toast.error('Network error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this pricing config?')) return;
    try {
      await fetch(`${API}/pricing/admin/${id}`, { method: 'DELETE', headers });
      setPricings(p => p.filter(x => x._id !== id));
      toast.success('Deleted');
    } catch { toast.error('Failed'); }
  };

  const handleToggle = async (id) => {
    try {
      const res = await fetch(`${API}/pricing/admin/${id}/toggle`, { method: 'PUT', headers });
      const data = await res.json();
      if (data.success) setPricings(p => p.map(x => x._id === id ? { ...x, isActive: data.data.isActive } : x));
    } catch { toast.error('Failed'); }
  };

  // Connector prices helpers
  const addConnector = () => setForm(f => ({ ...f, connectorPrices: [...f.connectorPrices, { connectorType: 'CCS2', pricePerUnit: f.basePricePerUnit, powerKw: 50 }] }));
  const updateConnector = (i, key, val) => setForm(f => ({ ...f, connectorPrices: f.connectorPrices.map((c, idx) => idx === i ? { ...c, [key]: val } : c) }));
  const removeConnector = (i) => setForm(f => ({ ...f, connectorPrices: f.connectorPrices.filter((_, idx) => idx !== i) }));

  // Peak hours helpers
  const addPeak = () => setForm(f => ({ ...f, peakHours: [...f.peakHours, { startTime: '18:00', endTime: '22:00', multiplier: 1.5, label: 'Peak Hours' }] }));
  const updatePeak = (i, key, val) => setForm(f => ({ ...f, peakHours: f.peakHours.map((p, idx) => idx === i ? { ...p, [key]: val } : p) }));
  const removePeak = (i) => setForm(f => ({ ...f, peakHours: f.peakHours.filter((_, idx) => idx !== i) }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pricing Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage charging rates, connector pricing & peak hours</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchAll} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            <RefreshCw size={16} /> Refresh
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-[#8CC63F] text-white rounded-xl text-sm font-semibold hover:bg-[#7ab535] transition-colors">
            <Plus size={16} /> Add Pricing
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Configs', value: pricings.length, color: 'text-blue-600' },
          { label: 'Active', value: pricings.filter(p => p.isActive).length, color: 'text-green-600' },
          { label: 'Global', value: pricings.filter(p => p.scope === 'global').length, color: 'text-purple-600' },
          { label: 'Station-Specific', value: pricings.filter(p => p.scope === 'station').length, color: 'text-orange-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#8CC63F] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : pricings.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <IndianRupee size={48} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No pricing configs yet</p>
            <button onClick={openCreate} className="mt-4 px-4 py-2 bg-[#8CC63F] text-white rounded-xl text-sm font-semibold">Create First Config</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Name', 'Scope', 'Base Price', 'Connectors', 'Peak Hours', 'GST', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pricings.map(p => (
                  <tr key={p._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">{p.name}</div>
                      {p.description && <div className="text-xs text-gray-400 mt-0.5">{p.description}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${p.scope === 'global' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                        {p.scope === 'global' ? 'Global' : p.station?.name || 'Station'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-gray-900">₹{p.basePricePerUnit}/kWh</div>
                      {p.sessionFee > 0 && <div className="text-xs text-gray-400">+₹{p.sessionFee} session fee</div>}
                    </td>
                    <td className="px-4 py-3">
                      {p.connectorPrices?.length > 0 ? (
                        <div className="space-y-0.5">
                          {p.connectorPrices.slice(0, 2).map((c, i) => (
                            <div key={i} className="text-xs text-gray-600">{c.connectorType}: <span className="font-semibold">₹{c.pricePerUnit}</span></div>
                          ))}
                          {p.connectorPrices.length > 2 && <div className="text-xs text-gray-400">+{p.connectorPrices.length - 2} more</div>}
                        </div>
                      ) : <span className="text-xs text-gray-400">Base only</span>}
                    </td>
                    <td className="px-4 py-3">
                      {p.peakHours?.length > 0 ? (
                        <div className="space-y-0.5">
                          {p.peakHours.slice(0, 1).map((ph, i) => (
                            <div key={i} className="text-xs text-gray-600">{ph.startTime}–{ph.endTime} <span className="font-semibold text-orange-600">{ph.multiplier}x</span></div>
                          ))}
                          {p.peakHours.length > 1 && <div className="text-xs text-gray-400">+{p.peakHours.length - 1} more</div>}
                        </div>
                      ) : <span className="text-xs text-gray-400">None</span>}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-700">{p.gstPercent}%</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleToggle(p._id)}>
                        {p.isActive
                          ? <ToggleRight size={24} className="text-green-500" />
                          : <ToggleLeft size={24} className="text-gray-400" />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"><Edit2 size={14} /></button>
                        <button onClick={() => handleDelete(p._id)} className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-gray-900">{editItem ? 'Edit Pricing' : 'Create Pricing Config'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-gray-100"><X size={20} className="text-gray-500" /></button>
            </div>

            <div className="p-6 space-y-5">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Config Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Standard Pricing, Mumbai Peak Pricing"
                    className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F]" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Scope</label>
                  <div className="relative mt-1">
                    <select value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value }))}
                      className="w-full appearance-none border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F]">
                      <option value="global">Global (All Stations)</option>
                      <option value="station">Station Specific</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                {form.scope === 'station' && (
                  <div>
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Station</label>
                    <div className="relative mt-1">
                      <select value={form.stationId} onChange={e => setForm(f => ({ ...f, stationId: e.target.value }))}
                        className="w-full appearance-none border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F]">
                        <option value="">Select Station</option>
                        {stations.map(s => <option key={s._id} value={s._id}>{s.name} — {s.city}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Description</label>
                  <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Optional description"
                    className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F]" />
                </div>
              </div>

              {/* Base Pricing */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2"><IndianRupee size={16} className="text-[#8CC63F]" /> Base Pricing</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 font-medium">Base Price (₹/kWh) *</label>
                    <input type="number" value={form.basePricePerUnit} onChange={e => setForm(f => ({ ...f, basePricePerUnit: parseFloat(e.target.value) || 0 }))}
                      className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F]" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium">Session Fee (₹)</label>
                    <input type="number" value={form.sessionFee} onChange={e => setForm(f => ({ ...f, sessionFee: parseFloat(e.target.value) || 0 }))}
                      className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F]" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium">GST (%)</label>
                    <input type="number" value={form.gstPercent} onChange={e => setForm(f => ({ ...f, gstPercent: parseFloat(e.target.value) || 0 }))}
                      className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F]" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium">Min Charge (₹)</label>
                    <input type="number" value={form.minChargeAmount} onChange={e => setForm(f => ({ ...f, minChargeAmount: parseFloat(e.target.value) || 0 }))}
                      className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F]" />
                  </div>
                </div>
              </div>

              {/* Connector Prices */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2"><Zap size={16} className="text-[#8CC63F]" /> Connector-Specific Pricing</h4>
                  <button onClick={addConnector} className="flex items-center gap-1 px-3 py-1.5 bg-[#8CC63F]/10 text-[#8CC63F] rounded-lg text-xs font-bold hover:bg-[#8CC63F]/20 transition-colors">
                    <Plus size={12} /> Add Connector
                  </button>
                </div>
                {form.connectorPrices.length === 0 && (
                  <p className="text-xs text-gray-400 italic">No connector-specific pricing — base price applies to all</p>
                )}
                {form.connectorPrices.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                    <div className="relative flex-1">
                      <select value={c.connectorType} onChange={e => updateConnector(i, 'connectorType', e.target.value)}
                        className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F]">
                        {CONNECTOR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-1 flex-1">
                      <span className="text-xs text-gray-500">₹</span>
                      <input type="number" value={c.pricePerUnit} onChange={e => updateConnector(i, 'pricePerUnit', parseFloat(e.target.value) || 0)}
                        placeholder="Price/kWh"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F]" />
                    </div>
                    <div className="flex items-center gap-1 flex-1">
                      <input type="number" value={c.powerKw} onChange={e => updateConnector(i, 'powerKw', parseFloat(e.target.value) || 0)}
                        placeholder="kW"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F]" />
                      <span className="text-xs text-gray-500">kW</span>
                    </div>
                    <button onClick={() => removeConnector(i)} className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100"><X size={14} /></button>
                  </div>
                ))}
              </div>

              {/* Peak Hours */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2"><Clock size={16} className="text-orange-500" /> Peak Hour Pricing</h4>
                  <button onClick={addPeak} className="flex items-center gap-1 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg text-xs font-bold hover:bg-orange-100 transition-colors">
                    <Plus size={12} /> Add Peak Slot
                  </button>
                </div>
                {form.peakHours.length === 0 && (
                  <p className="text-xs text-gray-400 italic">No peak hours — flat pricing all day</p>
                )}
                {form.peakHours.map((ph, i) => (
                  <div key={i} className="flex items-center gap-3 bg-orange-50/50 rounded-xl p-3 border border-orange-100">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500">Label</label>
                      <input value={ph.label} onChange={e => updatePeak(i, 'label', e.target.value)}
                        className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-500">Start Time</label>
                      <input type="time" value={ph.startTime} onChange={e => updatePeak(i, 'startTime', e.target.value)}
                        className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-500">End Time</label>
                      <input type="time" value={ph.endTime} onChange={e => updatePeak(i, 'endTime', e.target.value)}
                        className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                    </div>
                    <div className="w-24">
                      <label className="text-xs text-gray-500">Multiplier</label>
                      <input type="number" step="0.1" min="1" max="5" value={ph.multiplier} onChange={e => updatePeak(i, 'multiplier', parseFloat(e.target.value) || 1)}
                        className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                    </div>
                    <button onClick={() => removePeak(i)} className="p-1.5 mt-4 rounded-lg bg-red-50 text-red-500 hover:bg-red-100"><X size={14} /></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-100 sticky bottom-0 bg-white">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 text-sm font-bold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 text-sm font-bold text-white bg-[#8CC63F] rounded-xl hover:bg-[#7ab535] disabled:opacity-50 transition-colors">
                {saving ? 'Saving...' : editItem ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
