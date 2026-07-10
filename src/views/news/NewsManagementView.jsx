import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Edit2, Trash2, X, Loader2, Newspaper, Eye, EyeOff, Upload, ImageOff } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const BACKEND_URL = API_BASE_URL.replace('/api', '');

const CATEGORIES = ['General', 'Policy', 'Technology', 'Infrastructure', 'Tips', 'Market'];

const initialFormState = {
  title: '',
  summary: '',
  content: '',
  category: 'General',
  source: 'Bharat EV',
  isPublished: true,
};

const NewsManagementView = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [formData, setFormData] = useState(initialFormState);

  // Image state
  const [imageFile, setImageFile] = useState(null);       // new File selected
  const [imagePreview, setImagePreview] = useState(null); // local blob URL for preview
  const [existingImage, setExistingImage] = useState(null); // existing server image on edit
  const fileInputRef = useRef(null);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/news/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setNews(data.data);
      else toast.error(data.message || 'Failed to fetch news');
    } catch {
      toast.error('Network error while fetching news');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNews(); }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setExistingImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const resetImageState = () => {
    setImageFile(null);
    setImagePreview(null);
    setExistingImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData(initialFormState);
    resetImageState();
    setIsModalOpen(true);
  };

  const openEditModal = (article) => {
    setEditingId(article._id);
    setFormData({
      title: article.title,
      summary: article.summary,
      content: article.content || '',
      category: article.category,
      source: article.source || 'Bharat EV',
      isPublished: article.isPublished,
    });
    resetImageState();
    // Set existing image if present
    if (article.imageUrl) {
      const src = article.imageUrl.startsWith('http')
        ? article.imageUrl
        : `${BACKEND_URL}${article.imageUrl}`;
      setExistingImage(src);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const url = editingId ? `${API_BASE_URL}/news/${editingId}` : `${API_BASE_URL}/news`;
      const method = editingId ? 'PUT' : 'POST';

      // Always use FormData so multer can parse the file
      const body = new FormData();
      Object.entries(formData).forEach(([k, v]) => body.append(k, v));
      if (imageFile) body.append('image', imageFile);

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editingId ? 'Article updated!' : 'Article created!');
        setIsModalOpen(false);
        fetchNews();
      } else {
        toast.error(data.message || 'Action failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this news article?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/news/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) { toast.success('Article deleted'); fetchNews(); }
      else toast.error(data.message || 'Failed to delete');
    } catch {
      toast.error('Network error');
    }
  };

  const handleTogglePublish = async (article) => {
    try {
      const token = localStorage.getItem('adminToken');
      const body = new FormData();
      body.append('isPublished', !article.isPublished);
      const res = await fetch(`${API_BASE_URL}/news/${article._id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.data.isPublished ? 'Article published' : 'Article unpublished');
        fetchNews();
      } else toast.error(data.message || 'Failed to update');
    } catch {
      toast.error('Network error');
    }
  };

  const getImageSrc = (article) => {
    if (!article.imageUrl) return null;
    return article.imageUrl.startsWith('http')
      ? article.imageUrl
      : `${BACKEND_URL}${article.imageUrl}`;
  };

  const categoryColors = {
    Policy: 'bg-blue-100 text-blue-700',
    Technology: 'bg-purple-100 text-purple-700',
    Infrastructure: 'bg-orange-100 text-orange-700',
    Tips: 'bg-teal-100 text-teal-700',
    Market: 'bg-pink-100 text-pink-700',
    General: 'bg-gray-100 text-gray-700',
  };

  const filtered = news.filter((a) => {
    const matchSearch =
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.summary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = filterCategory === 'All' || a.category === filterCategory;
    return matchSearch && matchCat;
  });

  const publishedCount = news.filter((a) => a.isPublished).length;

  // The preview to show in modal (new file takes priority over existing)
  const modalImageSrc = imagePreview || existingImage;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">News Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage EV news articles shown to app users</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-[#8CC63F] hover:bg-[#7ab036] text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={18} /> Add Article
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Articles', value: news.length, color: 'text-gray-900' },
          { label: 'Published', value: publishedCount, color: 'text-green-600' },
          { label: 'Drafts', value: news.length - publishedCount, color: 'text-red-500' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-[#8CC63F]">
              <Newspaper size={20} />
            </div>
            <div>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-gray-500 font-medium">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-3 bg-gray-50/50">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8CC63F] focus:ring-1 focus:ring-[#8CC63F] bg-white"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8CC63F] bg-white"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">Article</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Source</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#8CC63F]" />
                    Loading articles...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">No articles found.</td>
                </tr>
              ) : (
                filtered.map((article) => (
                  <tr key={article._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {getImageSrc(article) ? (
                          <img
                            src={getImageSrc(article)}
                            alt=""
                            className="w-12 h-10 rounded-lg object-cover flex-shrink-0 border border-gray-100"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-12 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                            <Newspaper size={18} className="text-[#8CC63F]" />
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-gray-900 max-w-[260px] truncate">{article.title}</div>
                          <div className="text-xs text-gray-500 max-w-[260px] truncate mt-0.5">{article.summary}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${categoryColors[article.category] || 'bg-gray-100 text-gray-700'}`}>
                        {article.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-xs">{article.source}</td>
                    <td className="px-6 py-4 text-gray-600 text-xs">
                      {new Date(article.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${article.isPublished ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {article.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleTogglePublish(article)}
                          className={`p-1.5 rounded-lg transition-colors ${article.isPublished ? 'text-orange-500 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}
                          title={article.isPublished ? 'Unpublish' : 'Publish'}
                        >
                          {article.isPublished ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button onClick={() => openEditModal(article)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(article._id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900">{editingId ? 'Edit Article' : 'Add News Article'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 space-y-4 overflow-y-auto">

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Article Image</label>
                  {modalImageSrc ? (
                    <div className="relative rounded-xl overflow-hidden border border-gray-200 group">
                      <img src={modalImageSrc} alt="preview" className="w-full h-44 object-cover" />
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-white text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-gray-100 transition-colors"
                        >
                          <Upload size={13} /> Change
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="bg-red-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-red-600 transition-colors"
                        >
                          <ImageOff size={13} /> Remove
                        </button>
                      </div>
                      {/* File name badge */}
                      {imageFile && (
                        <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-md max-w-[80%] truncate">
                          {imageFile.name}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-200 rounded-xl h-36 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#8CC63F] hover:bg-emerald-50/30 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                        <Upload size={18} className="text-[#8CC63F]" />
                      </div>
                      <p className="text-sm font-medium text-gray-600">Click to upload image</p>
                      <p className="text-xs text-gray-400">JPG, PNG, WEBP up to 5MB</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text" name="title" required value={formData.title} onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8CC63F] focus:ring-1 focus:ring-[#8CC63F]"
                    placeholder="e.g. New EV Policy 2024 Announced"
                  />
                </div>

                {/* Summary */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Summary *</label>
                  <textarea
                    name="summary" required rows="2" value={formData.summary} onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8CC63F] focus:ring-1 focus:ring-[#8CC63F]"
                    placeholder="Short description shown in the app"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Content</label>
                  <textarea
                    name="content" rows="4" value={formData.content} onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8CC63F] focus:ring-1 focus:ring-[#8CC63F]"
                    placeholder="Full article content (optional)"
                  />
                </div>

                {/* Category + Source */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select name="category" value={formData.category} onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8CC63F]">
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                    <input
                      type="text" name="source" value={formData.source} onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8CC63F] focus:ring-1 focus:ring-[#8CC63F]"
                      placeholder="Bharat EV"
                    />
                  </div>
                </div>

                {/* Publish toggle */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox" id="isPublished" name="isPublished"
                    checked={formData.isPublished} onChange={handleInputChange}
                    className="w-4 h-4 text-[#8CC63F] border-gray-300 rounded focus:ring-[#8CC63F]"
                  />
                  <label htmlFor="isPublished" className="text-sm text-gray-700 font-medium">
                    Publish immediately (visible to app users)
                  </label>
                </div>
              </div>

              <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={actionLoading}
                  className="px-4 py-2 text-sm font-semibold text-white bg-[#8CC63F] hover:bg-[#7ab036] rounded-xl transition-colors flex items-center gap-2 shadow-sm disabled:opacity-70">
                  {actionLoading && <Loader2 size={16} className="animate-spin" />}
                  {editingId ? 'Save Changes' : 'Publish Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsManagementView;
