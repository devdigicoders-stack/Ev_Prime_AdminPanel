import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Loader2, Eye, 
  CheckCircle, XCircle, RefreshCw, ClipboardList, Zap, IndianRupee, 
  CalendarCheck, AlertTriangle, AlertCircle, Copy, CreditCard, RotateCcw, Clock,
  Check, Calendar, X, MapPin, BatteryCharging, 
  Leaf, User, MessageSquare, Star, ExternalLink, Phone, Mail,
  TicketCheck, Shield, HeartHandshake, MoreVertical, Ban, CalendarClock,
  RefreshCcw, PhoneCall, History } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Point 3: Complete Booking Lifecycle Vocabulary (Standard client statuses)
const BOOKING_STATUS_STYLES = {
  Pending: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', dot: 'bg-amber-500', icon: '🟡', label: 'Pending' },
  Confirmed: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500', icon: '📅', label: 'Confirmed' },
  'In Progress': { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-300', dot: 'bg-emerald-500 animate-pulse', icon: '⚡', label: 'In Progress' },
  Ongoing: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-300', dot: 'bg-emerald-500 animate-pulse', icon: '⚡', label: 'In Progress' },
  Charging: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-300', dot: 'bg-emerald-500 animate-pulse', icon: '⚡', label: 'In Progress' },
  Completed: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', dot: 'bg-teal-500', icon: '✅', label: 'Completed' },
  Cancelled: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500', icon: '❌', label: 'Cancelled' },
  Failed: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500', icon: '🔴', label: 'Failed' },
  'No Show': { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', dot: 'bg-slate-500', icon: '🚫', label: 'No Show' },
  'No-show': { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', dot: 'bg-slate-500', icon: '🚫', label: 'No Show' },
  Expired: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300', dot: 'bg-gray-400', icon: '⏰', label: 'Expired' },
};

// Guarantee: No booking left unclassified / blank / "-"
const getBookingStatusBadge = (status) => {
  if (!status || typeof status !== 'string' || status.trim() === '' || status === '-') {
    return { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', dot: 'bg-amber-500', icon: '🟡', label: 'Pending (Unclassified)' };
  }
  return BOOKING_STATUS_STYLES[status] || {
    bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200', dot: 'bg-gray-500', icon: '●', label: status
  };
};

// Payment Status Styles (Financial Settlements)
const PAYMENT_STATUS_STYLES = {
  Paid: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', icon: '🟢', label: 'Paid' },
  Pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500', icon: '🟡', label: 'Pending' },
  'Refund Requested': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500', icon: '⏳', label: 'Refund Requested' },
  Refunded: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500', icon: '↩️', label: 'Refunded' },
  Failed: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500', icon: '🔴', label: 'Payment Failed' },
};

// Filter Preset Options (Point 5)
const DATE_RANGE_OPTIONS = [
  { value: 'All', label: 'All Dates', icon: '📅' },
  { value: 'Today', label: 'Today', icon: '☀️' },
  { value: 'Yesterday', label: 'Yesterday', icon: '⏮️' },
  { value: 'This Week', label: 'This Week', icon: '📆' },
  { value: 'This Month', label: 'This Month', icon: '🗓️' },
  { value: 'Custom', label: 'Custom Range...', icon: '🎯' },
];

const BOOKING_STATUS_OPTIONS = [
  { value: 'All', label: 'All Booking Status', icon: '🌐' },
  { value: 'Pending', label: 'Pending', icon: '🟡' },
  { value: 'Confirmed', label: 'Confirmed', icon: '📅' },
  { value: 'Charging', label: 'In Progress (Charging)', icon: '⚡' },
  { value: 'Completed', label: 'Completed', icon: '✅' },
  { value: 'Cancelled', label: 'Cancelled', icon: '❌' },
  { value: 'Failed', label: 'Failed Sessions', icon: '🔴' },
  { value: 'No Show', label: 'No Show', icon: '⚪' },
  { value: 'Expired', label: 'Expired Slots', icon: '⏰' },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: 'All', label: 'All Payment Status', icon: '💳' },
  { value: 'Paid', label: 'Paid', icon: '🟢' },
  { value: 'Pending', label: 'Pending', icon: '🟡' },
  { value: 'Refund Requested', label: 'Refund Requested', icon: '⏳' },
  { value: 'Refunded', label: 'Refunded', icon: '↩️' },
  { value: 'Failed', label: 'Payment Failed', icon: '🔴' },
];

const StatCard = ({ label, value, subtext, icon: Icon, iconBg, iconColor, alertBadge, isActive, onClick }) => {
  const Component = onClick ? 'button' : 'div';
  const valStr = String(value ?? '');

  // Responsive dynamic font sizing: scales smoothly as digits grow (e.g. ₹2,21,082 or larger)
  const getValueSizeClass = (str) => {
    if (str.length > 11) return 'text-base sm:text-lg';
    if (str.length > 7) return 'text-lg sm:text-[21px]';
    if (str.length > 4) return 'text-xl sm:text-2xl';
    return 'text-2xl sm:text-[26px]';
  };

  return (
    <Component
      {...(onClick ? { type: 'button', onClick } : {})}
      className={`bg-white rounded-2xl border text-left p-3.5 sm:p-4 flex flex-col justify-between transition-all duration-200 group overflow-hidden relative min-h-[116px] select-none ${
        onClick ? 'cursor-pointer' : 'cursor-default'
      } ${
        isActive 
          ? 'ring-2 ring-[#8CC63F] border-[#8CC63F] bg-emerald-50/20 shadow-md -translate-y-0.5' 
          : 'border-gray-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-emerald-300 hover:-translate-y-0.5'
      }`}
      title={onClick ? `Filter by ${label}` : label}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5 z-10 w-full min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-gray-500 text-[11px] sm:text-xs font-bold uppercase tracking-wider truncate">{label}</span>
          {isActive && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#8CC63F] shrink-0" title="Active Filter" />
          )}
        </div>
        <div className={`w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl ${iconBg} ${iconColor} border border-black/5 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-2xs`}>
          <Icon size={16} strokeWidth={2.2} />
        </div>
      </div>

      <div className="z-10 w-full min-w-0 my-auto">
        <div className="flex items-baseline gap-1.5 flex-wrap min-w-0 max-w-full">
          <span 
            className={`${getValueSizeClass(valStr)} font-black text-gray-900 tracking-tight font-sans truncate max-w-full leading-tight`}
            title={valStr}
          >
            {valStr}
          </span>
          {alertBadge && (
            <span className="px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200/60 shrink-0">
              {alertBadge}
            </span>
          )}
        </div>
        {subtext && (
          <p 
            className="text-gray-400 text-[10px] sm:text-[11px] mt-1 font-medium truncate group-hover:text-gray-600 transition-colors"
            title={subtext}
          >
            {subtext}
          </p>
        )}
      </div>

      <div className={`absolute -right-5 -bottom-5 w-20 h-20 rounded-full ${iconBg} opacity-15 pointer-events-none transition-all group-hover:scale-125`} />
    </Component>
  );
};

// Point 12 (P2.4): Booking Activity Timeline builder
const buildBookingTimeline = (b) => {
  if (!b) return [];
  const events = [];

  const formatTimeStr = (dateVal, fallback) => {
    if (!dateVal) return fallback || '—';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return fallback || String(dateVal);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // 1. Booking Created / Reserved
  const createdTime = b.createdAt 
    ? formatTimeStr(b.createdAt)
    : (b.scheduledDate ? `${b.scheduledDate}, ${b.scheduledTime || 'TBD'}` : 'Initial Request');
  events.push({
    title: 'Booking Created',
    time: createdTime,
    desc: `Slot reserved by ${b.user?.name || 'User'} for ${b.connectorType || 'EV Charger'}`,
    status: 'completed'
  });

  // 2. Payment Status Event
  if (b.paymentStatus === 'Paid') {
    events.push({
      title: 'Payment Successful',
      time: b.paymentCompletedAt ? formatTimeStr(b.paymentCompletedAt) : (b.updatedAt ? formatTimeStr(b.updatedAt) : createdTime),
      desc: `₹${Math.round(b.estimatedCost || 0).toLocaleString('en-IN')} paid via ${b.paymentMethod || 'Razorpay'} (${b.razorpayPaymentId || 'Verified'})`,
      status: 'completed'
    });
  } else if (b.paymentStatus === 'Failed') {
    events.push({
      title: 'Payment Failed',
      time: b.updatedAt ? formatTimeStr(b.updatedAt) : createdTime,
      desc: 'Transaction declined or aborted by gateway',
      status: 'failed'
    });
  } else {
    events.push({
      title: 'Payment Pending',
      time: createdTime,
      desc: `Awaiting transaction authorization for ₹${Math.round(b.estimatedCost || 0).toLocaleString('en-IN')}`,
      status: 'pending'
    });
  }

  // 3. Booking Confirmation Event
  if (['Confirmed', 'Charging', 'Ongoing', 'In Progress', 'Completed'].includes(b.status)) {
    events.push({
      title: 'Booking Confirmed',
      time: b.confirmedAt ? formatTimeStr(b.confirmedAt) : (b.scheduledDate ? `${b.scheduledDate}, ${b.scheduledTime}` : 'Confirmed'),
      desc: `Station: ${b.station?.name || 'EV Station'} · Security PIN: ${b.pin || 'Generated'}`,
      status: 'completed'
    });
  }

  // 4. Charging Session Started
  if (b.chargingStartTime || ['Charging', 'Ongoing', 'In Progress', 'Completed'].includes(b.status)) {
    events.push({
      title: 'Charging Started',
      time: b.chargingStartTime ? formatTimeStr(b.chargingStartTime) : (b.status === 'Completed' ? 'Started' : 'In Progress'),
      desc: `Power delivery active on ${b.chargerId || b.connectorType || 'Connector'}`,
      status: 'completed'
    });
  }

  // 5. Final State / Special Lifecycle Event
  if (b.status === 'Completed') {
    events.push({
      title: 'Charging Completed',
      time: b.chargingEndTime ? formatTimeStr(b.chargingEndTime) : (b.updatedAt ? formatTimeStr(b.updatedAt) : 'Session Ended'),
      desc: `Total ${b.unitsConsumed || b.estimatedEnergy || 0} kWh energy delivered. Target SOC reached.`,
      status: 'completed'
    });
  } else if (b.status === 'Cancelled') {
    events.push({
      title: 'Booking Cancelled',
      time: b.cancelledAt ? formatTimeStr(b.cancelledAt) : (b.updatedAt ? formatTimeStr(b.updatedAt) : 'Cancelled'),
      desc: b.cancellationReason ? `Reason: ${b.cancellationReason}` : 'Cancelled by user or administrator',
      status: 'failed'
    });
    if (b.paymentStatus === 'Refunded' || b.refundAmount > 0) {
      events.push({
        title: 'Refund Processed',
        time: b.refundedAt ? formatTimeStr(b.refundedAt) : (b.updatedAt ? formatTimeStr(b.updatedAt) : 'Refunded'),
        desc: `₹${(b.refundAmount || 0).toFixed(2)} refunded to source account (${b.refundStatus || 'Completed'})`,
        status: 'completed'
      });
    }
  } else if (b.status === 'No Show' || b.status === 'No-show') {
    events.push({
      title: 'Marked No-Show',
      time: b.updatedAt ? formatTimeStr(b.updatedAt) : `${b.scheduledDate}, ${b.scheduledTime}`,
      desc: 'User did not arrive at the station for the reserved time window',
      status: 'warning'
    });
  } else if (b.status === 'Expired') {
    events.push({
      title: 'Slot Expired',
      time: b.updatedAt ? formatTimeStr(b.updatedAt) : `${b.scheduledDate}, ${b.scheduledTime}`,
      desc: 'Reservation lapsed due to payment or arrival timeout',
      status: 'warning'
    });
  } else if (b.status === 'Failed') {
    events.push({
      title: 'Session Failed / Aborted',
      time: b.updatedAt ? formatTimeStr(b.updatedAt) : 'Failed',
      desc: 'Hardware trip or charger communication fault reported',
      status: 'failed'
    });
  }

  return events;
};

const BookingManagementView = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // URL Query State Synchronization
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [bookingStatusFilter, setBookingStatusFilter] = useState(searchParams.get('bookingStatus') || 'All');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState(searchParams.get('paymentStatus') || 'All');
  const [dateRange, setDateRange] = useState(searchParams.get('dateRange') || 'All');
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '');
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');
  const [stationFilter, setStationFilter] = useState(searchParams.get('station') || 'All');
  const [cityFilter, setCityFilter] = useState(searchParams.get('city') || 'All');
  const [connectorTypeFilter, setConnectorTypeFilter] = useState(searchParams.get('connectorType') || 'All');
  const [partnerFilter, setPartnerFilter] = useState(searchParams.get('partner') || 'All');

  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Data states
  const [bookings, setBookings] = useState([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    charging: 0,
    completed: 0,
    cancelled: 0,
    failed: 0,
    noShow: 0,
    expired: 0,
    grossRevenue: 0,
    netRevenue: 0,
    completedRevenue: 0,
    totalRefunds: 0,
    totalRevenue: 0
  });

  // Point 9: Upcoming bookings state (Next 24 hours)
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [isUpcomingExpanded, setIsUpcomingExpanded] = useState(true);

  // Point 11: Real-time & Refresh states
  const [lastUpdated, setLastUpdated] = useState(() => {
    return new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  });
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(0); // 0=Off, 30=30s, 60=60s
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Dynamic filter lists from backend
  const [filterOptions, setFilterOptions] = useState({
    stations: [],
    cities: [],
    connectorTypes: [],
    partners: []
  });

  const { isSuperAdmin, hasPermission } = useAuth();

  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  // Actions dropdown state (table row)
  const [openActionMenu, setOpenActionMenu] = useState(null); // bookingId
  const actionMenuRef = useRef(null);
  const menuBtnRef = useRef({}); // map of bookingId -> button DOM element
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 }); // fixed coords

  // Reschedule modal state
  const [rescheduleModal, setRescheduleModal] = useState(null); // booking object
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  // Refund modal state
  const [refundModal, setRefundModal] = useState(null); // booking object
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundAction, setRefundAction] = useState('initiate'); // initiate | approve | reject
  const [refundLoading, setRefundLoading] = useState(false);

  // Sync URL parameters
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (bookingStatusFilter !== 'All') params.set('bookingStatus', bookingStatusFilter);
    if (paymentStatusFilter !== 'All') params.set('paymentStatus', paymentStatusFilter);
    if (dateRange !== 'All') params.set('dateRange', dateRange);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (stationFilter !== 'All') params.set('station', stationFilter);
    if (cityFilter !== 'All') params.set('city', cityFilter);
    if (connectorTypeFilter !== 'All') params.set('connectorType', connectorTypeFilter);
    if (partnerFilter !== 'All') params.set('partner', partnerFilter);
    if (currentPage > 1) params.set('page', currentPage.toString());
    setSearchParams(params, { replace: true });
  }, [
    search, bookingStatusFilter, paymentStatusFilter, dateRange, startDate, endDate,
    stationFilter, cityFilter, connectorTypeFilter, partnerFilter, currentPage, setSearchParams
  ]);

  // Fetch filter options (stations, cities, connectors, partners) on mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        setFilterLoading(true);
        const token = localStorage.getItem('adminToken');
        const res = await fetch(`${API_BASE_URL}/booking/admin/filter-options`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success && json.data) {
          setFilterOptions({
            stations: json.data.stations || [],
            cities: json.data.cities || [],
            connectorTypes: json.data.connectorTypes || [],
            partners: json.data.partners || []
          });
        }
      } catch (err) {
        console.error('Failed to load filter options:', err);
      } finally {
        setFilterLoading(false);
      }
    };
    fetchFilterOptions();
  }, []);

  // Fetch bookings with full multi-filter parameters
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
      });

      if (search) params.append('search', search);
      if (bookingStatusFilter !== 'All') params.append('bookingStatus', bookingStatusFilter);
      if (paymentStatusFilter !== 'All') params.append('paymentStatus', paymentStatusFilter);
      if (dateRange !== 'All') params.append('dateRange', dateRange);
      if (dateRange === 'Custom' && startDate) params.append('startDate', startDate);
      if (dateRange === 'Custom' && endDate) params.append('endDate', endDate);
      if (stationFilter !== 'All') params.append('station', stationFilter);
      if (cityFilter !== 'All') params.append('city', cityFilter);
      if (connectorTypeFilter !== 'All') params.append('connectorType', connectorTypeFilter);
      if (partnerFilter !== 'All') params.append('partner', partnerFilter);

      const res = await fetch(`${API_BASE_URL}/booking/admin/all?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success) {
        setBookings(data.data || []);
        setTotal(data.total || 0);
        if (data.stats) setStats(data.stats);
        if (Array.isArray(data.upcomingBookings)) {
          setUpcomingBookings(data.upcomingBookings);
        }
        setLastUpdated(new Date().toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }));
      } else {
        toast.error(data.message || 'Failed to fetch bookings');
      }
    } catch (err) {
      toast.error('Network error fetching bookings');
    } finally {
      setLoading(false);
    }
  }, [
    currentPage, itemsPerPage, search, bookingStatusFilter, paymentStatusFilter,
    dateRange, startDate, endDate, stationFilter, cityFilter, connectorTypeFilter, partnerFilter
  ]);

  // Dedicated fetch for upcoming next-24h reservations
  const fetchUpcomingBookings = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/booking/admin/upcoming`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setUpcomingBookings(json.data);
      }
    } catch (err) {
      console.warn('Failed to fetch upcoming bookings:', err);
    }
  }, []);

  // Point 11: Real-time Manual Refresh handler
  const handleManualRefresh = async (showToast = true) => {
    setIsRefreshing(true);
    try {
      await Promise.all([fetchBookings(), fetchUpcomingBookings()]);
      if (showToast) {
        toast.success('Live booking data & telemetry refreshed! ⚡');
      }
    } catch (err) {
      if (showToast) {
        toast.error('Failed to refresh booking data');
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Point 11: Auto-refresh timer
  useEffect(() => {
    if (!autoRefreshInterval || autoRefreshInterval <= 0) return;

    const intervalId = setInterval(() => {
      fetchBookings();
    }, autoRefreshInterval * 1000);

    return () => clearInterval(intervalId);
  }, [autoRefreshInterval, fetchBookings]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Reset to page 1 on filter changes
  useEffect(() => { 
    setCurrentPage(1); 
  }, [
    search, bookingStatusFilter, paymentStatusFilter, 
    dateRange, startDate, endDate, stationFilter, cityFilter, connectorTypeFilter, partnerFilter
  ]);

  // Open Level 2 View Booking Drawer and fetch fully populated record
  const handleOpenBookingDetail = async (booking) => {
    setSelectedBooking(booking);
    setDetailLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/booking/admin/${booking._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setSelectedBooking(data.data);
      }
    } catch (err) {
      console.warn('Failed to fetch complete booking details, showing preview data:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedBooking) {
        setSelectedBooking(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBooking]);

  const updateStatus = async (id, status) => {
    setActionLoading(id);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/booking/admin/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      const updated = await res.json();
      toast.success(`Booking status updated to ${status}`);
      fetchBookings();
      if (selectedBooking?._id === id) {
        setSelectedBooking(updated.data ?? { ...selectedBooking, status });
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartChargingRemote = async (id) => {
    setActionLoading(id);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/booking/${id}/start-charging`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to start charging');
      toast.success('Charging session started remotely! ⚡ (In Progress)');
      fetchBookings();
      if (selectedBooking?._id === id) setSelectedBooking(data.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStopChargingRemote = async (id) => {
    setActionLoading(id);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/booking/${id}/stop-charging`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to stop charging');
      toast.success('Charging session stopped & marked Completed! ✅');
      fetchBookings();
      if (selectedBooking?._id === id) setSelectedBooking(data.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Close action menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target)) {
        setOpenActionMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cancel booking (admin)
  const handleCancelBooking = async (booking) => {
    const canCancel = !['Completed', 'Cancelled', 'Failed'].includes(booking.status);
    if (!canCancel) {
      toast.error(`Cannot cancel a ${booking.status} booking`);
      return;
    }
    if (!window.confirm(`Cancel booking #${booking.bookingId}?\n\nThis will mark it Cancelled and preserve all payment/charging history.`)) return;
    await updateStatus(booking._id, 'Cancelled');
    setOpenActionMenu(null);
  };

  // Reschedule booking (admin)
  const handleRescheduleSubmit = async () => {
    if (!rescheduleDate || !rescheduleTime) {
      toast.error('Please select both date and time');
      return;
    }
    setRescheduleLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/booking/admin/${rescheduleModal._id}/reschedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ scheduledDate: rescheduleDate, scheduledTime: rescheduleTime }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Reschedule failed');
      toast.success(`Booking #${rescheduleModal.bookingId} rescheduled to ${rescheduleDate} at ${rescheduleTime}`);
      fetchBookings();
      if (selectedBooking?._id === rescheduleModal._id) {
        setSelectedBooking(prev => ({ ...prev, scheduledDate: rescheduleDate, scheduledTime: rescheduleTime }));
      }
      setRescheduleModal(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRescheduleLoading(false);
    }
  };

  // Refund initiation/approval (admin — superadmin or refunds.approve permission)
  const handleRefundSubmit = async () => {
    if (!refundAmount || isNaN(refundAmount) || Number(refundAmount) <= 0) {
      toast.error('Please enter a valid refund amount');
      return;
    }
    setRefundLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/booking/admin/${refundModal._id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ refundAmount: Number(refundAmount), refundReason, action: refundAction }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Refund operation failed');
      toast.success(`Refund ${refundAction}d successfully for booking #${refundModal.bookingId}`);
      fetchBookings();
      if (selectedBooking?._id === refundModal._id) {
        setSelectedBooking(prev => ({
          ...prev,
          paymentStatus: data.data?.paymentStatus || prev.paymentStatus,
          refundAmount: Number(refundAmount),
          refundStatus: data.data?.refundStatus || prev.refundStatus,
        }));
      }
      setRefundModal(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRefundLoading(false);
    }
  };

  // Check if admin can approve refunds (superadmin or has refunds.approve permission)
  const canApproveRefunds = isSuperAdmin || hasPermission('refunds', 'approve');

  // 1-Click Reset Filters
  const handleResetFilters = () => {
    setSearch('');
    setBookingStatusFilter('All');
    setPaymentStatusFilter('All');
    setDateRange('All');
    setStartDate('');
    setEndDate('');
    setStationFilter('All');
    setCityFilter('All');
    setConnectorTypeFilter('All');
    setPartnerFilter('All');
    setCurrentPage(1);
    toast.success('All filters reset to default');
  };

  // Count active non-default filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (search.trim()) count++;
    if (bookingStatusFilter !== 'All') count++;
    if (paymentStatusFilter !== 'All') count++;
    if (dateRange !== 'All') count++;
    if (stationFilter !== 'All') count++;
    if (cityFilter !== 'All') count++;
    if (connectorTypeFilter !== 'All') count++;
    if (partnerFilter !== 'All') count++;
    return count;
  }, [search, bookingStatusFilter, paymentStatusFilter, dateRange, stationFilter, cityFilter, connectorTypeFilter, partnerFilter]);

  const totalPages = Math.ceil(total / itemsPerPage);

  return (
    <div className="flex flex-col space-y-6">
      {/* Header with Point 11 Real-time Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Booking Management</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#8CC63F]/20 text-emerald-800 border border-[#8CC63F]/30">
              Live Operations
            </span>
          </div>
          <p className="text-gray-500 text-xs font-medium mt-0.5">
            Operational monitoring, upcoming reservations dispatch, and real-time charging telemetry.
          </p>
        </div>

        {/* Point 11: Real-time Refresh Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Last Updated Timestamp */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-xl shadow-2xs text-xs font-semibold text-gray-600">
            <Clock size={13} className="text-gray-400" />
            <span className="text-gray-400 font-medium text-[11px]">Last Updated:</span>
            <span className="text-gray-800 font-bold font-mono">{lastUpdated}</span>
          </div>

          {/* Auto Refresh Toggle */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-gray-200 rounded-xl shadow-2xs text-xs font-semibold text-gray-700">
            <span className={`w-2 h-2 rounded-full ${autoRefreshInterval > 0 ? 'bg-emerald-500 animate-ping' : 'bg-gray-300'}`} />
            <span className="text-gray-400 text-[11px]">Auto:</span>
            <select
              value={autoRefreshInterval}
              onChange={(e) => {
                const val = Number(e.target.value);
                setAutoRefreshInterval(val);
                if (val > 0) toast.success(`Auto-refresh enabled: every ${val}s`);
                else toast('Auto-refresh paused');
              }}
              className="bg-transparent font-bold text-gray-800 text-xs focus:outline-none cursor-pointer"
              title="Auto-refresh interval"
            >
              <option value={0}>Off</option>
              <option value={30}>30s</option>
              <option value={60}>60s</option>
            </select>
          </div>

          {/* Manual Refresh Button */}
          <button
            onClick={() => handleManualRefresh(true)}
            disabled={isRefreshing}
            className="px-3.5 py-1.5 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            title="Fetch latest bookings, payment & telemetry status"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Point 10: KPI Summary Metrics (Balanced 5x2 Layout for High Legibility) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Row 1: Core Lifecycle & Financials */}
        <StatCard 
          label="Total Bookings" 
          value={stats.total ?? 0} 
          subtext="All recorded bookings" 
          icon={ClipboardList} 
          iconBg="bg-blue-50" 
          iconColor="text-blue-600"
          isActive={bookingStatusFilter === 'All'}
          onClick={() => setBookingStatusFilter('All')}
        />
        <StatCard 
          label="Confirmed" 
          value={stats.confirmed ?? 0} 
          subtext="Scheduled reservations" 
          icon={CalendarCheck} 
          iconBg="bg-indigo-50" 
          iconColor="text-indigo-600"
          isActive={bookingStatusFilter === 'Confirmed'}
          onClick={() => setBookingStatusFilter(bookingStatusFilter === 'Confirmed' ? 'All' : 'Confirmed')}
        />
        <StatCard 
          label="In Progress ⚡" 
          value={stats.charging ?? 0} 
          subtext="Active charging sessions" 
          icon={Zap} 
          iconBg="bg-emerald-50" 
          iconColor="text-emerald-600" 
          alertBadge={stats.charging > 0 ? `${stats.charging} Live` : null}
          isActive={bookingStatusFilter === 'Charging'}
          onClick={() => setBookingStatusFilter(bookingStatusFilter === 'Charging' ? 'All' : 'Charging')}
        />
        <StatCard 
          label="Completed" 
          value={stats.completed ?? 0} 
          subtext="Delivered electricity" 
          icon={CheckCircle} 
          iconBg="bg-teal-50" 
          iconColor="text-teal-600"
          isActive={bookingStatusFilter === 'Completed'}
          onClick={() => setBookingStatusFilter(bookingStatusFilter === 'Completed' ? 'All' : 'Completed')}
        />
        <StatCard 
          label="Net Revenue" 
          value={`₹${Math.round(stats.netRevenue ?? stats.totalRevenue ?? 0).toLocaleString('en-IN')}`} 
          subtext={`Gross ₹${Math.round(stats.grossRevenue ?? 0).toLocaleString('en-IN')}`}
          icon={IndianRupee} 
          iconBg="bg-amber-50" 
          iconColor="text-amber-600"
        />

        {/* Row 2: Operational Pipeline & Exceptions */}
        <StatCard 
          label="Pending" 
          value={stats.pending ?? 0} 
          subtext="Awaiting user payment" 
          icon={Clock} 
          iconBg="bg-amber-50" 
          iconColor="text-amber-600"
          isActive={bookingStatusFilter === 'Pending'}
          onClick={() => setBookingStatusFilter(bookingStatusFilter === 'Pending' ? 'All' : 'Pending')}
        />
        <StatCard 
          label="Cancelled" 
          value={stats.cancelled ?? 0} 
          subtext="User / Host cancelled" 
          icon={XCircle} 
          iconBg="bg-orange-50" 
          iconColor="text-orange-500"
          isActive={bookingStatusFilter === 'Cancelled'}
          onClick={() => setBookingStatusFilter(bookingStatusFilter === 'Cancelled' ? 'All' : 'Cancelled')}
        />
        <StatCard 
          label="Failed" 
          value={stats.failed ?? 0} 
          subtext="Payment or charger error" 
          icon={AlertCircle} 
          iconBg="bg-rose-50" 
          iconColor="text-rose-600"
          alertBadge={stats.failed > 0 ? `${stats.failed} Issues` : null}
          isActive={bookingStatusFilter === 'Failed'}
          onClick={() => setBookingStatusFilter(bookingStatusFilter === 'Failed' ? 'All' : 'Failed')}
        />
        <StatCard 
          label="No-Show" 
          value={stats.noShow ?? 0} 
          subtext="User didn't arrive" 
          icon={AlertTriangle} 
          iconBg="bg-slate-100" 
          iconColor="text-slate-600"
          alertBadge={stats.noShow > 0 ? `${stats.noShow} Missed` : null}
          isActive={bookingStatusFilter === 'No Show'}
          onClick={() => setBookingStatusFilter(bookingStatusFilter === 'No Show' ? 'All' : 'No Show')}
        />
        <StatCard 
          label="Expired" 
          value={stats.expired ?? 0} 
          subtext="Time slot lapsed" 
          icon={Clock} 
          iconBg="bg-gray-100" 
          iconColor="text-gray-500"
          isActive={bookingStatusFilter === 'Expired'}
          onClick={() => setBookingStatusFilter(bookingStatusFilter === 'Expired' ? 'All' : 'Expired')}
        />
      </div>

      {/* Point 9: Upcoming Bookings — Next 24 Hours Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Section Header */}
        <div className="p-3.5 sm:px-5 sm:py-3 bg-gradient-to-r from-blue-50/40 via-white to-gray-50/40 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
              <CalendarClock size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-gray-900 tracking-tight">Upcoming Bookings</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Next 24 Hours
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                  {upcomingBookings.length} scheduled
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium hidden sm:block">
                Priority operations overview for reservations scheduled to arrive in the next 24 hours.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsUpcomingExpanded(!isUpcomingExpanded)}
            className="px-2 py-1 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition cursor-pointer flex items-center gap-1 text-xs font-bold"
            title={isUpcomingExpanded ? 'Collapse section' : 'Expand section'}
          >
            <span className="text-[11px] font-semibold text-gray-500">
              {isUpcomingExpanded ? 'Collapse' : 'Expand'}
            </span>
            {isUpcomingExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>

        {/* Section Content */}
        {isUpcomingExpanded && (
          <div>
            {upcomingBookings.length === 0 ? (
              <div className="py-7 px-4 text-center">
                <CalendarCheck size={26} className="mx-auto text-gray-300 mb-1.5" />
                <p className="text-xs font-bold text-gray-700">No Upcoming Bookings in Next 24 Hours</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  All station chargers are currently available for on-demand walk-in charging.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-4 py-2.5">⏰ Time</th>
                      <th className="px-4 py-2.5">⚡ Station</th>
                      <th className="px-4 py-2.5">🔌 Charger / Connector</th>
                      <th className="px-4 py-2.5">👤 User</th>
                      <th className="px-4 py-2.5">📌 Confirmation Status</th>
                      <th className="px-4 py-2.5">PIN</th>
                      <th className="px-4 py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {upcomingBookings.map((ub) => {
                      const uStatusBadge = getBookingStatusBadge(ub.status);
                      return (
                        <tr key={ub._id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Clock size={13} className="text-blue-500 shrink-0" />
                              <span className="font-extrabold text-gray-900 font-mono text-xs">{ub.time || ub.scheduledTime}</span>
                              <span className="text-[10px] font-semibold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                                {ub.timeFormatted?.split(',')[0] || ub.scheduledDate}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="font-bold text-gray-900 flex items-center gap-1">
                              <MapPin size={12} className="text-gray-400 shrink-0" />
                              <span className="truncate max-w-[160px]">{ub.station?.name || 'Station'}</span>
                            </div>
                            <span className="text-[10px] text-gray-500 ml-4">{ub.station?.city || ''}</span>
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                              <BatteryCharging size={12} className="text-emerald-600" />
                              {ub.chargerId || ub.connectorType}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="font-bold text-gray-900">{ub.user?.name || 'User'}</div>
                            <div className="text-[10px] text-gray-500 font-mono">{ub.user?.mobile || ub.user?.email || '—'}</div>
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${uStatusBadge.bg} ${uStatusBadge.text} ${uStatusBadge.border}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${uStatusBadge.dot}`} />
                              <span>{uStatusBadge.label}</span>
                            </span>
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            <span className="font-mono text-[11px] font-bold bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">
                              {ub.pin || '••••'}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleOpenBookingDetail(ub)}
                              className="px-2.5 py-1 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                              title="View Details"
                            >
                              <Eye size={12} />
                              <span>View</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Table Card (Full Width for Maximum Readability) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col min-w-0">
        
        {/* Point 5: Unified Search & Multi-Filters Toolbar */}
        <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/50 space-y-3">
          
          {/* Row 1: Unified Search & Action Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Universal Search Box (Booking ID, User, Mobile, Station, Charger) */}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search Booking ID (BK...), User, Mobile, Station, City, Charger..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#8CC63F] shadow-2xs placeholder:text-gray-400"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Action Buttons: Active count, Reset, Refresh */}
            <div className="flex items-center gap-2 shrink-0">
              {activeFilterCount > 0 && (
                <button
                  onClick={handleResetFilters}
                  className="px-3 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Clear all active filters"
                >
                  <RotateCcw size={13} />
                  <span>Reset Filters</span>
                  <span className="px-1.5 py-0.2 bg-rose-200 text-rose-800 rounded-full text-[10px]">
                    {activeFilterCount}
                  </span>
                </button>
              )}

              <button
                onClick={fetchBookings}
                className="p-2.5 border border-gray-200 bg-white rounded-xl hover:bg-gray-50 transition text-gray-600 shadow-2xs cursor-pointer flex items-center gap-1"
                title="Refresh Bookings"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Row 2: Grid of 7 Standard Filters */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2 pt-1">
            
            {/* 1. Date Filter */}
            <div className="relative">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className={`w-full appearance-none bg-white border rounded-xl pl-3 pr-7 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#8CC63F] cursor-pointer shadow-2xs truncate ${
                  dateRange !== 'All' ? 'border-[#8CC63F] text-emerald-800 bg-emerald-50/20' : 'border-gray-200 text-gray-700'
                }`}
                title="Date Range Filter"
              >
                {DATE_RANGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.icon} {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* 2. Booking Status */}
            <div className="relative">
              <select
                value={bookingStatusFilter}
                onChange={(e) => setBookingStatusFilter(e.target.value)}
                className={`w-full appearance-none bg-white border rounded-xl pl-3 pr-7 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#8CC63F] cursor-pointer shadow-2xs truncate ${
                  bookingStatusFilter !== 'All' ? 'border-[#8CC63F] text-emerald-800 bg-emerald-50/20' : 'border-gray-200 text-gray-700'
                }`}
                title="Filter by Booking Telemetry Status"
              >
                {BOOKING_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.icon} {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* 3. Payment Status */}
            <div className="relative">
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className={`w-full appearance-none bg-white border rounded-xl pl-3 pr-7 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#8CC63F] cursor-pointer shadow-2xs truncate ${
                  paymentStatusFilter !== 'All' ? 'border-[#8CC63F] text-emerald-800 bg-emerald-50/20' : 'border-gray-200 text-gray-700'
                }`}
                title="Filter by Financial Payment Status"
              >
                {PAYMENT_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.icon} {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* 4. Station Filter */}
            <div className="relative">
              <select
                value={stationFilter}
                onChange={(e) => setStationFilter(e.target.value)}
                className={`w-full appearance-none bg-white border rounded-xl pl-3 pr-7 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#8CC63F] cursor-pointer shadow-2xs truncate ${
                  stationFilter !== 'All' ? 'border-[#8CC63F] text-emerald-800 bg-emerald-50/20' : 'border-gray-200 text-gray-700'
                }`}
                title="Filter by Station"
              >
                <option value="All">⚡ All Stations</option>
                {filterOptions.stations.map((st) => (
                  <option key={st._id} value={st._id}>
                    {st.name} ({st.city})
                  </option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* 5. City Filter */}
            <div className="relative">
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className={`w-full appearance-none bg-white border rounded-xl pl-3 pr-7 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#8CC63F] cursor-pointer shadow-2xs truncate ${
                  cityFilter !== 'All' ? 'border-[#8CC63F] text-emerald-800 bg-emerald-50/20' : 'border-gray-200 text-gray-700'
                }`}
                title="Filter by City"
              >
                <option value="All">🏙️ All Cities</option>
                {filterOptions.cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* 6. Connector Type Filter */}
            <div className="relative">
              <select
                value={connectorTypeFilter}
                onChange={(e) => setConnectorTypeFilter(e.target.value)}
                className={`w-full appearance-none bg-white border rounded-xl pl-3 pr-7 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#8CC63F] cursor-pointer shadow-2xs truncate ${
                  connectorTypeFilter !== 'All' ? 'border-[#8CC63F] text-emerald-800 bg-emerald-50/20' : 'border-gray-200 text-gray-700'
                }`}
                title="Filter by Connector Plug"
              >
                <option value="All">🔌 All Connectors</option>
                {filterOptions.connectorTypes.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* 7. Partner Filter */}
            <div className="relative">
              <select
                value={partnerFilter}
                onChange={(e) => setPartnerFilter(e.target.value)}
                className={`w-full appearance-none bg-white border rounded-xl pl-3 pr-7 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#8CC63F] cursor-pointer shadow-2xs truncate ${
                  partnerFilter !== 'All' ? 'border-[#8CC63F] text-emerald-800 bg-emerald-50/20' : 'border-gray-200 text-gray-700'
                }`}
                title="Filter by Station Operator / Partner"
              >
                <option value="All">🤝 All Partners</option>
                {filterOptions.partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

          </div>

          {/* Row 3 (Conditional): Custom Date Range Inputs */}
          {dateRange === 'Custom' && (
            <div className="flex flex-wrap items-center gap-2 p-2.5 bg-white border border-gray-200 rounded-xl shadow-2xs animate-in fade-in duration-200">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <Calendar size={13} className="text-[#8CC63F]" />
                Custom Range:
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-400">From</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8CC63F]"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-400">To</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8CC63F]"
                />
              </div>
              {(startDate || endDate) && (
                <button
                  onClick={() => { setStartDate(''); setEndDate(''); }}
                  className="text-xs text-gray-400 hover:text-rose-600 p-1 cursor-pointer"
                  title="Clear dates"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          )}

          {/* Active Filter Chips Bar */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mr-1">
                Filters ({activeFilterCount}):
              </span>

              {search && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-gray-700 border border-gray-200 shadow-2xs">
                  <span>Search: "{search}"</span>
                  <button onClick={() => setSearch('')} className="hover:text-red-500 cursor-pointer"><X size={11} /></button>
                </span>
              )}

              {dateRange !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-gray-700 border border-gray-200 shadow-2xs">
                  <span>Date: {dateRange}</span>
                  <button onClick={() => { setDateRange('All'); setStartDate(''); setEndDate(''); }} className="hover:text-red-500 cursor-pointer"><X size={11} /></button>
                </span>
              )}

              {bookingStatusFilter !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-gray-700 border border-gray-200 shadow-2xs">
                  <span>Booking: {bookingStatusFilter}</span>
                  <button onClick={() => setBookingStatusFilter('All')} className="hover:text-red-500 cursor-pointer"><X size={11} /></button>
                </span>
              )}

              {paymentStatusFilter !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-gray-700 border border-gray-200 shadow-2xs">
                  <span>Payment: {paymentStatusFilter}</span>
                  <button onClick={() => setPaymentStatusFilter('All')} className="hover:text-red-500 cursor-pointer"><X size={11} /></button>
                </span>
              )}

              {stationFilter !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-gray-700 border border-gray-200 shadow-2xs">
                  <span>Station: {filterOptions.stations.find(s => s._id === stationFilter)?.name || 'Selected'}</span>
                  <button onClick={() => setStationFilter('All')} className="hover:text-red-500 cursor-pointer"><X size={11} /></button>
                </span>
              )}

              {cityFilter !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-gray-700 border border-gray-200 shadow-2xs">
                  <span>City: {cityFilter}</span>
                  <button onClick={() => setCityFilter('All')} className="hover:text-red-500 cursor-pointer"><X size={11} /></button>
                </span>
              )}

              {connectorTypeFilter !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-gray-700 border border-gray-200 shadow-2xs">
                  <span>Plug: {connectorTypeFilter}</span>
                  <button onClick={() => setConnectorTypeFilter('All')} className="hover:text-red-500 cursor-pointer"><X size={11} /></button>
                </span>
              )}

              {partnerFilter !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-gray-700 border border-gray-200 shadow-2xs">
                  <span>Partner: {filterOptions.partners.find(p => p.id === partnerFilter)?.name || partnerFilter}</span>
                  <button onClick={() => setPartnerFilter('All')} className="hover:text-red-500 cursor-pointer"><X size={11} /></button>
                </span>
              )}

              <button
                onClick={handleResetFilters}
                className="text-[10px] font-bold text-gray-400 hover:text-rose-600 underline ml-1 cursor-pointer"
              >
                Clear all
              </button>
            </div>
          )}

        </div>

        {/* Level 1: Clean, Readable 10-Column Booking Table */}
        <div className="overflow-x-auto flex-1 min-h-[400px] relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-20">
              <Loader2 className="animate-spin text-[#8CC63F]" size={32} />
            </div>
          )}
          <table className="w-full text-left border-collapse min-w-[1020px]">
            <thead className="sticky top-0 bg-gray-50/95 backdrop-blur-xs z-10 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Booking ID</th>
                <th className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Station</th>
                <th className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Charger</th>
                <th className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Date & Time</th>
                <th className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Duration</th>
                <th className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Payment</th>
                <th className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {!loading && bookings.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-20 text-gray-400 font-medium">
                    <div className="space-y-2">
                      <ClipboardList size={36} className="mx-auto text-gray-300" />
                      <p className="text-sm font-bold text-gray-700">No bookings match your filter criteria</p>
                      <p className="text-xs text-gray-400">Try adjusting your search query, dates, or clearing some filters.</p>
                      {activeFilterCount > 0 && (
                        <button
                          onClick={handleResetFilters}
                          className="mt-2 px-3 py-1.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <RotateCcw size={12} />
                          <span>Reset All Filters</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
              {!loading && bookings.map((b) => {
                const bStatusStyle = getBookingStatusBadge(b.status);
                const pStatusStyle = PAYMENT_STATUS_STYLES[b.paymentStatus] || PAYMENT_STATUS_STYLES.Pending;
                const isSelected = selectedBooking?._id === b._id;

                return (
                  <tr 
                    key={b._id} 
                    className={`hover:bg-gray-50/80 transition-colors ${isSelected ? 'bg-emerald-50/40' : ''}`}
                  >
                    {/* 1. Booking ID */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenBookingDetail(b)}
                          className="text-xs font-mono font-bold text-gray-900 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 px-2 py-0.5 rounded-lg border border-gray-200 transition cursor-pointer"
                          title="Click to View Full Details"
                        >
                          #{b.bookingId}
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard?.writeText(b.bookingId);
                            toast.success(`Copied: #${b.bookingId}`);
                          }}
                          className="text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
                          title="Copy ID"
                        >
                          <Copy size={11} />
                        </button>
                      </div>
                    </td>

                    {/* 2. User */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {b.user?.name ? b.user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="min-w-0 max-w-[130px]">
                          <p className="text-xs font-bold text-gray-900 truncate" title={b.user?.name}>{b.user?.name || 'Customer'}</p>
                          <p className="text-[11px] text-gray-400 font-mono truncate">{b.user?.mobile || 'No phone'}</p>
                        </div>
                      </div>
                    </td>

                    {/* 3. Station */}
                    <td className="px-4 py-3.5">
                      <div className="min-w-0 max-w-[150px]">
                        <p className="text-xs font-bold text-gray-900 truncate" title={b.station?.name}>{b.station?.name || 'EV Station'}</p>
                        <p className="text-[11px] text-gray-400 truncate flex items-center gap-1">
                          <MapPin size={10} className="shrink-0 text-gray-400" />
                          <span>{b.station?.city || 'City'}</span>
                        </p>
                      </div>
                    </td>

                    {/* 4. Charger */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-800">
                          <Zap size={11} className="text-emerald-500" />
                          <span>{b.connectorType || 'Standard'}</span>
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">
                          {b.connectorPower || (b.connectorType?.includes('CCS') || b.connectorType?.includes('DC') ? '60 kW DC' : '7.4 kW AC')}
                        </span>
                      </div>
                    </td>

                    {/* 5. Date & Time */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <p className="text-xs font-semibold text-gray-800">{b.scheduledDate || 'Today'}</p>
                      <p className="text-[11px] text-gray-400 font-mono flex items-center gap-1">
                        <Clock size={10} />
                        <span>{b.scheduledTime || 'Slot'}</span>
                      </p>
                    </td>

                    {/* 6. Duration */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-md">
                        <Clock size={11} className="text-gray-400" />
                        <span>{b.duration ? `${b.duration} min` : (b.estimatedTime ? `${b.estimatedTime} min` : '30 min')}</span>
                      </span>
                    </td>

                    {/* 7. Amount */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="text-xs font-black text-gray-900 font-mono">
                        ₹{b.estimatedCost?.toLocaleString('en-IN') || 0}
                      </span>
                    </td>

                    {/* 8. Payment Status */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${pStatusStyle.bg} ${pStatusStyle.text} ${pStatusStyle.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${pStatusStyle.dot}`} />
                          <span>{pStatusStyle.label || b.paymentStatus}</span>
                        </span>
                        <div className="text-[10px] text-gray-400 capitalize font-medium flex items-center gap-1">
                          <CreditCard size={10} />
                          <span>{b.paymentMethod || 'Razorpay'}</span>
                          {b.refundAmount > 0 && (
                            <span className="text-purple-600 font-bold ml-0.5">
                              (₹{b.refundAmount.toFixed(0)})
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 9. Booking Status */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${bStatusStyle.bg} ${bStatusStyle.text} ${bStatusStyle.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${bStatusStyle.dot}`} />
                        <span>{bStatusStyle.label || b.status}</span>
                      </span>
                    </td>

                    {/* 10. Action: View + ⋮ Actions Dropdown */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Primary: View Booking */}
                        <button
                          onClick={() => handleOpenBookingDetail(b)}
                          className="px-2.5 py-1 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-gray-200 rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          title="View Complete Booking Details"
                        >
                          <Eye size={13} className="text-gray-500" />
                          <span>View</span>
                        </button>

                        {/* Quick Status Actions */}
                        {b.status === 'Pending' && (
                          <button
                            onClick={() => updateStatus(b._id, 'Confirmed')}
                            disabled={actionLoading === b._id}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-lg transition flex items-center gap-1 shadow-2xs disabled:opacity-40 cursor-pointer"
                            title="Confirm Slot"
                          >
                            {actionLoading === b._id ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                            <span>Confirm</span>
                          </button>
                        )}
                        {b.status === 'Confirmed' && (
                          <button
                            onClick={() => handleStartChargingRemote(b._id)}
                            disabled={actionLoading === b._id}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg transition flex items-center gap-1 shadow-2xs disabled:opacity-40 cursor-pointer"
                            title="Start Remote Charging"
                          >
                            {actionLoading === b._id ? <Loader2 size={11} className="animate-spin" /> : <Zap size={11} />}
                            <span>Start</span>
                          </button>
                        )}
                        {(b.status === 'Ongoing' || b.status === 'Charging' || b.status === 'In Progress') && (
                          <button
                            onClick={() => handleStopChargingRemote(b._id)}
                            disabled={actionLoading === b._id}
                            className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] rounded-lg transition flex items-center gap-1 shadow-2xs disabled:opacity-40 cursor-pointer"
                            title="Stop & Complete Charging"
                          >
                            {actionLoading === b._id ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />}
                            <span>Stop</span>
                          </button>
                        )}

                        {/* ⋮ More Actions Dropdown */}
                        <div className="relative" ref={openActionMenu === b._id ? actionMenuRef : null}>
                          <button
                            ref={(el) => { menuBtnRef.current[b._id] = el; }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (openActionMenu === b._id) {
                                setOpenActionMenu(null);
                              } else {
                                const btn = menuBtnRef.current[b._id];
                                if (btn) {
                                  const rect = btn.getBoundingClientRect();
                                  setMenuPos({
                                    top: rect.bottom + 6,
                                    right: window.innerWidth - rect.right,
                                  });
                                }
                                setOpenActionMenu(b._id);
                              }
                            }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-gray-200 hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition cursor-pointer"
                            title="More Actions"
                          >
                            <MoreVertical size={14} />
                          </button>

                          {openActionMenu === b._id && (
                            <div
                              ref={actionMenuRef}
                              className="fixed z-[999] w-52 bg-white rounded-xl border border-gray-200 shadow-2xl py-1.5"
                              style={{ top: menuPos.top, right: menuPos.right }}
                            >
                              <div className="px-3 py-1.5 border-b border-gray-100 mb-1">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Admin Actions</p>
                                <p className="text-[10px] font-mono text-gray-500">#{b.bookingId}</p>
                              </div>

                              {/* View Booking — always available */}
                              <button
                                onClick={() => { handleOpenBookingDetail(b); setOpenActionMenu(null); }}
                                className="w-full px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 flex items-center gap-2 transition cursor-pointer"
                              >
                                <Eye size={13} className="text-gray-500" />
                                View Full Details
                              </button>

                              {/* Reschedule — only for Pending/Confirmed */}
                              {['Pending', 'Confirmed'].includes(b.status) && (
                                <button
                                  onClick={() => {
                                    setRescheduleModal(b);
                                    setRescheduleDate(b.scheduledDate || '');
                                    setRescheduleTime(b.scheduledTime || '');
                                    setOpenActionMenu(null);
                                  }}
                                  className="w-full px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 transition cursor-pointer"
                                >
                                  <CalendarClock size={13} className="text-blue-500" />
                                  Reschedule Booking
                                </button>
                              )}

                              {/* Cancel — not for completed/already cancelled */}
                              {!['Completed', 'Cancelled', 'Failed'].includes(b.status) && (
                                <button
                                  onClick={() => handleCancelBooking(b)}
                                  className="w-full px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-rose-50 hover:text-rose-700 flex items-center gap-2 transition cursor-pointer"
                                >
                                  <Ban size={13} className="text-rose-500" />
                                  Cancel Booking
                                </button>
                              )}

                              {/* Mark as No-show */}
                              {['Confirmed', 'Pending'].includes(b.status) && (
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Mark booking #${b.bookingId} as "No-show"? (User did not arrive)`)) {
                                      updateStatus(b._id, 'No Show');
                                      setOpenActionMenu(null);
                                    }
                                  }}
                                  className="w-full px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-slate-100 hover:text-slate-800 flex items-center gap-2 transition cursor-pointer"
                                >
                                  <AlertTriangle size={13} className="text-slate-500" />
                                  Mark as No-Show
                                </button>
                              )}

                              {/* Mark as Expired */}
                              {['Pending'].includes(b.status) && (
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Mark booking #${b.bookingId} as "Expired"?`)) {
                                      updateStatus(b._id, 'Expired');
                                      setOpenActionMenu(null);
                                    }
                                  }}
                                  className="w-full px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-gray-100 hover:text-gray-800 flex items-center gap-2 transition cursor-pointer"
                                >
                                  <Clock size={13} className="text-gray-400" />
                                  Mark as Expired
                                </button>
                              )}

                              {/* Mark as Failed */}
                              {!['Completed', 'Failed', 'Cancelled'].includes(b.status) && (
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Mark booking #${b.bookingId} as "Failed"?`)) {
                                      updateStatus(b._id, 'Failed');
                                      setOpenActionMenu(null);
                                    }
                                  }}
                                  className="w-full px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-rose-50 hover:text-rose-700 flex items-center gap-2 transition cursor-pointer"
                                >
                                  <AlertCircle size={13} className="text-rose-500" />
                                  Mark as Failed
                                </button>
                              )}

                              {/* Refund — Cancelled/Failed/Completed, authorized only */}
                              {['Cancelled', 'Failed', 'Completed'].includes(b.status) && canApproveRefunds && (
                                <button
                                  onClick={() => {
                                    setRefundModal(b);
                                    setRefundAmount(String(b.estimatedCost || ''));
                                    setRefundReason('');
                                    setRefundAction(b.paymentStatus === 'Refund Requested' ? 'approve' : 'initiate');
                                    setOpenActionMenu(null);
                                  }}
                                  className="w-full px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2 transition cursor-pointer"
                                >
                                  <RefreshCcw size={13} className="text-purple-500" />
                                  {b.paymentStatus === 'Refund Requested' ? 'Approve Refund' : 'Initiate Refund'}
                                  <span className="ml-auto text-[9px] font-bold bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full">Auth</span>
                                </button>
                              )}

                              {/* Contact User */}
                              <button
                                onClick={() => {
                                  const userId = b.user?._id || b.user;
                                  if (!userId) {
                                    toast.error('No customer profile linked to this booking');
                                    return;
                                  }
                                  setOpenActionMenu(null);
                                  navigate(`/users?id=${userId}`);
                                }}
                                className="w-full px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2 transition cursor-pointer"
                              >
                                <PhoneCall size={13} className="text-emerald-500" />
                                Contact / Assist User
                              </button>

                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 0 && (
          <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100 bg-white">
            <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
              <span>
                Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, total)} of {total} bookings
              </span>
              <div className="relative ml-2 border-l border-gray-200 pl-2">
                <select
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="appearance-none bg-transparent pl-2 pr-6 py-1 focus:outline-none cursor-pointer text-gray-700 font-semibold"
                >
                  {[10, 20, 50].map(n => <option key={n} value={n}>{n}/page</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-40 transition cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              {[...Array(Math.min(totalPages, 7))].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`min-w-[30px] h-7 rounded-lg text-xs font-bold transition cursor-pointer ${
                    currentPage === i + 1 ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-40 transition cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Level 2: Comprehensive Slide-Over "View Booking" Drawer */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setSelectedBooking(null)}
          />
          
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
              
              {/* Drawer Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/80 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-mono font-bold text-gray-900 bg-white px-2.5 py-1 rounded-lg border border-gray-200 shadow-2xs">
                    #{selectedBooking.bookingId}
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Booking Details</h2>
                    <p className="text-[11px] text-gray-500">Comprehensive session, telemetry & payment ledger</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {detailLoading && <Loader2 size={16} className="animate-spin text-emerald-600 mr-1" />}
                  <button
                    onClick={() => setSelectedBooking(null)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-gray-200 hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition cursor-pointer"
                    title="Close (Esc)"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Drawer Scrollable Content: 4 Client Sections */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Visual Booking Lifecycle Stepper Banner */}
                <div className="bg-slate-50/90 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
                      <Clock size={13} className="text-[#8CC63F]" />
                      Booking Lifecycle Progression
                    </span>
                    <div className="flex items-center gap-2">
                      {/* Booking Status Pill */}
                      {(() => {
                        const st = getBookingStatusBadge(selectedBooking.status);
                        return (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${st.bg} ${st.text} ${st.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                            <span>{st.label}</span>
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  {/* 4 Steps Stepper */}
                  {(() => {
                    const steps = [
                      { key: 'Pending', label: '1. Pending' },
                      { key: 'Confirmed', label: '2. Confirmed' },
                      { key: 'In Progress', label: '3. In Progress ⚡' },
                      { key: 'Completed', label: '4. Completed ✅' },
                    ];
                    const isAlternative = ['Cancelled', 'Failed', 'No Show', 'Expired'].includes(selectedBooking.status);
                    const normalizedStatus = (selectedBooking.status === 'Ongoing' || selectedBooking.status === 'Charging') 
                      ? 'In Progress' 
                      : selectedBooking.status;
                    const activeIndex = steps.findIndex(s => s.key === normalizedStatus);

                    return (
                      <div>
                        <div className="flex items-center justify-between relative px-2 pt-2">
                          <div className="absolute top-[22px] left-6 right-6 h-0.5 bg-gray-200 -z-0" />
                          {steps.map((step, idx) => {
                            const isDone = !isAlternative && activeIndex >= idx;
                            const isCurrent = !isAlternative && activeIndex === idx;

                            return (
                              <div key={step.key} className="flex flex-col items-center gap-1.5 z-10">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-2xs ${
                                  isCurrent ? 'bg-[#8CC63F] text-white ring-4 ring-[#8CC63F]/20' :
                                  isDone ? 'bg-emerald-600 text-white' :
                                  'bg-white border border-gray-300 text-gray-400'
                                }`}>
                                  {isDone ? '✓' : idx + 1}
                                </div>
                                <span className={`text-[10px] font-bold ${
                                  isCurrent ? 'text-gray-900 font-extrabold' : 
                                  isDone ? 'text-emerald-700' : 'text-gray-400'
                                }`}>
                                  {step.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Alternative Termination Diverter */}
                        {isAlternative && (
                          <div className="mt-3 pt-2.5 border-t border-slate-200 text-center flex items-center justify-center gap-2">
                            <AlertTriangle size={14} className="text-rose-500" />
                            <span className="text-xs font-bold text-rose-700">
                              Session Terminated: <span className="uppercase">{selectedBooking.status}</span>
                            </span>
                            <span className="text-[11px] text-gray-400">
                              (Alternative exit from standard progression)
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Lifecycle Admin Transition Controls */}
                  <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center gap-2">
                    {selectedBooking.status === 'Pending' && (
                      <>
                        <button
                          onClick={() => updateStatus(selectedBooking._id, 'Confirmed')}
                          disabled={actionLoading === selectedBooking._id}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          {actionLoading === selectedBooking._id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                          <span>Confirm Booking Slot</span>
                        </button>
                        <button
                          onClick={() => updateStatus(selectedBooking._id, 'Cancelled')}
                          disabled={actionLoading === selectedBooking._id}
                          className="px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl font-bold text-xs hover:bg-rose-100 transition disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                        >
                          <XCircle size={13} />
                          <span>Cancel Booking</span>
                        </button>
                      </>
                    )}

                    {selectedBooking.status === 'Confirmed' && (
                      <>
                        <button
                          onClick={() => handleStartChargingRemote(selectedBooking._id)}
                          disabled={actionLoading === selectedBooking._id}
                          className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          {actionLoading === selectedBooking._id ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
                          <span>Start Remote Charging (→ In Progress ⚡)</span>
                        </button>
                        <button
                          onClick={() => updateStatus(selectedBooking._id, 'No Show')}
                          disabled={actionLoading === selectedBooking._id}
                          className="px-2.5 py-1.5 bg-gray-100 text-gray-700 border border-gray-200 rounded-xl font-bold text-xs hover:bg-gray-200 transition cursor-pointer"
                        >
                          Mark No-Show ⚪
                        </button>
                        <button
                          onClick={() => updateStatus(selectedBooking._id, 'Expired')}
                          disabled={actionLoading === selectedBooking._id}
                          className="px-2.5 py-1.5 bg-gray-100 text-gray-700 border border-gray-200 rounded-xl font-bold text-xs hover:bg-gray-200 transition cursor-pointer"
                        >
                          Mark Expired ⏰
                        </button>
                        <button
                          onClick={() => updateStatus(selectedBooking._id, 'Cancelled')}
                          disabled={actionLoading === selectedBooking._id}
                          className="px-2.5 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl font-bold text-xs hover:bg-rose-100 transition cursor-pointer"
                        >
                          Cancel
                        </button>
                      </>
                    )}

                    {(selectedBooking.status === 'Ongoing' || selectedBooking.status === 'Charging' || selectedBooking.status === 'In Progress') && (
                      <>
                        <button
                          onClick={() => handleStopChargingRemote(selectedBooking._id)}
                          disabled={actionLoading === selectedBooking._id}
                          className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          {actionLoading === selectedBooking._id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                          <span>Complete Session (→ Completed ✅)</span>
                        </button>
                        <button
                          onClick={() => updateStatus(selectedBooking._id, 'Failed')}
                          disabled={actionLoading === selectedBooking._id}
                          className="px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl font-bold text-xs hover:bg-rose-100 transition cursor-pointer"
                        >
                          <AlertTriangle size={13} />
                          <span>Report Session Failed</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Point 12 (P2.4): ⏱️ Booking Activity Timeline */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
                  <div className="px-5 py-3.5 bg-gray-50/90 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <History size={16} className="text-indigo-600" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                        Booking Activity Timeline
                      </h3>
                    </div>
                    <span className="text-[11px] font-bold text-gray-400">
                      Chronological Audit Trail
                    </span>
                  </div>

                  <div className="p-5">
                    <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                      {buildBookingTimeline(selectedBooking).map((event, idx) => (
                        <div key={idx} className="relative flex items-start gap-3">
                          <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            event.status === 'completed' ? 'bg-emerald-500 text-white ring-4 ring-emerald-50' :
                            event.status === 'failed' ? 'bg-rose-500 text-white ring-4 ring-rose-50' :
                            event.status === 'warning' ? 'bg-amber-500 text-white ring-4 ring-amber-50' :
                            'bg-gray-300 text-gray-700 ring-4 ring-gray-100'
                          }`}>
                            {event.status === 'completed' ? '✓' : idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="text-xs font-bold text-gray-900">{event.title}</span>
                              <span className="text-[11px] font-mono font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                {event.time}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{event.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Section 1: 📋 Booking Information (Point 7: Exact 9 Client Fields) */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
                  {/* Header */}
                  <div className="px-5 py-3.5 bg-gray-50/90 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ClipboardList size={16} className="text-blue-600" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                        Booking Information
                      </h3>
                    </div>
                    <span className="text-[11px] font-mono text-gray-400">
                      Ref: #{selectedBooking.bookingId}
                    </span>
                  </div>

                  {/* Specification Table (Exact 9 Fields) */}
                  <div className="divide-y divide-gray-100 text-xs">
                    
                    {/* 1. Booking ID */}
                    <div className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition">
                      <span className="font-semibold text-gray-500">Booking ID</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2.5 py-0.5 rounded-lg border border-gray-200">
                          {selectedBooking.bookingId}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard?.writeText(selectedBooking.bookingId);
                            toast.success(`Copied: ${selectedBooking.bookingId}`);
                          }}
                          className="text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
                          title="Copy Booking ID"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                    </div>

                    {/* 2. User Name */}
                    <div className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition">
                      <span className="font-semibold text-gray-500">User Name</span>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-slate-800 text-white font-bold text-[10px] flex items-center justify-center">
                          {selectedBooking.user?.name ? selectedBooking.user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <span className="font-bold text-gray-900">
                          {selectedBooking.user?.name || 'Customer'}
                        </span>
                      </div>
                    </div>

                    {/* 3. Mobile Number */}
                    <div className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition">
                      <span className="font-semibold text-gray-500">Mobile Number</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-gray-800">
                          {selectedBooking.user?.mobile || 'No mobile registered'}
                        </span>
                        {selectedBooking.user?.mobile && (
                          <button
                            onClick={() => {
                              navigator.clipboard?.writeText(selectedBooking.user.mobile);
                              toast.success(`Copied: ${selectedBooking.user.mobile}`);
                            }}
                            className="text-gray-400 hover:text-gray-700 p-0.5 cursor-pointer"
                            title="Copy Mobile"
                          >
                            <Copy size={11} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 4. Station */}
                    <div className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition">
                      <span className="font-semibold text-gray-500">Station</span>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{selectedBooking.station?.name || 'EV Station'}</p>
                        {selectedBooking.station?.city && (
                          <p className="text-[11px] text-gray-400">{selectedBooking.station.city}</p>
                        )}
                      </div>
                    </div>

                    {/* 5. Charger ID */}
                    <div className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition">
                      <span className="font-semibold text-gray-500">Charger ID</span>
                      <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                        {selectedBooking.chargerId || `CHG-${selectedBooking.station?.name ? selectedBooking.station.name.substring(0, 3).toUpperCase() : '101'}`}
                      </span>
                    </div>

                    {/* 6. Connector Type */}
                    <div className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition">
                      <span className="font-semibold text-gray-500">Connector Type</span>
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 font-bold text-gray-800 bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-lg border border-blue-200">
                          <Zap size={12} className="text-blue-600" />
                          <span>{selectedBooking.connectorType}</span>
                        </span>
                        {selectedBooking.connectorPower && (
                          <span className="text-[11px] text-gray-400 font-medium">
                            ({selectedBooking.connectorPower})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 7. Date & Time */}
                    <div className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition">
                      <span className="font-semibold text-gray-500">Date & Time</span>
                      <div className="flex items-center gap-1.5 font-bold text-gray-800">
                        <Calendar size={13} className="text-gray-400" />
                        <span>{selectedBooking.scheduledDate}</span>
                        <span>•</span>
                        <Clock size={13} className="text-gray-400" />
                        <span>{selectedBooking.scheduledTime}</span>
                      </div>
                    </div>

                    {/* 8. Booking Duration */}
                    <div className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition">
                      <span className="font-semibold text-gray-500">Booking Duration</span>
                      <span className="font-bold text-gray-800 bg-gray-100 px-2.5 py-0.5 rounded-lg border border-gray-200">
                        {selectedBooking.duration ? `${selectedBooking.duration} Minutes` : (selectedBooking.estimatedTime ? `${selectedBooking.estimatedTime} Minutes` : '60 Minutes')}
                      </span>
                    </div>

                    {/* 9. Booking Status */}
                    <div className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition">
                      <span className="font-semibold text-gray-500">Booking Status</span>
                      {(() => {
                        const st = getBookingStatusBadge(selectedBooking.status);
                        return (
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${st.bg} ${st.text} ${st.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                            <span>{st.label}</span>
                          </span>
                        );
                      })()}
                    </div>

                  </div>
                </div>

                {/* Section 2: ⚡ Charging Information (Exact 6 Client Fields) */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
                  {/* Header */}
                  <div className="px-5 py-3.5 bg-gray-50/90 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BatteryCharging size={16} className="text-amber-500" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                        Charging Information
                      </h3>
                    </div>
                    {(selectedBooking.status === 'Ongoing' || selectedBooking.status === 'Charging' || selectedBooking.status === 'In Progress') ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Live Telemetry Active</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-gray-400">
                        Telemetry Summary
                      </span>
                    )}
                  </div>

                  {/* Specification Table (Exact 6 Fields) */}
                  <div className="divide-y divide-gray-100 text-xs">
                    
                    {/* 1. Charging Start Time */}
                    <div className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition">
                      <span className="font-semibold text-gray-500">Charging Start Time</span>
                      <div className="flex items-center gap-1.5 font-bold text-gray-800">
                        <Clock size={13} className="text-gray-400" />
                        <span>
                          {selectedBooking.chargingStartTime 
                            ? new Date(selectedBooking.chargingStartTime).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) 
                            : (selectedBooking.status === 'Confirmed' || selectedBooking.status === 'Pending' ? `Scheduled: ${selectedBooking.scheduledDate}, ${selectedBooking.scheduledTime}` : '—')}
                        </span>
                      </div>
                    </div>

                    {/* 2. Charging End Time */}
                    <div className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition">
                      <span className="font-semibold text-gray-500">Charging End Time</span>
                      <div className="flex items-center gap-1.5 font-bold text-gray-800">
                        <Clock size={13} className="text-gray-400" />
                        <span>
                          {selectedBooking.chargingEndTime 
                            ? new Date(selectedBooking.chargingEndTime).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) 
                            : ((selectedBooking.status === 'Ongoing' || selectedBooking.status === 'Charging' || selectedBooking.status === 'In Progress') ? '⚡ Live In Progress' : '—')}
                        </span>
                      </div>
                    </div>

                    {/* 3. Charging Duration */}
                    <div className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition">
                      <span className="font-semibold text-gray-500">Charging Duration</span>
                      <span className="font-bold text-gray-800 bg-gray-100 px-2.5 py-0.5 rounded-lg border border-gray-200">
                        {selectedBooking.duration 
                          ? `${selectedBooking.duration} Minutes` 
                          : (selectedBooking.chargingStartTime && selectedBooking.chargingEndTime 
                              ? `${Math.max(1, Math.round((new Date(selectedBooking.chargingEndTime) - new Date(selectedBooking.chargingStartTime)) / 60000))} Minutes` 
                              : (selectedBooking.estimatedTime ? `${selectedBooking.estimatedTime} Minutes (estimated)` : '—'))}
                      </span>
                    </div>

                    {/* 4. Energy Consumed (kWh) */}
                    <div className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition">
                      <span className="font-semibold text-gray-500">Energy Consumed (kWh)</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200 text-sm">
                          {selectedBooking.unitsConsumed ?? selectedBooking.estimatedEnergy ?? 0} kWh
                        </span>
                        {selectedBooking.unitsConsumed && selectedBooking.estimatedEnergy && selectedBooking.unitsConsumed !== selectedBooking.estimatedEnergy && (
                          <span className="text-[10px] text-gray-400">
                            (Est: {selectedBooking.estimatedEnergy} kWh)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 5. Power / Session Details */}
                    <div className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition">
                      <span className="font-semibold text-gray-500">Power / Session Details</span>
                      <div className="text-right space-y-0.5">
                        <p className="font-bold text-gray-900 flex items-center justify-end gap-1.5">
                          <Zap size={13} className="text-amber-500" />
                          <span>{selectedBooking.connectorPower || (selectedBooking.connectorType?.includes('CCS') || selectedBooking.connectorType?.includes('DC') ? '60 kW DC Fast' : '7.4 kW AC')}</span>
                          <span className="text-gray-400 font-normal">·</span>
                          <span className="text-blue-700 font-semibold">Target SOC: {selectedBooking.chargeUpTo || 80}%</span>
                        </p>
                        {selectedBooking.pin && (
                          <p className="text-[11px] text-gray-500">
                            Charger Security PIN: <span className="font-mono font-bold text-gray-900 bg-gray-100 px-1.5 py-0.2 rounded border border-gray-300">{selectedBooking.pin}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* 6. Charging Session Status */}
                    <div className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition">
                      <span className="font-semibold text-gray-500">Charging Session Status</span>
                      {(() => {
                        const isLive = selectedBooking.status === 'Ongoing' || selectedBooking.status === 'Charging' || selectedBooking.status === 'In Progress';
                        const isCompleted = selectedBooking.status === 'Completed';
                        const isFailed = selectedBooking.status === 'Failed';
                        const isCancelled = selectedBooking.status === 'Cancelled';

                        if (isLive) {
                          return (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span>⚡ In Progress (Charging)</span>
                            </span>
                          );
                        }
                        if (isCompleted) {
                          return (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                              <span>✅ Completed (Delivered)</span>
                            </span>
                          );
                        }
                        if (isFailed) {
                          return (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              <span>🔴 Session Failed / Aborted</span>
                            </span>
                          );
                        }
                        if (isCancelled) {
                          return (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-800 border border-orange-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                              <span>❌ Session Cancelled</span>
                            </span>
                          );
                        }
                        return (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <span>⏳ Scheduled / Not Started</span>
                          </span>
                        );
                      })()}
                    </div>

                  </div>

                  {/* Environmental Savings Sub-bar */}
                  <div className="px-5 py-2.5 bg-emerald-50/40 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                      <Leaf size={12} className="text-emerald-600" />
                      Environmental Savings:
                    </span>
                    <div className="flex items-center gap-3 text-[11px] text-gray-700">
                      <span>CO₂: <strong className="font-mono text-emerald-800 font-bold">{selectedBooking.carbonSavedKg?.toFixed(2) || 0} kg</strong></span>
                      <span>•</span>
                      <span>Fuel: <strong className="font-mono text-emerald-800 font-bold">{selectedBooking.fuelSavedLiters?.toFixed(2) || 0} L</strong></span>
                      <span>•</span>
                      <span>Trees: <strong className="font-mono text-emerald-800 font-bold">{selectedBooking.treesEquivalent || 0}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Section 3: 💳 Payment Information */}
                <div className="bg-white rounded-2xl border border-gray-200 p-4.5 space-y-3.5 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                      <CreditCard size={14} className="text-emerald-600" />
                      3. Payment Information
                    </span>
                    {/* Payment Status Pill */}
                    {(() => {
                      const pst = PAYMENT_STATUS_STYLES[selectedBooking.paymentStatus] || PAYMENT_STATUS_STYLES.Pending;
                      return (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${pst.bg} ${pst.text} ${pst.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${pst.dot}`} />
                          <span>{pst.label}</span>
                        </span>
                      );
                    })()}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                    <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100 space-y-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Billing Amount</span>
                      <p className="text-xl font-black text-gray-900 font-mono">
                        ₹{selectedBooking.estimatedCost?.toLocaleString('en-IN') || 0}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        Price Rate: ₹{selectedBooking.pricePerUnit || 18}/kWh
                      </p>
                    </div>

                    <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100 space-y-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Payment Method</span>
                      <p className="font-bold text-gray-900 capitalize text-sm">
                        {selectedBooking.paymentMethod || 'Razorpay'}
                      </p>
                      <p className="text-[11px] text-gray-500">Gateway: Verified</p>
                    </div>
                  </div>

                  {/* Transaction ID & Order ID */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Transaction / Payment ID:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-gray-900">
                          {selectedBooking.razorpayPaymentId || 'N/A (Cashless/Wallet)'}
                        </span>
                        {selectedBooking.razorpayPaymentId && (
                          <button
                            onClick={() => {
                              navigator.clipboard?.writeText(selectedBooking.razorpayPaymentId);
                              toast.success('Payment ID copied');
                            }}
                            className="text-gray-400 hover:text-gray-700 p-0.5 cursor-pointer"
                          >
                            <Copy size={11} />
                          </button>
                        )}
                      </div>
                    </div>

                    {selectedBooking.razorpayOrderId && (
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/80">
                        <span className="text-gray-500">Razorpay Order ID:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-gray-700">
                            {selectedBooking.razorpayOrderId}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard?.writeText(selectedBooking.razorpayOrderId);
                              toast.success('Order ID copied');
                            }}
                            className="text-gray-400 hover:text-gray-700 p-0.5 cursor-pointer"
                          >
                            <Copy size={11} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 4: ↩️ Refund Information */}
                <div className="bg-white rounded-2xl border border-gray-200 p-4.5 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                      <RotateCcw size={14} className="text-purple-600" />
                      4. Refund Information
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                      selectedBooking.refundAmount > 0 ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-gray-100 text-gray-500 border-gray-200'
                    }`}>
                      Status: {selectedBooking.refundStatus || (selectedBooking.paymentStatus === 'Refunded' ? 'Processed' : 'None')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100 space-y-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Refund Amount</span>
                      <p className="text-lg font-black text-purple-800 font-mono">
                        ₹{(selectedBooking.refundAmount || 0).toFixed(2)}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {selectedBooking.refundAmount > 0 ? 'Credited to source' : 'No refund requested/settled'}
                      </p>
                    </div>

                    <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100 space-y-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Refund Reference</span>
                      <p className="font-mono text-gray-700 text-xs">
                        {selectedBooking.razorpayPaymentId ? `REF-${selectedBooking.bookingId}` : 'N/A'}
                      </p>
                      <p className="text-[10px] text-gray-400">Direct Gateway Settlement</p>
                    </div>
                  </div>

                  {selectedBooking.cancellationReason && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-0.5">
                      <span className="font-bold text-amber-800 text-[11px] flex items-center gap-1">
                        <AlertTriangle size={12} />
                        Cancellation / Refund Reason:
                      </span>
                      <p className="text-amber-900 font-medium">{selectedBooking.cancellationReason}</p>
                    </div>
                  )}
                </div>
                {/* Section 5: 👤 User / Support */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
                  {/* Header */}
                  <div className="px-5 py-3.5 bg-gray-50/90 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-violet-500" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                        User / Support
                      </h3>
                    </div>
                    {selectedBooking.user?._id && (
                      <button
                        onClick={() => {
                          navigate(`/users?id=${selectedBooking.user._id}`);
                          setSelectedBooking(null);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-600 hover:text-violet-800 transition cursor-pointer"
                        title="View Full User Profile"
                      >
                        <ExternalLink size={11} />
                        View Full Profile
                      </button>
                    )}
                  </div>

                  <div className="divide-y divide-gray-100 text-xs">

                    {/* ── User Profile Card ── */}
                    <div className="px-5 py-4 space-y-3">
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-sm">
                          {selectedBooking.user?.name
                            ? selectedBooking.user.name.trim().split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                            : 'U'}
                        </div>
                        {/* Name + badges */}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 text-sm truncate">
                            {selectedBooking.user?.name || 'Unknown User'}
                          </p>
                          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                            {/* KYC Status */}
                            {(() => {
                              const kyc = selectedBooking.user?.kycStatus;
                              const kycStyles = {
                                Verified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                                Pending: 'bg-amber-50 text-amber-700 border-amber-200',
                                Rejected: 'bg-rose-50 text-rose-700 border-rose-200',
                                'Not Submitted': 'bg-gray-100 text-gray-500 border-gray-200',
                              };
                              const cls = kycStyles[kyc] || kycStyles['Not Submitted'];
                              return (
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${cls}`}>
                                  <Shield size={9} />
                                  KYC: {kyc || 'Not Submitted'}
                                </span>
                              );
                            })()}
                            {/* Tier */}
                            {selectedBooking.user?.tier && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-yellow-50 text-yellow-700 border border-yellow-200">
                                <Star size={9} />
                                {selectedBooking.user.tier}
                              </span>
                            )}
                            {/* User ID */}
                            <span className="text-[10px] text-gray-400 font-mono">
                              ID: {selectedBooking.user?._id?.toString().slice(-8) || '—'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                          <Phone size={11} className="text-gray-400 shrink-0" />
                          <div>
                            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Mobile</p>
                            <p className="font-mono font-bold text-gray-800">
                              {selectedBooking.user?.mobile
                                ? `${selectedBooking.user.mobile.toString().slice(0, 2)}****${selectedBooking.user.mobile.toString().slice(-2)}`
                                : '—'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                          <Mail size={11} className="text-gray-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Email</p>
                            <p className="font-mono font-bold text-gray-800 truncate">
                              {selectedBooking.user?.email
                                ? (() => {
                                    const [local, domain] = selectedBooking.user.email.split('@');
                                    return `${local.slice(0, 2)}***@${domain}`;
                                  })()
                                : '—'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Activity Stats */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-2 bg-violet-50 rounded-lg border border-violet-100 text-center">
                          <p className="text-[10px] text-violet-500 font-bold uppercase tracking-wider">Sessions</p>
                          <p className="font-black text-violet-900 text-base font-mono">
                            {selectedBooking.user?.totalChargingSessions || 0}
                          </p>
                        </div>
                        <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100 text-center">
                          <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Energy</p>
                          <p className="font-black text-emerald-900 text-base font-mono">
                            {(selectedBooking.user?.totalEnergyConsumedKwh || 0).toFixed(1)}
                            <span className="text-[9px] font-semibold ml-0.5">kWh</span>
                          </p>
                        </div>
                        <div className="p-2 bg-blue-50 rounded-lg border border-blue-100 text-center">
                          <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">Joined</p>
                          <p className="font-bold text-blue-900 text-[11px]">
                            {selectedBooking.user?.createdAt
                              ? new Date(selectedBooking.user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })
                              : '—'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* ── Support Ticket History ── */}
                    <div className="px-5 py-3.5">
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-[11px] font-bold text-gray-700 flex items-center gap-1.5 uppercase tracking-wider">
                          <TicketCheck size={13} className="text-rose-500" />
                          Support Tickets
                        </span>
                        <span className="text-[10px] text-gray-400">Latest 5</span>
                      </div>
                      {selectedBooking.userTickets && selectedBooking.userTickets.length > 0 ? (
                        <div className="space-y-2">
                          {selectedBooking.userTickets.map((ticket) => {
                            const ticketStatusStyle = {
                              Open: 'bg-rose-50 text-rose-700 border-rose-200',
                              'In Progress': 'bg-amber-50 text-amber-700 border-amber-200',
                              Resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                              Closed: 'bg-gray-100 text-gray-500 border-gray-200',
                            };
                            const priorityStyle = {
                              High: 'text-rose-600',
                              Medium: 'text-amber-600',
                              Low: 'text-blue-500',
                            };
                            return (
                              <div key={ticket._id} className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 space-y-1.5">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 text-[11px] truncate">{ticket.subject}</p>
                                    <p className="text-[10px] text-gray-400">
                                      <span className="font-mono">{ticket.ticketId}</span>
                                      {' · '}
                                      <span>{ticket.category}</span>
                                      {' · '}
                                      <span className={`font-semibold ${priorityStyle[ticket.priority] || 'text-gray-500'}`}>
                                        {ticket.priority}
                                      </span>
                                    </p>
                                  </div>
                                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border ${ticketStatusStyle[ticket.status] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                    {ticket.status}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-gray-400">
                                    {ticket.messages?.length || 0} message(s)
                                  </span>
                                  <span className="text-[10px] text-gray-400">
                                    {new Date(ticket.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-4 text-center text-gray-400 bg-gray-50 rounded-xl border border-gray-100">
                          <TicketCheck size={20} className="mb-1.5 opacity-30" />
                          <p className="text-[11px] font-medium">No support tickets raised</p>
                          <p className="text-[10px] text-gray-300">User has no complaint history</p>
                        </div>
                      )}
                    </div>

                    {/* ── Feedback / Reviews ── */}
                    <div className="px-5 py-3.5">
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-[11px] font-bold text-gray-700 flex items-center gap-1.5 uppercase tracking-wider">
                          <HeartHandshake size={13} className="text-pink-500" />
                          Feedback / Reviews
                        </span>
                        <span className="text-[10px] text-gray-400">Latest 5</span>
                      </div>
                      {selectedBooking.userFeedback && selectedBooking.userFeedback.length > 0 ? (
                        <div className="space-y-2">
                          {selectedBooking.userFeedback.map((fb) => (
                            <div key={fb._id} className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 space-y-1.5">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-gray-900 text-[11px] capitalize">
                                    {fb.title || `${fb.type} Feedback`}
                                  </p>
                                  {fb.stationId?.name && (
                                    <p className="text-[10px] text-gray-400">
                                      <MapPin size={9} className="inline mr-0.5" />
                                      {fb.stationId.name}{fb.stationId.city ? `, ${fb.stationId.city}` : ''}
                                    </p>
                                  )}
                                </div>
                                {/* Star Rating */}
                                <div className="flex items-center gap-0.5 shrink-0">
                                  {[1,2,3,4,5].map(s => (
                                    <Star
                                      key={s}
                                      size={10}
                                      className={s <= fb.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}
                                    />
                                  ))}
                                  <span className="ml-1 text-[10px] font-bold text-gray-600">{fb.rating}/5</span>
                                </div>
                              </div>
                              {fb.comment && (
                                <p className="text-[11px] text-gray-600 italic leading-relaxed line-clamp-2">"{fb.comment}"</p>
                              )}
                              {fb.adminReply && (
                                <div className="p-2 bg-blue-50 rounded-lg border border-blue-100 text-[10px] text-blue-700">
                                  <span className="font-bold">Admin Reply:</span> {fb.adminReply}
                                </div>
                              )}
                              <p className="text-[10px] text-gray-400">
                                {new Date(fb.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                {' · '}
                                <span className="capitalize">{fb.type}</span>
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-4 text-center text-gray-400 bg-gray-50 rounded-xl border border-gray-100">
                          <MessageSquare size={20} className="mb-1.5 opacity-30" />
                          <p className="text-[11px] font-medium">No feedback submitted</p>
                          <p className="text-[10px] text-gray-300">User hasn't left any reviews yet</p>
                        </div>
                      )}
                    </div>

                  </div>
                </div>

              </div>

              {/* Drawer Footer */}
              <div className="px-6 py-3.5 border-t border-gray-200 bg-gray-50 flex items-center justify-end shrink-0">
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="px-4 py-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 rounded-xl transition cursor-pointer shadow-2xs"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── Reschedule Booking Modal ─────────────────────────────── */}
      {rescheduleModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setRescheduleModal(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                  <CalendarClock size={18} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Reschedule Booking</h3>
                  <p className="text-[11px] text-gray-500 font-mono">#{rescheduleModal.bookingId}</p>
                </div>
              </div>
              <button onClick={() => setRescheduleModal(null)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            {/* Current Schedule */}
            <div className="px-6 py-3 bg-amber-50/60 border-b border-amber-100 text-xs flex items-center gap-2">
              <AlertTriangle size={13} className="text-amber-500 shrink-0" />
              <span className="text-amber-700">
                Current: <strong>{rescheduleModal.scheduledDate}</strong> at <strong>{rescheduleModal.scheduledTime}</strong>
              </span>
            </div>

            {/* Form */}
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">New Date</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">New Time Slot</label>
                <input
                  type="time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition"
                />
              </div>
              <div className="pt-1 p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-500">
                ⚠️ Only <strong>Pending</strong> or <strong>Confirmed</strong> bookings can be rescheduled. Station and Charger assignment remains unchanged.
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setRescheduleModal(null)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRescheduleSubmit}
                disabled={rescheduleLoading || !rescheduleDate || !rescheduleTime}
                className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {rescheduleLoading ? <Loader2 size={15} className="animate-spin" /> : <CalendarClock size={15} />}
                Confirm Reschedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Initiate / Approve Refund Modal ──────────────────────── */}
      {refundModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setRefundModal(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
                  <RefreshCcw size={18} className="text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Refund Management</h3>
                  <p className="text-[11px] text-gray-500 font-mono">#{refundModal.bookingId} · {refundModal.user?.name || 'User'}</p>
                </div>
              </div>
              <button onClick={() => setRefundModal(null)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            {/* Action Selector */}
            <div className="px-6 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                {[{v:'initiate',l:'Initiate Refund',c:'blue'},{v:'approve',l:'Approve Refund',c:'emerald'},{v:'reject',l:'Reject Refund',c:'rose'}].map(({v, l, c}) => (
                  <button
                    key={v}
                    onClick={() => setRefundAction(v)}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                      refundAction === v
                        ? `bg-${c}-600 text-white border-${c}-600`
                        : `bg-gray-50 text-gray-600 border-gray-200 hover:bg-${c}-50`
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <div className="px-6 py-5 space-y-4">
              {/* Booking Summary */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs space-y-1">
                <div className="flex justify-between"><span className="text-gray-500">Booking Status</span><span className="font-bold text-gray-900">{refundModal.status}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Payment Status</span><span className="font-bold text-gray-900">{refundModal.paymentStatus}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Original Amount</span><span className="font-bold text-gray-900">₹{refundModal.estimatedCost || 0}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Payment Method</span><span className="font-bold capitalize text-gray-900">{refundModal.paymentMethod || 'Razorpay'}</span></div>
              </div>

              {refundAction !== 'reject' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Refund Amount (₹)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₹</span>
                    <input
                      type="number"
                      value={refundAmount}
                      min="0"
                      max={refundModal.estimatedCost || 9999}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 transition"
                      placeholder="Enter refund amount"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Reason / Note</label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none transition"
                  placeholder="Optional: reason for refund/rejection..."
                />
              </div>

              {refundModal.paymentMethod === 'wallet' && refundAction === 'approve' && (
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-700 flex items-start gap-2">
                  <CheckCircle size={13} className="mt-0.5 shrink-0" />
                  <span>Wallet refund: ₹{refundAmount || 0} will be <strong>automatically credited</strong> back to user's wallet balance.</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-[10px] text-gray-400">🔒 Financial records preserved regardless of action</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRefundModal(null)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRefundSubmit}
                  disabled={refundLoading || (refundAction !== 'reject' && (!refundAmount || Number(refundAmount) <= 0))}
                  className={`px-5 py-2 text-sm font-bold text-white rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center gap-2 ${
                    refundAction === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' :
                    refundAction === 'reject' ? 'bg-rose-600 hover:bg-rose-700' :
                    'bg-purple-600 hover:bg-purple-700'
                  }`}
                >
                  {refundLoading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCcw size={15} />}
                  {refundAction === 'approve' ? 'Approve & Process' : refundAction === 'reject' ? 'Reject Refund' : 'Initiate Refund'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default BookingManagementView;
