import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Link2, ChevronLeft, ChevronRight, ChevronDown, ImageIcon, X, UploadCloud, Loader2, AlertTriangle, FileText, Shield, ScrollText, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ─── Banner Management ────────────────────────────────────────────────────────
const BannerTab = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState(null);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState('Homepage');
  const [priority, setPriority] = useState(1);
  const [status, setStatus] = useState('Active');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/cms`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) throw new Error('Failed to fetch banners');
      const data = await response.json();
      setBanners(data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBanners(); }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const openAddModal = () => {
    setIsEditMode(false); setEditingBannerId(null); setTitle(''); setUrl('');
    setType('Homepage'); setPriority(1); setStatus('Active'); setImageFile(null); setImagePreview(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (banner) => {
    setIsEditMode(true); setEditingBannerId(banner._id); setTitle(banner.title); setUrl(banner.url);
    setType(banner.type); setPriority(banner.priority); setStatus(banner.status);
    setImageFile(null); setImagePreview(banner.imageUrl ? getFullImageUrl(banner.imageUrl) : null);
    setIsAddModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !url) { toast.error('Please provide Title and Target URL.'); return; }
    if (!isEditMode && !imageFile) { toast.error('Please upload an Image for the new banner.'); return; }
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('adminToken');
      const formData = new FormData();
      formData.append('title', title); formData.append('url', url); formData.append('type', type);
      formData.append('priority', priority); formData.append('status', status);
      if (imageFile) formData.append('bannerImage', imageFile);
      const method = isEditMode ? 'PUT' : 'POST';
      const endpoint = isEditMode ? `${API_BASE_URL}/cms/${editingBannerId}` : `${API_BASE_URL}/cms`;
      const response = await fetch(endpoint, { method, headers: { 'Authorization': `Bearer ${token}` }, body: formData });
      if (!response.ok) { const e = await response.json(); throw new Error(e.message || 'Failed'); }
      toast.success(isEditMode ? 'Banner updated!' : 'Banner added!');
      setIsAddModalOpen(false); fetchBanners();
    } catch (err) { toast.error(err.message || 'Error saving banner'); }
    finally { setIsSubmitting(false); }
  };

  const confirmDelete = (id) => { setBannerToDelete(id); setDeleteModalOpen(true); };
  const handleDelete = async () => {
    if (!bannerToDelete) return;
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/cms/${bannerToDelete}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) throw new Error('Failed to delete');
      toast.success('Banner deleted'); setDeleteModalOpen(false); setBannerToDelete(null); fetchBanners();
    } catch (err) { toast.error(err.message || 'Error deleting banner'); }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const getFullImageUrl = (path) => {
    if (!path) return '';
    const base = (API_BASE_URL || 'http://localhost:5000/api').replace('/api', '');
    return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  return (
    <div className="space-y-6 relative">
      {loading && banners.length === 0 && (
        <div className="absolute inset-0 bg-white/50 z-40 flex items-center justify-center rounded-2xl">
          <Loader2 className="animate-spin text-[#8CC63F]" size={48} />
        </div>
      )}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Banner Management</h2>
          <p className="text-gray-500 text-sm">Manage website and app banners</p>
        </div>
        <button onClick={openAddModal} className="bg-[#8CC63F] hover:bg-[#116631] text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors">
          <Plus size={16} /> Add Banner
        </button>
      </div>
      {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase">Banner</th>
                <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase">Title</th>
                <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase">Type</th>
                <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase">Target URL</th>
                <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase text-center">Priority</th>
                <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase">Created</th>
                <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {banners.length === 0 && !loading ? (
                <tr><td colSpan="8" className="px-6 py-10 text-center text-sm text-gray-400">No banners found. Add one to get started.</td></tr>
              ) : banners.map((banner) => (
                <tr key={banner._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="w-24 h-12 rounded-lg bg-gray-100 overflow-hidden border border-gray-200 flex items-center justify-center">
                      {banner.imageUrl ? <img src={getFullImageUrl(banner.imageUrl)} alt={banner.title} className="w-full h-full object-cover" /> : <ImageIcon size={18} className="text-gray-400" />}
                    </div>
                  </td>
                  <td className="px-5 py-4"><span className="text-sm font-semibold text-gray-800">{banner.title}</span></td>
                  <td className="px-5 py-4"><span className="text-sm text-gray-600">{banner.type}</span></td>
                  <td className="px-5 py-4"><span className="text-sm text-gray-600 truncate max-w-[140px] inline-block">{banner.url}</span></td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${banner.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>{banner.status}</span>
                  </td>
                  <td className="px-5 py-4 text-center"><span className="text-sm font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded">{banner.priority}</span></td>
                  <td className="px-5 py-4"><span className="text-sm text-gray-500">{formatDate(banner.createdAt)}</span></td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => openEditModal(banner)} className="text-gray-400 hover:text-emerald-600 transition-colors"><Edit2 size={15} /></button>
                      <a href={banner.url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-blue-500 transition-colors"><Link2 size={15} /></a>
                      <button onClick={() => confirmDelete(banner._id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl my-auto">
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">{isEditMode ? 'Edit Banner' : 'Add Banner'}</h2>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:bg-gray-100 p-1.5 rounded-lg"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                <div onClick={() => fileInputRef.current.click()} className={`border-2 border-dashed ${imagePreview ? 'border-[#8CC63F]' : 'border-gray-200'} rounded-xl p-6 flex flex-col items-center text-center cursor-pointer hover:border-[#8CC63F] transition-colors relative overflow-hidden`}>
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-90" />
                  ) : (
                    <><UploadCloud size={24} className="text-gray-400 mb-2" /><p className="text-sm font-medium text-gray-600">Click to upload image</p><p className="text-xs text-gray-400">PNG, JPG, GIF (max 5MB)</p></>
                  )}
                </div>
                <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="Banner Title" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F]" />
                <input type="text" required value={url} onChange={e => setUrl(e.target.value)} placeholder="Target URL (e.g. /home)" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F]" />
                <div className="grid grid-cols-3 gap-3">
                  <div className="relative"><select value={type} onChange={e => setType(e.target.value)} className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] appearance-none"><option>Homepage</option><option>Promotion</option><option>Information</option><option>Campaign</option></select><ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" /></div>
                  <input type="number" min="1" value={priority} onChange={e => setPriority(e.target.value)} placeholder="Priority" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F]" />
                  <div className="relative"><select value={status} onChange={e => setStatus(e.target.value)} className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] appearance-none"><option>Active</option><option>Inactive</option></select><ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" /></div>
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-semibold text-white bg-[#8CC63F] hover:bg-[#116631] disabled:opacity-50 rounded-lg flex items-center gap-2">
                  {isSubmitting ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : (isEditMode ? 'Save Changes' : 'Add Banner')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3"><AlertTriangle size={28} className="text-red-500" /></div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Banner?</h3>
              <p className="text-sm text-gray-500">This action cannot be undone.</p>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button onClick={() => { setDeleteModalOpen(false); setBannerToDelete(null); }} className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-red-500 rounded-lg hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Legal Documents Tab ──────────────────────────────────────────────────────
const LegalTab = () => {
  const [activeDoc, setActiveDoc] = useState('privacy_policy');
  const [privacyDoc, setPrivacyDoc] = useState({ content: '', title: 'Privacy Policy', lastUpdated: null });
  const [termsDoc, setTermsDoc] = useState({ content: '', title: 'Terms & Conditions', lastUpdated: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const currentDoc = activeDoc === 'privacy_policy' ? privacyDoc : termsDoc;
  const setCurrentDoc = activeDoc === 'privacy_policy' ? setPrivacyDoc : setTermsDoc;

  const fetchDoc = async (type) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/legal/${type}`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        if (type === 'privacy_policy') setPrivacyDoc(data.data);
        else setTermsDoc(data.data);
      }
    } catch (err) {
      toast.error(`Failed to load ${type === 'privacy_policy' ? 'Privacy Policy' : 'Terms'}`);
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchDoc('privacy_policy'), fetchDoc('terms_conditions')]);
      setLoading(false);
    };
    loadAll();
  }, []);

  const handleSave = async () => {
    if (!currentDoc.content.trim()) { toast.error('Content cannot be empty'); return; }
    setSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/legal/${activeDoc}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: currentDoc.content, title: currentDoc.title }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save');
      setCurrentDoc(data.data);
      toast.success('Document saved successfully!');
    } catch (err) {
      toast.error(err.message || 'Error saving document');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="animate-spin text-[#8CC63F]" size={36} />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Legal Documents</h2>
          <p className="text-gray-500 text-sm">Edit Privacy Policy and Terms & Conditions shown in the user app</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="bg-[#8CC63F] hover:bg-[#116631] disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Doc Selector */}
      <div className="flex gap-3">
        {[
          { id: 'privacy_policy', label: 'Privacy Policy', icon: Shield },
          { id: 'terms_conditions', label: 'Terms & Conditions', icon: ScrollText },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveDoc(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
              activeDoc === id
                ? 'bg-[#8CC63F] text-white border-[#8CC63F] shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-[#8CC63F] hover:text-[#8CC63F]'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Editor Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Title bar */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#8CC63F]/10 flex items-center justify-center">
              <FileText size={16} className="text-[#8CC63F]" />
            </div>
            <div>
              <input
                type="text"
                value={currentDoc.title || ''}
                onChange={e => setCurrentDoc(prev => ({ ...prev, title: e.target.value }))}
                className="text-base font-bold text-gray-900 focus:outline-none focus:border-b-2 focus:border-[#8CC63F] bg-transparent"
              />
              <p className="text-xs text-gray-400">Last updated: {formatDate(currentDoc.lastUpdated)}</p>
            </div>
          </div>
          <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
            {activeDoc === 'privacy_policy' ? 'privacy_policy' : 'terms_conditions'}
          </span>
        </div>

        {/* Textarea */}
        <div className="p-6">
          <p className="text-xs text-gray-400 mb-3 font-medium">
            Write plain text. Each paragraph will be displayed in the app. Use numbered sections (e.g. "1. Introduction") for structure.
          </p>
          <textarea
            value={currentDoc.content || ''}
            onChange={e => setCurrentDoc(prev => ({ ...prev, content: e.target.value }))}
            rows={24}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8CC63F] font-mono leading-relaxed resize-y"
            placeholder="Enter document content here..."
          />
          <p className="text-xs text-gray-400 mt-2">{currentDoc.content?.length || 0} characters</p>
        </div>
      </div>
    </div>
  );
};

// ─── Main CMSView with Tabs ───────────────────────────────────────────────────
const CMSView = () => {
  const [activeTab, setActiveTab] = useState('banners');

  const tabs = [
    { id: 'banners', label: 'Banner Management', icon: ImageIcon },
    { id: 'legal', label: 'Legal Documents', icon: FileText },
  ];

  return (
    <div className="flex flex-col h-full space-y-6 pb-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Content Management</h1>
        <p className="text-gray-500 text-sm font-medium">Manage banners, privacy policy and terms of service</p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 border-b border-gray-100 pb-0">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all -mb-px ${
              activeTab === id
                ? 'border-[#8CC63F] text-[#8CC63F]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'banners' && <BannerTab />}
      {activeTab === 'legal' && <LegalTab />}
    </div>
  );
};

export default CMSView;
