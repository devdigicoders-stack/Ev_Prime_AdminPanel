import { useState, useEffect, useCallback } from 'react';
import { Search, ChevronDown, Plus, Edit2, Trash2, X, Loader2, AlertCircle, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const libraries = ['places'];

const StationManagementView = () => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: libraries
  });

  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals & Action States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [stationToView, setStationToView] = useState(null);
  
  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [stationToDelete, setStationToDelete] = useState(null);
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
    location: '',
    city: '',
    address: '',
    latitude: '',
    longitude: '',
    powerCapacity: '',
    connectors: '',
    partner: '',
    status: 'Active',
    image: '',
    connectorTypes: [],
    amenities: [],
    openHours: '24/7',
  };
  const [formData, setFormData] = useState(initialFormState);
  const [editingId, setEditingId] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  // Fetch Stations
  const fetchStations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/station`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch stations');
      const data = await response.json();
      setStations(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();
  }, []);

  // Filtered Data
  const filteredStations = stations.filter(station => {
    const matchesSearch = station.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          station.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || station.status === statusFilter;
    const matchesCity = cityFilter === 'All' || station.city === cityFilter;
    return matchesSearch && matchesStatus && matchesCity;
  });

  const uniqueCities = ['All', ...new Set(stations.map(s => s.city))];

  // Pagination Calculation
  const totalPages = Math.ceil(filteredStations.length / itemsPerPage);
  const paginatedStations = filteredStations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Handle Input Change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMapClick = useCallback((e) => {
    setFormData(prev => ({
      ...prev,
      latitude: e.latLng.lat(),
      longitude: e.latLng.lng()
    }));
  }, []);

  const [autocomplete, setAutocomplete] = useState(null);

  const onLoadAutocomplete = (autocompleteInstance) => {
    setAutocomplete(autocompleteInstance);
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        setFormData(prev => ({
          ...prev,
          location: place.name || place.formatted_address || prev.location,
          address: place.formatted_address || prev.address,
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng()
        }));
      }
    } else {
      console.log('Autocomplete is not loaded yet!');
    }
  };

  // Add Station
  const handleAddSubmit = async () => {
    if (!formData.name || !formData.location || !formData.city || !formData.connectors || !formData.partner) {
      alert("Please fill all required fields (Name, Location, City, Connectors, Partner).");
      return;
    }
    setActionLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'connectorTypes' || key === 'amenities') {
          submitData.append(key, JSON.stringify(formData[key]));
        } else if (formData[key] !== undefined && formData[key] !== '') {
          submitData.append(key, formData[key]);
        }
      });
      if (imageFile) submitData.append('image', imageFile);
      const response = await fetch(`${API_BASE_URL}/station`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: submitData
      });
      if (!response.ok) throw new Error('Failed to create station');
      toast.success('Station created successfully');
      await fetchStations();
      setIsAddModalOpen(false);
      setFormData(initialFormState);
      setImageFile(null);
    } catch (err) {
      toast.error(err.message || 'Failed to create station');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (station) => {
    setEditingId(station._id);
    setFormData({
      name: station.name || '',
      location: station.location || '',
      city: station.city || '',
      address: station.address || '',
      latitude: station.latitude || '',
      longitude: station.longitude || '',
      powerCapacity: station.powerCapacity || '',
      connectors: station.connectors || '',
      partner: station.partner || '',
      status: station.status || 'Active',
      image: station.image || '',
      connectorTypes: station.connectorTypes || [],
      amenities: station.amenities || [],
      openHours: station.openHours || '24/7',
    });
    setImageFile(null);
    setIsEditModalOpen(true);
  };

  // Edit Station
  const handleEditSubmit = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'connectorTypes' || key === 'amenities') {
          submitData.append(key, JSON.stringify(formData[key]));
        } else if (formData[key] !== undefined && formData[key] !== '') {
          submitData.append(key, formData[key]);
        }
      });
      if (imageFile) submitData.append('image', imageFile);
      const response = await fetch(`${API_BASE_URL}/station/${editingId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: submitData
      });
      if (!response.ok) throw new Error('Failed to update station');
      toast.success('Station updated successfully');
      await fetchStations();
      setIsEditModalOpen(false);
      setFormData(initialFormState);
      setImageFile(null);
    } catch (err) {
      toast.error(err.message || 'Failed to update station');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Station
  const confirmDelete = (station) => {
    setStationToDelete(station);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!stationToDelete) return;
    
    setDeleteLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/station/${stationToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete station');
      toast.success('Station deleted successfully');
      await fetchStations(); // Refresh the list
      setIsDeleteModalOpen(false);
      setStationToDelete(null);
    } catch (err) {
      toast.error(err.message || 'Failed to delete station');
    } finally {
      setDeleteLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'text-emerald-500';
      case 'Maintenance': return 'text-amber-500';
      case 'Offline': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Header Area */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Station Management</h1>
        <p className="text-gray-500 text-sm font-medium">Manage all charging stations.</p>
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
              placeholder="Search stations by name or location..." 
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
                <option value="Maintenance">Maintenance</option>
                <option value="Offline">Offline</option>
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
              <Plus size={18} strokeWidth={2.5} /> Add Station
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
          ) : filteredStations.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500 font-medium z-20">
               No stations found matching the criteria.
            </div>
          ) : null}

          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="sticky top-0 bg-white z-10 shadow-sm">
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-white">Station Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-white">Location</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-white">City</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-white">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-white">Connectors</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-white">Partner</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center bg-white">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {!loading && paginatedStations.map((station) => (
                <tr key={station._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">{station.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-600 whitespace-nowrap">{station.location}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-600 whitespace-nowrap">{station.city}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-semibold whitespace-nowrap ${getStatusColor(station.status)}`}>
                      {station.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">{station.connectors}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-600 whitespace-nowrap">{station.partner}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => { setStationToView(station); setIsViewModalOpen(true); }} className="text-gray-400 hover:text-blue-600 transition-colors">
                        <Eye size={16} strokeWidth={2.5} />
                      </button>
                      <button onClick={() => openEditModal(station)} className="text-gray-400 hover:text-emerald-600 transition-colors">
                        <Edit2 size={16} strokeWidth={2.5} />
                      </button>
                      <button onClick={() => confirmDelete(station)} className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50">
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
        {filteredStations.length > 0 && (
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100 bg-white">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-600 font-medium w-full sm:w-auto justify-between sm:justify-start order-2 sm:order-1">
              <span className="whitespace-nowrap">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredStations.length)} of {filteredStations.length}
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

      {/* View Station Modal */}
      {isViewModalOpen && stationToView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="text-lg font-semibold text-gray-900">Station Details</h2>
              <button 
                onClick={() => {
                  setIsViewModalOpen(false);
                  setStationToView(null);
                }}
                className="text-gray-400 hover:bg-gray-100 hover:text-gray-600 p-1.5 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/3 flex flex-col items-center">
                  <div className="w-full aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm flex items-center justify-center">
                    {stationToView.image ? (
                      <img src={`${API_BASE_URL.replace('/api', '')}${stationToView.image}`} alt={stationToView.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-400 text-sm font-medium">No Image</span>
                    )}
                  </div>
                  <span className={`mt-6 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    stationToView.status === 'Active' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                    stationToView.status === 'Maintenance' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                    'bg-red-100 text-red-700 border border-red-200'
                  }`}>
                    {stationToView.status}
                  </span>
                </div>

                <div className="w-full md:w-2/3 space-y-5">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{stationToView.name}</h3>
                    <p className="text-sm text-gray-500 mt-1.5 flex items-center gap-1.5">
                      <span className="font-semibold text-gray-700">{stationToView.location}</span> • {stationToView.city}
                    </p>
                  </div>
                  
                  {stationToView.address && (
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-sm text-gray-600 leading-relaxed"><strong className="text-gray-900">Full Address:</strong> {stationToView.address}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-5 pt-4 border-t border-gray-100">
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Partner</p>
                      <p className="font-semibold text-gray-900 mt-1">{stationToView.partner}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Connectors</p>
                      <p className="font-semibold text-gray-900 mt-1">{stationToView.connectors}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Power Capacity</p>
                      <p className="font-semibold text-gray-900 mt-1">{stationToView.powerCapacity ? `${stationToView.powerCapacity} kW` : 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Coordinates</p>
                      <p className="font-semibold text-gray-900 mt-1 text-sm">{stationToView.latitude?.toFixed(4) || 'N/A'}, {stationToView.longitude?.toFixed(4) || 'N/A'}</p>
                    </div>
                  </div>
                  {stationToView.connectorTypes?.length > 0 && (
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-3">Connector Pricing</p>
                      <div className="space-y-2">
                        {stationToView.connectorTypes.map((ct, i) => (
                          <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-100">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-lg">{ct.chargeType}</span>
                              <span className="font-semibold text-gray-800 text-sm">{ct.type}</span>
                              <span className="text-xs text-gray-500">{ct.powerKw} kW</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-gray-500">{ct.availableCount}/{ct.totalCount} avail.</span>
                              <span className="font-bold text-[#8CC63F]">₹{ct.pricePerUnit}/kWh</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Station Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="text-lg font-semibold text-gray-900">{isEditModalOpen ? 'Edit Station' : 'Add New Station'}</h2>
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
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Station Name *</label>
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Green Park Station"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Location / Area *</label>
                  {isLoaded ? (
                    <Autocomplete
                      onLoad={onLoadAutocomplete}
                      onPlaceChanged={onPlaceChanged}
                    >
                      <input 
                        type="text" 
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="e.g. Green Park"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all shadow-sm"
                      />
                    </Autocomplete>
                  ) : (
                    <input 
                      type="text" 
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="e.g. Green Park"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all shadow-sm"
                    />
                  )}
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
                
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Full Address</label>
                  <input 
                    type="text" 
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Complete address details"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all shadow-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Pin Location on Map</label>
                  <div className="h-64 w-full rounded-xl overflow-hidden border border-gray-200">
                    {isLoaded ? (
                      <GoogleMap
                        mapContainerStyle={{ width: '100%', height: '100%' }}
                        center={
                          formData.latitude && formData.longitude
                            ? { lat: Number(formData.latitude), lng: Number(formData.longitude) }
                            : { lat: 20.5937, lng: 78.9629 } // Default to India
                        }
                        zoom={formData.latitude && formData.longitude ? 15 : 4}
                        onClick={handleMapClick}
                      >
                        {formData.latitude && formData.longitude && (
                          <Marker position={{ lat: Number(formData.latitude), lng: Number(formData.longitude) }} />
                        )}
                      </GoogleMap>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <Loader2 className="animate-spin text-gray-400" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Click on the map to automatically set Latitude & Longitude.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Latitude</label>
                  <input 
                    type="number" 
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleInputChange}
                    step="any"
                    placeholder="e.g. 28.5562"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Longitude</label>
                  <input 
                    type="number" 
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleInputChange}
                    step="any"
                    placeholder="e.g. 77.2065"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Partner / Operator *</label>
                  <input 
                    type="text" 
                    name="partner"
                    value={formData.partner}
                    onChange={handleInputChange}
                    placeholder="e.g. Green Energy"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Number of Connectors *</label>
                  <input 
                    type="number" 
                    name="connectors"
                    value={formData.connectors}
                    onChange={handleInputChange}
                    placeholder="e.g. 6"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all shadow-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Power Capacity (kW)</label>
                  <input 
                    type="number" 
                    name="powerCapacity"
                    value={formData.powerCapacity}
                    onChange={handleInputChange}
                    placeholder="e.g. 50"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Status</label>
                  <div className="relative">
                    <select 
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all shadow-sm appearance-none bg-white"
                    >
                      <option value="Active">Active</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Offline">Offline</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Connector Types & Pricing */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">Connector Types & Pricing</label>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, connectorTypes: [...prev.connectorTypes, { type: 'CCS2', powerKw: 50, pricePerUnit: 18, totalCount: 1, availableCount: 1, chargeType: 'DC' }] }))}
                      className="flex items-center gap-1 px-3 py-1 bg-[#8CC63F]/10 text-[#8CC63F] rounded-lg text-xs font-bold hover:bg-[#8CC63F]/20"
                    >
                      <Plus size={12} /> Add Connector
                    </button>
                  </div>
                  {formData.connectorTypes.length === 0 && (
                    <p className="text-xs text-gray-400 italic mb-2">No connectors added — add at least one connector with pricing</p>
                  )}
                  <div className="space-y-2">
                    {formData.connectorTypes.map((ct, i) => (
                      <div key={i} className="grid grid-cols-6 gap-2 bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <div>
                          <label className="text-xs text-gray-500">Type</label>
                          <select value={ct.type} onChange={e => {
                            const updated = [...formData.connectorTypes];
                            updated[i] = { ...updated[i], type: e.target.value };
                            setFormData(p => ({ ...p, connectorTypes: updated }));
                          }} className="mt-1 w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#8CC63F]">
                            {['CCS2','CHAdeMO','Type2','AC Type1','GB/T','Bharat AC','Bharat DC'].map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">AC/DC</label>
                          <select value={ct.chargeType} onChange={e => {
                            const updated = [...formData.connectorTypes];
                            updated[i] = { ...updated[i], chargeType: e.target.value };
                            setFormData(p => ({ ...p, connectorTypes: updated }));
                          }} className="mt-1 w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#8CC63F]">
                            <option value="DC">DC</option>
                            <option value="AC">AC</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Power (kW)</label>
                          <input type="number" value={ct.powerKw} onChange={e => {
                            const updated = [...formData.connectorTypes];
                            updated[i] = { ...updated[i], powerKw: parseFloat(e.target.value) || 0 };
                            setFormData(p => ({ ...p, connectorTypes: updated }));
                          }} className="mt-1 w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#8CC63F]" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">₹/kWh</label>
                          <input type="number" value={ct.pricePerUnit} onChange={e => {
                            const updated = [...formData.connectorTypes];
                            updated[i] = { ...updated[i], pricePerUnit: parseFloat(e.target.value) || 0 };
                            setFormData(p => ({ ...p, connectorTypes: updated }));
                          }} className="mt-1 w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#8CC63F]" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Total</label>
                          <input type="number" value={ct.totalCount} onChange={e => {
                            const updated = [...formData.connectorTypes];
                            updated[i] = { ...updated[i], totalCount: parseInt(e.target.value) || 1, availableCount: parseInt(e.target.value) || 1 };
                            setFormData(p => ({ ...p, connectorTypes: updated }));
                          }} className="mt-1 w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#8CC63F]" />
                        </div>
                        <div className="flex items-end">
                          <button type="button" onClick={() => setFormData(p => ({ ...p, connectorTypes: p.connectorTypes.filter((_, idx) => idx !== i) }))}
                            className="w-full py-1.5 bg-red-50 text-red-500 rounded-lg text-xs font-bold hover:bg-red-100">
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Open Hours */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Open Hours</label>
                  <input type="text" name="openHours" value={formData.openHours} onChange={handleInputChange}
                    placeholder="e.g. 24/7 or 6AM-10PM"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] shadow-sm" />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Station Image</label>
                  <input 
                    type="file" 
                    name="image"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files[0])}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all shadow-sm bg-white"
                  />
                  {formData.image && !imageFile && (
                    <div className="mt-2 text-sm text-gray-500 flex items-center">
                      <span>Current image:</span>
                      <a href={`${API_BASE_URL.replace('/api', '')}${formData.image}`} target="_blank" rel="noreferrer" className="ml-2 text-[#8CC63F] hover:underline font-medium">View Image</a>
                    </div>
                  )}
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
                {isEditModalOpen ? 'Save Changes' : 'Add Station'}
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
              <h2 className="text-xl font-bold text-gray-900">Delete Station?</h2>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">
                Are you sure you want to permanently delete <strong className="text-gray-800">{stationToDelete?.name}</strong>? This action cannot be undone.
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
                {deleteLoading ? <Loader2 className="animate-spin" size={16} /> : 'Delete Station'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StationManagementView;
