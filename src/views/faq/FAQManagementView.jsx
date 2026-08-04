import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Filter, HelpCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import Swal from 'sweetalert2';

const FAQManagementView = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'General',
    order: 1,
    isActive: true
  });

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${baseUrl}/faq/admin?category=${categoryFilter}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setFaqs(data.data);
      } else {
        Swal.fire({ icon: 'error', title: 'Oops...', text: 'Failed to load FAQs' });
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      Swal.fire({ icon: 'error', title: 'Network Error', text: 'Failed to fetch FAQs' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, [categoryFilter]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const openModal = (faq = null) => {
    if (faq) {
      setEditingFaq(faq);
      setFormData({
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        order: faq.order,
        isActive: faq.isActive
      });
    } else {
      setEditingFaq(null);
      setFormData({
        question: '',
        answer: '',
        category: 'General',
        order: 1,
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingFaq(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingFaq ? `${baseUrl}/faq/${editingFaq._id}` : `${baseUrl}/faq`;
      const method = editingFaq ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (data.success) {
        Swal.fire({ icon: 'success', title: 'Success!', text: `FAQ ${editingFaq ? 'updated' : 'added'} successfully!`, timer: 2000, showConfirmButton: false });
        closeModal();
        fetchFaqs();
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: data.message || `Failed to ${editingFaq ? 'update' : 'add'} FAQ` });
      }
    } catch (error) {
      console.error('Error saving FAQ:', error);
      Swal.fire({ icon: 'error', title: 'Network Error', text: 'Error saving FAQ' });
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this FAQ!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`${baseUrl}/faq/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        });
        const data = await res.json();
        if (data.success) {
          Swal.fire({ icon: 'success', title: 'Deleted!', text: 'FAQ has been deleted.', timer: 2000, showConfirmButton: false });
          fetchFaqs();
        } else {
          Swal.fire({ icon: 'error', title: 'Failed', text: data.message || 'Failed to delete FAQ' });
        }
      } catch (error) {
        console.error('Error deleting FAQ:', error);
        Swal.fire({ icon: 'error', title: 'Network Error', text: 'Error deleting FAQ' });
      }
    }
  };

  const toggleStatus = async (faq) => {
    try {
      const res = await fetch(`${baseUrl}/faq/${faq._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ ...faq, isActive: !faq.isActive })
      });
      
      const data = await res.json();
      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Status Updated',
          text: `FAQ marked as ${!faq.isActive ? 'Active' : 'Inactive'}`,
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        });
        fetchFaqs();
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to update status', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
      }
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Network error while updating status', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
    }
  };

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <HelpCircle className="w-8 h-8 text-green-600" />
            FAQ Management
          </h1>
          <p className="text-gray-500 mt-1">Manage Frequently Asked Questions for the platform</p>
        </div>
        
        <button 
          onClick={() => openModal()}
          className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm shadow-green-600/20 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add FAQ
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search questions or answers..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent cursor-pointer bg-gray-50"
            >
              <option value="All">All Categories</option>
              <option value="General">General</option>
              <option value="Charging">Charging</option>
              <option value="Payments">Payments</option>
              <option value="Account">Account</option>
              <option value="Partner">Partner</option>
            </select>
          </div>
          <button 
            onClick={fetchFaqs}
            className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-600 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-green-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* FAQ List */}
      <div className="space-y-4">
        {loading && faqs.length === 0 ? (
          <div className="text-center py-12">
            <RefreshCw className="w-10 h-10 text-green-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading FAQs...</p>
          </div>
        ) : filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq) => (
            <div key={faq._id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-md">
                      {faq.category}
                    </span>
                    <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-md">
                      Order: {faq.order}
                    </span>
                    <button 
                      onClick={() => toggleStatus(faq)}
                      className={`text-xs font-medium px-2.5 py-1 rounded-md flex items-center gap-1 cursor-pointer transition-colors ${faq.isActive ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                      title="Click to toggle status"
                    >
                      {faq.isActive ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {faq.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{faq.question}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
                </div>
                
                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                  <button 
                    onClick={() => openModal(faq)}
                    className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(faq._id)}
                    className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center">
            <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">No FAQs Found</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              There are no FAQs matching your current filters or search criteria.
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-800">
                {editingFaq ? 'Edit FAQ' : 'Add New FAQ'}
              </h2>
              <button 
                onClick={closeModal}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Question</label>
                  <input
                    type="text"
                    name="question"
                    required
                    value={formData.question}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="Enter the question..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Answer</label>
                  <textarea
                    name="answer"
                    required
                    rows="4"
                    value={formData.answer}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
                    placeholder="Enter the comprehensive answer..."
                  ></textarea>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent cursor-pointer bg-white"
                    >
                      <option value="General">General</option>
                      <option value="Charging">Charging</option>
                      <option value="Payments">Payments</option>
                      <option value="Account">Account</option>
                      <option value="Partner">Partner</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Display Order</label>
                    <input
                      type="number"
                      name="order"
                      min="1"
                      value={formData.order}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-green-600 rounded border-gray-300 focus:ring-green-500 cursor-pointer"
                  />
                  <label htmlFor="isActive" className="text-sm font-semibold text-gray-700 cursor-pointer">
                    Active (Visible on website and app)
                  </label>
                </div>
              </div>
              
              <div className="mt-8 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 rounded-xl font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl font-medium text-white bg-green-600 hover:bg-green-700 transition-colors shadow-sm shadow-green-600/20"
                >
                  {editingFaq ? 'Save Changes' : 'Add FAQ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FAQManagementView;
