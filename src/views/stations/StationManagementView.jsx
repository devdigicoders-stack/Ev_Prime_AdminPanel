import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Search, ChevronDown, Plus, Edit2, Trash2, X, Loader2, AlertCircle, 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Eye, Zap, BatteryCharging, CheckCircle2, 
  AlertTriangle, PowerOff, Wrench, Activity, RotateCcw, Building2, WifiOff
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const libraries = ['places'];

// Operational Health Status Styling for Chargers & Connectors
const CHARGER_HEALTH_STYLES = {
  Available: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    label: 'Available',
    icon: CheckCircle2
  },
  Charging: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500 animate-pulse',
    label: 'Charging',
    icon: BatteryCharging
  },
  Offline: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
    dot: 'bg-slate-400',
    label: 'Offline',
    icon: PowerOff
  },
  Fault: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
    label: 'Fault',
    icon: AlertTriangle
  },
  Maintenance: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    label: 'Maintenance',
    icon: Wrench
  }
};

const getChargerHealthBadge = (status) => {
  return CHARGER_HEALTH_STYLES[status] || CHARGER_HEALTH_STYLES.Available;
};

const StationManagementView = () => {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
  const [chargerActionLoading, setChargerActionLoading] = useState(null);
  
  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [stationToDelete, setStationToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Filters & Search (8 Advanced Criteria)
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'All');
  const [cityFilter, setCityFilter] = useState('All');
  const [stateFilter, setStateFilter] = useState('All');
  const [partnerFilter, setPartnerFilter] = useState('All');
  const [chargerTypeFilter, setChargerTypeFilter] = useState('All');
  const [connectorTypeFilter, setConnectorTypeFilter] = useState('All');
  const [powerCapacityFilter, setPowerCapacityFilter] = useState('All');
  const [availabilityFilter, setAvailabilityFilter] = useState('All');

  // Sync status, partner, and search filter with URL query params
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam) {
      setStatusFilter(statusParam);
    }
    const partnerParam = searchParams.get('partner');
    if (partnerParam) {
      setPartnerFilter(partnerParam);
    }
    const searchParam = searchParams.get('search');
    if (searchParam) {
      setSearchTerm(searchParam);
    }
  }, [searchParams]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Reset pagination on any filter or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm, statusFilter, cityFilter, stateFilter, partnerFilter,
    chargerTypeFilter, connectorTypeFilter, powerCapacityFilter, availabilityFilter
  ]);

  // Check if any filter is active
  const isAnyFilterActive = Boolean(
    searchTerm.trim() ||
    statusFilter !== 'All' ||
    cityFilter !== 'All' ||
    stateFilter !== 'All' ||
    partnerFilter !== 'All' ||
    chargerTypeFilter !== 'All' ||
    connectorTypeFilter !== 'All' ||
    powerCapacityFilter !== 'All' ||
    availabilityFilter !== 'All'
  );

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setCityFilter('All');
    setStateFilter('All');
    setPartnerFilter('All');
    setChargerTypeFilter('All');
    setConnectorTypeFilter('All');
    setPowerCapacityFilter('All');
    setAvailabilityFilter('All');
    setCurrentPage(1);
  };

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

  // Station Performance Summary KPIs State
  const [summaryKpis, setSummaryKpis] = useState(null);
  const [kpisLoading, setKpisLoading] = useState(false);

  // Fetch Station Performance Summary KPIs from Backend API
  const fetchStationSummary = async () => {
    try {
      setKpisLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/station/summary`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const resData = await response.json();
        setSummaryKpis(resData.data || resData);
      }
    } catch (err) {
      console.warn('Failed to fetch station summary KPIs, using live reactive fallback:', err);
    } finally {
      setKpisLoading(false);
    }
  };

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
      fetchStationSummary();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();
    fetchStationSummary();
  }, []);

  // Open View Modal and fetch fresh live operational telemetry
  const handleOpenViewModal = async (station) => {
    setStationToView(station);
    setIsViewModalOpen(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/station/${station._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const freshData = await response.json();
        setStationToView(freshData);
        setStations(prev => prev.map(s => s._id === freshData._id ? { ...s, ...freshData } : s));
      }
    } catch (err) {
      console.warn('Failed to fetch fresh station telemetry:', err);
    }
  };

  // Live charger / connector operational status override
  const handleUpdateChargerStatus = async (stationId, chargerId, newStatus) => {
    setChargerActionLoading(chargerId);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/station/${stationId}/charger/${chargerId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success && data.data) {
        toast.success(`Charger ${chargerId} status updated to ${newStatus}`);
        setStationToView(data.data);
        setStations(prev => prev.map(s => s._id === stationId ? { ...s, ...data.data } : s));
        fetchStationSummary();
      } else {
        toast.error(data.message || 'Failed to update charger status');
      }
    } catch (err) {
      toast.error('Network error updating charger status');
    } finally {
      setChargerActionLoading(null);
    }
  };

  // Filtered Data (Multi-field Search & 8 Advanced Operational Filters)
  const filteredStations = stations.filter(station => {
    // 1. Single search box searching across Station Name, Station ID, Location/Address, City, and Partner
    const term = searchTerm.trim().toLowerCase();
    const stationIdStr = (station.stationId || `STN-${station._id?.slice(-4).toUpperCase() || ''}`).toLowerCase();
    const matchesSearch = !term || (
      station.name?.toLowerCase().includes(term) ||
      stationIdStr.includes(term) ||
      station.location?.toLowerCase().includes(term) ||
      station.address?.toLowerCase().includes(term) ||
      station.city?.toLowerCase().includes(term) ||
      station.partner?.toLowerCase().includes(term)
    );

    // 2. Status (Station Master Status)
    const matchesStatus = statusFilter === 'All' || (() => {
      const sf = statusFilter.toLowerCase();
      const st = (station.status || '').toLowerCase();
      if (sf === 'inactive') {
        return st === 'inactive' || st === 'offline';
      }
      return st === sf;
    })();

    // 3. City
    const matchesCity = cityFilter === 'All' || station.city === cityFilter;

    // 4. State
    const stState = station.state || 'Uttar Pradesh';
    const matchesState = stateFilter === 'All' || stState === stateFilter;

    // 5. Partner
    const matchesPartner = partnerFilter === 'All' || station.partner === partnerFilter;

    // 6. Charger Type (AC / DC)
    const matchesChargerType = chargerTypeFilter === 'All' || (() => {
      const type = chargerTypeFilter.toUpperCase();
      if (Array.isArray(station.chargers) && station.chargers.length > 0) {
        return station.chargers.some(chg => {
          if (chg.connectors && chg.connectors.length > 0) {
            return chg.connectors.some(c => c.chargeType?.toUpperCase() === type);
          }
          if (type === 'DC') return (chg.powerKw || 0) > 22;
          if (type === 'AC') return (chg.powerKw || 0) <= 22;
          return false;
        });
      }
      if (Array.isArray(station.connectorTypes) && station.connectorTypes.length > 0) {
        return station.connectorTypes.some(ct => ct.chargeType?.toUpperCase() === type);
      }
      if (type === 'DC') return (station.powerCapacity || 0) > 22;
      if (type === 'AC') return (station.powerCapacity || 0) <= 22;
      return false;
    })();

    // 7. Connector Type (CCS2, Type 2, CHAdeMO, GB/T)
    const matchesConnectorType = connectorTypeFilter === 'All' || (() => {
      const target = connectorTypeFilter.toLowerCase();
      if (Array.isArray(station.chargers) && station.chargers.length > 0) {
        return station.chargers.some(chg => 
          chg.connectors?.some(c => c.type?.toLowerCase().includes(target))
        );
      }
      if (Array.isArray(station.connectorTypes) && station.connectorTypes.length > 0) {
        return station.connectorTypes.some(ct => ct.type?.toLowerCase().includes(target));
      }
      return false;
    })();

    // 8. Power Capacity Range
    const matchesPowerCapacity = powerCapacityFilter === 'All' || (() => {
      const maxPower = station.powerCapacity || 
        (station.chargers?.reduce((max, c) => Math.max(max, c.powerKw || 0), 0)) || 22;
      
      switch (powerCapacityFilter) {
        case '7–22 kW':
          return maxPower >= 7 && maxPower <= 22;
        case '22–60 kW':
          return maxPower > 22 && maxPower <= 60;
        case '60–120 kW':
          return maxPower > 60 && maxPower <= 120;
        case '120+ kW':
          return maxPower > 120;
        default:
          return true;
      }
    })();

    // 9. Availability (Hardware / Connector Health Status)
    const matchesAvailability = availabilityFilter === 'All' || (() => {
      const norm = availabilityFilter.toLowerCase();
      // Check healthSummary counts if available
      if (station.healthSummary) {
        if (norm === 'available' && (station.healthSummary.available > 0)) return true;
        if (norm === 'charging' && (station.healthSummary.charging > 0)) return true;
        if (norm === 'offline' && (station.healthSummary.offline > 0)) return true;
        if (norm === 'fault' && (station.healthSummary.fault > 0)) return true;
        if (norm === 'maintenance' && (station.healthSummary.maintenance > 0)) return true;
      }
      // Check individual chargers & connectors
      if (Array.isArray(station.chargers) && station.chargers.length > 0) {
        return station.chargers.some(chg => {
          if (chg.status?.toLowerCase() === norm) return true;
          return chg.connectors?.some(conn => conn.status?.toLowerCase() === norm);
        });
      }
      // Fallback on station level
      if (norm === 'available' && station.status === 'Active') return true;
      if (norm === 'maintenance' && station.status === 'Maintenance') return true;
      if (norm === 'offline' && station.status === 'Offline') return true;
      return false;
    })();

    return (
      matchesSearch &&
      matchesStatus &&
      matchesCity &&
      matchesState &&
      matchesPartner &&
      matchesChargerType &&
      matchesConnectorType &&
      matchesPowerCapacity &&
      matchesAvailability
    );
  });

  // Dynamic Station Performance KPI Calculations (API data + reactive fallback from state)
  const totalStationsCount = summaryKpis?.totalStations ?? stations.length;
  const activeStationsCount = summaryKpis?.activeStations ?? stations.filter(s => (s.status || '').toLowerCase() === 'active').length;
  const maintenanceStationsCount = summaryKpis?.maintenanceStations ?? stations.filter(s => (s.status || '').toLowerCase() === 'maintenance').length;
  const inactiveStationsCount = summaryKpis?.inactiveStations ?? Math.max(0, totalStationsCount - activeStationsCount - maintenanceStationsCount);

  // Charger level calculations (Hardware / Gun health - strictly distinct from station status)
  const totalChargersCount = summaryKpis?.totalChargers ?? stations.reduce((acc, s) => {
    return acc + (Array.isArray(s.chargers) && s.chargers.length > 0 ? s.chargers.length : (Number(s.connectors) || 1));
  }, 0);

  const offlineChargersCount = summaryKpis?.offlineChargers ?? stations.reduce((acc, s) => {
    let count = 0;
    if (Array.isArray(s.chargers) && s.chargers.length > 0) {
      s.chargers.forEach(chg => {
        const chgStatus = (chg.status || '').toLowerCase();
        const hasOfflineConn = Array.isArray(chg.connectors) && chg.connectors.some(cn => (cn.status || '').toLowerCase() === 'offline');
        if (chgStatus === 'offline' || hasOfflineConn) {
          count++;
        }
      });
    } else if ((s.status || '').toLowerCase() === 'offline') {
      count += (Number(s.connectors) || 1);
    }
    return acc + count;
  }, 0);

  // Dynamic Options for Dropdowns
  const uniqueCities = ['All', ...new Set(stations.map(s => s.city).filter(Boolean))].sort();
  const uniqueStates = ['All', ...new Set(stations.map(s => s.state || 'Uttar Pradesh').filter(Boolean))].sort();
  const uniquePartners = ['All', ...new Set(stations.map(s => s.partner).filter(Boolean))].sort();

  // Pagination Calculation
  const totalPages = Math.max(1, Math.ceil(filteredStations.length / itemsPerPage));
  const paginatedStations = filteredStations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push('...');
      }
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      pages.push(totalPages);
    }
    return pages;
  };

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

  // Station Master Status Badge (P0: Clearly separated from Charger status)
  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'active') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Active
        </span>
      );
    }
    if (s === 'maintenance') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Maintenance
        </span>
      );
    }
    if (s === 'offline') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Offline
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        {status || 'Inactive'}
      </span>
    );
  };

  // Station-Level Alerts Engine (🚨 Warning indicators visible in main table row)
  const getStationAlerts = (station) => {
    const alerts = [];
    
    // 1. Hardware-level Offline & Fault Connectors / Chargers
    let offlineCount = 0;
    let faultCount = 0;
    let maintCount = 0;

    if (Array.isArray(station.chargers) && station.chargers.length > 0) {
      station.chargers.forEach(chg => {
        const cStatus = (chg.status || '').toLowerCase();
        const hasOfflineConn = Array.isArray(chg.connectors) && chg.connectors.some(cn => (cn.status || '').toLowerCase() === 'offline');
        const hasFaultConn = Array.isArray(chg.connectors) && chg.connectors.some(cn => (cn.status || '').toLowerCase() === 'fault');
        const hasMaintConn = Array.isArray(chg.connectors) && chg.connectors.some(cn => (cn.status || '').toLowerCase() === 'maintenance');

        if (cStatus === 'offline' || hasOfflineConn) offlineCount++;
        if (cStatus === 'fault' || hasFaultConn) faultCount++;
        if (cStatus === 'maintenance' || hasMaintConn) maintCount++;
      });
    } else if (station.healthSummary) {
      offlineCount = station.healthSummary.offline || 0;
      faultCount = station.healthSummary.fault || 0;
      maintCount = station.healthSummary.maintenance || 0;
    }

    if (offlineCount > 0) {
      alerts.push({
        id: 'offline',
        text: `${offlineCount} ${offlineCount === 1 ? 'Charger' : 'Chargers'} Offline`,
        shortText: `${offlineCount} Offline`,
        icon: '🔴',
        className: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
        onClick: () => setAvailabilityFilter('Offline')
      });
    }

    if (faultCount > 0) {
      alerts.push({
        id: 'fault',
        text: `${faultCount} ${faultCount === 1 ? 'Charger' : 'Chargers'} Fault`,
        shortText: `${faultCount} Fault`,
        icon: '⚠️',
        className: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
        onClick: () => setAvailabilityFilter('Fault')
      });
    }

    // 2. Station Maintenance Mode / Due
    const isStationMaint = (station.status || '').toLowerCase() === 'maintenance';
    const isDateDue = station.maintenanceDate && new Date(station.maintenanceDate) <= new Date();

    if (isStationMaint || isDateDue || maintCount > 0) {
      alerts.push({
        id: 'maintenance',
        text: isStationMaint ? 'Maintenance Mode' : isDateDue ? 'Maintenance Due' : `${maintCount} In Maintenance`,
        shortText: isStationMaint ? 'Maintenance' : isDateDue ? 'Maint. Due' : `${maintCount} Maint.`,
        icon: '🔧',
        className: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
        onClick: () => setStatusFilter('Maintenance')
      });
    }

    // 3. Station Power Offline
    if ((station.status || '').toLowerCase() === 'offline') {
      alerts.push({
        id: 'station_offline',
        text: 'Station Power Offline',
        shortText: 'Power Offline',
        icon: '⚫',
        className: 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200',
        onClick: () => setStatusFilter('Offline')
      });
    }

    return alerts;
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Station Management</h1>
          <p className="text-gray-500 text-sm font-medium">Manage all charging stations & operational network telemetry.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              fetchStations();
              fetchStationSummary();
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 text-xs font-semibold rounded-xl shadow-2xs hover:shadow-xs transition cursor-pointer"
            title="Refresh live telemetry"
          >
            <RotateCcw size={14} className={kpisLoading ? 'animate-spin text-[#8CC63F]' : 'text-gray-500'} />
            <span>Sync Telemetry</span>
          </button>
        </div>
      </div>

      {/* Station Performance Dashboard / Summary KPIs (6 Compact Metrics) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8CC63F] animate-pulse" />
            <h2 className="text-xs sm:text-sm font-black text-gray-800 uppercase tracking-wider">
              Station Performance
            </h2>
            <span className="hidden sm:inline-block text-[10px] font-bold text-gray-500 bg-gray-100/70 border border-gray-200/60 px-2 py-0.5 rounded-md">
              Network Overview
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
            <span className="hidden md:inline text-[11px]">Click metric to filter list</span>
          </div>
        </div>

        {/* 6 KPIs Grid (1x6 on Desktop, 2x3 on Tablet, 2x3 on Mobile) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. Total Stations */}
          <div 
            onClick={() => {
              setStatusFilter('All');
              setAvailabilityFilter('All');
            }}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group select-none ${
              statusFilter === 'All' && availabilityFilter === 'All'
                ? 'bg-blue-50/40 border-blue-300 ring-2 ring-blue-500/10 shadow-xs'
                : 'bg-white border-gray-100 hover:border-blue-200 hover:shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Stations</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                <Building2 size={15} strokeWidth={2.2} />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-2xl sm:text-[26px] font-black text-gray-900 tracking-tight">
                {totalStationsCount.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">
                Network
              </span>
            </div>
            <div className="mt-2.5 pt-2 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-400">
              <span>System Hubs</span>
              <span className="text-blue-600 font-semibold group-hover:translate-x-0.5 transition-transform text-[10px]">All →</span>
            </div>
          </div>

          {/* 2. Active Stations */}
          <div 
            onClick={() => setStatusFilter(statusFilter === 'Active' ? 'All' : 'Active')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group select-none ${
              statusFilter === 'Active'
                ? 'bg-emerald-50/40 border-emerald-300 ring-2 ring-emerald-500/10 shadow-xs'
                : 'bg-white border-gray-100 hover:border-emerald-200 hover:shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Active</span>
              </div>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                <Activity size={15} strokeWidth={2.2} />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-2xl sm:text-[26px] font-black text-emerald-600 tracking-tight">
                {activeStationsCount.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
                {Math.round((activeStationsCount / (totalStationsCount || 1)) * 100)}%
              </span>
            </div>
            <div className="mt-2.5 pt-2 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-400">
              <span>Operational</span>
              <span className="text-emerald-600 font-semibold group-hover:translate-x-0.5 transition-transform text-[10px]">Filter →</span>
            </div>
          </div>

          {/* 3. Inactive Stations */}
          <div 
            onClick={() => setStatusFilter(statusFilter === 'Inactive' ? 'All' : 'Inactive')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group select-none ${
              statusFilter === 'Inactive' || statusFilter === 'Offline'
                ? 'bg-slate-100/60 border-slate-400 ring-2 ring-slate-500/10 shadow-xs'
                : 'bg-white border-gray-100 hover:border-slate-300 hover:shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Inactive</span>
              <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                <PowerOff size={15} strokeWidth={2.2} />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-2xl sm:text-[26px] font-black text-slate-700 tracking-tight">
                {inactiveStationsCount.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                {Math.round((inactiveStationsCount / (totalStationsCount || 1)) * 100)}%
              </span>
            </div>
            <div className="mt-2.5 pt-2 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-400">
              <span>Non-operational</span>
              <span className="text-slate-600 font-semibold group-hover:translate-x-0.5 transition-transform text-[10px]">Filter →</span>
            </div>
          </div>

          {/* 4. Maintenance Stations */}
          <div 
            onClick={() => setStatusFilter(statusFilter === 'Maintenance' ? 'All' : 'Maintenance')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group select-none ${
              statusFilter === 'Maintenance'
                ? 'bg-amber-50/40 border-amber-300 ring-2 ring-amber-500/10 shadow-xs'
                : 'bg-white border-gray-100 hover:border-amber-200 hover:shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Maintenance</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                <Wrench size={15} strokeWidth={2.2} />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-2xl sm:text-[26px] font-black text-amber-600 tracking-tight">
                {maintenanceStationsCount.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded">
                Service
              </span>
            </div>
            <div className="mt-2.5 pt-2 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-400">
              <span>Under Repair</span>
              <span className="text-amber-600 font-semibold group-hover:translate-x-0.5 transition-transform text-[10px]">Filter →</span>
            </div>
          </div>

          {/* 5. Total Chargers (Gun / EVSE hardware) */}
          <div 
            onClick={() => {
              setChargerTypeFilter('All');
              setConnectorTypeFilter('All');
              setAvailabilityFilter('All');
            }}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group select-none ${
              chargerTypeFilter === 'All' && connectorTypeFilter === 'All' && availabilityFilter === 'All'
                ? 'bg-indigo-50/20 border-indigo-200'
                : 'bg-white border-gray-100 hover:border-indigo-200 hover:shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Chargers</span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                <BatteryCharging size={15} strokeWidth={2.2} />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-2xl sm:text-[26px] font-black text-indigo-600 tracking-tight">
                {totalChargersCount.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                Hardware
              </span>
            </div>
            <div className="mt-2.5 pt-2 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-400">
              <span>EVSE Guns</span>
              <span className="text-indigo-600 font-semibold group-hover:translate-x-0.5 transition-transform text-[10px]">Total →</span>
            </div>
          </div>

          {/* 6. Offline Chargers (Hardware Health Status) */}
          <div 
            onClick={() => setAvailabilityFilter(availabilityFilter === 'Offline' ? 'All' : 'Offline')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group select-none ${
              availabilityFilter === 'Offline'
                ? 'bg-rose-50/50 border-rose-300 ring-2 ring-rose-500/10 shadow-xs'
                : 'bg-white border-gray-100 hover:border-rose-200 hover:shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                {offlineChargersCount > 0 && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Offline Chargers</span>
              </div>
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                <WifiOff size={15} strokeWidth={2.2} />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-2xl sm:text-[26px] font-black text-rose-600 tracking-tight">
                {offlineChargersCount.toLocaleString('en-IN')}
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                offlineChargersCount > 0 
                  ? 'text-rose-700 bg-rose-50 border-rose-200' 
                  : 'text-emerald-700 bg-emerald-50 border-emerald-200'
              }`}>
                {offlineChargersCount > 0 ? 'Alert' : 'All Online'}
              </span>
            </div>
            <div className="mt-2.5 pt-2 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-400">
              <span>Hardware Telemetry</span>
              <span className="text-rose-600 font-semibold group-hover:translate-x-0.5 transition-transform text-[10px]">Filter →</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
        
        {/* Toolbar */}
        {/* Advanced Search & Multi-Filters Toolbar */}
        <div className="p-4 sm:p-5 border-b border-gray-100 bg-white space-y-3.5">
          {/* Row 1: Search Box & Add Station */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:flex-1">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search station name, ID (e.g. STN-001), address, or partner..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-[#8CC63F] transition-all bg-gray-50/40 hover:bg-white focus:bg-white"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-md transition cursor-pointer"
                  title="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {hasPermission('stations', 'add') && (
              <button 
                onClick={() => {
                  setFormData(initialFormState);
                  setIsAddModalOpen(true);
                }}
                className="w-full sm:w-auto bg-[#8CC63F] hover:bg-[#116631] text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm shrink-0 cursor-pointer"
              >
                <Plus size={18} strokeWidth={2.5} /> Add Station
              </button>
            )}
          </div>

          {/* Row 2: Operational Location & Master Filters (4 filters) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* 1. Status Filter */}
            <div className="relative">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Status</label>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full appearance-none bg-white border border-gray-200 rounded-xl pl-3 pr-8 py-2 text-xs text-gray-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#8CC63F] hover:bg-gray-50 transition cursor-pointer"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Offline">Offline</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-[27px] text-gray-400 pointer-events-none" />
            </div>

            {/* 2. City Filter */}
            <div className="relative">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">City</label>
              <select 
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full appearance-none bg-white border border-gray-200 rounded-xl pl-3 pr-8 py-2 text-xs text-gray-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#8CC63F] hover:bg-gray-50 transition cursor-pointer"
              >
                {uniqueCities.map(city => (
                  <option key={city} value={city}>{city === 'All' ? 'All Cities' : city}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-[27px] text-gray-400 pointer-events-none" />
            </div>

            {/* 3. State Filter */}
            <div className="relative">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">State</label>
              <select 
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="w-full appearance-none bg-white border border-gray-200 rounded-xl pl-3 pr-8 py-2 text-xs text-gray-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#8CC63F] hover:bg-gray-50 transition cursor-pointer"
              >
                {uniqueStates.map(st => (
                  <option key={st} value={st}>{st === 'All' ? 'All States' : st}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-[27px] text-gray-400 pointer-events-none" />
            </div>

            {/* 4. Partner Filter */}
            <div className="relative">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Partner</label>
              <select 
                value={partnerFilter}
                onChange={(e) => setPartnerFilter(e.target.value)}
                className="w-full appearance-none bg-white border border-gray-200 rounded-xl pl-3 pr-8 py-2 text-xs text-gray-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#8CC63F] hover:bg-gray-50 transition cursor-pointer truncate"
              >
                {uniquePartners.map(p => (
                  <option key={p} value={p}>{p === 'All' ? 'All Partners' : p}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-[27px] text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Row 3: Technical Hardware & Operational Health Filters (4 filters) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* 5. Charger Type Filter */}
            <div className="relative">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Charger Type</label>
              <select 
                value={chargerTypeFilter}
                onChange={(e) => setChargerTypeFilter(e.target.value)}
                className="w-full appearance-none bg-white border border-gray-200 rounded-xl pl-3 pr-8 py-2 text-xs text-gray-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#8CC63F] hover:bg-gray-50 transition cursor-pointer"
              >
                <option value="All">All Types</option>
                <option value="AC">AC Charging</option>
                <option value="DC">DC Fast</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-[27px] text-gray-400 pointer-events-none" />
            </div>

            {/* 6. Connector Type Filter */}
            <div className="relative">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Connector Type</label>
              <select 
                value={connectorTypeFilter}
                onChange={(e) => setConnectorTypeFilter(e.target.value)}
                className="w-full appearance-none bg-white border border-gray-200 rounded-xl pl-3 pr-8 py-2 text-xs text-gray-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#8CC63F] hover:bg-gray-50 transition cursor-pointer"
              >
                <option value="All">All Connectors</option>
                <option value="CCS2">CCS2</option>
                <option value="Type 2">Type 2</option>
                <option value="CHAdeMO">CHAdeMO</option>
                <option value="GB/T">GB/T</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-[27px] text-gray-400 pointer-events-none" />
            </div>

            {/* 7. Power Capacity Filter */}
            <div className="relative">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Power Capacity</label>
              <select 
                value={powerCapacityFilter}
                onChange={(e) => setPowerCapacityFilter(e.target.value)}
                className="w-full appearance-none bg-white border border-gray-200 rounded-xl pl-3 pr-8 py-2 text-xs text-gray-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#8CC63F] hover:bg-gray-50 transition cursor-pointer"
              >
                <option value="All">All Capacities</option>
                <option value="7–22 kW">7–22 kW (AC)</option>
                <option value="22–60 kW">22–60 kW (Fast DC)</option>
                <option value="60–120 kW">60–120 kW (Superfast)</option>
                <option value="120+ kW">120+ kW (Ultra-Fast)</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-[27px] text-gray-400 pointer-events-none" />
            </div>

            {/* 8. Availability Filter (Hardware / Charger Health) */}
            <div className="relative">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Availability <span className="text-emerald-600 font-bold">(Health)</span>
              </label>
              <select 
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                className="w-full appearance-none bg-white border border-gray-200 rounded-xl pl-3 pr-8 py-2 text-xs text-gray-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#8CC63F] hover:bg-gray-50 transition cursor-pointer"
              >
                <option value="All">All Availability</option>
                <option value="Available">🟢 Has Available</option>
                <option value="Charging">🔵 Has Charging</option>
                <option value="Fault">🔴 Has Fault</option>
                <option value="Maintenance">🟠 Has Maintenance</option>
                <option value="Offline">⚫ Has Offline</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-[27px] text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Row 4: Results Counter, Active Filters & Clear All */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100 text-xs">
            <div className="flex flex-wrap items-center gap-2 text-gray-600">
              <span className="font-bold text-gray-900">
                Showing {filteredStations.length} of {stations.length} Stations
              </span>
              {filteredStations.length !== stations.length && (
                <span className="text-gray-400">({stations.length - filteredStations.length} filtered out)</span>
              )}

              {/* Active Filter Chips */}
              <div className="flex flex-wrap items-center gap-1.5 ml-1">
                {statusFilter !== 'All' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Status: {statusFilter}
                    <button onClick={() => setStatusFilter('All')} className="hover:text-red-500 cursor-pointer"><X size={11} /></button>
                  </span>
                )}
                {cityFilter !== 'All' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                    City: {cityFilter}
                    <button onClick={() => setCityFilter('All')} className="hover:text-red-500 cursor-pointer"><X size={11} /></button>
                  </span>
                )}
                {stateFilter !== 'All' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
                    State: {stateFilter}
                    <button onClick={() => setStateFilter('All')} className="hover:text-red-500 cursor-pointer"><X size={11} /></button>
                  </span>
                )}
                {partnerFilter !== 'All' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-800 border border-purple-200">
                    Partner: {partnerFilter}
                    <button onClick={() => setPartnerFilter('All')} className="hover:text-red-500 cursor-pointer"><X size={11} /></button>
                  </span>
                )}
                {chargerTypeFilter !== 'All' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-cyan-50 text-cyan-800 border border-cyan-200">
                    Type: {chargerTypeFilter}
                    <button onClick={() => setChargerTypeFilter('All')} className="hover:text-red-500 cursor-pointer"><X size={11} /></button>
                  </span>
                )}
                {connectorTypeFilter !== 'All' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                    Connector: {connectorTypeFilter}
                    <button onClick={() => setConnectorTypeFilter('All')} className="hover:text-red-500 cursor-pointer"><X size={11} /></button>
                  </span>
                )}
                {powerCapacityFilter !== 'All' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                    Power: {powerCapacityFilter}
                    <button onClick={() => setPowerCapacityFilter('All')} className="hover:text-red-500 cursor-pointer"><X size={11} /></button>
                  </span>
                )}
                {availabilityFilter !== 'All' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                    Health: {availabilityFilter}
                    <button onClick={() => setAvailabilityFilter('All')} className="hover:text-red-500 cursor-pointer"><X size={11} /></button>
                  </span>
                )}
              </div>
            </div>

            {/* Clear All Filters Button */}
            {isAnyFilterActive && (
              <button
                onClick={handleClearFilters}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1 rounded-xl border border-rose-200 transition inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <RotateCcw size={12} />
                <span>Clear Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto w-full relative">
          {loading ? (
            <div className="py-20 flex items-center justify-center bg-white/80">
               <Loader2 className="animate-spin text-[#8CC63F]" size={32} />
            </div>
          ) : error ? (
            <div className="py-20 flex items-center justify-center text-red-500 font-medium">
               {error}
            </div>
          ) : filteredStations.length === 0 ? (
            <div className="py-20 flex items-center justify-center text-gray-500 font-medium">
               No stations found matching the criteria.
            </div>
          ) : null}

          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-gray-50/80 border-b border-gray-100 select-none">
              <tr>
                <th className="px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[180px]">
                  Station
                </th>
                <th className="px-3.5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[140px]">
                  Location
                </th>
                <th className="px-3 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Station Status
                </th>
                <th className="px-3 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap text-center">
                  Chargers
                </th>
                <th className="px-3.5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[160px]">
                  🚨 Alerts
                </th>
                <th className="px-3 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[120px]">
                  Utilization
                </th>
                <th className="px-3 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[120px]">
                  Partner
                </th>
                {/* P0: Sticky Actions column - always visible on right, no scroll hiding! */}
                <th className="sticky right-0 bg-gray-50/95 backdrop-blur-xs z-20 px-3.5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider text-center shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.06)] border-l border-gray-100 min-w-[110px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {!loading && paginatedStations.map((station) => (
                <tr key={station._id} className="hover:bg-gray-50/60 transition-colors group">
                  {/* 1. Station Name & ID */}
                  <td className="px-4 py-3 min-w-[180px]">
                    <button 
                      onClick={() => navigate(`/stations/${station._id}`)}
                      className="text-sm font-bold text-gray-900 hover:text-emerald-700 hover:underline transition-colors text-left block truncate max-w-[200px] cursor-pointer"
                      title={station.name}
                    >
                      {station.name}
                    </button>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-mono font-bold text-gray-500 bg-gray-50 border border-gray-200/80 px-1.5 py-0.5 rounded">
                        {station.stationId || `STN-${station._id?.slice(-4).toUpperCase()}`}
                      </span>
                    </div>
                  </td>

                  {/* 2. City & Location */}
                  <td className="px-3.5 py-3 min-w-[140px]">
                    <span className="text-xs font-bold text-gray-800 block whitespace-nowrap">{station.city}</span>
                    <span className="text-[11px] text-gray-400 block max-w-[150px] truncate" title={station.location}>
                      {station.location}
                    </span>
                  </td>

                  {/* 3. Station Status (P0: Master Station Status) */}
                  <td className="px-3 py-3 whitespace-nowrap">
                    {getStatusBadge(station.status)}
                  </td>

                  {/* 4. Chargers & Guns (P0: Hardware Health Status distinct from Station) */}
                  <td className="px-3 py-3 text-center whitespace-nowrap">
                    <div className="inline-flex flex-col items-center">
                      <span className="text-xs font-black text-gray-900">
                        {station.chargers?.length || station.connectors || 1} Guns
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100/80 px-1.5 py-0.2 rounded mt-0.5">
                        {station.healthSummary?.available ?? (station.status === 'Active' ? (station.connectors || 1) : 0)} Online
                      </span>
                    </div>
                  </td>

                  {/* 5. 🚨 Station-Level Alerts */}
                  <td className="px-3.5 py-3 min-w-[160px]">
                    {(() => {
                      const alerts = getStationAlerts(station);
                      if (alerts.length === 0) {
                        return (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> All Normal
                          </span>
                        );
                      }
                      return (
                        <div className="flex flex-col gap-1">
                          {alerts.map((al, idx) => (
                            <button
                              key={idx}
                              onClick={(e) => {
                                e.stopPropagation();
                                al.onClick();
                              }}
                              title={`Click to filter by ${al.text}`}
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold border transition text-left cursor-pointer shadow-2xs ${al.className}`}
                            >
                              <span className="text-xs">{al.icon}</span>
                              <span className="whitespace-nowrap">{al.shortText}</span>
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                  </td>

                  {/* 6. Utilization */}
                  <td className="px-3 py-3 min-w-[120px]">
                    <div className="flex items-center gap-2">
                      <div className="w-12 bg-gray-100 rounded-full h-1.5 overflow-hidden shrink-0">
                        <div 
                          className={`h-1.5 rounded-full transition-all ${
                            (station.utilization || 0) >= 40 ? 'bg-emerald-500' : (station.utilization || 0) >= 10 ? 'bg-[#8CC63F]' : 'bg-blue-400'
                          }`} 
                          style={{ width: `${Math.min(100, Math.max(Number(station.utilization) || 0, 4))}%` }}
                        />
                      </div>
                      <span className="text-xs font-black text-gray-700 whitespace-nowrap">
                        {station.utilization !== undefined ? `${station.utilization}%` : '0%'}
                      </span>
                    </div>
                  </td>

                  {/* 7. Partner */}
                  <td className="px-3 py-3 min-w-[120px]">
                    <span className="text-xs font-semibold text-gray-700 whitespace-nowrap max-w-[130px] truncate block" title={station.partner}>
                      {station.partner}
                    </span>
                  </td>

                  {/* 8. P0: Sticky Actions Column - Always visible on right edge! */}
                  <td className="sticky right-0 bg-white group-hover:bg-gray-50/95 backdrop-blur-xs z-10 px-3.5 py-3 text-center shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.06)] border-l border-gray-100 transition-colors min-w-[110px]">
                    <div className="flex items-center justify-center gap-1.5">
                      <button 
                        onClick={() => navigate(`/stations/${station._id}`)} 
                        className="text-gray-400 hover:text-blue-600 transition-colors p-1.5 rounded-lg hover:bg-blue-50 cursor-pointer"
                        title="View Station Detail Page"
                      >
                        <Eye size={16} strokeWidth={2.2} />
                      </button>
                      {hasPermission('stations', 'edit') && (
                        <button 
                          onClick={() => openEditModal(station)} 
                          className="text-gray-400 hover:text-emerald-600 transition-colors p-1.5 rounded-lg hover:bg-emerald-50 cursor-pointer"
                          title="Edit Station"
                        >
                          <Edit2 size={16} strokeWidth={2.2} />
                        </button>
                      )}
                      {hasPermission('stations', 'delete') && (
                        <button 
                          onClick={() => confirmDelete(station)} 
                          className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50 cursor-pointer"
                          title="Delete Station"
                        >
                          <Trash2 size={16} strokeWidth={2.2} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Proper Pagination */}
        {filteredStations.length > 0 && (
          <div className="p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-gray-100 bg-white">
            <div className="flex items-center gap-3 text-sm text-gray-600 font-medium w-full md:w-auto justify-between md:justify-start">
              <span className="whitespace-nowrap">
                Showing <span className="font-bold text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-gray-900">{Math.min(currentPage * itemsPerPage, filteredStations.length)}</span> of <span className="font-bold text-gray-900">{filteredStations.length}</span> stations
              </span>
              <div className="relative border-l border-gray-200 pl-3">
                <select 
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="appearance-none bg-gray-50 border border-gray-200 rounded-lg pl-2.5 pr-7 py-1 text-xs font-bold text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#8CC63F] cursor-pointer"
                >
                  <option value={10}>10 / page</option>
                  <option value={20}>20 / page</option>
                  <option value={50}>50 / page</option>
                  <option value={100}>100 / page</option>
                </select>
                <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center gap-1.5 w-full md:w-auto justify-center md:justify-end">
              {/* First Page */}
              <button 
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                title="First Page"
                className="p-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-white disabled:cursor-not-allowed transition shadow-2xs cursor-pointer"
              >
                <ChevronsLeft size={16} />
              </button>

              {/* Prev Page */}
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                title="Previous Page"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-white disabled:cursor-not-allowed transition text-xs font-semibold shadow-2xs cursor-pointer"
              >
                <ChevronLeft size={15} />
                <span className="hidden sm:inline">Prev</span>
              </button>

              {/* Page Number Buttons */}
              <div className="flex items-center gap-1">
                {getPageNumbers().map((item, idx) => {
                  if (item === '...') {
                    return (
                      <span key={`ellipsis-${idx}`} className="w-8 text-center text-gray-400 font-bold select-none text-xs">
                        ...
                      </span>
                    );
                  }
                  const isCurrent = currentPage === item;
                  return (
                    <button 
                      key={`page-${item}`}
                      onClick={() => setCurrentPage(item)}
                      className={`min-w-8 h-8 px-2 flex items-center justify-center rounded-xl font-bold text-xs transition cursor-pointer ${
                        isCurrent 
                          ? 'bg-[#8CC63F] text-white shadow-xs font-black' 
                          : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>

              {/* Next Page */}
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                title="Next Page"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-white disabled:cursor-not-allowed transition text-xs font-semibold shadow-2xs cursor-pointer"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight size={15} />
              </button>

              {/* Last Page */}
              <button 
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages || totalPages === 0}
                title="Last Page"
                className="p-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-white disabled:cursor-not-allowed transition shadow-2xs cursor-pointer"
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Station Modal */}
      {isViewModalOpen && stationToView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl lg:max-w-5xl my-auto animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#8CC63F] flex items-center justify-center border border-emerald-100">
                  <Zap size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Live Telemetry
                    </span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase">{stationToView.city}</span>
                  </div>
                  <h2 className="text-base font-black text-gray-900 tracking-wide uppercase">
                    STATION: {stationToView.name}
                  </h2>
                  <p className="text-xs text-gray-500 font-medium">
                    {stationToView.location} • Partner: <span className="text-gray-700 font-semibold">{stationToView.partner}</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsViewModalOpen(false);
                  setStationToView(null);
                }}
                className="text-gray-400 hover:bg-gray-100 hover:text-gray-600 p-1.5 rounded-xl transition-colors cursor-pointer"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              
              {/* Station Top Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-0.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Station Status</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${stationToView.status === 'Active' ? 'bg-emerald-500' : stationToView.status === 'Maintenance' ? 'bg-amber-500' : 'bg-red-500'}`} />
                    <span className="font-bold text-gray-900 text-sm">{stationToView.status}</span>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-0.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Grid Capacity</span>
                  <p className="font-bold text-gray-900 text-sm font-mono">
                    {stationToView.powerCapacity ? `${stationToView.powerCapacity} kW` : '180 kW'}
                  </p>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-0.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Operating Hours</span>
                  <p className="font-bold text-gray-900 text-sm">
                    {stationToView.openHours || '24/7 Service'}
                  </p>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-0.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">30-Day Utilization</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-emerald-600 text-sm">{stationToView.utilization ?? 0}%</span>
                    <span className="text-[10px] text-gray-400">({stationToView.totalSessions || 0} sessions)</span>
                  </div>
                </div>
              </div>

              {/* Operational Health Status KPI Bar */}
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
                    <Activity size={14} className="text-[#8CC63F]" />
                    Real-Time Operational Health Breakdown
                  </span>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100/80 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    {stationToView.healthSummary?.overallHealthPercent ?? 100}% Fleet Readiness
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {/* 🟢 Available */}
                  <div className="bg-white p-2.5 rounded-xl border border-emerald-200/70 text-center shadow-2xs">
                    <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-emerald-700 uppercase">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Available
                    </div>
                    <p className="text-xl font-black text-emerald-900 mt-0.5 font-mono">
                      {stationToView.healthSummary?.available ?? stationToView.connectors}
                    </p>
                    <span className="text-[10px] text-gray-400 font-medium">Ready to charge</span>
                  </div>

                  {/* 🔵 Charging */}
                  <div className="bg-white p-2.5 rounded-xl border border-blue-200/70 text-center shadow-2xs">
                    <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-blue-700 uppercase">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      Charging
                    </div>
                    <p className="text-xl font-black text-blue-900 mt-0.5 font-mono">
                      {stationToView.healthSummary?.charging ?? 0}
                    </p>
                    <span className="text-[10px] text-gray-400 font-medium">In active session</span>
                  </div>

                  {/* 🔴 Fault */}
                  <div className="bg-white p-2.5 rounded-xl border border-rose-200/70 text-center shadow-2xs">
                    <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-rose-700 uppercase">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      Fault
                    </div>
                    <p className="text-xl font-black text-rose-900 mt-0.5 font-mono">
                      {stationToView.healthSummary?.fault ?? 0}
                    </p>
                    <span className="text-[10px] text-gray-400 font-medium">Hardware trip / error</span>
                  </div>

                  {/* 🟠 Maintenance */}
                  <div className="bg-white p-2.5 rounded-xl border border-amber-200/70 text-center shadow-2xs">
                    <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-amber-700 uppercase">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Maintenance
                    </div>
                    <p className="text-xl font-black text-amber-900 mt-0.5 font-mono">
                      {stationToView.healthSummary?.maintenance ?? 0}
                    </p>
                    <span className="text-[10px] text-gray-400 font-medium">Service locked</span>
                  </div>

                  {/* ⚫ Offline */}
                  <div className="bg-white p-2.5 rounded-xl border border-slate-300 text-center shadow-2xs col-span-2 sm:col-span-1">
                    <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-slate-700 uppercase">
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                      Offline
                    </div>
                    <p className="text-xl font-black text-slate-900 mt-0.5 font-mono">
                      {stationToView.healthSummary?.offline ?? 0}
                    </p>
                    <span className="text-[10px] text-gray-400 font-medium">No connection</span>
                  </div>
                </div>
              </div>

              {/* ⚡ Operational Live Chargers & Connectors Table (Client Format) */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
                <div className="px-5 py-3.5 bg-gray-50/90 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Zap size={16} className="text-[#8CC63F]" />
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                        Live Chargers & Connectors Operational Status
                      </h3>
                      <p className="text-[11px] text-gray-500 font-medium">
                        Real-time hardware status, power ratings, and individual connector telemetry
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-gray-600 bg-white border border-gray-200 px-2.5 py-1 rounded-lg shadow-2xs">
                    {stationToView.chargers?.length || 0} Hardware Chargers
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-gray-50/60 border-b border-gray-200 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="px-4 py-3">⚡ Charger ID</th>
                        <th className="px-4 py-3">🔌 Connector Type</th>
                        <th className="px-4 py-3">🔋 Power</th>
                        <th className="px-4 py-3">🟢 Charger Status</th>
                        <th className="px-4 py-3">📌 Connector Status</th>
                        <th className="px-4 py-3">⏱️ Live Session / Diagnostics</th>
                        <th className="px-4 py-3 text-right">⚙️ Override Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {stationToView.chargers && stationToView.chargers.length > 0 ? (
                        stationToView.chargers.map((chg) => {
                          const chgBadge = getChargerHealthBadge(chg.status);
                          return (
                            <tr key={chg.chargerId} className="hover:bg-slate-50/60 transition-colors">
                              {/* 1. Charger ID */}
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-extrabold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200">
                                    {chg.chargerId}
                                  </span>
                                  <div>
                                    <p className="font-bold text-gray-800 text-[11px]">{chg.name || `${chg.oem || 'Delta'} Charger`}</p>
                                    <p className="text-[10px] text-gray-400 font-mono">{chg.serialNumber || 'SN: Verified'}</p>
                                  </div>
                                </div>
                              </td>

                              {/* 2. Connector Type */}
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-1">
                                  {chg.connectors && chg.connectors.length > 0 ? (
                                    chg.connectors.map((c, cIdx) => (
                                      <span key={cIdx} className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md text-[11px]">
                                        <Zap size={10} className="text-blue-600" />
                                        {c.type}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-gray-500 font-medium">CCS2</span>
                                  )}
                                </div>
                              </td>

                              {/* 3. Power */}
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="font-mono font-bold text-gray-900 bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md text-[11px]">
                                  {chg.powerKw || 60} kW
                                </span>
                              </td>

                              {/* 4. Charger Status */}
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${chgBadge.bg} ${chgBadge.text} ${chgBadge.border}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${chgBadge.dot}`} />
                                  <span>{chgBadge.label}</span>
                                </span>
                              </td>

                              {/* 5. Connector Status (Multi-Gun support) */}
                              <td className="px-4 py-3">
                                <div className="space-y-1">
                                  {chg.connectors && chg.connectors.length > 0 ? (
                                    chg.connectors.map((c, cIdx) => {
                                      const cBadge = getChargerHealthBadge(c.status);
                                      return (
                                        <div key={cIdx} className="flex items-center gap-1.5 whitespace-nowrap">
                                          <span className="text-[10px] font-bold text-gray-500 font-mono">Gun {c.connectorId || cIdx + 1}:</span>
                                          <span className={`inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-extrabold border ${cBadge.bg} ${cBadge.text} ${cBadge.border}`}>
                                            <span className={`w-1 h-1 rounded-full ${cBadge.dot}`} />
                                            <span>{cBadge.label}</span>
                                          </span>
                                        </div>
                                      );
                                    })
                                  ) : (
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${chgBadge.bg} ${chgBadge.text} ${chgBadge.border}`}>
                                      <span className={`w-1 h-1 rounded-full ${chgBadge.dot}`} />
                                      <span>{chgBadge.label}</span>
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* 6. Live Session / Diagnostics */}
                              <td className="px-4 py-3">
                                {chg.status === 'Charging' && chg.activeSession ? (
                                  <div className="space-y-0.5 min-w-[140px]">
                                    <p className="font-bold text-blue-900 flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                                      {chg.activeSession.userName || 'Active Driver'}
                                    </p>
                                    <p className="text-[10px] text-gray-500 font-mono">
                                      {chg.activeSession.vehicle} · {chg.activeSession.unitsConsumed} kWh
                                    </p>
                                  </div>
                                ) : chg.status === 'Fault' ? (
                                  <div className="text-rose-700 font-medium space-y-0.5">
                                    <p className="font-bold text-[11px] flex items-center gap-1">
                                      <AlertTriangle size={11} /> Hardware Alert
                                    </p>
                                    <p className="text-[10px] text-rose-500 font-mono">{chg.errorCode || 'ERR-OCPP-COMM-FAULT'}</p>
                                  </div>
                                ) : chg.status === 'Maintenance' ? (
                                  <div className="text-amber-700 text-[11px] font-medium flex items-center gap-1">
                                    <Wrench size={12} /> Scheduled Maintenance
                                  </div>
                                ) : chg.status === 'Offline' ? (
                                  <div className="text-slate-500 text-[11px] font-medium flex items-center gap-1">
                                    <PowerOff size={11} /> Disconnected from OCPP
                                  </div>
                                ) : (
                                  <div className="text-emerald-700 text-[11px] font-medium flex items-center gap-1">
                                    <CheckCircle2 size={12} /> Ready for Charging
                                  </div>
                                )}
                              </td>

                              {/* 7. Action Override */}
                              <td className="px-4 py-3 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1.5">
                                  {chargerActionLoading === chg.chargerId ? (
                                    <Loader2 size={15} className="animate-spin text-emerald-600 mr-2" />
                                  ) : (
                                    <select
                                      value={chg.status}
                                      onChange={(e) => handleUpdateChargerStatus(stationToView._id, chg.chargerId, e.target.value)}
                                      className="text-[11px] font-bold border border-gray-200 rounded-lg px-2 py-1 bg-white hover:border-emerald-400 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#8CC63F]"
                                      title="Change charger operational state"
                                    >
                                      <option value="Available">🟢 Available</option>
                                      <option value="Charging">🔵 Charging</option>
                                      <option value="Maintenance">🟠 Maintenance</option>
                                      <option value="Fault">🔴 Fault</option>
                                      <option value="Offline">⚫ Offline</option>
                                    </select>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                            No operational chargers found for this station.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Station Address & Connector Pricing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Address */}
                {stationToView.address && (
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Full Station Address</span>
                    <p className="text-xs text-gray-700 leading-relaxed font-medium">{stationToView.address}</p>
                  </div>
                )}

                {/* Connector Pricing List */}
                {stationToView.connectorTypes?.length > 0 && (
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Commercial Tariffs</span>
                    <div className="space-y-1.5">
                      {stationToView.connectorTypes.map((ct, i) => (
                        <div key={i} className="flex items-center justify-between bg-white rounded-xl px-3 py-1.5 border border-gray-200 text-xs">
                          <span className="font-bold text-gray-800">{ct.type} ({ct.chargeType})</span>
                          <span className="font-extrabold text-[#8CC63F] font-mono">₹{ct.pricePerUnit}/kWh</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-end shrink-0">
              <button 
                onClick={() => {
                  setIsViewModalOpen(false);
                  setStationToView(null);
                }}
                className="px-4 py-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 rounded-xl transition cursor-pointer shadow-2xs"
              >
                Close
              </button>
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

                {/* Amenities */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">Amenities</label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {['Cafe', 'Parking', 'Washroom', 'Wi-Fi', 'Lounge', 'Restaurant', 'ATM', 'Store', 'EV Accessories', 'CCTV', 'Security Guard', 'Air Pump'].map((amenity) => {
                      const isChecked = formData.amenities.includes(amenity);
                      return (
                        <label
                          key={amenity}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm select-none ${
                            isChecked
                              ? 'border-[#8CC63F] bg-[#8CC63F]/10 text-[#5a8a1a] font-semibold'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-[#8CC63F]/50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="accent-[#8CC63F] w-4 h-4 shrink-0"
                            checked={isChecked}
                            onChange={() => {
                              setFormData(prev => ({
                                ...prev,
                                amenities: isChecked
                                  ? prev.amenities.filter(a => a !== amenity)
                                  : [...prev.amenities, amenity]
                              }));
                            }}
                          />
                          {amenity}
                        </label>
                      );
                    })}
                  </div>
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
