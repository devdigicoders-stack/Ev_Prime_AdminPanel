import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Zap, Loader2, BatteryCharging } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ConnectorManagementView = () => {

  const [connectorsData, setConnectorsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConnector, setEditingConnector] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    subtitle: '',
    powerKw: '',
    chargeType: 'DC',
    icon: 'ev_station'
  });

  useEffect(() => {
    fetchConnectors();
  }, []);

  const fetchConnectors = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/connectors`);
      const data = await res.json();
      if (data.success) {
        setConnectorsData(data.data);
      }
    } catch (error) {
      console.error('Error fetching connectors', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      let res;
      if (editingConnector) {
        res = await fetch(`${API_BASE_URL}/connectors/${editingConnector._id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(formData)
        });
      } else {
        res = await fetch(`${API_BASE_URL}/connectors`, {
          method: 'POST',
          headers,
          body: JSON.stringify(formData)
        });
      }
      
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save');
      }
      
      setIsModalOpen(false);
      fetchConnectors();
    } catch (error) {
      console.error('Error saving connector', error);
      alert('Error saving connector: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this connector type?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/connectors/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        fetchConnectors();
      }
    } catch (error) {
      console.error('Error deleting connector', error);
      alert('Error deleting connector');
    }
  };

  const openModal = (connector = null) => {
    setEditingConnector(connector);
    if (connector) {
      setFormData({
        name: connector.name,
        subtitle: connector.subtitle,
        powerKw: connector.powerKw,
        chargeType: connector.chargeType,
        icon: connector.icon
      });
    } else {
      setFormData({ name: '', subtitle: '', powerKw: '', chargeType: 'DC', icon: 'ev_station' });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Connector Types</h1>
          <p className="text-gray-500 text-sm mt-1">Manage global connector types available for partners</p>
        </div>
        <button 
          onClick={() => openModal()} 
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition"
        >
          <Plus size={18} /> Add Connector
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex-1 flex justify-center items-center"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 text-sm">
                  <th className="p-4 font-semibold">Name</th>
                  <th className="p-4 font-semibold">Subtitle</th>
                  <th className="p-4 font-semibold">Power (kW)</th>
                  <th className="p-4 font-semibold">Type</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {connectorsData.map((conn) => (
                  <tr key={conn._id} className="hover:bg-gray-50/50 transition">
                    <td className="p-4 font-medium text-gray-900 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <BatteryCharging size={16} />
                      </div>
                      {conn.name}
                    </td>
                    <td className="p-4 text-gray-600">{conn.subtitle}</td>
                    <td className="p-4 text-gray-900 font-semibold">{conn.powerKw} kW</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs font-bold rounded-full ${conn.chargeType === 'DC' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                        {conn.chargeType}
                      </span>
                    </td>
                    <td className="p-4 flex items-center justify-end gap-2">
                      <button onClick={() => openModal(conn)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(conn._id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">{editingConnector ? 'Edit Connector' : 'Add Connector'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Name (e.g. CCS2)</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Subtitle (e.g. DC Fast • 120 kW)</label>
                <input required type="text" value={formData.subtitle} onChange={e => setFormData({...formData, subtitle: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Power (kW)</label>
                  <input required type="number" value={formData.powerKw} onChange={e => setFormData({...formData, powerKw: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Charge Type</label>
                  <select value={formData.chargeType} onChange={e => setFormData({...formData, chargeType: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none">
                    <option value="DC">DC</option>
                    <option value="AC">AC</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Flutter Icon Name</label>
                <input required type="text" value={formData.icon} onChange={e => setFormData({...formData, icon: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-lg font-medium text-gray-600 bg-gray-100 hover:bg-gray-200">Cancel</button>
                <button type="submit" className="px-5 py-2.5 rounded-lg font-medium text-white bg-emerald-600 hover:bg-emerald-700">{editingConnector ? 'Update' : 'Save'} Connector</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectorManagementView;
