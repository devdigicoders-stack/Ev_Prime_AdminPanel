import React, { useState, useEffect, useRef } from 'react';
import {
  PenSquare, Plus, Trash2, Eye, EyeOff, Search, RefreshCw,
  BookOpen, Clock, CheckCircle, Tag, X, ChevronDown, Save, ArrowLeft,
  Image, Link, Bold, Italic, Underline, Heading1, Heading2, List, ListOrdered, Code, UploadCloud
} from 'lucide-react';
import Swal from 'sweetalert2';

const CATEGORIES = ['All', 'EV News', 'Tips & Tricks', 'Technology', 'Policy & Govt', 'Charging Guides', 'Industry'];

const emptyForm = {
  title: '',
  excerpt: '',
  content: '',
  coverImage: '',
  category: 'EV News',
  tags: '',
  author: 'Bharat EV Prime Team',
  isPublished: false
};

const BlogManagementView = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // 'list' | 'editor'
  const [editingBlog, setEditingBlog] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Cover image mode: 'upload' | 'url'
  const [imageMode, setImageMode] = useState('upload');
  const [uploadingImage, setUploadingImage] = useState(false);

  const editorRef = useRef(null);

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const token = localStorage.getItem('adminToken');
  const authHeader = { Authorization: `Bearer ${token}` };
  const jsonHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (categoryFilter !== 'All') params.set('category', categoryFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchTerm) params.set('search', searchTerm);

      const res = await fetch(`${baseUrl}/blogs/admin/all?${params}`, {
        headers: authHeader
      });
      const data = await res.json();
      if (data.success) setBlogs(data.data);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load blogs' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBlogs(); }, [categoryFilter, statusFilter]);

  const openEditor = (blog = null) => {
    if (blog) {
      setForm({
        title: blog.title,
        excerpt: blog.excerpt,
        content: blog.content,
        coverImage: blog.coverImage || '',
        category: blog.category,
        tags: blog.tags?.join(', ') || '',
        author: blog.author,
        isPublished: blog.isPublished
      });
      setEditingBlog(blog);
      setImageMode(blog.coverImage?.includes('/uploads/') ? 'upload' : 'url');
    } else {
      setForm(emptyForm);
      setEditingBlog(null);
      setImageMode('upload');
    }
    setView('editor');
  };

  const handleSave = async (publishNow = null) => {
    if (!form.title.trim() || !form.excerpt.trim() || !form.content.trim()) {
      Swal.fire({ icon: 'warning', title: 'Required Fields', text: 'Title, excerpt and content are required.' });
      return;
    }

    setSaving(true);
    const payload = {
      ...form,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      isPublished: publishNow !== null ? publishNow : form.isPublished
    };

    try {
      const url = editingBlog ? `${baseUrl}/blogs/${editingBlog._id}` : `${baseUrl}/blogs`;
      const method = editingBlog ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: jsonHeaders, body: JSON.stringify(payload) });
      const data = await res.json();

      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: editingBlog ? 'Updated!' : 'Created!',
          text: `Blog "${data.data.title}" ${editingBlog ? 'updated' : 'created'} successfully.`,
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
        setView('list');
        fetchBlogs();
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: data.message });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Network Error', text: 'Failed to save blog' });
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (blog) => {
    try {
      const res = await fetch(`${baseUrl}/blogs/${blog._id}/publish`, { method: 'PUT', headers: authHeader });
      const data = await res.json();
      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: data.data.isPublished ? 'Published!' : 'Unpublished!',
          text: data.message,
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
        fetchBlogs();
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to toggle publish' });
    }
  };

  const handleDelete = async (blog) => {
    const result = await Swal.fire({
      title: 'Delete Blog?',
      text: `"${blog.title}" will be permanently deleted.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Delete!'
    });
    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`${baseUrl}/blogs/${blog._id}`, { method: 'DELETE', headers: authHeader });
      const data = await res.json();
      if (data.success) {
        Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1500, showConfirmButton: false });
        fetchBlogs();
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to delete blog' });
    }
  };

  // Image upload handler
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch(`${baseUrl}/upload/image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setForm(prev => ({ ...prev, coverImage: data.url }));
        Swal.fire({
          icon: 'success',
          title: 'Uploaded!',
          text: 'Cover image uploaded successfully.',
          timer: 1500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      } else {
        Swal.fire({ icon: 'error', title: 'Upload Failed', text: data.message });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to upload image' });
    } finally {
      setUploadingImage(false);
    }
  };

  // Rich Text Editor Commands
  const runCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setForm(prev => ({ ...prev, content: editorRef.current.innerHTML }));
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
      setForm(prev => ({ ...prev, content: editorRef.current.innerHTML }));
    }
  };

  const publishedCount = blogs.filter(b => b.isPublished).length;
  const draftCount = blogs.filter(b => !b.isPublished).length;

  // ─── EDITOR VIEW ───────────────────────────────────────────────
  if (view === 'editor') {
    return (
      <div className="p-4 sm:p-6 lg:p-8 w-full max-w-5xl mx-auto">
        {/* Editor Header */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <button
            onClick={() => setView('list')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Blogs
          </button>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <PenSquare className="w-6 h-6 text-green-600" />
            {editingBlog ? 'Edit Blog Post' : 'New Blog Post'}
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors flex items-center gap-1.5 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              Save Draft
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm transition-colors flex items-center gap-1.5 disabled:opacity-60"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Publish
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Blog Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-base font-medium"
                  placeholder="Enter an engaging blog title..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Short Excerpt *
                  <span className="text-gray-400 font-normal ml-1">(shown in blog listing)</span>
                </label>
                <textarea
                  rows="2"
                  value={form.excerpt}
                  onChange={e => setForm({ ...form, excerpt: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm resize-none"
                  placeholder="A brief 1-2 line summary of this blog post..."
                />
              </div>

              {/* Rich Text Editor */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Content *
                </label>
                
                <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-green-500">
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
                    ref={editorRef}
                    contentEditable
                    onInput={handleEditorInput}
                    dangerouslySetInnerHTML={{ __html: form.content }}
                    className="min-h-[400px] max-h-[600px] overflow-y-auto p-4 focus:outline-none bg-white text-gray-800 prose prose-sm max-w-none text-sm"
                    placeholder="Start typing your post..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Settings */}
          <div className="space-y-4">
            {/* Cover Image */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Cover Image</label>

              {/* Cover Image Preview */}
              {form.coverImage && (
                <div className="relative group mb-3">
                  <img src={form.coverImage} alt="Cover preview" className="w-full h-32 object-cover rounded-xl border border-gray-100" />
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, coverImage: '' }))}
                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Tab Switcher */}
              <div className="flex border border-gray-200 rounded-xl overflow-hidden mb-3">
                <button
                  type="button"
                  onClick={() => setImageMode('upload')}
                  className={`flex-1 py-1.5 text-xs font-semibold flex items-center justify-center gap-1 transition-all ${imageMode === 'upload' ? 'bg-green-600 text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  Upload Image
                </button>
                <button
                  type="button"
                  onClick={() => setImageMode('url')}
                  className={`flex-1 py-1.5 text-xs font-semibold flex items-center justify-center gap-1 transition-all ${imageMode === 'url' ? 'bg-green-600 text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                >
                  <Link className="w-3.5 h-3.5" />
                  Paste URL
                </button>
              </div>

              {/* Upload Input */}
              {imageMode === 'upload' ? (
                <div className="relative border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-green-500 transition-all">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <UploadCloud className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-500 font-semibold">
                    {uploadingImage ? 'Uploading image...' : 'Click to upload a file'}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">PNG, JPG, WEBP up to 5MB</p>
                </div>
              ) : (
                /* Paste URL Input */
                <input
                  type="url"
                  value={form.coverImage}
                  onChange={e => setForm({ ...form, coverImage: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  placeholder="https://example.com/image.jpg"
                />
              )}
            </div>

            {/* Category */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
              <div className="relative">
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm appearance-none bg-white"
                >
                  {CATEGORIES.filter(c => c !== 'All').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Author */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Author</label>
              <input
                type="text"
                value={form.author}
                onChange={e => setForm({ ...form, author: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                placeholder="Author name"
              />
            </div>

            {/* Tags */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tags
                <span className="text-gray-400 font-normal ml-1">(comma separated)</span>
              </label>
              <input
                type="text"
                value={form.tags}
                onChange={e => setForm({ ...form, tags: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                placeholder="EV, Charging, India"
              />
              {form.tags && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                    <span key={tag} className="bg-green-50 text-green-700 border border-green-200 text-xs px-2.5 py-1 rounded-full font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Status */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Status</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, isPublished: false })}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${!form.isPublished ? 'bg-amber-50 text-amber-700 border-amber-300' : 'bg-gray-50 text-gray-500 border-gray-200'}`}
                >
                  Draft
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, isPublished: true })}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${form.isPublished ? 'bg-green-50 text-green-700 border-green-300' : 'bg-gray-50 text-gray-500 border-gray-200'}`}
                >
                  Published
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── LIST VIEW ─────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-green-600" />
            Blog Management
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Create and manage blog posts for the website</p>
        </div>
        <button
          onClick={() => openEditor()}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          New Blog Post
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
          <div className="text-2xl font-extrabold text-gray-900">{blogs.length}</div>
          <div className="text-xs text-gray-500 font-medium mt-0.5">Total Posts</div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-100 text-center">
          <div className="text-2xl font-extrabold text-emerald-600">{publishedCount}</div>
          <div className="text-xs text-gray-500 font-medium mt-0.5">Published</div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-amber-100 text-center">
          <div className="text-2xl font-extrabold text-amber-500">{draftCount}</div>
          <div className="text-xs text-gray-500 font-medium mt-0.5">Drafts</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search blog titles..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); }}
            onKeyDown={e => e.key === 'Enter' && fetchBlogs()}
          />
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {['all', 'published', 'draft'].map(s => (
            <button key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all capitalize flex items-center gap-1.5 ${statusFilter === s ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {s === 'published' && <CheckCircle className="w-3.5 h-3.5" />}
              {s === 'draft' && <Clock className="w-3.5 h-3.5" />}
              {s === 'all' && <BookOpen className="w-3.5 h-3.5" />}
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 flex-wrap mb-6">
        {CATEGORIES.map(cat => (
          <button key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${categoryFilter === cat ? 'bg-green-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-green-400'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Blog List */}
      {loading ? (
        <div className="text-center py-16">
          <RefreshCw className="w-10 h-10 text-green-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading blog posts...</p>
        </div>
      ) : blogs.length === 0 ? (
        <div className="bg-white p-14 rounded-2xl shadow-sm border border-gray-100 text-center">
          <BookOpen className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-700 mb-2">No Blog Posts Yet</h3>
          <p className="text-gray-400 text-sm mb-6">Start writing your first blog post!</p>
          <button onClick={() => openEditor()} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 mx-auto">
            <Plus className="w-4 h-4" /> Create First Post
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {blogs.map(blog => (
            <div key={blog._id} className={`bg-white rounded-2xl shadow-sm border transition-all hover:shadow-md ${blog.isPublished ? 'border-emerald-100' : 'border-amber-100'}`}>
              {/* Cover image */}
              {blog.coverImage && (
                <img src={blog.coverImage} alt={blog.title} className="w-full h-40 object-cover rounded-t-2xl" onError={e => { e.target.style.display = 'none'; }} />
              )}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${blog.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {blog.isPublished ? 'Published' : 'Draft'}
                      </span>
                      <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-200">{blog.category}</span>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 leading-tight line-clamp-2">{blog.title}</h3>
                  </div>
                </div>

                <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">{blog.excerpt}</p>

                <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                  <span>{blog.author}</span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {blog.views || 0} views
                  </span>
                  <span>{new Date(blog.createdAt).toLocaleDateString('en-IN')}</span>
                </div>

                {/* Tags */}
                {blog.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {blog.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-xs bg-green-50 text-green-700 border border-green-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Tag className="w-2.5 h-2.5" /> {tag}
                      </span>
                    ))}
                    {blog.tags.length > 3 && <span className="text-xs text-gray-400">+{blog.tags.length - 3} more</span>}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <button onClick={() => openEditor(blog)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold transition-colors border border-gray-200">
                    <PenSquare className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => handleTogglePublish(blog)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-colors border ${blog.isPublished ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                    {blog.isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {blog.isPublished ? 'Unpublish' : 'Publish'}
                  </button>
                  <button onClick={() => handleDelete(blog)}
                    className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-semibold transition-colors border border-red-200">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BlogManagementView;
