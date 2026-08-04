import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Link2, ChevronDown, ImageIcon, X, UploadCloud, Loader2, AlertTriangle, FileText, Shield, ScrollText, Save, HelpCircle, Zap, Bold, Italic, Underline, Heading1, Heading2, List, ListOrdered, Code, Link } from 'lucide-react';
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

  const editorRef = useRef(null);

  const runCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setCurrentDoc(prev => ({ ...prev, content: editorRef.current.innerHTML }));
    }
  };

  const handleLinkPrompt = () => {
    const url = prompt('Enter the link URL (e.g. https://google.com):');
    if (url) {
      runCommand('createLink', url);
    }
  };

  const handleEditorInput = () => {
    if (editorRef.current) {
      setCurrentDoc(prev => ({ ...prev, content: editorRef.current.innerHTML }));
    }
  };

  // Set editor content only when switching documents (not on every keystroke)
  useEffect(() => {
    if (editorRef.current) {
      const currentContent = activeDoc === 'privacy_policy' ? privacyDoc.content : termsDoc.content;
      editorRef.current.innerHTML = currentContent || '';
    }
  }, [activeDoc, loading]);

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

        {/* Rich Text Editor */}
        <div className="p-6">
          <p className="text-xs text-gray-400 mb-3 font-medium">
            Format your text. The content will be displayed directly on the app and website.
          </p>
          
          <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#8CC63F]">
            {/* Editor Toolbar */}
            <div className="bg-gray-50 border-b border-gray-200 p-2 flex flex-wrap gap-1">
              <button type="button" onClick={() => runCommand('bold')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700" title="Bold"><Bold className="w-4 h-4" /></button>
              <button type="button" onClick={() => runCommand('italic')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700" title="Italic"><Italic className="w-4 h-4" /></button>
              <button type="button" onClick={() => runCommand('underline')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700" title="Underline"><Underline className="w-4 h-4" /></button>
              <div className="w-px h-6 bg-gray-200 mx-1"></div>
              <button type="button" onClick={() => runCommand('formatBlock', '<h1>')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700 font-bold" title="H1"><Heading1 className="w-4 h-4" /></button>
              <button type="button" onClick={() => runCommand('formatBlock', '<h2>')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700 font-bold" title="H2"><Heading2 className="w-4 h-4" /></button>
              <button type="button" onClick={() => runCommand('formatBlock', '<p>')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700" title="Paragraph"><Code className="w-4 h-4" /></button>
              <div className="w-px h-6 bg-gray-200 mx-1"></div>
              <button type="button" onClick={() => runCommand('insertUnorderedList')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700" title="Bullet List"><List className="w-4 h-4" /></button>
              <button type="button" onClick={() => runCommand('insertOrderedList')} className="p-1.5 hover:bg-gray-200 rounded text-gray-700" title="Numbered List"><ListOrdered className="w-4 h-4" /></button>
              <button type="button" onClick={handleLinkPrompt} className="p-1.5 hover:bg-gray-200 rounded text-gray-700" title="Add Link"><Link className="w-4 h-4" /></button>
            </div>

            {/* Editor Content Area */}
            <div
              key={activeDoc}
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleEditorInput}
              dir="ltr"
              className="min-h-[400px] max-h-[600px] overflow-y-auto p-4 focus:outline-none bg-white text-gray-800 prose prose-sm max-w-none text-sm"
              style={{ direction: 'ltr', unicodeBidi: 'embed', textAlign: 'left' }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">{currentDoc.content?.length || 0} characters</p>
        </div>
      </div>
    </div>
  );
};

// ─── FAQ Management Tab ───────────────────────────────────────────────────────
const FAQTab = () => {
  const CATEGORIES = ['General', 'Charging', 'Payments', 'Account', 'Other'];

  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [faqToDelete, setFaqToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // form state
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState('General');
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const fetchFAQs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const params = filterCategory !== 'All' ? `?category=${filterCategory}` : '';
      const res = await fetch(`${API_BASE_URL}/faq/admin${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setFaqs(data.data);
    } catch (err) {
      toast.error('Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFAQs(); }, [filterCategory]);

  const openAddModal = () => {
    setIsEditMode(false); setEditingId(null);
    setQuestion(''); setAnswer(''); setCategory('General'); setOrder(0); setIsActive(true);
     setModalOpen(true);
  };

  const openEditModal = (faq) => {
    setIsEditMode(true); setEditingId(faq._id);
    setQuestion(faq.question); setAnswer(faq.answer);
    setCategory(faq.category); setOrder(faq.order); setIsActive(faq.isActive);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) {
      toast.error('Question and answer are required');
      return;
    }
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('adminToken');
      const method = isEditMode ? 'PUT' : 'POST';
      const url = isEditMode ? `${API_BASE_URL}/faq/${editingId}` : `${API_BASE_URL}/faq`;
      const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, answer, category, order: Number(order), isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed');
      toast.success(isEditMode ? 'FAQ updated!' : 'FAQ created!');
      setModalOpen(false);
      fetchFAQs();
    } catch (err) {
      toast.error(err.message || 'Error saving FAQ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = (id) => { setFaqToDelete(id); setDeleteModalOpen(true); };

  const handleDelete = async () => {
    if (!faqToDelete) return;
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/faq/${faqToDelete}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('FAQ deleted');
      setDeleteModalOpen(false); setFaqToDelete(null);
      fetchFAQs();
    } catch (err) {
      toast.error('Error deleting FAQ');
    }
  };

  const toggleActive = async (faq) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/faq/${faq._id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !faq.isActive }),
      });
      if (!res.ok) throw new Error('Failed');
      fetchFAQs();
    } catch {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">FAQ Management</h2>
          <p className="text-gray-500 text-sm">Manage FAQs shown in the user app</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-[#8CC63F] hover:bg-[#116631] text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
        >
          <Plus size={16} /> Add FAQ
        </button>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {['All', ...CATEGORIES].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
              filterCategory === cat
                ? 'bg-[#8CC63F] text-white border-[#8CC63F]'
                : 'bg-white text-gray-600 border-gray-200 hover:border-[#8CC63F] hover:text-[#8CC63F]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-[#8CC63F]" size={36} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase">Question</th>
                  <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase">Category</th>
                  <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase text-center">Order</th>
                  <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase text-center">Status</th>
                  <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {faqs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-10 text-center text-sm text-gray-400">
                      No FAQs found. Add one to get started.
                    </td>
                  </tr>
                ) : faqs.map((faq) => (
                  <tr key={faq._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4 max-w-xs">
                      <p className="text-sm font-semibold text-gray-800 truncate">{faq.question}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{faq.answer}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                        {faq.category}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="text-sm font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {faq.order}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => toggleActive(faq)}
                        className={`text-xs font-bold px-3 py-1 rounded-full transition-colors ${
                          faq.isActive
                            ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            : 'bg-red-50 text-red-500 hover:bg-red-100'
                        }`}
                      >
                        {faq.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => openEditModal(faq)}
                          className="text-gray-400 hover:text-emerald-600 transition-colors"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => confirmDelete(faq._id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={15} />
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

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">
                  {isEditMode ? 'Edit FAQ' : 'Add FAQ'}
                </h2>
                <button type="button" onClick={() => setModalOpen(false)} className="text-gray-400 hover:bg-gray-100 p-1.5 rounded-lg">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Question *</label>
                  <input
                    type="text"
                    required
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                    placeholder="Enter FAQ question"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Answer *</label>
                  <textarea
                    required
                    rows={4}
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    placeholder="Enter FAQ answer"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] resize-y"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Category</label>
                    <div className="relative">
                      <select
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] appearance-none"
                      >
                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Order</label>
                    <input
                      type="number"
                      min="0"
                      value={order}
                      onChange={e => setOrder(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F]"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-semibold text-gray-600">Active in app</label>
                  <button
                    type="button"
                    onClick={() => setIsActive(v => !v)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${isActive ? 'bg-[#8CC63F]' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-semibold text-white bg-[#8CC63F] hover:bg-[#116631] disabled:opacity-50 rounded-lg flex items-center gap-2"
                >
                  {isSubmitting ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : (isEditMode ? 'Save Changes' : 'Add FAQ')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle size={28} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete FAQ?</h3>
              <p className="text-sm text-gray-500">This FAQ will be removed from the app.</p>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => { setDeleteModalOpen(false); setFaqToDelete(null); }}
                className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-red-500 rounded-lg hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Charging Solutions Management Tab ────────────────────────────────────────────────────────
const ChargingSolutionsTab = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [solutions, setSolutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [solutionToDelete, setSolutionToDelete] = useState(null);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const fetchSolutions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/cms/solutions`);
      if (!response.ok) throw new Error('Failed to fetch charging solutions');
      const data = await response.json();
      setSolutions(data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSolutions(); }, []);

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
    setIsEditMode(false); setEditingId(null); setTitle(''); setDescription('');
    setLink('/download-app'); setIsActive(true); setImageFile(null); setImagePreview(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (sol) => {
    setIsEditMode(true); setEditingId(sol._id); setTitle(sol.title); setDescription(sol.description);
    setLink(sol.link); setIsActive(sol.isActive);
    setImageFile(null); setImagePreview(sol.image ? getFullImageUrl(sol.image) : null);
    setIsAddModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description) { toast.error('Please provide Title and Description.'); return; }
    if (!isEditMode && !imageFile) { toast.error('Please upload an Image.'); return; }
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('adminToken');
      const formData = new FormData();
      formData.append('title', title); formData.append('description', description); formData.append('link', link);
      formData.append('isActive', isActive);
      if (imageFile) formData.append('solutionImage', imageFile);
      
      const method = isEditMode ? 'PUT' : 'POST';
      const endpoint = isEditMode ? `${API_BASE_URL}/cms/solutions/${editingId}` : `${API_BASE_URL}/cms/solutions`;
      const response = await fetch(endpoint, { method, headers: { 'Authorization': `Bearer ${token}` }, body: formData });
      if (!response.ok) { const e = await response.json(); throw new Error(e.message || 'Failed'); }
      toast.success(isEditMode ? 'Solution updated!' : 'Solution added!');
      setIsAddModalOpen(false); fetchSolutions();
    } catch (err) { toast.error(err.message || 'Error saving solution'); }
    finally { setIsSubmitting(false); }
  };

  const confirmDelete = (id) => { setSolutionToDelete(id); setDeleteModalOpen(true); };
  const handleDelete = async () => {
    if (!solutionToDelete) return;
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/cms/solutions/${solutionToDelete}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) throw new Error('Failed to delete');
      toast.success('Solution deleted'); setDeleteModalOpen(false); setSolutionToDelete(null); fetchSolutions();
    } catch (err) { toast.error(err.message || 'Error deleting solution'); }
  };

  const getFullImageUrl = (path) => {
    if (!path) return '';
    const base = (API_BASE_URL || 'http://localhost:5000/api').replace('/api', '');
    return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  return (
    <div className="space-y-6 relative">
      {loading && solutions.length === 0 && (
        <div className="absolute inset-0 bg-white/50 z-40 flex items-center justify-center rounded-2xl">
          <Loader2 className="animate-spin text-[#8CC63F]" size={48} />
        </div>
      )}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Charging Solutions</h2>
          <p className="text-gray-500 text-sm">Manage dynamic charging solutions shown on the homepage</p>
        </div>
        <button onClick={openAddModal} className="bg-[#8CC63F] hover:bg-[#116631] text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors">
          <Plus size={16} /> Add Solution
        </button>
      </div>
      {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase">Image</th>
                <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase">Title</th>
                <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase">Description</th>
                <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="px-5 py-4 text-xs font-bold text-gray-500 uppercase text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {solutions.length === 0 && !loading ? (
                <tr><td colSpan="5" className="px-6 py-10 text-center text-sm text-gray-400">No solutions found. Add one to get started.</td></tr>
              ) : solutions.map((sol) => (
                <tr key={sol._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="w-24 h-16 rounded-lg bg-gray-100 overflow-hidden border border-gray-200 flex items-center justify-center">
                      {sol.image ? <img src={getFullImageUrl(sol.image)} alt={sol.title} className="w-full h-full object-cover" /> : <ImageIcon size={18} className="text-gray-400" />}
                    </div>
                  </td>
                  <td className="px-5 py-4"><span className="text-sm font-semibold text-gray-800">{sol.title}</span></td>
                  <td className="px-5 py-4"><span className="text-sm text-gray-500 max-w-xs truncate inline-block">{sol.description}</span></td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${sol.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>{sol.isActive ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => openEditModal(sol)} className="text-gray-400 hover:text-emerald-600 transition-colors"><Edit2 size={15} /></button>
                      <button onClick={() => confirmDelete(sol._id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl my-auto">
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">{isEditMode ? 'Edit Solution' : 'Add Solution'}</h2>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:bg-gray-100 p-1.5 rounded-lg"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                <div onClick={() => fileInputRef.current.click()} className={`border-2 border-dashed ${imagePreview ? 'border-[#8CC63F]' : 'border-gray-200'} rounded-xl p-6 flex flex-col items-center text-center cursor-pointer hover:border-[#8CC63F] transition-colors relative overflow-hidden`}>
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-contain opacity-90 bg-gray-100" />
                  ) : (
                    <><UploadCloud size={24} className="text-gray-400 mb-2" /><p className="text-sm font-medium text-gray-600">Click to upload image</p><p className="text-xs text-gray-400">PNG, JPG (Square/Landscape)</p></>
                  )}
                </div>
                <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="Solution Title" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F]" />
                <textarea required value={description} onChange={e => setDescription(e.target.value)} placeholder="Short Description" rows={2} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] resize-y" />
                <div className="flex items-center gap-4 mt-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4 text-[#8CC63F] rounded border-gray-300 focus:ring-[#8CC63F]" />
                    Active in App/Website
                  </label>
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-semibold text-white bg-[#8CC63F] hover:bg-[#116631] disabled:opacity-50 rounded-lg flex items-center gap-2">
                  {isSubmitting ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : (isEditMode ? 'Save Changes' : 'Add Solution')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3"><AlertTriangle size={28} className="text-red-500" /></div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Solution?</h3>
              <p className="text-sm text-gray-500">This action cannot be undone.</p>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button onClick={() => { setDeleteModalOpen(false); setSolutionToDelete(null); }} className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-red-500 rounded-lg hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main CMSView with Tabs ───────────────────────────────────────────────────
const CMSView = () => {
  const [activeTab, setActiveTab] = useState('banners');

  const tabs = [
    { id: 'banners', label: 'Banner Management', icon: ImageIcon },
    { id: 'legal', label: 'Legal Documents', icon: FileText },
    { id: 'faq', label: 'FAQ Management', icon: HelpCircle },
    { id: 'solutions', label: 'Charging Solutions', icon: Zap },
  ];

  return (
    <div className="flex flex-col h-full space-y-6 pb-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Content Management</h1>
        <p className="text-gray-500 text-sm font-medium">Manage banners, privacy policy, terms of service and FAQs</p>
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
      {activeTab === 'faq' && <FAQTab />}
      {activeTab === 'solutions' && <ChargingSolutionsTab />}
    </div>
  );
};

export default CMSView;
