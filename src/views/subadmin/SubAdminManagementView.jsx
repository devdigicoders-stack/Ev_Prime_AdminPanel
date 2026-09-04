import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, ShieldCheck, XCircle, RefreshCw, Eye, EyeOff, ToggleLeft, ToggleRight } from 'lucide-react';
import Swal from 'sweetalert2';

const formatPermissionLabel = (key) => {
  const customLabels = {
    'users': 'User Management',
    'bookings': 'Booking Management',
    'stations': 'Station Management',
    'partners': 'Partner Management',
    'partner-complaints': 'Partner Complaints',
    'payments': 'Payment Monitoring',
    'payouts': 'Payout Requests',
    'refunds': 'Refund Management',
    'offers': 'Offers Management',
    'news': 'News Management',
    'emergency': 'Roadside Assistance',
    'feedback': 'Feedback Management',
    'pricing': 'Pricing Management',
    'tickets': 'Ticket Management',
    'support': 'Support Center',
    'live-chat': 'Live Chat',
    'enquiries': 'Enquiries',
    'newsletter': 'Newsletter',
    'our-team': 'Our Team',
    'reviews': 'Customer Reviews',
    'blog': 'Blog Management',
    'faq': 'FAQ Management',
    'marketplace': 'Marketplace',
    'franchise': 'Franchise Management',
    'analytics': 'AI Analytics',
    'carbon': 'Carbon Dashboard',
    'gov': 'Government Dashboard',
    'heatmap': 'EV Heat Map',
    'cities': 'City Analytics',
    'cms': 'CMS',
    'connectors': 'Connector Types',
    'reports': 'Reports Generation',
    'audit': 'Audit Log',
    'security': 'Security Center',
    'settings': 'Settings'
  };
  if (customLabels[key]) return customLabels[key];
  return key.charAt(0).toUpperCase() + key.slice(1).replace(/-/g, ' ');
};

const getAvailableActions = (module) => {
  const overrides = {
    'dashboard': ['view'],
    'users': ['view', 'edit', 'delete'],
    'bookings': ['view', 'edit', 'delete'],
    'partner-complaints': ['view', 'edit'],
    'payments': ['view'],
    'payouts': ['view', 'edit'],
    'audit': ['view'],
    'reports': ['view', 'add'],
    'carbon': ['view'],
    'gov': ['view'],
    'analytics': ['view'],
  };
  return overrides[module] || ['view', 'add', 'edit', 'delete'];
};

const EMPTY_FORM = {
  name: '',
  email: '',
  password: '',
  role: '',
  phone: '',
  permissions: [],
  isActive: true,
};

