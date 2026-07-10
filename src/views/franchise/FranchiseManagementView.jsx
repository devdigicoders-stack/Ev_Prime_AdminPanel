import { useState, useEffect } from 'react';
import { Search, ChevronDown, Plus, Edit2, Trash2, X, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const FranchiseManagementView = () => {
  const [franchises, setFranchises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals & Action States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [franchiseToDelete, setFranchiseToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [cityFilter, setCityFilter] = useState('All');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, cityFilter]);

  // Form State
  const initialFormState = {
    name: '',
    owner: '',
    location: '',
    city: '',
    status: 'Active',
    stationsCount: 0
  };
  const [formData, setFormData] = useState(initialFormState);
  const [editingId, setEditingId] = useState(null);

  // Fetch Franchises
  const fetchFranchises = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/franchise`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch franchises');
      const data = await response.json();
      setFranchises(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFranchises();
  }, []);

  // Filtered Data
  const filteredFranchises = franchises.filter(franchise => {
    const searchString = `${franchise.name} ${franchise.owner} ${franchise.location}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || franchise.status === statusFilter;
    const matchesCity = cityFilter === 'All' || franchise.city === cityFilter;
    return matchesSearch && matchesStatus && matchesCity;
  });

  // Pagination Calculation
  const totalPages = Math.ceil(filteredFranchises.length / itemsPerPage);
  const paginatedFranchises = filteredFranchises.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const uniqueCities = ['All', ...new Set(franchises.map(f => f.city).filter(Boolean))];

  // Handle Input Change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Add Franchise
  const handleAddSubmit = async () => {
    if (!formData.name || !formData.owner || !formData.location || !formData.city) {
      alert("Please fill all required fields (Name, Owner, Location, City).");
      return;
    }
    
    setActionLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/franchise`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          stationsCount: Number(formData.stationsCount)
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to create franchise');
      
      toast.success('Franchise created successfully');
      await fetchFranchises();
      setIsAddModalOpen(false);
      setFormData(initialFormState);
    } catch (err) {
      toast.error(err.message || 'Failed to create franchise');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (franchise) => {
    setEditingId(franchise._id);
    setFormData({
      name: franchise.name || '',
      owner: franchise.owner || '',
      location: franchise.location || '',
      city: franchise.city || '',
      status: franchise.status || 'Active',
      stationsCount: franchise.stationsCount || 0
    });
    setIsEditModalOpen(true);
  };

  // Edit Franchise
  const handleEditSubmit = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/franchise/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          stationsCount: Number(formData.stationsCount)
        })
      });

      if (!response.ok) throw new Error('Failed to update franchise');
      
      toast.success('Franchise updated successfully');
      await fetchFranchises();
      setIsEditModalOpen(false);
      setFormData(initialFormState);
    } catch (err) {
      toast.error(err.message || 'Failed to update franchise');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Franchise
  const confirmDelete = (franchise) => {
    setFranchiseToDelete(franchise);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!franchiseToDelete) return;
    
    setDeleteLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/franchise/${franchiseToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete franchise');
      
      toast.success('Franchise deleted successfully');
      await fetchFranchises(); // Refresh the list
      setIsDeleteModalOpen(false);
      setFranchiseToDelete(null);
    } catch (err) {
      toast.error(err.message || 'Failed to delete franchise');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Format Date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-GB', options);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'text-emerald-500';
      case 'Inactive': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Header Area */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Franchise Management</h1>
        <p className="text-gray-500 text-sm font-medium">Manage all franchises.</p>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col flex-1">
        
        {/* Toolbar */}
        <div className="p-4 sm:p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-gray-100">
          
          {/* Search */}
          <div className="relative w-full xl:max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search franchises..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-[#8CC63F] transition-all"
            />
          </div>

          {/* Filters & Actions */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full xl:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto appearance-none bg-white border border-gray-200 rounded-xl pl-4 pr-10 py-2.5 text-sm text-gray-600 font-medium focus:outline-none focus:ring-2 focus:ring-[#8CC63F] hover:bg-gray-50 transition"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            
            <div className="relative flex-1 sm:flex-none">
              <select 
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full sm:w-auto appearance-none bg-white border border-gray-200 rounded-xl pl-4 pr-10 py-2.5 text-sm text-gray-600 font-medium focus:outline-none focus:ring-2 focus:ring-[#8CC63F] hover:bg-gray-50 transition"
              >
                {uniqueCities.map(city => (
                  <option key={city} value={city}>{city === 'All' ? 'All Cities' : city}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            
            <button 
              onClick={() => {
                setFormData(initialFormState);
                setIsAddModalOpen(true);
              }}
              className="w-full sm:w-auto bg-[#8CC63F] hover:bg-[#116631] text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <Plus size={18} strokeWidth={2.5} /> Add Franchise
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto w-full relative flex-1 min-h-[400px]">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-20">
               <Loader2 className="animate-spin text-[#8CC63F]" size={32} />
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex items-center justify-center text-red-500 font-medium z-20">
               {error}
            </div>
          ) : filteredFranchises.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500 font-medium z-20">
               No franchises found matching the criteria.
            </div>
          ) : null}

          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="sticky top-0 bg-white z-10 shadow-sm">
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-white">Franchise Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-white">Owner</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-white">Location</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-white">City</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-white">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center bg-white">Stations</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-white">Joined On</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center bg-white">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {!loading && paginatedFranchises.map((franchise) => (
                <tr key={franchise._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">{franchise.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-600 whitespace-nowrap">{franchise.owner}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-600 whitespace-nowrap">{franchise.location}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-600 whitespace-nowrap">{franchise.city}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-semibold whitespace-nowrap ${getStatusColor(franchise.status)}`}>
                      {franchise.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">{franchise.stationsCount}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-600 whitespace-nowrap">{formatDate(franchise.createdAt)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => openEditModal(franchise)} className="text-gray-400 hover:text-emerald-600 transition-colors p-1.5 rounded-lg hover:bg-emerald-50">
                        <Edit2 size={16} strokeWidth={2.5} />
                      </button>
                      <button onClick={() => confirmDelete(franchise)} className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50">
                        <Trash2 size={16} strokeWidth={2.5} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredFranchises.length > 0 && (
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100 bg-white">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-600 font-medium w-full sm:w-auto justify-between sm:justify-start order-2 sm:order-1">
              <span className="whitespace-nowrap">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredFranchises.length)} of {filteredFranchises.length}
              </span>
              <div className="relative ml-2 border-l border-gray-200 pl-2">
                <select 
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="appearance-none bg-transparent pl-2 pr-6 py-1 focus:outline-none cursor-pointer text-gray-700"
                >
                  <option value={5}>5 / page</option>
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                </select>
                <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-1 w-full sm:w-auto order-1 sm:order-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 text-gray-400 hover:text-gray-700 transition disabled:opacity-50"
              >
                <ChevronLeft size={18} />
              </button>
              
              <div className="flex items-center gap-1 max-w-[150px] sm:max-w-none overflow-x-auto no-scrollbar">
                {[...Array(totalPages)].map((_, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setCurrentPage(idx + 1)}
                    className={`min-w-[32px] h-8 flex items-center justify-center rounded-lg font-medium text-sm transition ${
                      currentPage === idx + 1 
                        ? 'bg-[#8CC63F] text-white font-semibold' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-1.5 text-gray-400 hover:text-gray-700 transition disabled:opacity-50"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Franchise Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="text-lg font-semibold text-gray-900">{isEditModalOpen ? 'Edit Franchise' : 'Add New Franchise'}</h2>
              <button 
                onClick={() => {
                  setIsAddModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="text-gray-400 hover:bg-gray-100 hover:text-gray-600 p-1.5 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Modal Body / Form */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Franchise Name *</label>
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Green Future EV"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Owner Name *</label>
                  <input 
                    type="text" 
                    name="owner"
                    value={formData.owner}
                    onChange={handleInputChange}
                    placeholder="e.g. Sanjay Mehta"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Location / Area *</label>
                  <input 
                    type="text" 
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g. Connaught Place"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all shadow-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">City *</label>
                  <input 
                    type="text" 
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="e.g. Delhi"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Number of Stations</label>
                  <input 
                    type="number" 
                    name="stationsCount"
                    value={formData.stationsCount}
                    onChange={handleInputChange}
                    placeholder="e.g. 6"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all shadow-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Status</label>
                  <div className="relative">
                    <select 
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all shadow-sm appearance-none bg-white"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3 sticky bottom-0 rounded-b-2xl">
              <button 
                onClick={() => {
                  setIsAddModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                disabled={actionLoading}
                className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-200 bg-white border border-gray-200 rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={isEditModalOpen ? handleEditSubmit : handleAddSubmit}
                disabled={actionLoading}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-[#8CC63F] hover:bg-[#116631] rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading && <Loader2 className="animate-spin" size={16} />}
                {isEditModalOpen ? 'Save Changes' : 'Add Franchise'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-2 text-red-500">
                <AlertCircle size={32} strokeWidth={2} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Delete Franchise?</h2>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">
                Are you sure you want to permanently delete <strong className="text-gray-800">{franchiseToDelete?.name}</strong>? This action cannot be undone.
              </p>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-center gap-3">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={deleteLoading}
                className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-200 bg-white border border-gray-200 rounded-xl transition-colors shadow-sm disabled:opacity-50 w-full"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                disabled={deleteLoading}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 w-full"
              >
                {deleteLoading ? <Loader2 className="animate-spin" size={16} /> : 'Delete Franchise'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FranchiseManagementView;
