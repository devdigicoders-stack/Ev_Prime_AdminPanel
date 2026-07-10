import React, { useState } from 'react';
import { Plus, Trash2, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = ['Accessories', 'Cables & Adapters', 'Chargers', 'EV Care', 'Merchandise', 'Services'];

const CategoryManagementView = () => {
  const [categories, setCategories] = useState(CATEGORIES);
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      toast.error('Category name cannot be empty');
      return;
    }
    if (categories.includes(newCategory)) {
      toast.error('Category already exists');
      return;
    }
    setCategories([...categories, newCategory]);
    setNewCategory('');
    toast.success('Category added');
  };

  const handleDeleteCategory = (category) => {
    if (window.confirm(`Delete "${category}"?`)) {
      setCategories(categories.filter(c => c !== category));
      toast.success('Category deleted');
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6 pb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Category Management</h1>
          <p className="text-gray-500 text-sm font-medium">Manage marketplace categories</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex gap-3 mb-6">
          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
            placeholder="Enter new category name..."
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F]"
          />
          <button
            onClick={handleAddCategory}
            disabled={loading}
            className="flex items-center gap-2 bg-[#8CC63F] hover:bg-[#7ab535] text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Add
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((category) => (
            <div
              key={category}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors"
            >
              <div>
                <div className="text-sm font-semibold text-gray-900">{category}</div>
                <div className="text-xs text-gray-500 mt-1">Category</div>
              </div>
              <button
                onClick={() => handleDeleteCategory(category)}
                className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> Categories are currently managed statically. To make them dynamic, connect to a backend API.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CategoryManagementView;
