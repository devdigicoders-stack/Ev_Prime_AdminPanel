import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Plus, Edit2, Trash2, X, Loader2, Tag, Percent, 
  Receipt, AlertCircle, Clock, CheckCircle, Calendar, Pause, Play,
  Users, Info, FileText, Copy, Check, MapPin, Timer, ChevronDown, ChevronUp
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Format Date consistently as "01 Sep 2026" (DD MMM YYYY)
export const formatOfferDate = (dateString) => {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return 'N/A';
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`; // Output: "01 Sep 2026"
};

// Compute Offer Status: Draft | Active | Scheduled | Expired | Disabled
export const getOfferStatus = (offer) => {
  const now = new Date();

  // 1. Draft status
  if (offer.isDraft || offer.status === 'Draft') {
    return {
      status: 'Draft',
      label: 'Draft',
      badgeClass: 'bg-gray-100 text-gray-700 border border-gray-300 font-semibold',
      dotClass: 'bg-gray-400',
      icon: FileText,
      description: 'Saved as draft, not visible to customers'
    };
  }

  // 2. Disabled status
  if (offer.isManualDisabled || offer.status === 'Disabled' || (!offer.isDraft && offer.isActive === false && offer.status !== 'Expired')) {
    return {
      status: 'Disabled',
      label: 'Disabled',
      badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200 font-semibold',
      dotClass: 'bg-amber-500',
      icon: Pause,
      description: 'Manually paused by Admin'
    };
  }

  // 3. Expired status
  const isExpired = Boolean(offer.isExpired || (offer.validUntil && new Date(offer.validUntil) < now));
  if (isExpired) {
    return {
      status: 'Expired',
      label: 'Expired',
      badgeClass: 'bg-rose-50 text-rose-700 border border-rose-200 font-bold',
      dotClass: 'bg-rose-500',
      icon: AlertCircle,
      description: 'Validity date has passed'
    };
  }

  // 4. Scheduled status (Future start date)
  const isScheduled = Boolean(offer.isScheduled || (offer.validFrom && new Date(offer.validFrom) > now));
  if (isScheduled) {
    return {
      status: 'Scheduled',
      label: 'Scheduled',
      badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold',
      dotClass: 'bg-blue-500',
      icon: Calendar,
      description: 'Scheduled for future launch'
    };
  }

  // 5. Active status
  return {
    status: 'Active',
    label: 'Active',
    badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold',
    dotClass: 'bg-emerald-500',
    icon: CheckCircle,
    description: 'Currently live and redeemable'
  };
};

const OfferManagementView = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals & Forms
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Filter & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Active' | 'Scheduled' | 'Expired' | 'Disabled' | 'Draft'
  const [copiedCode, setCopiedCode] = useState(null);

  const handleCopyCode = (code, e) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Coupon code "${code}" copied!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };
  
  const initialFormState = {
    title: '',
    description: '',
    code: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    minOrderAmount: '',
    maxDiscountAmount: '',
    totalUsageLimit: '',
    perUserLimit: 1,
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: '',
    status: 'Active',
    isDraft: false,
    isManualDisabled: false,
    // Point 7: User Targeting
    applicableUserType: 'ALL',
    applicableTiers: [],
    // Point 8: Station Applicability
    stationApplicabilityType: 'ALL',
    applicableCities: '',
    applicableConnectorTypes: [],
    // Point 9: Day/Time Restrictions
    dayRestrictions: 'ALL',
    customDays: [],
    hasTimeRestriction: false,
    timeStart: '',
    timeEnd: ''
  };
  const [formData, setFormData] = useState(initialFormState);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/offers/admin`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setOffers(data.data);
      } else {
        toast.error(data.message || 'Failed to fetch offers');
      }
    } catch (err) {
      toast.error('Network error while fetching offers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const openEditModal = (offer) => {
    setEditingId(offer._id);
    const computed = getOfferStatus(offer);
    
    // Map initial status for edit mode
    let editStatus = 'Active';
    if (computed.status === 'Draft') editStatus = 'Draft';
    else if (computed.status === 'Disabled') editStatus = 'Disabled';

    setFormData({
      title: offer.title || '',
      description: offer.description || '',
      code: offer.code || '',
      discountType: offer.discountType || 'PERCENTAGE',
      discountValue: offer.discountValue !== undefined ? offer.discountValue : '',
      minOrderAmount: offer.minOrderAmount !== undefined && offer.minOrderAmount !== null ? offer.minOrderAmount : '',
      maxDiscountAmount: offer.maxDiscountAmount !== undefined && offer.maxDiscountAmount !== null ? offer.maxDiscountAmount : '',
      totalUsageLimit: offer.totalUsageLimit !== undefined && offer.totalUsageLimit !== null ? offer.totalUsageLimit : '',
      perUserLimit: offer.perUserLimit !== undefined && offer.perUserLimit !== null ? offer.perUserLimit : 1,
      validFrom: offer.validFrom ? new Date(offer.validFrom).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      validUntil: offer.validUntil ? new Date(offer.validUntil).toISOString().split('T')[0] : '',
      status: editStatus,
      isDraft: computed.status === 'Draft',
      isManualDisabled: computed.status === 'Disabled',
      // Point 7: User Targeting
      applicableUserType: offer.applicableUserType || 'ALL',
      applicableTiers: offer.applicableTiers || [],
      // Point 8: Station Applicability
      stationApplicabilityType: offer.stationApplicabilityType || 'ALL',
      applicableCities: (offer.applicableCities || []).join(', '),
      applicableConnectorTypes: offer.applicableConnectorTypes || [],
      // Point 9: Day/Time Restrictions
      dayRestrictions: offer.dayRestrictions || 'ALL',
      customDays: offer.customDays || [],
      hasTimeRestriction: offer.timeRestrictions?.hasTimeRestriction || false,
      timeStart: offer.timeRestrictions?.startTime || '',
      timeEnd: offer.timeRestrictions?.endTime || ''
    });
    setIsModalOpen(true);
  };

  // Quick Toggle Status (Active/Scheduled <-> Disabled)
  const handleToggleStatus = async (offer) => {
    const { status } = getOfferStatus(offer);
    if (status === 'Expired') {
      toast.error('Cannot activate an expired offer. Please edit and extend the validity date first.');
      return;
    }

    let newStatus = 'Active';
    if (status === 'Active' || status === 'Scheduled') {
      newStatus = 'Disabled';
    } else if (status === 'Disabled' || status === 'Draft') {
      newStatus = 'Active';
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/offers/${offer._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Offer marked as ${newStatus}`);
        fetchOffers();
      } else {
        toast.error(data.message || 'Failed to update status');
      }
    } catch (err) {
      toast.error('Network error while toggling status');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Point 10: Coupon Code Validation (frontend guard)
    const sanitizedCode = (formData.code || '').trim().replace(/\s+/g, '').toUpperCase();
    if (!sanitizedCode) {
      toast.error('Coupon code is required.');
      return;
    }
    if (sanitizedCode.length < 3) {
      toast.error('Coupon code must be at least 3 characters long.');
      return;
    }
    if (sanitizedCode.length > 20) {
      toast.error('Coupon code cannot exceed 20 characters.');
      return;
    }
    if (!/^[A-Z0-9_-]+$/.test(sanitizedCode)) {
      toast.error('Coupon code can only contain letters, digits, hyphens (-) and underscores (_). No spaces allowed.');
      return;
    }

    // 1. Discount Value Validation (0–100% for Percentage, > 0 for Flat)
    const numDiscount = Number(formData.discountValue);
    if (isNaN(numDiscount) || numDiscount <= 0) {
      toast.error('Discount Value must be greater than 0.');
      return;
    }

    if (formData.discountType === 'PERCENTAGE' && numDiscount > 100) {
      toast.error('Percentage discount cannot exceed 100%. Value must be between 0.01% and 100%.');
      return;
    }

    // Point 5: Mandatory Maximum Discount Cap for Percentage
    let numMaxCap = undefined;
    if (formData.discountType === 'PERCENTAGE') {
      if (formData.maxDiscountAmount === '' || formData.maxDiscountAmount === null || formData.maxDiscountAmount === undefined) {
        toast.error('Maximum Discount Cap (₹) is mandatory for percentage-based offers (e.g. ₹100).');
        return;
      }
      numMaxCap = Number(formData.maxDiscountAmount);
      if (isNaN(numMaxCap) || numMaxCap <= 0) {
        toast.error('Maximum Discount Cap must be a valid number greater than 0.');
        return;
      }
    } else if (formData.maxDiscountAmount !== '') {
      numMaxCap = Number(formData.maxDiscountAmount);
      if (isNaN(numMaxCap) || numMaxCap <= 0) {
        toast.error('Maximum Discount Cap must be greater than 0.');
        return;
      }
    }

    // Point 4: Minimum Charging Amount Validation
    let numMinOrder = 0;
    if (formData.minOrderAmount !== '' && formData.minOrderAmount !== null && formData.minOrderAmount !== undefined) {
      numMinOrder = Number(formData.minOrderAmount);
      if (isNaN(numMinOrder) || numMinOrder < 0) {
        toast.error('Minimum Charging Amount cannot be negative.');
        return;
      }
    }

    // Point 6: Usage Limits Validation
    let numTotalLimit = null;
    if (formData.totalUsageLimit !== '' && formData.totalUsageLimit !== null && formData.totalUsageLimit !== undefined) {
      numTotalLimit = Number(formData.totalUsageLimit);
      if (isNaN(numTotalLimit) || numTotalLimit < 1) {
        toast.error('Total Usage Limit must be at least 1 (or leave blank for unlimited).');
        return;
      }
    }

    let numPerUserLimit = 1;
    if (formData.perUserLimit !== '' && formData.perUserLimit !== null && formData.perUserLimit !== undefined) {
      numPerUserLimit = Number(formData.perUserLimit);
      if (isNaN(numPerUserLimit) || numPerUserLimit < 1) {
        toast.error('Per User Limit must be at least 1.');
        return;
      }
    }

    // 2. Validity Date Validation
    if (!formData.validUntil) {
      toast.error('Please select an expiry date (Valid Until).');
      return;
    }

    const startDate = formData.validFrom ? new Date(formData.validFrom) : new Date();
    const expiryDate = new Date(formData.validUntil);

    if (isNaN(startDate.getTime())) {
      toast.error('Invalid start date (Valid From) format.');
      return;
    }
    if (isNaN(expiryDate.getTime())) {
      toast.error('Invalid expiry date (Valid Until) format.');
      return;
    }

    if (expiryDate <= startDate) {
      toast.error('Validity date (Valid Until) must be after start date (Valid From).');
      return;
    }

    const now = new Date();
    // Prevent activating an offer with a past validity date
    if (expiryDate < now && formData.status === 'Active') {
      toast.error('Cannot set an offer with a past expiry date as Active. Please select a future date.');
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const url = editingId 
        ? `${API_BASE_URL}/offers/${editingId}` 
        : `${API_BASE_URL}/offers`;
      const method = editingId ? 'PUT' : 'POST';
      
      // Point 7/8/9 advanced fields
      const applicableCitiesArr = formData.applicableCities
        ? formData.applicableCities.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      const payload = {
        title: formData.title,
        description: formData.description,
        code: formData.code,
        discountType: formData.discountType,
        discountValue: numDiscount,
        minOrderAmount: numMinOrder,
        maxDiscountAmount: numMaxCap,
        totalUsageLimit: numTotalLimit,
        perUserLimit: numPerUserLimit,
        validFrom: startDate.toISOString(),
        validUntil: expiryDate.toISOString(),
        status: formData.status,
        isDraft: formData.status === 'Draft',
        isManualDisabled: formData.status === 'Disabled',
        // Point 7: User Targeting
        applicableUserType: formData.applicableUserType,
        applicableTiers: formData.applicableTiers,
        // Point 8: Station Applicability
        stationApplicabilityType: formData.stationApplicabilityType,
        applicableCities: applicableCitiesArr,
        applicableConnectorTypes: formData.applicableConnectorTypes,
        // Point 9: Day/Time Restrictions
        dayRestrictions: formData.dayRestrictions,
        customDays: formData.customDays,
        timeRestrictions: {
          hasTimeRestriction: formData.hasTimeRestriction,
          startTime: formData.hasTimeRestriction ? formData.timeStart : null,
          endTime: formData.hasTimeRestriction ? formData.timeEnd : null
        }
      };

      const response = await fetch(url, {
        method,
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success(editingId ? 'Offer updated successfully' : 'Offer created successfully');
        setIsModalOpen(false);
        fetchOffers();
      } else {
        toast.error(data.message || 'Action failed');
      }
    } catch (err) {
      toast.error('Network error during action');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this offer?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/offers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Offer deleted');
        fetchOffers();
      } else {
        toast.error(data.message || 'Failed to delete');
      }
    } catch (err) {
      toast.error('Network error during deletion');
    }
  };

  // Status Counts
  const statusCounts = useMemo(() => {
    let active = 0;
    let scheduled = 0;
    let expired = 0;
    let disabled = 0;
    let draft = 0;

    offers.forEach(o => {
      const { status } = getOfferStatus(o);
      if (status === 'Active') active++;
      else if (status === 'Scheduled') scheduled++;
      else if (status === 'Expired') expired++;
      else if (status === 'Disabled') disabled++;
      else if (status === 'Draft') draft++;
    });

    return { all: offers.length, active, scheduled, expired, disabled, draft };
  }, [offers]);

  // Filtered Offers
  const filteredOffers = useMemo(() => {
    return offers.filter(offer => {
      const matchesSearch = 
        (offer.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (offer.code || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      if (statusFilter === 'All') return true;
      const { status } = getOfferStatus(offer);
      return status === statusFilter;
    });
  }, [offers, searchTerm, statusFilter]);

  // Modal Computed Status Preview Helper
  const previewModalStatus = useMemo(() => {
    if (formData.status === 'Draft') {
      return {
        label: 'Draft',
        color: 'text-gray-700 bg-gray-100 border-gray-300',
        note: 'Offer will be saved as draft and hidden from customers.'
      };
    }
    if (formData.status === 'Disabled') {
      return {
        label: 'Disabled',
        color: 'text-amber-700 bg-amber-50 border-amber-200',
        note: 'Offer will be disabled immediately.'
      };
    }
    const now = new Date();
    if (formData.validUntil && new Date(formData.validUntil) < now) {
      return {
        label: 'Expired',
        color: 'text-rose-700 bg-rose-50 border-rose-200',
        note: 'Expiry date is in the past. Offer will be automatically marked Expired.'
      };
    }
    if (formData.validFrom && new Date(formData.validFrom) > now) {
      return {
        label: 'Scheduled',
        color: 'text-blue-700 bg-blue-50 border-blue-200',
        note: 'Start date is in the future. Offer will automatically activate on that date.'
      };
    }
    return {
      label: 'Active',
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      note: 'Offer will be active and live immediately.'
    };
  }, [formData.status, formData.validFrom, formData.validUntil]);

  // Modal Discount Cap Preview Simulation
  const previewCapSimulation = useMemo(() => {
    if (formData.discountType !== 'PERCENTAGE' || !formData.discountValue || !formData.maxDiscountAmount) {
      return null;
    }
    const pct = Number(formData.discountValue);
    const cap = Number(formData.maxDiscountAmount);
    if (isNaN(pct) || isNaN(cap) || pct <= 0 || cap <= 0) return null;

    const sampleBill = 2000;
    const rawDisc = (sampleBill * pct) / 100;
    const cappedDisc = Math.min(rawDisc, cap);

    return {
      sampleBill,
      rawDisc,
      cappedDisc,
      isCapped: rawDisc > cap
    };
  }, [formData.discountType, formData.discountValue, formData.maxDiscountAmount]);

  // Point 10: Real-time Coupon Code Validation
  const codeValidation = useMemo(() => {
    const raw = formData.code || '';
    if (raw.length === 0) return { valid: null, message: '', charCount: 0 };
    const sanitized = raw.trim().replace(/\s+/g, '').toUpperCase();
    if (sanitized.length < 3) {
      return { valid: false, message: `Too short — minimum 3 characters (${sanitized.length}/3).`, charCount: sanitized.length };
    }
    if (sanitized.length > 20) {
      return { valid: false, message: `Too long — maximum 20 characters (${sanitized.length}/20).`, charCount: sanitized.length };
    }
    if (!/^[A-Z0-9_-]+$/.test(sanitized)) {
      return { valid: false, message: 'Only letters, digits, hyphens (-) and underscores (_) allowed. No spaces.', charCount: sanitized.length };
    }
    return { valid: true, message: `Valid code — ${sanitized.length} characters.`, charCount: sanitized.length };
  }, [formData.code]);

  // Auto-uppercase & strip spaces on coupon code input
  const handleCodeChange = (e) => {
    const sanitized = e.target.value.replace(/\s+/g, '').toUpperCase();
    setFormData(prev => ({ ...prev, code: sanitized }));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Offers Management</h1>
          <p className="text-gray-500 text-sm mt-1">Configure promotional vouchers, discount caps, minimum spend & usage quotas</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-[#8CC63F] hover:bg-[#7ab036] text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus size={18} />
          Add Offer
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Search & 5-State Status Tabs Bar */}
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gray-50/50">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
            <input
              type="text"
              placeholder="Search by title or coupon code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8CC63F] focus:ring-1 focus:ring-[#8CC63F] transition-all bg-white"
            />
          </div>

          {/* Quick 5-State Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 select-none">
            {/* All */}
            <button
              onClick={() => setStatusFilter('All')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'All'
                  ? 'bg-gray-900 text-white shadow-2xs'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              <span>All</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                statusFilter === 'All' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
              }`}>
                {statusCounts.all}
              </span>
            </button>

            {/* Active */}
            <button
              onClick={() => setStatusFilter('Active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'Active'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Active</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                statusFilter === 'Active' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-800'
              }`}>
                {statusCounts.active}
              </span>
            </button>

            {/* Scheduled */}
            <button
              onClick={() => setStatusFilter('Scheduled')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'Scheduled'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              <span>Scheduled</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                statusFilter === 'Scheduled' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-800'
              }`}>
                {statusCounts.scheduled}
              </span>
            </button>

            {/* Expired */}
            <button
              onClick={() => setStatusFilter('Expired')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'Expired'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
              <span>Expired</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                statusFilter === 'Expired' ? 'bg-white/20 text-white' : 'bg-rose-50 text-rose-800'
              }`}>
                {statusCounts.expired}
              </span>
            </button>

            {/* Disabled */}
            <button
              onClick={() => setStatusFilter('Disabled')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'Disabled'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span>Disabled</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                statusFilter === 'Disabled' ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-800'
              }`}>
                {statusCounts.disabled}
              </span>
            </button>

            {/* Draft */}
            <button
              onClick={() => setStatusFilter('Draft')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'Draft'
                  ? 'bg-gray-700 text-white shadow-2xs'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
              <span>Draft</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                statusFilter === 'Draft' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
              }`}>
                {statusCounts.draft}
              </span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[960px]">
            <thead>
              <tr className="bg-gray-50/90 border-b border-gray-200 text-gray-600 text-xs font-bold uppercase tracking-wider select-none">
                <th className="px-5 py-3.5">Offer &amp; Code</th>
                <th className="px-5 py-3.5">Discount &amp; Conditions</th>
                <th className="px-5 py-3.5">Usage &amp; Quota</th>
                <th className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} className="text-blue-500" />
                    <span>Valid From → Until</span>
                  </div>
                </th>
                <th className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <span>Status</span>
                    <span className="text-[9px] font-normal text-gray-400 normal-case tracking-normal">auto-computed</span>
                  </div>
                </th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm bg-white">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-14 text-center text-gray-500">
                    <Loader2 className="w-7 h-7 animate-spin mx-auto mb-2 text-[#8CC63F]" />
                    <span className="font-medium text-sm">Loading offers...</span>
                  </td>
                </tr>
              ) : filteredOffers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-14 text-center text-gray-500">
                    <Tag className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <span className="font-medium text-sm">No offers found matching your criteria.</span>
                  </td>
                </tr>
              ) : (
                filteredOffers.map((offer) => {
                  const statusInfo = getOfferStatus(offer);
                  const StatusIcon = statusInfo.icon;

                  const remaining = offer.totalUsageLimit != null && offer.totalUsageLimit > 0
                    ? Math.max(0, offer.totalUsageLimit - (offer.usedCount || 0))
                    : null;
                  const isExhausted = offer.totalUsageLimit != null && offer.totalUsageLimit > 0 && (offer.usedCount || 0) >= offer.totalUsageLimit;
                  const usagePercent = offer.totalUsageLimit ? Math.min(100, Math.round(((offer.usedCount || 0) / offer.totalUsageLimit) * 100)) : 0;

                  return (
                    <tr key={offer._id} className="hover:bg-gray-50/70 transition-colors">
                      {/* 1. Offer Title & Code */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3 min-w-[210px]">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                            statusInfo.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                            statusInfo.status === 'Scheduled' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                            statusInfo.status === 'Expired' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                            statusInfo.status === 'Disabled' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                            'bg-gray-50 text-gray-600 border-gray-200'
                          }`}>
                            <Tag size={18} />
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 text-sm tracking-tight">{offer.title}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <button
                                onClick={(e) => handleCopyCode(offer.code, e)}
                                className="inline-flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider text-gray-800 bg-gray-100 hover:bg-gray-200 px-2 py-0.5 rounded-md border border-gray-200 transition-colors cursor-pointer group"
                                title="Click to copy coupon code"
                              >
                                <span>{offer.code}</span>
                                {copiedCode === offer.code ? (
                                  <Check size={11} className="text-emerald-600" />
                                ) : (
                                  <Copy size={11} className="text-gray-400 group-hover:text-gray-600" />
                                )}
                              </button>
                              {offer.description && (
                                <span className="text-[11px] text-gray-400 truncate max-w-[150px]" title={offer.description}>
                                  {offer.description}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Discount & Conditions (Cap & Min Order) */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1.5 min-w-[150px]">
                          <div className="flex items-center gap-1.5">
                            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-md text-xs font-bold ${
                              offer.discountType === 'PERCENTAGE' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {offer.discountType === 'PERCENTAGE' ? '%' : '₹'}
                            </span>
                            <span className="font-extrabold text-sm text-gray-900">
                              {offer.discountType === 'PERCENTAGE'
                                ? `${offer.discountValue}% OFF`
                                : `₹${offer.discountValue} OFF`}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            {offer.discountType === 'PERCENTAGE' && offer.maxDiscountAmount ? (
                              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200" title="Maximum discount cap applied on bill">
                                Cap: ₹{offer.maxDiscountAmount}
                              </span>
                            ) : null}

                            {offer.minOrderAmount && offer.minOrderAmount > 0 ? (
                              <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200" title="Minimum charging bill required">
                                Min: ₹{offer.minOrderAmount}
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                                No Min Spend
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 3. Usage & Quota */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1.5 min-w-[160px]">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500 font-medium flex items-center gap-1">
                              <Users size={12} className="text-gray-400" />
                              <span>Redemptions:</span>
                            </span>
                            <span className="font-mono font-bold text-gray-800">
                              {offer.usedCount || 0}
                              {offer.totalUsageLimit ? ` / ${offer.totalUsageLimit}` : ' (Unlimited)'}
                            </span>
                          </div>

                          {offer.totalUsageLimit ? (
                            <div className="space-y-1">
                              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all ${
                                    isExhausted ? 'bg-rose-500' : usagePercent > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                                  }`} 
                                  style={{ width: `${usagePercent}%` }}
                                />
                              </div>
                              <div className="flex items-center justify-between text-[10px]">
                                <span className={isExhausted ? 'text-rose-600 font-bold' : 'text-emerald-700 font-semibold'}>
                                  {isExhausted ? '⚠️ Quota Exhausted' : `${remaining} left`}
                                </span>
                                <span className="text-gray-500 bg-gray-100 px-1.5 py-0.2 rounded font-medium">
                                  Max {offer.perUserLimit || 1}/user
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium border border-gray-200 text-[10px]">
                                Max {offer.perUserLimit || 1} per customer
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 4. Validity Period — From + Until with days remaining */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1.5 min-w-[160px]">
                          {/* FROM */}
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded w-12 justify-center shrink-0">
                              <Calendar size={9} />From
                            </span>
                            <span className="font-mono text-xs font-semibold text-gray-700">
                              {formatOfferDate(offer.validFrom)}
                            </span>
                          </div>
                          {/* UNTIL */}
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border w-12 justify-center shrink-0 ${
                              statusInfo.status === 'Expired'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              <Calendar size={9} />Until
                            </span>
                            <span className={`font-mono text-xs font-bold ${
                              statusInfo.status === 'Expired' ? 'text-rose-600' : 'text-gray-900'
                            }`}>
                              {formatOfferDate(offer.validUntil)}
                            </span>
                          </div>
                          {/* Days remaining / elapsed */}
                          {(() => {
                            const now = new Date();
                            const end = new Date(offer.validUntil);
                            const start = new Date(offer.validFrom);
                            if (statusInfo.status === 'Expired') {
                              const daysAgo = Math.ceil((now - end) / (1000 * 60 * 60 * 24));
                              return <span className="text-[10px] text-rose-600 font-semibold">Expired {daysAgo}d ago</span>;
                            }
                            if (statusInfo.status === 'Scheduled') {
                              const daysUntil = Math.ceil((start - now) / (1000 * 60 * 60 * 24));
                              return <span className="text-[10px] text-blue-600 font-semibold">Starts in {daysUntil}d</span>;
                            }
                            const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
                            return <span className={`text-[10px] font-semibold ${
                              daysLeft <= 3 ? 'text-amber-600' : 'text-gray-500'
                            }`}>{daysLeft}d remaining</span>;
                          })()}
                        </div>
                      </td>

                      {/* 5. Status with lifecycle trail */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1.5 items-start">
                          <span 
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.badgeClass}`}
                            title={statusInfo.description}
                          >
                            <StatusIcon size={12} className="shrink-0" />
                            <span>{statusInfo.label}</span>
                          </span>
                          {/* Lifecycle trail */}
                          <div className="flex items-center gap-0.5 text-[9px] font-semibold">
                            {['Draft','Scheduled','Active','Expired'].map((step, i) => {
                              const isCurrent = statusInfo.status === step || (statusInfo.status === 'Disabled' && step === 'Active');
                              const isPast = (
                                (step === 'Draft' && ['Scheduled','Active','Expired','Disabled'].includes(statusInfo.status)) ||
                                (step === 'Scheduled' && ['Active','Expired','Disabled'].includes(statusInfo.status)) ||
                                (step === 'Active' && ['Expired','Disabled'].includes(statusInfo.status))
                              );
                              return (
                                <span key={step} className="flex items-center gap-0.5">
                                  <span className={`px-1 py-0.2 rounded ${
                                    isCurrent
                                      ? step === 'Expired' ? 'text-rose-600 font-bold' :
                                        step === 'Scheduled' ? 'text-blue-600 font-bold' :
                                        step === 'Draft' ? 'text-gray-600 font-bold' :
                                        statusInfo.status === 'Disabled' ? 'text-amber-600 font-bold' :
                                        'text-emerald-600 font-bold'
                                      : isPast ? 'text-gray-400' : 'text-gray-300'
                                  }`}>{step}</span>
                                  {i < 3 && <span className="text-gray-200">→</span>}
                                </span>
                              );
                            })}
                            {statusInfo.status === 'Disabled' && (
                              <span className="ml-0.5 text-amber-600 font-bold">(Paused)</span>
                            )}
                          </div>
                          {isExhausted && (
                            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                              Quota Reached
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 6. Modern Rounded Action Buttons */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Status Toggle Button */}
                          {statusInfo.status === 'Expired' ? (
                            <button
                              disabled
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-300 border border-gray-200 cursor-not-allowed"
                              title="Offer is expired. Update validity date to reactivate."
                            >
                              <Play size={14} />
                            </button>
                          ) : statusInfo.status === 'Disabled' ? (
                            <button
                              onClick={() => handleToggleStatus(offer)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                              title="Activate / Enable Offer"
                            >
                              <Play size={14} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleStatus(offer)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
                              title="Pause / Disable Offer"
                            >
                              <Pause size={14} />
                            </button>
                          )}

                          {/* Edit Button */}
                          <button
                            onClick={() => openEditModal(offer)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                            title="Edit Offer"
                          >
                            <Edit2 size={14} />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDelete(offer._id)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                            title="Delete Offer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{editingId ? 'Edit Offer' : 'Add New Offer'}</h2>
                <p className="text-xs text-gray-500 mt-0.5">Configure discount, limits, targeting, station & time restrictions in structured sections</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-6 overflow-y-auto">
                
                {/* SECTION 1: Basic Information */}
                <div className="bg-gray-50/60 p-4 rounded-xl border border-gray-200/80 space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-[10px]">1</span>
                      Basic Information
                    </h3>
                    <span className="text-[10px] text-gray-400">Title, description & code</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Offer Title *</label>
                      <input
                        type="text"
                        name="title"
                        required
                        value={formData.title}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8CC63F] focus:ring-1 focus:ring-[#8CC63F] bg-white"
                        placeholder="e.g. Monsoon EV Special"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Description *</label>
                      <textarea
                        name="description"
                        required
                        rows="2"
                        value={formData.description}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8CC63F] focus:ring-1 focus:ring-[#8CC63F] bg-white"
                        placeholder="e.g. 20% OFF up to ₹100 on minimum ₹300 charging"
                      ></textarea>
                    </div>

                    <div className="md:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-semibold text-gray-700">Coupon Code *</label>
                        <div className="flex items-center gap-2">
                          {codeValidation.charCount > 0 && (
                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                              codeValidation.valid === true
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : codeValidation.valid === false
                                  ? 'bg-rose-50 text-rose-700 border-rose-300'
                                  : 'bg-gray-100 text-gray-500 border-gray-200'
                            }`}>
                              {codeValidation.charCount}/20
                            </span>
                          )}
                          <span className="text-[10px] text-gray-400">3–20 chars</span>
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          name="code"
                          required
                          value={formData.code}
                          onChange={handleCodeChange}
                          maxLength={20}
                          className={`w-full px-3 py-2 pr-10 border rounded-xl text-sm uppercase font-mono font-bold focus:outline-none transition-all bg-white ${
                            codeValidation.valid === true
                              ? 'border-emerald-400 focus:ring-1 focus:ring-emerald-500 bg-emerald-50/30'
                              : codeValidation.valid === false
                                ? 'border-rose-400 focus:ring-1 focus:ring-rose-500 bg-rose-50/30'
                                : 'border-gray-200 focus:border-[#8CC63F] focus:ring-1 focus:ring-[#8CC63F]'
                          }`}
                          placeholder="e.g. MONSOON20 or WEL21"
                        />
                        {codeValidation.valid === true && (
                          <Check size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 pointer-events-none" />
                        )}
                        {codeValidation.valid === false && (
                          <AlertCircle size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-500 pointer-events-none" />
                        )}
                      </div>
                      {codeValidation.message && (
                        <p className={`text-[11px] mt-1 font-medium ${
                          codeValidation.valid === true ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {codeValidation.valid === true ? '✓' : '✗'} {codeValidation.message}
                        </p>
                      )}
                      {!codeValidation.charCount && (
                        <p className="text-[11px] text-gray-400 mt-1">Auto-uppercased. No spaces. Only A–Z, 0–9, - and _ allowed.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* SECTION 2: Discount & Conditions */}
                <div className="bg-gray-50/60 p-4 rounded-xl border border-gray-200/80 space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-[10px]">2</span>
                      Discount & Conditions
                    </h3>
                    <span className="text-[10px] text-gray-400">Type, value, cap & min spend</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Discount Type *</label>
                      <select
                        name="discountType"
                        value={formData.discountType}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8CC63F] focus:ring-1 focus:ring-[#8CC63F] cursor-pointer bg-white"
                      >
                        <option value="PERCENTAGE">Percentage (%)</option>
                        <option value="FLAT">Flat Amount (₹)</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-semibold text-gray-700">Discount Value *</label>
                        {formData.discountType === 'PERCENTAGE' && (
                          <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                            Range: 0.01% – 100%
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          name="discountValue"
                          required
                          min="0.01"
                          max={formData.discountType === 'PERCENTAGE' ? '100' : undefined}
                          step="any"
                          value={formData.discountValue}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 pr-8 border rounded-xl text-sm font-semibold focus:outline-none transition-all bg-white ${
                            formData.discountType === 'PERCENTAGE' && Number(formData.discountValue) > 100
                              ? 'border-rose-400 focus:ring-2 focus:ring-rose-500 bg-rose-50/40 text-rose-900'
                              : 'border-gray-200 focus:border-[#8CC63F] focus:ring-1 focus:ring-[#8CC63F]'
                          }`}
                          placeholder={formData.discountType === 'PERCENTAGE' ? 'e.g. 20' : 'e.g. 50'}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 pointer-events-none">
                          {formData.discountType === 'PERCENTAGE' ? '%' : '₹'}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-semibold text-gray-800">
                          Max Discount Cap (₹) {formData.discountType === 'PERCENTAGE' ? <span className="text-rose-500 font-bold">*</span> : ''}
                        </label>
                        {formData.discountType === 'PERCENTAGE' && (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1 rounded border border-rose-200">
                            Mandatory
                          </span>
                        )}
                      </div>
                      <input
                        type="number"
                        name="maxDiscountAmount"
                        required={formData.discountType === 'PERCENTAGE'}
                        min="0.01"
                        step="any"
                        value={formData.maxDiscountAmount}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-xl text-sm font-semibold focus:outline-none bg-white ${
                          formData.discountType === 'PERCENTAGE' && !formData.maxDiscountAmount
                            ? 'border-amber-300 focus:ring-1 focus:ring-amber-500'
                            : 'border-gray-200 focus:border-[#8CC63F] focus:ring-1 focus:ring-[#8CC63F]'
                        }`}
                        placeholder={formData.discountType === 'PERCENTAGE' ? 'e.g. 100 (Max Cap)' : 'Optional'}
                      />
                      <p className="text-[11px] text-gray-500 mt-1">
                        {formData.discountType === 'PERCENTAGE'
                          ? 'Prevents excessive discounts on high charges.'
                          : 'Optional ceiling limit.'}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-semibold text-gray-800">Min Charge Amount (₹)</label>
                        <span className="text-[10px] text-gray-400">Default: ₹0</span>
                      </div>
                      <input
                        type="number"
                        name="minOrderAmount"
                        min="0"
                        step="any"
                        value={formData.minOrderAmount}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#8CC63F] focus:ring-1 focus:ring-[#8CC63F] bg-white"
                        placeholder="e.g. 300 or 500"
                      />
                      <p className="text-[11px] text-gray-500 mt-0.5">Bill must be ≥ this amount.</p>
                    </div>
                  </div>

                  {/* Cap Preview */}
                  {previewCapSimulation && (
                    <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-xl text-[11px] flex items-start gap-2">
                      <Info size={13} className="text-purple-500 shrink-0 mt-0.5" />
                      <span className="text-purple-800">
                        {formData.discountValue}% of ₹{previewCapSimulation.sampleBill} = ₹{previewCapSimulation.rawDisc}.{' '}
                        {previewCapSimulation.isCapped
                          ? <strong className="text-purple-900">Capped → Customer saves ₹{previewCapSimulation.cappedDisc}.</strong>
                          : <span>Below cap → saves ₹{previewCapSimulation.cappedDisc}.</span>
                        }
                      </span>
                    </div>
                  )}
                </div>

                {/* SECTION 3: Validity */}
                <div className="bg-gray-50/60 p-4 rounded-xl border border-gray-200/80 space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-[10px]">3</span>
                      Validity & Schedule
                    </h3>
                    <span className="text-[10px] text-gray-400">Dates, days & time slots</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-gray-700">Start Date *</label>
                        {formData.validFrom && (
                          <span className="text-[10px] font-mono font-bold text-gray-600 bg-gray-100 px-1.5 rounded border border-gray-200">
                            {formatOfferDate(formData.validFrom)}
                          </span>
                        )}
                      </div>
                      <input
                        type="date"
                        name="validFrom"
                        required
                        value={formData.validFrom}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8CC63F] focus:ring-1 focus:ring-[#8CC63F] bg-white"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-gray-700">End Date *</label>
                        {formData.validUntil && (
                          <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 rounded border border-emerald-200">
                            {formatOfferDate(formData.validUntil)}
                          </span>
                        )}
                      </div>
                      <input
                        type="date"
                        name="validUntil"
                        required
                        value={formData.validUntil}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8CC63F] focus:ring-1 focus:ring-[#8CC63F] bg-white"
                      />
                    </div>
                  </div>

                  {/* Applicable Days */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Applicable Days</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { val: 'ALL', label: 'All Days' },
                        { val: 'WEEKDAYS', label: 'Mon–Fri' },
                        { val: 'WEEKENDS', label: 'Sat & Sun' },
                        { val: 'CUSTOM', label: 'Custom' }
                      ].map(({ val, label }) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setFormData(p => ({ ...p, dayRestrictions: val, customDays: [] }))}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition cursor-pointer text-center ${
                            formData.dayRestrictions === val
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    {formData.dayRestrictions === 'CUSTOM' && (
                      <div className="mt-2 flex gap-1.5 flex-wrap">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => {
                          const isSelected = formData.customDays.includes(idx);
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => setFormData(p => ({
                                ...p,
                                customDays: isSelected
                                  ? p.customDays.filter(d => d !== idx)
                                  : [...p.customDays, idx].sort((a, b) => a - b)
                              }))}
                              className={`w-10 h-9 rounded-lg text-xs font-bold border transition cursor-pointer ${
                                isSelected
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-white text-gray-600 border-gray-200 hover:bg-blue-50 hover:border-blue-300'
                              }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                        {formData.customDays.length === 0 && (
                          <p className="text-[11px] text-amber-600 w-full mt-1">Select at least one day.</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Time Slot */}
                  <div className="border border-blue-100 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 bg-blue-50">
                      <div>
                        <p className="text-xs font-semibold text-gray-700">Specific Time Slot</p>
                        <p className="text-[10px] text-gray-500">e.g. 10:00 AM – 4:00 PM</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, hasTimeRestriction: !p.hasTimeRestriction, timeStart: '', timeEnd: '' }))}
                        className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors cursor-pointer ${
                          formData.hasTimeRestriction ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                          formData.hasTimeRestriction ? 'translate-x-5' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </div>
                    {formData.hasTimeRestriction && (
                      <div className="grid grid-cols-2 gap-3 p-3 bg-white border-t border-blue-100">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Start Time</label>
                          <input
                            type="time"
                            value={formData.timeStart}
                            onChange={e => setFormData(p => ({ ...p, timeStart: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8CC63F] focus:ring-1 focus:ring-[#8CC63F] bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">End Time</label>
                          <input
                            type="time"
                            value={formData.timeEnd}
                            onChange={e => setFormData(p => ({ ...p, timeEnd: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8CC63F] focus:ring-1 focus:ring-[#8CC63F] bg-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* SECTION 4: Eligibility */}
                <div className="bg-gray-50/60 p-4 rounded-xl border border-gray-200/80 space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-[10px]">4</span>
                      Eligibility
                    </h3>
                    <span className="text-[10px] text-gray-400">User targeting & usage limits</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Applicable For</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {[
                        { val: 'ALL', label: '👥 All Users' },
                        { val: 'NEW_USERS', label: '🆕 New Users' },
                        { val: 'SPECIFIC_USERS', label: '🎯 Specific' },
                        { val: 'TIER', label: '🏆 By Tier' }
                      ].map(({ val, label }) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setFormData(p => ({ ...p, applicableUserType: val }))}
                          className={`py-2 px-2 rounded-xl text-xs font-semibold border transition cursor-pointer text-center ${
                            formData.applicableUserType === val
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {formData.applicableUserType === 'TIER' && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Select Loyalty Tiers</label>
                      <div className="flex gap-2 flex-wrap">
                        {['Bronze', 'Silver', 'Gold'].map(tier => {
                          const isSelected = formData.applicableTiers.includes(tier);
                          return (
                            <button
                              key={tier}
                              type="button"
                              onClick={() => setFormData(p => ({
                                ...p,
                                applicableTiers: isSelected
                                  ? p.applicableTiers.filter(t => t !== tier)
                                  : [...p.applicableTiers, tier]
                              }))}
                              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                                isSelected
                                  ? tier === 'Gold' ? 'bg-yellow-500 text-white border-yellow-500'
                                    : tier === 'Silver' ? 'bg-gray-400 text-white border-gray-400'
                                    : 'bg-amber-700 text-white border-amber-700'
                                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              {isSelected && <Check size={11} />}{tier}
                            </button>
                          );
                        })}
                      </div>
                      {formData.applicableTiers.length === 0 && <p className="text-[11px] text-amber-600 mt-1">Select at least one tier.</p>}
                    </div>
                  )}

                  {formData.applicableUserType === 'SPECIFIC_USERS' && (
                    <p className="text-[11px] text-indigo-700 bg-indigo-50 p-2 rounded-lg border border-indigo-200">
                      ℹ️ Specific user assignment is managed via the User Profiles section. This offer applies only to users explicitly tagged with this coupon code.
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-gray-700">Total Usage Limit</label>
                        <span className="text-[10px] text-gray-400">Blank = ∞</span>
                      </div>
                      <input
                        type="number"
                        name="totalUsageLimit"
                        min="1"
                        value={formData.totalUsageLimit}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8CC63F] focus:ring-1 focus:ring-[#8CC63F] bg-white"
                        placeholder="e.g. 1000"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-gray-700">Per User Limit *</label>
                        <span className="text-[10px] text-gray-400">Default: 1</span>
                      </div>
                      <input
                        type="number"
                        name="perUserLimit"
                        required
                        min="1"
                        value={formData.perUserLimit}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8CC63F] focus:ring-1 focus:ring-[#8CC63F] bg-white"
                        placeholder="1"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 5: Applicability */}
                <div className="bg-gray-50/60 p-4 rounded-xl border border-gray-200/80 space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-[10px]">5</span>
                      Applicability
                    </h3>
                    <span className="text-[10px] text-gray-400">Stations, cities & connectors</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Stations</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { val: 'ALL', label: '🌐 All Stations' },
                        { val: 'SPECIFIC_STATIONS', label: '📍 Selected' },
                        { val: 'SPECIFIC_CITIES', label: '🏙️ By City' }
                      ].map(({ val, label }) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setFormData(p => ({ ...p, stationApplicabilityType: val }))}
                          className={`py-2 px-2 rounded-xl text-xs font-semibold border transition cursor-pointer text-center ${
                            formData.stationApplicabilityType === val
                              ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-teal-300 hover:bg-teal-50'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    {formData.stationApplicabilityType === 'SPECIFIC_CITIES' && (
                      <div className="mt-2">
                        <input
                          type="text"
                          name="applicableCities"
                          value={formData.applicableCities}
                          onChange={handleInputChange}
                          placeholder="e.g. Lucknow, Delhi, Pune"
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#8CC63F] focus:ring-1 focus:ring-[#8CC63F] bg-white"
                        />
                        <p className="text-[11px] text-gray-500 mt-1">Comma-separated city names.</p>
                      </div>
                    )}
                    {formData.stationApplicabilityType === 'SPECIFIC_STATIONS' && (
                      <p className="text-[11px] text-teal-700 bg-teal-50 p-2 rounded-lg border border-teal-200 mt-2">
                        ℹ️ Station-level assignment is configured per-station from the Station Management section.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Connector Types <span className="text-gray-400 font-normal">(all if none selected)</span>
                    </label>
                    <div className="flex gap-1.5 flex-wrap">
                      {['CCS2', 'CHAdeMO', 'Type 2 AC', 'Type 1', 'GB/T'].map(ct => {
                        const isSelected = formData.applicableConnectorTypes.includes(ct);
                        return (
                          <button
                            key={ct}
                            type="button"
                            onClick={() => setFormData(p => ({
                              ...p,
                              applicableConnectorTypes: isSelected
                                ? p.applicableConnectorTypes.filter(x => x !== ct)
                                : [...p.applicableConnectorTypes, ct]
                            }))}
                            className={`py-1 px-2.5 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                              isSelected
                                ? 'bg-teal-600 text-white border-teal-600'
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-teal-50 hover:border-teal-300'
                            }`}
                          >
                            {isSelected && <span className="mr-1">✓</span>}{ct}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* SECTION 6: Status */}
                <div className="bg-gray-50/60 p-4 rounded-xl border border-gray-200/80 space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-[10px]">6</span>
                      Status
                    </h3>
                    <span className="text-[10px] text-gray-400">How this offer is published</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: 'Active', label: '✅ Active', desc: 'Publish live now', activeClass: 'bg-emerald-600 border-emerald-600', hoverClass: 'hover:border-emerald-300 hover:bg-emerald-50' },
                      { val: 'Draft', label: '📋 Draft', desc: 'Save unpublished', activeClass: 'bg-gray-500 border-gray-500', hoverClass: 'hover:border-gray-300 hover:bg-gray-50' },
                      { val: 'Disabled', label: '⏸ Disabled', desc: 'Pause immediately', activeClass: 'bg-amber-600 border-amber-600', hoverClass: 'hover:border-amber-300 hover:bg-amber-50' }
                    ].map(({ val, label, desc, activeClass, hoverClass }) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, status: val }))}
                        className={`py-2.5 px-2 rounded-xl text-xs font-semibold border transition cursor-pointer text-center ${
                          formData.status === val
                            ? `${activeClass} text-white shadow-sm`
                            : `bg-white text-gray-700 border-gray-200 ${hoverClass}`
                        }`}
                      >
                        <div className="font-bold">{label}</div>
                        <div className={`text-[10px] mt-0.5 ${formData.status === val ? 'text-white/80' : 'text-gray-400'}`}>{desc}</div>
                      </button>
                    ))}
                  </div>

                  {/* Live Status Preview */}
                  <div className={`p-3 rounded-xl flex items-start gap-2.5 border ${
                    previewModalStatus.label === 'Active' ? 'bg-emerald-50 border-emerald-200' :
                    previewModalStatus.label === 'Scheduled' ? 'bg-blue-50 border-blue-200' :
                    previewModalStatus.label === 'Expired' ? 'bg-rose-50 border-rose-200' :
                    previewModalStatus.label === 'Draft' ? 'bg-gray-50 border-gray-200' :
                    'bg-amber-50 border-amber-200'
                  }`}>
                    <Clock size={14} className="mt-0.5 text-gray-500 shrink-0" />
                    <div className="text-xs flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-700">Calculated Status:</span>
                        <span className={`px-2 py-0.5 rounded-md font-bold border text-[11px] ${previewModalStatus.color}`}>
                          {previewModalStatus.label}
                        </span>
                      </div>
                      <p className="text-gray-500 mt-0.5">{previewModalStatus.note}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    actionLoading ||
                    codeValidation.valid === false ||
                    (formData.discountType === 'PERCENTAGE' && Number(formData.discountValue) > 100) ||
                    (formData.discountValue !== '' && Number(formData.discountValue) <= 0) ||
                    (formData.discountType === 'PERCENTAGE' && !formData.maxDiscountAmount)
                  }
                  className="px-4 py-2 text-sm font-semibold text-white bg-[#8CC63F] hover:bg-[#7ab036] rounded-xl transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                  {editingId ? 'Save Changes' : (formData.status === 'Draft' ? 'Save as Draft' : 'Create Offer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfferManagementView;

