import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Link2, ChevronLeft, ChevronRight, ChevronDown, ImageIcon, X, UploadCloud, Loader2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const CMSView = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Edit State
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState(null);

  // Delete State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState(null);

  // Form State
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
      const response = await fetch(`${API_BASE_URL}/cms`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch banners');
      const data = await response.json();
      setBanners(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

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
      setIsEditMode(false);
      setEditingBannerId(null);
      setTitle('');
      setUrl('');
      setType('Homepage');
      setPriority(1);
      setStatus('Active');
      setImageFile(null);
      setImagePreview(null);
      setIsAddModalOpen(true);
  };

  const openEditModal = (banner) => {
      setIsEditMode(true);
      setEditingBannerId(banner._id);
      setTitle(banner.title);
      setUrl(banner.url);
      setType(banner.type);
      setPriority(banner.priority);
      setStatus(banner.status);
      setImageFile(null);
      setImagePreview(banner.imageUrl ? getFullImageUrl(banner.imageUrl) : null);
      setIsAddModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !url) {
        toast.error("Please provide Title and Target URL.");
        return;
    }
    
    if (!isEditMode && !imageFile) {
        toast.error("Please upload an Image for the new banner.");
        return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('adminToken');
      const formData = new FormData();
      formData.append('title', title);
      formData.append('url', url);
      formData.append('type', type);
      formData.append('priority', priority);
      formData.append('status', status);
      if (imageFile) {
          formData.append('bannerImage', imageFile);
      }

      const method = isEditMode ? 'PUT' : 'POST';
      const endpoint = isEditMode ? `${API_BASE_URL}/cms/${editingBannerId}` : `${API_BASE_URL}/cms`;

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || `Failed to ${isEditMode ? 'update' : 'add'} banner`);
      }

      toast.success(isEditMode ? 'Banner updated successfully' : 'Banner added successfully');
      setIsAddModalOpen(false);
      fetchBanners();

    } catch (err) {
      toast.error(err.message || 'Error saving banner');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = (id) => {
      setBannerToDelete(id);
      setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
      if (!bannerToDelete) return;
      try {
          const token = localStorage.getItem('adminToken');
          const response = await fetch(`${API_BASE_URL}/cms/${bannerToDelete}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (!response.ok) throw new Error('Failed to delete');
          toast.success('Banner deleted successfully');
          setDeleteModalOpen(false);
          setBannerToDelete(null);
          fetchBanners();
      } catch(err) {
          toast.error(err.message || 'Error deleting banner');
      }
  };

  const formatDate = (dateString) => {
      const options = { day: '2-digit', month: 'short', year: 'numeric' };
      return new Date(dateString).toLocaleDateString('en-GB', options);
  };

  const getFullImageUrl = (path) => {
      if (!path) return '';
      const baseApiUrl = API_BASE_URL || 'http://localhost:5000/api';
      const baseUrl = baseApiUrl.replace('/api', '');
      const cleanPath = path.startsWith('/') ? path : `/${path}`;
      return `${baseUrl}${cleanPath}`;
  };

  return (
    <div className="flex flex-col h-full space-y-6 pb-6 relative">
      
      {loading && banners.length === 0 && (
          <div className="absolute inset-0 bg-white/50 z-40 flex items-center justify-center rounded-2xl">
            <Loader2 className="animate-spin text-[#8CC63F]" size={48} />
          </div>
      )}

      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Banner Management</h1>
          <p className="text-gray-500 text-sm font-medium">Manage website and app banners</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-[#8CC63F] hover:bg-[#116631] text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm whitespace-nowrap"
        >
          <Plus size={18} strokeWidth={2.5} /> Add Banner
        </button>
      </div>

      {error && <div className="text-red-500 text-sm font-semibold bg-red-50 p-4 rounded-lg">{error}</div>}

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col">
        
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Banner</th>
                <th className="px-6 py-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Target URL</th>
                <th className="px-6 py-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Priority</th>
                <th className="px-6 py-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created On</th>
                <th className="px-6 py-5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {banners.length === 0 && !loading ? (
                  <tr>
                      <td colSpan="8" className="px-6 py-8 text-center text-sm text-gray-500 font-medium">No banners found. Add one to get started.</td>
                  </tr>
              ) : (
                  banners.map((banner) => (
                    <tr key={banner._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="w-28 h-12 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center border border-gray-200">
                           {banner.imageUrl ? (
                               <img src={getFullImageUrl(banner.imageUrl)} alt={banner.title} className="w-full h-full object-cover" />
                           ) : (
                               <ImageIcon size={20} strokeWidth={2} className="text-gray-400" />
                           )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-gray-800">{banner.title}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-600">{banner.type}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-600 truncate max-w-[150px] inline-block">{banner.url}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-semibold ${banner.status === 'Active' ? 'text-emerald-500' : 'text-red-500'}`}>
                          {banner.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded">{banner.priority}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-600">{formatDate(banner.createdAt)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-3">
                          <button onClick={() => openEditModal(banner)} className="text-gray-400 hover:text-emerald-600 transition-colors">
                            <Edit2 size={16} strokeWidth={2.5} />
                          </button>
                          <a href={banner.url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-blue-500 transition-colors">
                            <Link2 size={16} strokeWidth={2.5} />
                          </a>
                          <button onClick={() => confirmDelete(banner._id)} className="text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 size={16} strokeWidth={2.5} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-5 flex items-center justify-center lg:justify-end gap-4 border-t border-gray-100">
          <div className="flex items-center gap-1">
            <button className="p-1.5 text-gray-400 hover:text-gray-700 transition"><ChevronLeft size={18} /></button>
            <button className="w-8 h-8 flex items-center justify-center rounded bg-[#8CC63F] text-white font-semibold text-sm">1</button>
            <button className="p-1.5 text-gray-400 hover:text-gray-700 transition"><ChevronRight size={18} /></button>
          </div>
        </div>
      </div>

      {/* Add / Edit Banner Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
            <form onSubmit={handleSubmit}>
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">{isEditMode ? 'Edit Banner' : 'Add New Banner'}</h2>
                <button 
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="text-gray-400 hover:bg-gray-100 hover:text-gray-600 p-1.5 rounded-lg transition-colors"
                >
                    <X size={20} />
                </button>
                </div>
                
                <div className="p-6 space-y-5">
                
                <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Banner Image</label>
                    <input 
                        type="file" 
                        accept="image/png, image/jpeg, image/jpg, image/gif, image/svg+xml, image/webp"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden" 
                    />
                    <div 
                        onClick={() => fileInputRef.current.click()}
                        className={`border-2 border-dashed ${imagePreview ? 'border-[#8CC63F]' : 'border-gray-200'} rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 hover:border-[#8CC63F] transition-colors cursor-pointer group relative overflow-hidden`}
                    >
                        {imagePreview ? (
                            <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-90" />
                        ) : (
                            <>
                                <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-emerald-100 flex items-center justify-center mb-3 transition-colors z-10">
                                    <UploadCloud size={24} className="text-gray-500 group-hover:text-emerald-600 transition-colors" />
                                </div>
                                <p className="text-sm font-semibold text-gray-700 mb-1 z-10">Click to upload or drag and drop</p>
                                <p className="text-xs text-gray-500 font-medium z-10">SVG, PNG, JPG or GIF (max. 5MB)</p>
                            </>
                        )}
                        {imagePreview && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <p className="text-white font-semibold text-sm flex items-center gap-2"><UploadCloud size={16}/> Change Image</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Banner Title</label>
                    <input 
                        type="text" 
                        required
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="e.g. Go Green, Go Electric!"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all shadow-sm"
                    />
                    </div>

                    <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Target URL</label>
                    <input 
                        type="text"
                        required 
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                        placeholder="e.g. /home or https://..."
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all shadow-sm"
                    />
                    </div>

                    <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Type</label>
                    <div className="relative">
                        <select value={type} onChange={e => setType(e.target.value)} className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all shadow-sm appearance-none bg-white cursor-pointer">
                        <option>Homepage</option>
                        <option>Promotion</option>
                        <option>Information</option>
                        <option>Campaign</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                    </div>

                    <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Priority / Order</label>
                    <input 
                        type="number" 
                        min="1"
                        value={priority}
                        onChange={e => setPriority(e.target.value)}
                        placeholder="e.g. 1"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all shadow-sm"
                    />
                    </div>

                    <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Status</label>
                    <div className="relative">
                        <select value={status} onChange={e => setStatus(e.target.value)} className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all shadow-sm appearance-none bg-white cursor-pointer">
                        <option>Active</option>
                        <option>Inactive</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                    </div>
                </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
                <button 
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-200 bg-white border border-gray-200 rounded-lg transition-colors shadow-sm"
                >
                    Cancel
                </button>
                <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-[#8CC63F] hover:bg-[#116631] disabled:bg-[#8CC63F]/50 rounded-lg transition-colors shadow-sm flex items-center gap-2"
                >
                    {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : (isEditMode ? 'Save Changes' : 'Add Banner')}
                </button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="p-6 text-center flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                          <AlertTriangle size={32} className="text-red-500" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Banner?</h3>
                      <p className="text-sm text-gray-500 font-medium">Are you sure you want to permanently delete this banner? This action cannot be undone.</p>
                  </div>
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                      <button 
                          onClick={() => { setDeleteModalOpen(false); setBannerToDelete(null); }}
                          className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                          Cancel
                      </button>
                      <button 
                          onClick={handleDelete}
                          className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
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

export default CMSView;
