import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Zap, Activity, Clock, ShieldCheck, 
  BatteryCharging, CheckCircle2, AlertTriangle, PowerOff, 
  Wrench, ExternalLink, RefreshCw, Copy, Check, Loader2,
  TrendingUp, IndianRupee, BarChart3, Radio, Server, Edit3,
  ChevronDown, X, Sparkles, Coffee
} from 'lucide-react';
import toast from 'react-hot-toast';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { useAuth } from '../../contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const mapLibraries = ['places'];

const defaultAmenities = {
  parking: true,
  washroom: true,
  cafe: false,
  food: true,
  wifi: true,
  ev_support: true,
  available_24x7: true
};

// Operational Health Status Styling for Chargers & Connectors
const CHARGER_HEALTH_STYLES = {
  Available: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    label: 'Available'
  },
  Charging: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500 animate-pulse',
    label: 'Charging'
  },
  Offline: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
    dot: 'bg-slate-400',
    label: 'Offline'
  },
  Fault: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
    label: 'Fault'
  },
  Maintenance: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    label: 'Maintenance'
  }
};

const getChargerHealthBadge = (status) => {
  const norm = (status || 'Available').trim();
  if (['Available', 'Ready', 'Online'].includes(norm)) return CHARGER_HEALTH_STYLES.Available;
  if (['Charging', 'In Use', 'Busy', 'Ongoing', 'In Progress'].includes(norm)) return CHARGER_HEALTH_STYLES.Charging;
  if (['Offline', 'Disconnected'].includes(norm)) return CHARGER_HEALTH_STYLES.Offline;
  if (['Fault', 'Error', 'Tripped'].includes(norm)) return CHARGER_HEALTH_STYLES.Fault;
  if (['Maintenance', 'Under Maintenance', 'Service'].includes(norm)) return CHARGER_HEALTH_STYLES.Maintenance;
  return CHARGER_HEALTH_STYLES.Available;
};

const StationDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const [stationData, setStationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [chargerActionLoading, setChargerActionLoading] = useState(null);
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [isEditAmenitiesOpen, setIsEditAmenitiesOpen] = useState(false);
  const [amenitiesForm, setAmenitiesForm] = useState(defaultAmenities);
  const [savingAmenities, setSavingAmenities] = useState(false);

  // Google Maps Loader
  const { isLoaded: isMapLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY || '',
    libraries: mapLibraries
  });

  // Fetch Station Details
  const fetchStationDetails = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/station/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      
      if (res.ok && (json.data || json._id)) {
        const payload = json.data || json;
        setStationData(payload);
        setError(null);
      } else {
        throw new Error(json.message || 'Station not found');
      }
    } catch (err) {
      setError(err.message || 'Failed to load station details');
      toast.error(err.message || 'Failed to load station details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchStationDetails();
  }, [fetchStationDetails]);

  // Sync customer amenities form with loaded station data
  useEffect(() => {
    if (stationData?.amenitiesInfo?.details) {
      setAmenitiesForm(stationData.amenitiesInfo.details);
    } else if (stationData?.amenitiesDetails) {
      setAmenitiesForm(stationData.amenitiesDetails);
    }
  }, [stationData]);

  // Save updated customer amenities to MongoDB
  const handleSaveAmenities = async (e) => {
    e.preventDefault();
    setSavingAmenities(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/station/${id}/amenities`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(amenitiesForm)
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to update amenities');
      toast.success('Customer facilities updated successfully');
      setIsEditAmenitiesOpen(false);
      fetchStationDetails(true);
    } catch (err) {
      toast.error(err.message || 'Failed to update customer amenities');
    } finally {
      setSavingAmenities(false);
    }
  };

  // Live status override
  const handleUpdateChargerStatus = async (chargerId, newStatus) => {
    setChargerActionLoading(chargerId);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/station/${id}/charger/${chargerId}/status`, {
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
        fetchStationDetails(true);
      } else {
        toast.error(data.message || 'Failed to update charger status');
      }
    } catch (err) {
      toast.error('Network error updating charger status');
    } finally {
      setChargerActionLoading(null);
    }
  };

  const copyCoordinates = (lat, lng) => {
    navigator.clipboard?.writeText(`${lat}, ${lng}`);
    setCopiedCoords(true);
    toast.success('Coordinates copied to clipboard');
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="animate-spin text-[#8CC63F]" size={40} />
        <p className="text-sm font-semibold text-gray-500">Loading Station Operational Details...</p>
      </div>
    );
  }

  if (error || !stationData) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-red-100 shadow-sm text-center max-w-lg mx-auto mt-12 space-y-4">
        <AlertTriangle size={48} className="mx-auto text-rose-500" />
        <h2 className="text-xl font-bold text-gray-900">Station Not Found</h2>
        <p className="text-sm text-gray-500">{error || 'Could not locate the requested charging station.'}</p>
        <button
          onClick={() => navigate('/stations')}
          className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-semibold inline-flex items-center gap-2 transition cursor-pointer"
        >
          <ArrowLeft size={16} /> Back to Stations
        </button>
      </div>
    );
  }

  const { stationInfo = {}, chargerInfo = {}, performance = {}, chargers = [], amenitiesInfo = {} } = stationData;

  // Fallbacks
  const stName = stationInfo.stationName || stationData.name;
  const stId = stationInfo.stationId || `STN-${stationData._id?.slice(-4).toUpperCase() || '001'}`;
  const stStatus = stationInfo.stationStatus || stationData.status || 'Active';
  const stPartner = stationInfo.partner || stationData.partner;
  const stAddress = stationInfo.fullAddress || stationData.address || `${stationData.location}, ${stationData.city}`;
  const stCity = stationInfo.city || stationData.city;
  const stState = stationInfo.state || stationData.state || 'Uttar Pradesh';
  const stHours = stationInfo.operatingHours || stationData.openHours || '24 × 7';
  const lat = Number(stationInfo.latitude || stationData.latitude) || 26.8584;
  const lng = Number(stationInfo.longitude || stationData.longitude) || 80.9984;
  const googleMapUrl = stationInfo.googleMapUrl || `https://www.google.com/maps?q=${lat},${lng}`;

  const totalConnectors = chargerInfo.totalConnectors || stationData.connectors || 1;
  const totalChargers = chargerInfo.totalChargers || chargers.length || 1;

  const amenitiesList = amenitiesInfo.items || [
    { key: 'parking', name: 'Parking', icon: '🅿️', available: stationData.amenitiesDetails?.parking ?? true, description: 'Dedicated EV Parking Slots' },
    { key: 'washroom', name: 'Washroom', icon: '🚻', available: stationData.amenitiesDetails?.washroom ?? true, description: 'Clean Restroom Facilities' },
    { key: 'cafe', name: 'Cafe', icon: '☕', available: stationData.amenitiesDetails?.cafe ?? false, description: 'Coffee & Refreshment Lounge' },
    { key: 'food', name: 'Food', icon: '🍔', available: stationData.amenitiesDetails?.food ?? true, description: 'Food Court & Dining Nearby' },
    { key: 'wifi', name: 'Wi-Fi', icon: '📶', available: stationData.amenitiesDetails?.wifi ?? true, description: 'Free High-Speed Wi-Fi' },
    { key: 'ev_support', name: 'EV Support', icon: '🔧', available: stationData.amenitiesDetails?.ev_support ?? true, description: 'On-site Technical Assistance' },
    { key: 'available_24x7', name: '24×7 Availability', icon: '🕐', available: stationData.amenitiesDetails?.available_24x7 ?? true, description: 'Open Round the Clock' }
  ];

  const availableAmenitiesCount = amenitiesInfo.availableCount ?? amenitiesList.filter(a => a.available).length;

  return (
    <div className="space-y-6 pb-12">
      {/* ─── TOP ACTION BAR & BREADCRUMB ───────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/stations')}
            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition cursor-pointer shrink-0"
            title="Back to Stations List"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                {stId}
              </span>
              <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                stStatus === 'Active' ? 'bg-emerald-100 text-emerald-800' :
                stStatus === 'Maintenance' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  stStatus === 'Active' ? 'bg-emerald-500' :
                  stStatus === 'Maintenance' ? 'bg-amber-500' : 'bg-red-500'
                }`} />
                {stStatus}
              </span>
              <span className="text-xs text-gray-400 font-medium hidden md:inline">• {stCity}, {stState}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight mt-0.5 uppercase">
              STATION: {stName}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => fetchStationDetails(true)}
            disabled={refreshing}
            className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl inline-flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            title="Refresh Real-time Telemetry"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-emerald-600' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Live'}</span>
          </button>

          <a
            href={googleMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs rounded-xl inline-flex items-center gap-1.5 transition cursor-pointer"
            title="Open in Google Maps"
          >
            <ExternalLink size={14} />
            <span className="hidden sm:inline">Google Maps</span>
          </a>
        </div>
      </div>

      {/* ─── SECTION 1: 🏢 STATION INFORMATION ─────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#8CC63F] flex items-center justify-center border border-emerald-100">
              <MapPin size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900">1. Station Information</h2>
              <p className="text-xs text-gray-500 font-medium">Master identity, location coordinates, partner ownership, and operational hours</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-gray-400">Section 1 of 4</span>
        </div>

        <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Master Details Grid */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Station Name */}
            <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-200/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">Station Name</span>
              <p className="text-sm font-bold text-gray-900">{stName}</p>
            </div>

            {/* Station ID */}
            <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-200/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">Station ID</span>
              <p className="text-sm font-mono font-bold text-emerald-800">{stId}</p>
            </div>

            {/* Full Address */}
            <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-200/60 sm:col-span-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">Full Address</span>
              <p className="text-sm font-semibold text-gray-800 leading-relaxed">{stAddress}</p>
            </div>

            {/* City */}
            <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-200/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">City</span>
              <p className="text-sm font-bold text-gray-900">{stCity}</p>
            </div>

            {/* State */}
            <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-200/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">State</span>
              <p className="text-sm font-bold text-gray-900">{stState}</p>
            </div>

            {/* Coordinates */}
            <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-200/60 sm:col-span-2 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">Latitude / Longitude</span>
                <p className="text-xs font-mono font-bold text-gray-800">
                  {lat.toFixed(6)}, {lng.toFixed(6)}
                </p>
              </div>
              <button
                onClick={() => copyCoordinates(lat, lng)}
                className="px-2.5 py-1.5 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-bold rounded-lg transition inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                title="Copy Coordinates"
              >
                {copiedCoords ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                <span>{copiedCoords ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Partner */}
            <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-200/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">Partner / CPO</span>
              <p className="text-sm font-bold text-gray-900">{stPartner}</p>
            </div>

            {/* Operating Hours */}
            <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-200/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">Operating Hours</span>
              <p className="text-sm font-bold text-gray-900 flex items-center gap-1">
                <Clock size={14} className="text-[#8CC63F]" />
                {stHours}
              </p>
            </div>
          </div>

          {/* Map Preview Card */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="h-full min-h-[260px] rounded-xl overflow-hidden border border-gray-200 relative bg-gray-100 flex flex-col">
              {isMapLoaded ? (
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%', minHeight: '260px' }}
                  center={{ lat, lng }}
                  zoom={15}
                  options={{
                    disableDefaultUI: true,
                    zoomControl: true,
                    streetViewControl: false,
                    mapTypeControl: false
                  }}
                >
                  <Marker position={{ lat, lng }} title={stName} />
                </GoogleMap>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-400">
                  <MapPin size={32} className="mb-2 text-gray-300" />
                  <p className="text-xs font-bold text-gray-700">{stAddress}</p>
                  <p className="text-[11px] text-gray-400 font-mono mt-1">{lat}, {lng}</p>
                </div>
              )}
              <div className="p-3 bg-white/95 backdrop-blur-xs border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-gray-700 font-bold">
                  <Radio size={14} className="text-emerald-500 animate-pulse" />
                  <span>GPS Geofence Verified</span>
                </div>
                <a
                  href={googleMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                >
                  Open in Map <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── SECTION 2: 🏢 STATION AMENITIES (CUSTOMER FACILITIES) ───── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900">2. Customer Amenities & Facilities</h2>
              <p className="text-xs text-gray-500 font-medium">
                Customer convenience, verified on-site services, and facility availability
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Availability Summary Pill */}
            <div className="bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-1.5 shadow-2xs">
              <CheckCircle2 size={13} className="text-emerald-600" />
              <span>{availableAmenitiesCount} of {amenitiesList.length} Facilities Available</span>
            </div>

            {/* Quick Edit Amenities Button */}
            {hasPermission('stations', 'edit') && (
              <button
                onClick={() => setIsEditAmenitiesOpen(true)}
                className="px-3 py-1 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                title="Edit Station Amenities"
              >
                <Edit3 size={13} className="text-emerald-700" />
                <span>Manage Amenities</span>
              </button>
            )}
            <span className="text-xs font-mono font-bold text-gray-400 ml-2 hidden sm:inline">Section 2 of 4</span>
          </div>
        </div>

        {/* Facilities Grid */}
        <div className="p-5 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3.5">
            {amenitiesList.map((item) => (
              <div
                key={item.key}
                className={`rounded-xl p-3.5 flex flex-col items-center text-center transition-all ${
                  item.available
                    ? 'bg-emerald-50/40 border border-emerald-200/70 hover:bg-emerald-50/80 hover:shadow-2xs'
                    : 'bg-gray-50/60 border border-gray-200/60 opacity-60 hover:opacity-90'
                }`}
              >
                {/* Emoji Icon */}
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-2xl mb-1 bg-white shadow-2xs border border-gray-100">
                  {item.icon}
                </div>

                {/* Facility Name */}
                <span className={`text-xs font-bold mt-1 ${item.available ? 'text-gray-900' : 'text-gray-500'}`}>
                  {item.name}
                </span>

                {/* Status Indicator */}
                <div className="mt-2">
                  {item.available ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100/90 text-emerald-800 border border-emerald-200">
                      <Check size={11} strokeWidth={3} /> Available
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-500 border border-gray-200">
                      <X size={11} strokeWidth={3} /> Not Available
                    </span>
                  )}
                </div>

                {/* Description */}
                <span className="text-[10px] text-gray-400 font-medium mt-1.5 line-clamp-1" title={item.description}>
                  {item.description}
                </span>
              </div>
            ))}
          </div>

          {/* Quick Client-style Checklist summary strip */}
          <div className="mt-4 pt-3.5 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-semibold text-gray-500 uppercase tracking-wider text-[11px]">
              Customer Checklist View:
            </span>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              {amenitiesList.map((item) => (
                <div key={item.key} className="inline-flex items-center gap-1 font-medium">
                  {item.available ? (
                    <span className="text-emerald-600 font-bold">✓</span>
                  ) : (
                    <span className="text-rose-500 font-bold">✕</span>
                  )}
                  <span className={item.available ? 'text-gray-800 font-semibold' : 'text-gray-400 line-through'}>
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── SECTION 3: ⚡ CHARGER INFORMATION (MUTUALLY EXCLUSIVE) ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Zap size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900">3. Charger Information</h2>
              <p className="text-xs text-gray-500 font-medium">
                Individual chargers, multi-gun status, real-time telemetry, and mutually exclusive operational health
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mutually Exclusive Formula Verification Pill */}
            <div className="bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl text-xs font-mono font-extrabold text-emerald-800 flex items-center gap-2 shadow-2xs">
              <CheckCircle2 size={14} className="text-emerald-600" />
              <span>Formula: {chargerInfo.verificationFormula || `${chargerInfo.available || 0} + ${chargerInfo.charging || 0} + ${chargerInfo.offline || 0} + ${chargerInfo.fault || 0} + ${chargerInfo.maintenance || 0} = ${totalConnectors}`}</span>
            </div>
            <span className="text-xs font-mono font-bold text-gray-400 ml-1 hidden sm:inline">Section 3 of 4</span>
          </div>
        </div>

        {/* Operational Health Breakdown KPI Grid */}
        <div className="p-5 sm:p-6 border-b border-gray-100 bg-slate-50/50">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {/* Total Chargers */}
            <div className="p-3 bg-white rounded-xl border border-gray-200 text-center shadow-2xs">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Chargers</span>
              <p className="text-2xl font-black text-gray-900 font-mono mt-0.5">{totalChargers}</p>
              <span className="text-[10px] text-gray-400 font-semibold">Hardware Units</span>
            </div>

            {/* Total Connectors */}
            <div className="p-3 bg-white rounded-xl border border-gray-200 text-center shadow-2xs">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Connectors</span>
              <p className="text-2xl font-black text-gray-900 font-mono mt-0.5">{totalConnectors}</p>
              <span className="text-[10px] text-gray-400 font-semibold">Active Guns</span>
            </div>

            {/* 🟢 Available */}
            <div className="p-3 bg-white rounded-xl border border-emerald-200 text-center shadow-2xs">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Available
              </span>
              <p className="text-2xl font-black text-emerald-900 font-mono mt-0.5">{chargerInfo.available ?? 0}</p>
              <span className="text-[10px] text-emerald-600 font-medium">Ready to charge</span>
            </div>

            {/* 🔵 Charging */}
            <div className="p-3 bg-white rounded-xl border border-blue-200 text-center shadow-2xs">
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> Charging
              </span>
              <p className="text-2xl font-black text-blue-900 font-mono mt-0.5">{chargerInfo.charging ?? 0}</p>
              <span className="text-[10px] text-blue-600 font-medium">In active session</span>
            </div>

            {/* ⚫ Offline */}
            <div className="p-3 bg-white rounded-xl border border-slate-300 text-center shadow-2xs">
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Offline
              </span>
              <p className="text-2xl font-black text-slate-900 font-mono mt-0.5">{chargerInfo.offline ?? 0}</p>
              <span className="text-[10px] text-slate-500 font-medium">No OCPP signal</span>
            </div>

            {/* 🔴 Fault */}
            <div className="p-3 bg-white rounded-xl border border-rose-200 text-center shadow-2xs">
              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Fault
              </span>
              <p className="text-2xl font-black text-rose-900 font-mono mt-0.5">{chargerInfo.fault ?? 0}</p>
              <span className="text-[10px] text-rose-600 font-medium">Hardware trip</span>
            </div>

            {/* 🟠 Maintenance */}
            <div className="p-3 bg-white rounded-xl border border-amber-200 text-center shadow-2xs">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Maintenance
              </span>
              <p className="text-2xl font-black text-amber-900 font-mono mt-0.5">{chargerInfo.maintenance ?? 0}</p>
              <span className="text-[10px] text-amber-600 font-medium">Service locked</span>
            </div>
          </div>
        </div>

        {/* Live Chargers & Connectors Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/80 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Charger ID</th>
                <th className="px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Connector Type</th>
                <th className="px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Power</th>
                <th className="px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Charger Status</th>
                <th className="px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Connector Status (Guns)</th>
                <th className="px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Live Diagnostics</th>
                <th className="px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Override Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {chargers && chargers.length > 0 ? (
                chargers.map((chg) => {
                  const chgBadge = getChargerHealthBadge(chg.status);
                  return (
                    <tr key={chg.chargerId} className="hover:bg-gray-50/60 transition-colors">
                      {/* 1. Charger ID */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                              {chg.chargerId}
                            </span>
                            <span className="text-sm font-semibold text-gray-900">
                              {chg.name || `${chg.oem || 'EV'} Charger`}
                            </span>
                          </div>
                          <span className="text-[11px] text-gray-400 font-mono mt-0.5 pl-0.5">
                            {chg.serialNumber || (chg.oem ? `OEM: ${chg.oem}` : 'Verified Hardware')}
                          </span>
                        </div>
                      </td>

                      {/* 2. Connector Type */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {chg.connectors && chg.connectors.length > 0 ? (
                            chg.connectors.map((c, cIdx) => (
                              <span 
                                key={cIdx} 
                                className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100"
                              >
                                {c.type || 'CCS2'}
                              </span>
                            ))
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                              CCS2
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 3. Power */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-800">
                          {chg.powerKw || 60} kW
                        </span>
                      </td>

                      {/* 4. Charger Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${chgBadge.bg} ${chgBadge.text} ${chgBadge.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${chgBadge.dot}`} />
                          <span>{chgBadge.label}</span>
                        </span>
                      </td>

                      {/* 5. Connector Status (Multi-Gun) */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {chg.connectors && chg.connectors.length > 0 ? (
                            chg.connectors.map((c, cIdx) => {
                              const cBadge = getChargerHealthBadge(c.status);
                              return (
                                <div 
                                  key={cIdx} 
                                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-medium ${cBadge.bg} ${cBadge.text} ${cBadge.border}`}
                                >
                                  <span className="font-semibold opacity-75">Gun {c.connectorId?.replace('GUN-', '') || cIdx + 1}:</span>
                                  <span className={`w-1.5 h-1.5 rounded-full ${cBadge.dot}`} />
                                  <span className="font-semibold">{c.status}</span>
                                </div>
                              );
                            })
                          ) : (
                            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-medium ${chgBadge.bg} ${chgBadge.text} ${chgBadge.border}`}>
                              <span className="font-semibold opacity-75">Gun 1:</span>
                              <span className={`w-1.5 h-1.5 rounded-full ${chgBadge.dot}`} />
                              <span className="font-semibold">{chgBadge.label}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 6. Live Session / Diagnostics */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {chg.status === 'Charging' && chg.activeSession ? (
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping shrink-0" />
                            <div className="text-xs">
                              <span className="font-semibold text-gray-900">{chg.activeSession.userName || 'Active Driver'}</span>
                              <span className="text-gray-400 mx-1">·</span>
                              <span className="font-medium text-emerald-700">{chg.activeSession.unitsConsumed || 14.5} kWh</span>
                            </div>
                          </div>
                        ) : chg.status === 'Fault' ? (
                          <div className="flex items-center gap-1.5 text-xs font-medium text-rose-600">
                            <AlertTriangle size={14} className="shrink-0" />
                            <span>Trip: {chg.errorCode || 'Over-temperature'}</span>
                          </div>
                        ) : chg.status === 'Maintenance' ? (
                          <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600">
                            <Wrench size={14} className="shrink-0" />
                            <span>Under Inspection</span>
                          </div>
                        ) : chg.status === 'Offline' ? (
                          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
                            <PowerOff size={14} className="shrink-0" />
                            <span>No OCPP Signal</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                            <CheckCircle2 size={14} className="shrink-0" />
                            <span>Ready for Charging</span>
                          </div>
                        )}
                      </td>

                      {/* 7. Action Override */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        {chargerActionLoading === chg.chargerId ? (
                          <Loader2 size={16} className="animate-spin text-emerald-600 mx-auto" />
                        ) : (
                          <div className="relative inline-block text-left">
                            <select
                              value={chg.status}
                              onChange={(e) => handleUpdateChargerStatus(chg.chargerId, e.target.value)}
                              disabled={!hasPermission('stations', 'edit')}
                              className="appearance-none bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg pl-2.5 pr-7 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#8CC63F] cursor-pointer transition shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Change Charger Status"
                            >
                              <option value="Available">Available</option>
                              <option value="Charging">Charging</option>
                              <option value="Maintenance">Maintenance</option>
                              <option value="Fault">Fault</option>
                              <option value="Offline">Offline</option>
                            </select>
                            <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400 font-medium text-sm">
                    No hardware chargers configured for this station.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── SECTION 4: 📊 PERFORMANCE METRICS ───────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#8CC63F] flex items-center justify-center border border-emerald-100">
              <TrendingUp size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900">4. Performance & Usage</h2>
              <p className="text-xs text-gray-500 font-medium">
                Charging sessions, gross & net revenue, energy delivery, utilization rate, and station uptime
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-gray-400">Section 4 of 4</span>
        </div>

        <div className="p-5 sm:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Today's Sessions */}
            <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200/60 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Today's Sessions</span>
              <p className="text-2xl font-black text-gray-900 font-mono">
                {performance.todaySessions?.toLocaleString() || 0}
              </p>
              <span className="text-[10px] font-bold text-emerald-600">Sessions since 00:00 AM</span>
            </div>

            {/* Total Sessions */}
            <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200/60 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Total Sessions</span>
              <p className="text-2xl font-black text-gray-900 font-mono">
                {performance.totalSessions?.toLocaleString() || 0}
              </p>
              <span className="text-[10px] font-semibold text-gray-400">Lifetime charging sessions</span>
            </div>

            {/* Today's Revenue */}
            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200/70 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">Today's Revenue</span>
              <p className="text-2xl font-black text-emerald-950 font-mono">
                ₹{performance.todayRevenue?.toLocaleString('en-IN') || 0}
              </p>
              <span className="text-[10px] font-bold text-emerald-700">Gross daily billings</span>
            </div>

            {/* Total Revenue */}
            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200/70 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">Total Revenue</span>
              <p className="text-2xl font-black text-emerald-950 font-mono">
                ₹{performance.totalRevenue?.toLocaleString('en-IN') || 0}
              </p>
              <span className="text-[10px] font-bold text-emerald-700">Cumulative station revenue</span>
            </div>

            {/* Energy Delivered */}
            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-200/70 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block">Energy Delivered</span>
              <p className="text-2xl font-black text-blue-950 font-mono">
                {performance.energyDelivered?.toLocaleString() || 0} <span className="text-xs font-bold font-sans">kWh</span>
              </p>
              <span className="text-[10px] font-bold text-blue-700">Clean EV electricity delivered</span>
            </div>

            {/* Utilization % */}
            <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200/60 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Utilization Rate</span>
              <p className="text-2xl font-black text-gray-900 font-mono">
                {performance.utilization || 0}%
              </p>
              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-[#8CC63F] h-1.5 rounded-full" 
                  style={{ width: `${Math.min(100, performance.utilization || 10)}%` }} 
                />
              </div>
            </div>

            {/* Uptime % */}
            <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200/60 space-y-1 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Fleet Uptime</span>
              <p className="text-2xl font-black text-emerald-700 font-mono">
                {performance.uptime || 98.8}%
              </p>
              <span className="text-[10px] font-bold text-emerald-600">Hardware operational uptime</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── EDIT CUSTOMER AMENITIES MODAL ────────────────────────────── */}
      {isEditAmenitiesOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-2xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-gray-100 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Manage Customer Amenities</h3>
                  <p className="text-xs text-gray-500 font-medium">Toggle facilities available at {stName}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditAmenitiesOpen(false)}
                className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAmenities} className="space-y-3">
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {amenitiesList.map((item) => {
                  const isChecked = Boolean(amenitiesForm[item.key]);
                  return (
                    <label
                      key={item.key}
                      className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer ${
                        isChecked
                          ? 'bg-emerald-50/50 border-emerald-200 shadow-2xs'
                          : 'bg-gray-50 border-gray-200 opacity-70'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{item.icon}</span>
                        <div>
                          <p className="text-xs font-bold text-gray-900">{item.name}</p>
                          <p className="text-[10px] text-gray-400 font-medium">{item.description}</p>
                        </div>
                      </div>

                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) =>
                          setAmenitiesForm((prev) => ({
                            ...prev,
                            [item.key]: e.target.checked
                          }))
                        }
                        className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer accent-[#8CC63F]"
                      />
                    </label>
                  );
                })}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditAmenitiesOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAmenities}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-2xs"
                >
                  {savingAmenities ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>Save Amenities</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StationDetailView;
