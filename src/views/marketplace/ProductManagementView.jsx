import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Loader2, X, Search, Package } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const CATEGORIES = ['Accessories', 'Cables & Adapters', 'Chargers', 'EV Care', 'Merchandise', 'Services'];

const ProductModal = ({ product, onClose, onSaved }) => {
  const isEdit = !!product;
  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    mrp: product?.mrp || '',
    category: product?.category || CATEGORIES[0],
    stock: product?.stock || '',
    isActive: product?.isActive !== false,
    isFeatured: product?.isFeatured || false,
    tags: product?.tags?.join(', ') || '',
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.name || !form.price || !form.mrp || !form.description) { toast.error('Fill all required fields'); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      images.forEach(img => fd.append('images', img));

      const url = isEdit ? `${API_BASE_URL}/market/products/${product._id}` : `${API_BASE_URL}/market/products`;
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { Authorization: `Bearer ${token}` }, body: fd });
      const data = await res.json();
      if (data.success) { toast.success(isEdit ? 'Product updated!' : 'Product created!'); onSaved(); onClose(); }
      else toast.error(data.message || 'Failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl my-4">
        <div className="flex justify-between items-center p-5 border-b">
          <h3 className="font-bold text-gray-900 text-lg">{isEdit ? 'Edit Product' : 'Add Product'}</h3>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
          {[['name','Product Name *'],['description','Description *'],['price','Price (₹) *'],['mrp','MRP (₹) *'],['stock','Stock'],['tags','Tags (comma separated)']].map(([key, label]) => (
            <div key={key}>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">{label}</label>
              {key === 'description'
                ? <textarea value={form[key]} onChange={e => setForm(f => ({...f, [key]: e.target.value}))} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none" />
                : <input value={form[key]} onChange={e => setForm(f => ({...f, [key]: e.target.value}))} type={['price','mrp','stock'].includes(key) ? 'number' : 'text'} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
              }
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Category</label>
            <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({...f, isActive: e.target.checked}))} className="w-4 h-4 accent-green-500" /> Active
            </label>
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <input type="checkbox" checked={form.isFeatured} onChange={e => setForm(f => ({...f, isFeatured: e.target.checked}))} className="w-4 h-4 accent-green-500" /> Featured
            </label>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Product Images</label>
            <input type="file" multiple accept="image/*" onChange={e => setImages(Array.from(e.target.files))} className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-green-50 file:text-green-700" />
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t">
          <button onClick={onClose} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-[#8CC63F] hover:bg-[#7ab535] text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            {isEdit ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ProductManagementView = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | product object

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await fetch(`${API_BASE_URL}/market/admin/products${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setProducts(data.data);
    } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    const token = localStorage.getItem('adminToken');
    const res = await fetch(`${API_BASE_URL}/market/products/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.success) { toast.success('Product deleted'); fetchProducts(); }
    else toast.error(data.message || 'Failed');
  };

  return (
    <div className="flex flex-col h-full space-y-6 pb-6">
      {modal && <ProductModal product={modal === 'add' ? null : modal} onClose={() => setModal(null)} onSaved={fetchProducts} />}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Product Management</h1>
          <p className="text-gray-500 text-sm font-medium">Manage marketplace products</p>
        </div>
        <button onClick={() => setModal('add')} className="flex items-center gap-2 bg-[#8CC63F] hover:bg-[#7ab535] text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm">
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F]" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[#8CC63F]" size={36} /></div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Package size={48} className="mb-3 opacity-30" />
            <p className="font-medium">No products found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{['Product', 'Category', 'Price', 'MRP', 'Stock', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map(p => (
                  <tr key={p._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {p.images?.[0]
                          ? <img src={p.images[0].startsWith('http') ? p.images[0] : `${API_BASE_URL.replace('/api','')}${p.images[0]}`} className="w-10 h-10 rounded-lg object-cover" alt="" />
                          : <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center"><Package size={16} className="text-gray-400" /></div>}
                        <div>
                          <div className="text-sm font-semibold text-gray-900 max-w-[160px] truncate">{p.name}</div>
                          {p.isFeatured && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-semibold">Featured</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{p.category}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-gray-900">₹{p.price}</td>
                    <td className="px-5 py-4 text-sm text-gray-400 line-through">₹{p.mrp}</td>
                    <td className="px-5 py-4">
                      <span className={`text-sm font-semibold ${p.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>{p.stock}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setModal(p)} className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"><Pencil size={14} /></button>
                        <button onClick={() => handleDelete(p._id)} className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductManagementView;