const SubAdminManagementView = () => {
  const [subAdmins, setSubAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [allPermissions, setAllPermissions] = useState([]);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const token = localStorage.getItem('adminToken');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const fetchSubAdmins = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${baseUrl}/admin/subadmins`, { headers });
      const data = await res.json();
      if (res.ok) setSubAdmins(data.data || []);
      else Swal.fire({ icon: 'error', title: 'Error', text: data.message || 'Failed to load sub-admins' });
      
      const permRes = await fetch(`${baseUrl}/admin/subadmins/permissions`, { headers });
      const permData = await permRes.json();
      if (permRes.ok) setAllPermissions(permData.data || []);
    } catch {
      Swal.fire({ icon: 'error', title: 'Network Error', text: 'Failed to fetch sub-admins or permissions' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubAdmins(); }, []);

  const openModal = (admin = null) => {
    if (admin) {
      // Normalize legacy permissions to granular
      let normalizedPerms = [];
      (admin.permissions || []).forEach(p => {
        if (!p.includes('.')) {
          // Legacy: grant all actions
          normalizedPerms.push(`${p}.view`, `${p}.add`, `${p}.edit`, `${p}.delete`);
        } else {
          normalizedPerms.push(p);
        }
      });
      
      setEditingAdmin(admin);
      setFormData({
        name: admin.name,
        email: admin.email,
        password: '',
        role: admin.role || '',
        phone: admin.phone || '',
        permissions: normalizedPerms,
        isActive: admin.isActive,
      });
    } else {
      setEditingAdmin(null);
      setFormData(EMPTY_FORM);
    }
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingAdmin(null); };

  const togglePermissionAction = (module, action) => {
    const permKey = `${module}.${action}`;
    setFormData(prev => {
      let newPermissions = [...prev.permissions];
      
      if (newPermissions.includes(permKey)) {
        newPermissions = newPermissions.filter(p => p !== permKey);
      } else {
        newPermissions.push(permKey);
        // Automatically grant 'view' if assigning any other action
        if (action !== 'view' && !newPermissions.includes(`${module}.view`)) {
          newPermissions.push(`${module}.view`);
        }
      }
      return { ...prev, permissions: newPermissions };
    });
  };

  const selectAll = () => {
    const all = [];
    allPermissions.forEach(module => {
      const actions = getAvailableActions(module);
      actions.forEach(a => all.push(`${module}.${a}`));
    });
    setFormData(prev => ({ ...prev, permissions: all }));
  };

  const clearAll = () => setFormData(prev => ({ ...prev, permissions: [] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingAdmin && !formData.password) {
      return Swal.fire({ icon: 'warning', title: 'Password Required', text: 'Please set a password for the new sub-admin.' });
    }
    setSaving(true);
    try {
      const url = editingAdmin
        ? `${baseUrl}/admin/subadmins/${editingAdmin._id}`
        : `${baseUrl}/admin/subadmins`;
      const method = editingAdmin ? 'PUT' : 'POST';
      const body = { ...formData };
      if (editingAdmin && !body.password) delete body.password;

      const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
      const data = await res.json();
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Success!', text: data.message, timer: 2000, showConfirmButton: false });
        closeModal();
        fetchSubAdmins();
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: data.message || 'Operation failed' });
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'Network Error', text: 'Something went wrong' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    const result = await Swal.fire({
      title: `Delete "${name}"?`,
      text: 'This sub-admin will be permanently removed.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Delete',
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`${baseUrl}/admin/subadmins/${id}`, { method: 'DELETE', headers });
      const data = await res.json();
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Deleted!', text: data.message, timer: 2000, showConfirmButton: false });
        fetchSubAdmins();
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: data.message });
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'Network Error', text: 'Failed to delete' });
    }
  };

  const handleToggleActive = async (admin) => {
    try {
      const res = await fetch(`${baseUrl}/admin/subadmins/${admin._id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ isActive: !admin.isActive }),
      });
      const data = await res.json();
      if (res.ok) fetchSubAdmins();
      else Swal.fire({ icon: 'error', title: 'Error', text: data.message });
    } catch {
      Swal.fire({ icon: 'error', title: 'Network Error', text: 'Failed to update status' });
    }
  };

  const filtered = subAdmins.filter(a =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.role || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-green-600" />
            Sub-Admin Management
          </h1>
          <p className="text-gray-500 mt-1">Create and manage sub-admins with granular module permissions</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Add Sub-Admin
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, email or role..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button onClick={fetchSubAdmins} className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-600 transition-colors" title="Refresh">
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-green-600' : ''}`} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">Total Sub-Admins</p>
          <p className="text-2xl font-bold text-gray-900">{subAdmins.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-green-600">{subAdmins.filter(a => a.isActive).length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">Inactive</p>
          <p className="text-2xl font-bold text-red-500">{subAdmins.filter(a => !a.isActive).length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-16">
            <RefreshCw className="w-10 h-10 text-green-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading sub-admins...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <ShieldCheck className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-700 mb-1">No Sub-Admins Found</h3>
            <p className="text-gray-400 text-sm">Click "Add Sub-Admin" to create one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600">Name</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600">Email</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600">Role</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600">Permissions</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(admin => {
                  // calculate unique modules from specific actions or legacy strings
                  const uniqueModules = new Set();
                  (admin.permissions || []).forEach(p => {
                    const mod = p.includes('.') ? p.split('.')[0] : p;
                    uniqueModules.add(mod);
                  });

                  return (
                    <tr key={admin._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm flex-shrink-0">
                            {admin.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-gray-900">{admin.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{admin.email}</td>
                      <td className="px-6 py-4">
                        <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg text-xs font-semibold">
                          {admin.role || 'Sub Administrator'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-orange-50 text-orange-700 px-2.5 py-1 rounded-lg text-xs font-semibold">
                          {uniqueModules.size} modules
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => handleToggleActive(admin)} className="flex items-center gap-1.5 transition-colors">
                          {admin.isActive
                            ? <><ToggleRight className="w-6 h-6 text-green-500" /><span className="text-green-600 font-semibold text-xs">Active</span></>
                            : <><ToggleLeft className="w-6 h-6 text-gray-400" /><span className="text-gray-400 font-semibold text-xs">Inactive</span></>
                          }
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openModal(admin)}
                            className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(admin._id, admin.name)}
                            className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[95vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
              <h2 className="text-xl font-bold text-gray-800">
                {editingAdmin ? 'Edit Sub-Admin' : 'Create Sub-Admin'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name *</label>
                  <input
                    type="text" required
                    value={formData.name}
                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g. Rahul Sharma"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email *</label>
                  <input
                    type="email" required
                    value={formData.email}
                    onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="rahul@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Password {editingAdmin ? '(leave blank to keep current)' : '*'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                      className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Min 6 characters"
                    />
                    <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Role Title</label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={e => setFormData(p => ({ ...p, role: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g. Station Manager"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <label className="text-sm font-semibold text-gray-700">Account Active</label>
                  <button
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, isActive: !p.isActive }))}
                    className="transition-colors"
                  >
                    {formData.isActive
                      ? <ToggleRight className="w-8 h-8 text-green-500" />
                      : <ToggleLeft className="w-8 h-8 text-gray-400" />
                    }
                  </button>
                </div>
              </div>

              {/* Permissions Matrix */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block">
                      Granular Module Permissions
                    </label>
                    <span className="text-xs text-gray-500">Configure exact access levels for each module</span>
                  </div>
                  <div className="flex gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                    <button type="button" onClick={selectAll} className="text-xs text-green-600 hover:text-green-700 font-semibold transition-colors">Select All</button>
                    <span className="text-gray-300">|</span>
                    <button type="button" onClick={clearAll} className="text-xs text-red-500 hover:text-red-600 font-semibold transition-colors">Clear All</button>
                  </div>
                </div>
                
                <div className="overflow-x-auto max-h-[300px] border border-gray-200 rounded-xl shadow-sm">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm border-b border-gray-200">
                      <tr>
                        <th className="px-5 py-3 font-semibold text-gray-700 w-1/3">Module Name</th>
                        <th className="px-4 py-3 font-semibold text-gray-700 text-center">View</th>
                        <th className="px-4 py-3 font-semibold text-gray-700 text-center">Add</th>
                        <th className="px-4 py-3 font-semibold text-gray-700 text-center">Edit</th>
                        <th className="px-4 py-3 font-semibold text-gray-700 text-center">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {allPermissions.map(module => (
                        <tr key={module} className="hover:bg-green-50/30 transition-colors">
                          <td className="px-5 py-2.5 font-medium text-gray-800">{formatPermissionLabel(module)}</td>
                          {['view', 'add', 'edit', 'delete'].map(action => {
                            const permKey = `${module}.${action}`;
                            const isAvailable = getAvailableActions(module).includes(action);
                            return (
                              <td key={action} className="px-4 py-2.5 text-center">
                                {isAvailable ? (
                                  <input
                                    type="checkbox"
                                    checked={formData.permissions.includes(permKey)}
                                    onChange={() => togglePermissionAction(module, action)}
                                    className="w-4 h-4 accent-green-600 rounded cursor-pointer"
                                  />
                                ) : (
                                  <span className="text-gray-300">-</span>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end shrink-0">
              <button type="button" onClick={closeModal} className="px-5 py-2.5 rounded-xl font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl font-medium text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-60"
              >
                {saving ? 'Saving...' : editingAdmin ? 'Save Changes' : 'Create Sub-Admin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubAdminManagementView;
