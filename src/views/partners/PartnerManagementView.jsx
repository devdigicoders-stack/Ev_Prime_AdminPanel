import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, ChevronDown, Plus, Edit2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X, 
  Loader2, AlertCircle, Activity, MapPin, DollarSign, Wallet, Clock, 
  TrendingUp, ShieldCheck, RefreshCw, FileText, CheckCircle2, 
  Building2, CreditCard, Eye, ExternalLink, Award, XCircle, PauseCircle,
  PlayCircle, SlidersHorizontal, RotateCcw, Phone, Mail, Copy, User, Zap,
  ShieldAlert, UserX} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const PartnerManagementView = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Financial Summary State
  const [financialSummary, setFinancialSummary] = useState({
    totalRevenue: 0,
    partnerEarnings: 0,
    pendingPayout: 0,
    partnerShare: 0,
    platformCommission: 0,
    paidPayout: 0,
    refunds: 0,
    totalPartners: 0,
    activePartners: 0
  });
  const [
    summaryLoading, setSummaryLoading] = useState(false);

  // Modals & Action States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Delete / Deactivate Modal State (Requirement ★ 14: Safe Flow Active -> Suspended/Inactive)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [partnerToDelete, setPartnerToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deactivationReason, setDeactivationReason] = useState('');
  const [deactivationTargetStatus, setDeactivationTargetStatus] = useState('Suspended');

  // History / Statement Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [partnerHistory, setPartnerHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeHistoryTab, setActiveHistoryTab] = useState('statement'); // 'statement' | 'stations' | 'bookings' | 'payouts'

  // Table Lifecycle Modals State
  const [isTableRejectModalOpen, setIsTableRejectModalOpen] = useState(false);
  const [isTableSuspendModalOpen, setIsTableSuspendModalOpen] = useState(false);
  const [selectedLifecyclePartner, setSelectedLifecyclePartner] = useState(null);
  const [lifecycleReason, setLifecycleReason] = useState('');
  const [lifecycleActionLoading, setLifecycleActionLoading] = useState(false);

  // Filters & Search (Requirements 9 & 10)
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [cityFilter, setCityFilter] = useState('All');
  const [stationsFilter, setStationsFilter] = useState('All');
  const [partnerTypeFilter, setPartnerTypeFilter] = useState('All');
  const [kycFilter, setKycFilter] = useState('All');
  const [onboardingDateFilter, setOnboardingDateFilter] = useState('All');
  const [performanceSort, setPerformanceSort] = useState('default');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(true);

  // Pagination State (Default 10 items per screen)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Reset pagination on any filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, cityFilter, stationsFilter, partnerTypeFilter, kycFilter, onboardingDateFilter, performanceSort]);

  // Form State
  const initialFormState = {
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    status: 'Active',
    stationsCount: 0,
    appUsername: '',
    appPassword: ''
  };
  const [formData, setFormData] = useState(initialFormState);
  const [editingId, setEditingId] = useState(null);

  // Fetch Partners & Executive Financials
  const fetchPartners = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const [partnersRes, summaryRes] = await Promise.all([
        fetch(`${API_BASE_URL}/partner`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/partner/financial-summary`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => null)
      ]);

      if (!partnersRes.ok) throw new Error('Failed to fetch partners');
      const data = await partnersRes.json();
      setPartners(data);

      if (summaryRes && summaryRes.ok) {
        const sumData = await summaryRes.json();
        setFinancialSummary(sumData.data || sumData);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  // Dynamic Unique Cities from Partners
  const uniqueCities = useMemo(() => {
    const citiesSet = new Set();
    partners.forEach(p => {
      if (Array.isArray(p.cities)) p.cities.forEach(c => c && citiesSet.add(c));
      if (p.primaryCity) citiesSet.add(p.primaryCity);
      if (p.businessAddress) {
        const parts = p.businessAddress.split(',');
        if (parts.length > 1) citiesSet.add(parts[parts.length - 2].trim());
      }
    });
    return Array.from(citiesSet).filter(Boolean).sort();
  }, [partners]);

  // Dynamic Unique Partner Types
  const uniquePartnerTypes = useMemo(() => {
    const typesSet = new Set(['Charge Point Operator (CPO)', 'Franchise Partner', 'Fleet Partner', 'Commercial Host']);
    partners.forEach(p => {
      if (p.partnerType) typesSet.add(p.partnerType);
      if (p.businessType) typesSet.add(p.businessType);
    });
    return Array.from(typesSet).filter(Boolean).sort();
  }, [partners]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    return [
      statusFilter !== 'All',
      cityFilter !== 'All',
      stationsFilter !== 'All',
      partnerTypeFilter !== 'All',
      kycFilter !== 'All',
      onboardingDateFilter !== 'All',
      performanceSort !== 'default'
    ].filter(Boolean).length;
  }, [statusFilter, cityFilter, stationsFilter, partnerTypeFilter, kycFilter, onboardingDateFilter, performanceSort]);

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setCityFilter('All');
    setStationsFilter('All');
    setPartnerTypeFilter('All');
    setKycFilter('All');
    setOnboardingDateFilter('All');
    setPerformanceSort('default');
  };

  // Filtered & Sorted Partners (Requirements ★ 9 & ★ 10)
  const filteredPartners = useMemo(() => {
    return partners.filter(partner => {
      // 1. Universal Search across: Partner Name / Partner ID / Contact Person / Email / Mobile
      const partnerIdStr = (partner._id || '').toString().toLowerCase();
      const shortId = partnerIdStr.slice(-6);
      const searchTokens = [
        partner.name || '',
        partner.contactPerson || '',
        partner.email || '',
        partner.phone || '',
        partnerIdStr,
        `#${shortId}`,
        shortId
      ].join(' ').toLowerCase();

      const matchesSearch = !searchTerm || searchTokens.includes(searchTerm.trim().toLowerCase());

      // 2. Status
      const matchesStatus = statusFilter === 'All' 
        || partner.status === statusFilter
        || (statusFilter === 'Active' && (partner.status === 'Active' || partner.status === 'Approved'));

      // 3. City / State
      const partnerCityList = (partner.cities || []).concat(partner.primaryCity || []);
      const matchesCity = cityFilter === 'All'
        || partnerCityList.some(c => c && c.toLowerCase() === cityFilter.toLowerCase())
        || (partner.states || []).some(s => s && s.toLowerCase() === cityFilter.toLowerCase());

      // 4. Stations Count
      const stnCount = Number(partner.stationsCount || 0);
      let matchesStations = true;
      if (stationsFilter === '0') matchesStations = stnCount === 0;
      else if (stationsFilter === '1-3') matchesStations = stnCount >= 1 && stnCount <= 3;
      else if (stationsFilter === '4-10') matchesStations = stnCount >= 4 && stnCount <= 10;
      else if (stationsFilter === '10+') matchesStations = stnCount > 10;

      // 5. Partner Type
      const pType = partner.partnerType || partner.businessType || 'Charge Point Operator (CPO)';
      const matchesType = partnerTypeFilter === 'All'
        || pType.toLowerCase() === partnerTypeFilter.toLowerCase();

      // 6. KYC Status
      const isKycVerified = Boolean(
        partner.kycVerified ||
        partner.verification?.kyc?.verified === true ||
        (partner.panNumber && partner.gstNumber)
      );
      let matchesKyc = true;
      if (kycFilter === 'Verified') matchesKyc = isKycVerified;
      else if (kycFilter === 'Pending') matchesKyc = !isKycVerified;

      // 7. Onboarding Date
      let matchesDate = true;
      if (onboardingDateFilter !== 'All' && partner.createdAt) {
        const pDate = new Date(partner.createdAt);
        const now = new Date();
        if (onboardingDateFilter === 'This Month') {
          matchesDate = pDate.getMonth() === now.getMonth() && pDate.getFullYear() === now.getFullYear();
        } else if (onboardingDateFilter === 'Last 30 Days') {
          const days30 = 30 * 24 * 60 * 60 * 1000;
          matchesDate = (now - pDate) <= days30;
        } else if (onboardingDateFilter === 'Last 90 Days') {
          const days90 = 90 * 24 * 60 * 60 * 1000;
          matchesDate = (now - pDate) <= days90;
        } else if (onboardingDateFilter === 'This Year') {
          matchesDate = pDate.getFullYear() === now.getFullYear();
        }
      }

      return matchesSearch && matchesStatus && matchesCity && matchesStations && matchesType && matchesKyc && matchesDate;
    }).sort((a, b) => {
      // 8. Performance Sort
      if (performanceSort === 'revenue_desc') {
        return (b.totalRevenue || 0) - (a.totalRevenue || 0);
      }
      if (performanceSort === 'sessions_desc') {
        return (b.chargingSessions || 0) - (a.chargingSessions || 0);
      }
      if (performanceSort === 'energy_desc') {
        return (b.energyDelivered || 0) - (a.energyDelivered || 0);
      }
      if (performanceSort === 'earnings_desc') {
        return (b.netEarnings || 0) - (a.netEarnings || 0);
      }
      if (performanceSort === 'stations_desc') {
        return (b.stationsCount || 0) - (a.stationsCount || 0);
      }
      return 0;
    });
  }, [partners, searchTerm, statusFilter, cityFilter, stationsFilter, partnerTypeFilter, kycFilter, onboardingDateFilter, performanceSort]);

  // Pagination Calculation
  const totalPages = Math.ceil(filteredPartners.length / itemsPerPage);
  const paginatedPartners = filteredPartners.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Helper for generating page numbers with ellipses
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

  // Add Partner
  const handleAddSubmit = async () => {
    if (!formData.name || !formData.contactPerson || !formData.email || !formData.phone) {
      alert("Please fill all required fields (Name, Contact Person, Email, Phone).");
      return;
    }
    
    setActionLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      // Step 1: Create Partner
      const response = await fetch(`${API_BASE_URL}/partner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          contactPerson: formData.contactPerson,
          email: formData.email,
          phone: formData.phone,
          status: formData.status,
          stationsCount: Number(formData.stationsCount)
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to create partner');
      
      // Step 2: Set Credentials if provided
      if (formData.appUsername && formData.appPassword) {
        const credResponse = await fetch(`${API_BASE_URL}/partner/${data._id}/credentials`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            appUsername: formData.appUsername,
            appPassword: formData.appPassword
          })
        });
        if (!credResponse.ok) {
           const credData = await credResponse.json();
           toast.error(credData.message || 'Partner created but failed to set credentials');
        }
      }

      toast.success('Partner created successfully');
      await fetchPartners();
      setIsAddModalOpen(false);
      setFormData(initialFormState);
    } catch (err) {
      toast.error(err.message || 'Failed to create partner');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (partner) => {
    setEditingId(partner._id);
    setFormData({
      name: partner.name || '',
      contactPerson: partner.contactPerson || '',
      email: partner.email || '',
      phone: partner.phone || '',
      status: partner.status || 'Active',
      stationsCount: partner.stationsCount || 0,
      appUsername: partner.appUsername || '',
      appPassword: ''
    });
    setIsEditModalOpen(true);
  };

  // Edit Partner
  const handleEditSubmit = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/partner/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          contactPerson: formData.contactPerson,
          email: formData.email,
          phone: formData.phone,
          status: formData.status,
          stationsCount: Number(formData.stationsCount)
        })
      });

      if (!response.ok) throw new Error('Failed to update partner');
      
      if (formData.appUsername && formData.appPassword) {
        const credResponse = await fetch(`${API_BASE_URL}/partner/${editingId}/credentials`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            appUsername: formData.appUsername,
            appPassword: formData.appPassword
          })
        });
        if (!credResponse.ok) {
           const credData = await credResponse.json();
           toast.error(credData.message || 'Partner updated but failed to set credentials');
        }
      }

      toast.success('Partner updated successfully');
      await fetchPartners();
      setIsEditModalOpen(false);
      setFormData(initialFormState);
    } catch (err) {
      toast.error(err.message || 'Failed to update partner');
    } finally {
      setActionLoading(false);
    }
  };

  const fetchPartnerHistory = async (partner) => {
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/partner/${partner._id}/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch history');
      setPartnerHistory(data);
    } catch (err) {
      toast.error(err.message || 'Failed to fetch history');
      setIsHistoryModalOpen(false);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Safe Deactivate / Suspend Partner (Requirement ★ 14: Never Permanently Delete Records)
  const confirmDelete = (partner) => {
    setPartnerToDelete(partner);
    setDeactivationReason('Administrative deactivation: Preserving operational and financial records');
    setDeactivationTargetStatus(partner.status === 'Suspended' ? 'Inactive' : 'Suspended');
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!partnerToDelete) return;
    
    setDeleteLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/partner/${partnerToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'deactivate',
          targetStatus: deactivationTargetStatus,
          reason: deactivationReason || `Deactivated to ${deactivationTargetStatus} by Admin. Historical records preserved.`
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to process partner deactivation');
      
      if (data.deactivated) {
        toast.success(data.message || `Partner "${partnerToDelete.name}" deactivated (${data.status || deactivationTargetStatus}). Historical records safely preserved!`);
      } else {
        toast.success(data.message || 'Partner record updated successfully');
      }

      await fetchPartners(); // Refresh list to reflect Suspended/Inactive status
      setIsDeleteModalOpen(false);
      setPartnerToDelete(null);
      setDeactivationReason('');
    } catch (err) {
      toast.error(err.message || 'Failed to deactivate partner');
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
      case 'Blocked': return 'text-red-500';
      case 'Pending': return 'text-amber-500';
      case 'Rejected': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const handleLifecycleStatus = async (partnerId, newStatus, reason = '') => {
    try {
      setLifecycleActionLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/partner/${partnerId}/lifecycle-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus, reason })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `Failed to update status to ${newStatus}`);
      toast.success(data.message || `Partner marked as ${newStatus}`);
      setIsTableRejectModalOpen(false);
      setIsTableSuspendModalOpen(false);
      setSelectedLifecyclePartner(null);
      setLifecycleReason('');
      await fetchPartners();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLifecycleActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Partner Management</h1>
          <p className="text-gray-500 text-sm font-medium mt-0.5">Financial intelligence, operational metrics, and revenue share governance.</p>
        </div>
        <button
          onClick={fetchPartners}
          disabled={loading}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition shadow-sm"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-[#8CC63F]' : 'text-gray-500'} />
          Sync Telemetry
        </button>
      </div>

      {/* Top Financial KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Revenue */}
        <div className="bg-gradient-to-br from-blue-50/70 via-white to-white p-5 rounded-2xl border border-blue-100/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-blue-700 uppercase">Total Revenue</span>
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 shadow-sm">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
              ₹{Math.round(financialSummary.totalRevenue || 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1 font-medium">
              <TrendingUp size={13} className="text-emerald-500" />
              Gross earnings across {partners.length} partners
            </p>
          </div>
        </div>

        {/* Card 2: Partner Earnings (70% Net) */}
        <div className="bg-gradient-to-br from-emerald-50/70 via-white to-white p-5 rounded-2xl border border-emerald-100/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-emerald-800 uppercase">Partner Earnings</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800 shadow-sm">
              <Wallet size={20} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-emerald-800 tracking-tight">
              ₹{Math.round(financialSummary.partnerEarnings || 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1 font-medium">
              Net payable earnings (70% share)
            </p>
          </div>
        </div>

        {/* Card 3: Pending Payout */}
        <div className="bg-gradient-to-br from-amber-50/70 via-white to-white p-5 rounded-2xl border border-amber-100/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-amber-800 uppercase">Pending Payout</span>
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 shadow-sm">
              <Clock size={20} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-amber-800 tracking-tight">
              ₹{Math.round(financialSummary.pendingPayout || 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1 font-medium">
              Outstanding settlement balance
            </p>
          </div>
        </div>

        {/* Card 4: Platform Fee & Disbursed */}
        <div className="bg-gradient-to-br from-purple-50/70 via-white to-white p-5 rounded-2xl border border-purple-100/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-purple-800 uppercase">Platform Fee & Settled</span>
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-800 shadow-sm">
              <ShieldCheck size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <h3 className="text-2xl font-bold text-purple-800 tracking-tight">
                ₹{Math.round(financialSummary.platformCommission || 0).toLocaleString('en-IN')}
              </h3>
              <p className="text-xs text-gray-500 mt-1 font-medium">Platform 30% cut</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-emerald-700">₹{Math.round(financialSummary.paidPayout || 0).toLocaleString('en-IN')}</span>
              <p className="text-[11px] text-gray-500 font-semibold">Disbursed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
        
        {/* Advanced Toolbar (Requirements ★ 9 & ★ 10) */}
        <div className="p-4 sm:p-5 border-b border-gray-100 space-y-3.5">
          {/* Row 1: Universal Search, Status, Filter Toggle & Add Partner */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            {/* Universal Search (Partner Name, ID, Contact Person, Email, Mobile) */}
            <div className="relative flex-1 max-w-2xl">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search partner name, ID, contact person, email or mobile..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all shadow-2xs placeholder:text-gray-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded cursor-pointer"
                  title="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Quick Actions & Status */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Status Filter */}
              <div className="relative min-w-[150px]">
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full appearance-none bg-white border border-gray-200 rounded-xl pl-3.5 pr-8 py-2.5 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8CC63F] hover:bg-gray-50 transition shadow-2xs cursor-pointer"
                >
                  <option value="All">All Status</option>
                  <option value="Pending">Pending Review</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Active">Approved / Active</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Rejected">Rejected</option>
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              {/* Toggle Filters Button with Badge */}
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition shadow-2xs border cursor-pointer ${
                  activeFiltersCount > 0 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                    : showAdvancedFilters 
                    ? 'bg-gray-100 text-gray-900 border-gray-300' 
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
                title="Toggle advanced filter criteria"
              >
                <SlidersHorizontal size={14} className={activeFiltersCount > 0 ? 'text-emerald-700' : 'text-gray-500'} />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[#116631] text-white flex items-center justify-center text-[10px] font-black ml-0.5">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {/* Add Partner Button */}
              {hasPermission('partners', 'add') && (
                <button 
                  onClick={() => {
                    setFormData(initialFormState);
                    setIsAddModalOpen(true);
                  }}
                  className="bg-[#8CC63F] hover:bg-[#116631] text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  <Plus size={16} strokeWidth={2.5} />
                  <span>Add Partner</span>
                </button>
              )}
            </div>
          </div>

          {/* Row 2: Advanced 7-Filter Bar (City/State, Stations, Partner Type, KYC, Date, Performance) */}
          {showAdvancedFilters && (
            <div className="pt-2 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 animate-in fade-in duration-150">
              {/* 1. City / State */}
              <div className="relative">
                <select 
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="w-full appearance-none bg-gray-50/80 border border-gray-200 rounded-xl pl-3 pr-7 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8CC63F] hover:bg-white transition cursor-pointer"
                >
                  <option value="All">All Cities / States</option>
                  {uniqueCities.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="Uttar Pradesh">Uttar Pradesh (State)</option>
                  <option value="Delhi">Delhi (State)</option>
                  <option value="Maharashtra">Maharashtra (State)</option>
                </select>
                <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              {/* 2. Number of Stations */}
              <div className="relative">
                <select 
                  value={stationsFilter}
                  onChange={(e) => setStationsFilter(e.target.value)}
                  className="w-full appearance-none bg-gray-50/80 border border-gray-200 rounded-xl pl-3 pr-7 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8CC63F] hover:bg-white transition cursor-pointer"
                >
                  <option value="All">All Station Counts</option>
                  <option value="0">0 Stations (Pre-launch)</option>
                  <option value="1-3">1 - 3 Stations</option>
                  <option value="4-10">4 - 10 Stations</option>
                  <option value="10+">10+ Stations (Major)</option>
                </select>
                <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              {/* 3. Partner Type */}
              <div className="relative">
                <select 
                  value={partnerTypeFilter}
                  onChange={(e) => setPartnerTypeFilter(e.target.value)}
                  className="w-full appearance-none bg-gray-50/80 border border-gray-200 rounded-xl pl-3 pr-7 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8CC63F] hover:bg-white transition cursor-pointer"
                >
                  <option value="All">All Partner Types</option>
                  <option value="Charge Point Operator (CPO)">Charge Point Operator (CPO)</option>
                  <option value="Franchise Partner">Franchise Partner</option>
                  <option value="Fleet Partner">Fleet Partner</option>
                  <option value="Commercial Host">Commercial Host</option>
                </select>
                <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              {/* 4. KYC Status */}
              <div className="relative">
                <select 
                  value={kycFilter}
                  onChange={(e) => setKycFilter(e.target.value)}
                  className="w-full appearance-none bg-gray-50/80 border border-gray-200 rounded-xl pl-3 pr-7 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8CC63F] hover:bg-white transition cursor-pointer"
                >
                  <option value="All">All KYC Status</option>
                  <option value="Verified">KYC Verified (✓)</option>
                  <option value="Pending">KYC Pending / Missing (⚠️)</option>
                </select>
                <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              {/* 5. Onboarding Date */}
              <div className="relative">
                <select 
                  value={onboardingDateFilter}
                  onChange={(e) => setOnboardingDateFilter(e.target.value)}
                  className="w-full appearance-none bg-gray-50/80 border border-gray-200 rounded-xl pl-3 pr-7 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8CC63F] hover:bg-white transition cursor-pointer"
                >
                  <option value="All">All Onboarding Time</option>
                  <option value="This Month">Joined This Month</option>
                  <option value="Last 30 Days">Last 30 Days</option>
                  <option value="Last 90 Days">Last 90 Days</option>
                  <option value="This Year">Joined This Year</option>
                </select>
                <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              {/* 6. Performance Sort & Reset Button */}
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <select 
                    value={performanceSort}
                    onChange={(e) => setPerformanceSort(e.target.value)}
                    className="w-full appearance-none bg-gray-50/80 border border-gray-200 rounded-xl pl-3 pr-7 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8CC63F] hover:bg-white transition cursor-pointer"
                  >
                    <option value="default">Sort: Default (Recent)</option>
                    <option value="revenue_desc">Top Revenue (₹)</option>
                    <option value="sessions_desc">Most Sessions</option>
                    <option value="energy_desc">Highest Energy (kWh)</option>
                    <option value="earnings_desc">Top Net Earnings</option>
                    <option value="stations_desc">Most Stations</option>
                  </select>
                  <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>

                {(activeFiltersCount > 0 || searchTerm) && (
                  <button
                    onClick={handleClearAllFilters}
                    className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition border border-red-200 shadow-2xs shrink-0 cursor-pointer"
                    title="Reset All Filters"
                  >
                    <RotateCcw size={14} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Active Filter Pills Bar (when any filter active) */}
          {(activeFiltersCount > 0 || searchTerm) && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
              <span className="text-gray-400 font-medium">Active criteria:</span>
              {searchTerm && (
                <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 flex items-center gap-1">
                  Query: &ldquo;{searchTerm}&rdquo;
                  <button onClick={() => setSearchTerm('')} className="hover:text-red-600"><X size={11} /></button>
                </span>
              )}
              {statusFilter !== 'All' && (
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1 font-semibold">
                  Status: {statusFilter}
                  <button onClick={() => setStatusFilter('All')} className="hover:text-red-600"><X size={11} /></button>
                </span>
              )}
              {cityFilter !== 'All' && (
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1 font-semibold">
                  City: {cityFilter}
                  <button onClick={() => setCityFilter('All')} className="hover:text-red-600"><X size={11} /></button>
                </span>
              )}
              {stationsFilter !== 'All' && (
                <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 font-semibold">
                  Stations: {stationsFilter}
                  <button onClick={() => setStationsFilter('All')} className="hover:text-red-600"><X size={11} /></button>
                </span>
              )}
              {partnerTypeFilter !== 'All' && (
                <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1 font-semibold">
                  Type: {partnerTypeFilter}
                  <button onClick={() => setPartnerTypeFilter('All')} className="hover:text-red-600"><X size={11} /></button>
                </span>
              )}
              {kycFilter !== 'All' && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 font-semibold">
                  KYC: {kycFilter}
                  <button onClick={() => setKycFilter('All')} className="hover:text-red-600"><X size={11} /></button>
                </span>
              )}
              {onboardingDateFilter !== 'All' && (
                <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 flex items-center gap-1 font-semibold">
                  Date: {onboardingDateFilter}
                  <button onClick={() => setOnboardingDateFilter('All')} className="hover:text-red-600"><X size={11} /></button>
                </span>
              )}
              {performanceSort !== 'default' && (
                <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 font-semibold">
                  Sort: {performanceSort.replace('_desc', '').toUpperCase()}
                  <button onClick={() => setPerformanceSort('default')} className="hover:text-red-600"><X size={11} /></button>
                </span>
              )}
              <button
                onClick={handleClearAllFilters}
                className="text-[#116631] hover:underline font-bold text-[11px] ml-1 cursor-pointer"
              >
                Clear all ({filteredPartners.length} matching)
              </button>
            </div>
          )}
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
          ) : filteredPartners.length === 0 ? (
            <div className="py-20 flex items-center justify-center text-gray-500 font-medium">
               No partners found matching the criteria.
            </div>
          ) : null}

          <table className="w-full text-left border-collapse min-w-[1050px]">
            <thead className="bg-gray-50/90 border-b border-gray-100 select-none">
              <tr>
                <th className="px-3.5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[180px]">
                  Partner & ID
                </th>
                <th className="px-3.5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[160px]">
                  Contact Person
                </th>
                <th className="px-3.5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[150px]">
                  Mobile / Phone
                </th>
                <th className="px-3 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap text-center">
                  Status
                </th>
                <th className="px-3 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap text-center">
                  Stations
                </th>
                <th className="px-3.5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap text-right">
                  Total Revenue
                </th>
                <th className="px-3.5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap text-right">
                  Net Earnings
                </th>
                <th className="px-3.5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap text-right">
                  Paid
                </th>
                <th className="px-3.5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap text-center">
                  Pending Payout
                </th>
                <th className="sticky right-0 bg-gray-50/95 backdrop-blur-xs z-20 px-3.5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider text-center shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.06)] border-l border-gray-100 min-w-[110px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {!loading && paginatedPartners.map((partner) => {
                const totalRev = Math.round(partner.totalRevenue ?? partner.financials?.totalRevenue ?? 0);
                const netEarn = Math.round(partner.netEarnings ?? partner.financials?.netEarnings ?? 0);
                const paidAmt = Math.round(partner.paidPayout ?? partner.financials?.paidPayout ?? 0);
                const pendPayout = Math.round(partner.pendingPayout ?? partner.financials?.pendingPayout ?? 0);

                return (
                  <tr key={partner._id} className="hover:bg-gray-50/70 transition-colors group">
                    {/* 1. Partner & ID Column */}
                    <td className="px-3.5 py-3 whitespace-nowrap min-w-[180px]">
                      <div className="flex items-center gap-2.5">
                        <div 
                          onClick={() => navigate(`/partners/${partner._id}`)}
                          className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs cursor-pointer hover:bg-[#116631] transition"
                          title="Open Partner Detail Page"
                        >
                          {partner.name ? partner.name.charAt(0).toUpperCase() : 'P'}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              onClick={() => navigate(`/partners/${partner._id}`)}
                              className="text-xs font-bold text-gray-900 group-hover:text-emerald-700 hover:underline transition-colors truncate max-w-[160px] text-left cursor-pointer"
                              title={`Open ${partner.name} Detail Page`}
                            >
                              {partner.name}
                            </button>
                            <span className="font-mono text-[9px] font-bold text-gray-500 bg-gray-100 px-1 py-0.5 rounded border border-gray-200">
                              #{partner._id.slice(-6).toUpperCase()}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-0.5">
                            {(partner.primaryCity || partner.cities?.[0]) && (
                              <span className="text-gray-500 flex items-center gap-0.5">
                                <MapPin size={10} className="text-gray-400" />
                                {partner.primaryCity || partner.cities[0]}
                              </span>
                            )}
                            {partner.kycVerified ? (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200 ml-0.5">
                                <CheckCircle2 size={9} /> KYC
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200 ml-0.5">
                                KYC Pending
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 2. Contact Person Column */}
                    <td className="px-3.5 py-3 whitespace-nowrap min-w-[160px]">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                          <User size={12} className="text-gray-400 shrink-0" />
                          <span className="text-xs font-bold text-gray-800 truncate max-w-[140px]">
                            {partner.contactPerson || 'Authorized Rep'}
                          </span>
                        </div>
                        {partner.email ? (
                          <a 
                            href={`mailto:${partner.email}`}
                            className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-emerald-700 hover:underline mt-0.5 truncate max-w-[150px] transition"
                            title={`Email ${partner.email}`}
                          >
                            <Mail size={10} className="text-gray-400 shrink-0" />
                            <span className="truncate">{partner.email}</span>
                          </a>
                        ) : (
                          <span className="text-[10px] text-gray-400 italic">No email</span>
                        )}
                      </div>
                    </td>

                    {/* 3. Mobile / Phone Column (⭐ DEDICATED COLUMN ⭐) */}
                    <td className="px-3.5 py-3 whitespace-nowrap min-w-[150px]">
                      {partner.phone ? (
                        <div className="flex items-center gap-1.5">
                          <a 
                            href={`tel:${partner.phone}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 transition cursor-pointer shadow-2xs group/phone"
                            title={`Call ${partner.phone}`}
                          >
                            <Phone size={11} className="text-emerald-600 group-hover/phone:animate-bounce shrink-0" />
                            <span className="font-mono text-xs font-bold tracking-tight">
                              {partner.phone}
                            </span>
                          </a>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(partner.phone);
                              toast.success(`Copied mobile: ${partner.phone}`);
                            }}
                            className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                            title="Copy Mobile Number"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                          <AlertCircle size={10} /> Missing Phone
                        </span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="px-3.5 py-3 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        partner.status === 'Active' || partner.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        partner.status === 'Under Review' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                        partner.status === 'Pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        partner.status === 'Suspended' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                        partner.status === 'Inactive' ? 'bg-gray-100 text-gray-700 border border-gray-300' :
                        partner.status === 'Rejected' ? 'bg-red-50 text-red-700 border border-red-200' :
                        'bg-gray-50 text-gray-600 border border-gray-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          partner.status === 'Active' || partner.status === 'Approved' ? 'bg-emerald-500 animate-pulse' :
                          partner.status === 'Under Review' ? 'bg-indigo-600 animate-pulse' :
                          partner.status === 'Pending' ? 'bg-amber-500' :
                          partner.status === 'Suspended' ? 'bg-orange-500' : 
                          partner.status === 'Inactive' ? 'bg-gray-400' : 'bg-red-500'
                        }`} />
                        {partner.status === 'Active' || partner.status === 'Approved' ? 'Active' : partner.status}
                      </span>
                    </td>

                    {/* Stations Count (Clickable - Requirement ★ 12) */}
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => navigate(`/partners/${partner._id}?tab=stations`)}
                        title={`View ${partner.name}'s ${partner.stationsCount || 0} Stations`}
                        className="inline-flex items-center justify-center gap-1 min-w-[38px] h-7 px-2.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-900 border border-blue-200/80 shadow-2xs hover:shadow-xs transition-all cursor-pointer group/stn"
                      >
                        <Zap size={11} className="text-blue-500 group-hover/stn:scale-110 transition-transform" />
                        <span>{partner.stationsCount || 0}</span>
                        <span className="text-[10px] text-blue-500 font-semibold hidden xl:inline">Stns</span>
                      </button>
                    </td>

                    {/* Total Revenue */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <span className="text-sm font-bold text-gray-900">
                        ₹{totalRev.toLocaleString('en-IN')}
                      </span>
                    </td>

                    {/* Net Earnings */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-emerald-700">
                          ₹{netEarn.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">70% Share</span>
                      </div>
                    </td>

                    {/* Paid Payout */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-600">
                        ₹{paidAmt.toLocaleString('en-IN')}
                      </span>
                    </td>

                    {/* Pending Payout */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {pendPayout > 0 ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-xs">
                          <Clock size={12} className="text-amber-600" />
                          ₹{pendPayout.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={13} className="text-emerald-600" /> Settled
                        </span>
                      )}
                    </td>

                    {/* Actions Column (Sticky Right - Requirement ★ 13: 5 Clear Action Icons with Mandatory Tooltips) */}
                    <td className="sticky right-0 bg-white group-hover:bg-gray-50/95 z-20 px-3.5 py-3 text-center shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.06)] border-l border-gray-100 min-w-[170px]">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* 1. View Details */}
                        <button 
                          onClick={() => navigate(`/partners/${partner._id}`)} 
                          title="View Details" 
                          className="p-2 rounded-xl text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 border border-gray-100 shadow-2xs transition-colors cursor-pointer"
                        >
                          <Eye size={15} strokeWidth={2.2} />
                        </button>

                        {/* 2. Performance */}
                        <button 
                          onClick={() => navigate(`/partners/${partner._id}?tab=performance`)} 
                          title="Performance" 
                          className="p-2 rounded-xl text-gray-500 hover:text-blue-600 hover:bg-blue-50 border border-gray-100 shadow-2xs transition-colors cursor-pointer"
                        >
                          <TrendingUp size={15} strokeWidth={2.2} />
                        </button>

                        {/* 3. Edit Partner */}
                        {hasPermission('partners', 'edit') && (
                          <button 
                            onClick={() => openEditModal(partner)} 
                            title="Edit Partner" 
                            className="p-2 rounded-xl text-gray-500 hover:text-amber-600 hover:bg-amber-50 border border-gray-100 shadow-2xs transition-colors cursor-pointer"
                          >
                            <Edit2 size={15} strokeWidth={2.2} />
                          </button>
                        )}

                        {/* 4. Suspend / Activate */}
                        {partner.status === 'Active' || partner.status === 'Approved' ? (
                          <button 
                            onClick={() => {
                              setSelectedLifecyclePartner(partner);
                              setLifecycleReason('');
                              setIsTableSuspendModalOpen(true);
                            }} 
                            title="Suspend/Activate" 
                            className="p-2 rounded-xl text-orange-500 hover:text-orange-700 hover:bg-orange-50 border border-gray-100 shadow-2xs transition-colors cursor-pointer"
                          >
                            <PauseCircle size={15} strokeWidth={2.2} />
                          </button>
                        ) : partner.status === 'Suspended' || partner.status === 'Inactive' ? (
                          <button 
                            onClick={() => handleLifecycleStatus(partner._id, 'Active', 'Reactivated by Admin')} 
                            title="Suspend/Activate" 
                            className="p-2 rounded-xl text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 border border-gray-100 shadow-2xs transition-colors cursor-pointer"
                          >
                            <PlayCircle size={15} strokeWidth={2.2} />
                          </button>
                        ) : (
                          <button 
                            onClick={() => navigate(`/partners/${partner._id}`)} 
                            title="Suspend/Activate" 
                            className="p-2 rounded-xl text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 border border-gray-100 shadow-2xs transition-colors cursor-pointer"
                          >
                            <ShieldCheck size={15} strokeWidth={2.2} />
                          </button>
                        )}

                        {/* 5. Delete / Deactivate (With Confirmation Modal - Requirement ★ 14) */}
                        {hasPermission('partners', 'delete') && (
                          <button 
                            onClick={() => confirmDelete(partner)} 
                            title="Delete/Deactivate" 
                            className="p-2 rounded-xl text-gray-400 hover:text-amber-600 hover:bg-amber-50 border border-gray-100 shadow-2xs transition-colors cursor-pointer"
                          >
                            <UserX size={15} strokeWidth={2.2} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Complete Pagination Bar */}
        {filteredPartners.length > 0 && (
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100 bg-white">
            {/* Left side: Showing X to Y of Z + Page Size selector */}
            <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs sm:text-sm text-gray-600 font-medium w-full sm:w-auto justify-between sm:justify-start">
              <span className="whitespace-nowrap">
                Showing <strong className="text-gray-900 font-semibold">{(currentPage - 1) * itemsPerPage + 1}</strong> to <strong className="text-gray-900 font-semibold">{Math.min(currentPage * itemsPerPage, filteredPartners.length)}</strong> of <strong className="text-gray-900 font-semibold">{filteredPartners.length}</strong> partners
              </span>
              <div className="relative ml-2 border-l border-gray-200 pl-3">
                <select 
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="appearance-none bg-transparent pr-6 py-0.5 focus:outline-none cursor-pointer text-gray-700 font-semibold text-xs sm:text-sm"
                >
                  <option value={10} className="text-gray-900 bg-white">10 / page</option>
                  <option value={20} className="text-gray-900 bg-white">20 / page</option>
                  <option value={50} className="text-gray-900 bg-white">50 / page</option>
                  <option value={100} className="text-gray-900 bg-white">100 / page</option>
                </select>
                <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Right side: Complete Full Pagination with First, Prev, Numbers, Next, Last */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto justify-center sm:justify-end">
              {/* First Page */}
              <button 
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                title="First Page"
                className="inline-flex items-center justify-center p-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-white disabled:cursor-not-allowed transition text-xs font-semibold shadow-2xs cursor-pointer"
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
                className="inline-flex items-center justify-center p-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-white disabled:cursor-not-allowed transition text-xs font-semibold shadow-2xs cursor-pointer"
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Partner Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="text-lg font-semibold text-gray-900">{isEditModalOpen ? 'Edit Partner' : 'Add New Partner'}</h2>
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
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Company / Partner Name *</label>
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Green Energy Solutions"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Contact Person *</label>
                  <input 
                    type="text" 
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                    placeholder="e.g. Amit Verma"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Email Address *</label>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="e.g. amit@greenenergy.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Phone size={13} className="text-emerald-600" />
                      Mobile / Phone Number *
                    </span>
                    <span className="text-[10px] text-gray-400 normal-case font-normal">Primary Contact</span>
                  </label>
                  <input 
                    type="tel" 
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="e.g. 9876543210 or +91 98765 43210"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all shadow-sm"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Required for operational alerts & partner coordination</p>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Number of Stations</label>
                  <input 
                    type="number" 
                    name="stationsCount"
                    value={formData.stationsCount}
                    onChange={handleInputChange}
                    placeholder="e.g. 10"
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
                      <option value="Pending">Pending</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Blocked">Blocked</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="sm:col-span-2 pt-2 mt-2 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">App Credentials (Optional)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">App Username</label>
                      <input 
                        type="text" 
                        name="appUsername"
                        value={formData.appUsername}
                        onChange={handleInputChange}
                        placeholder="e.g. partner_green"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">{isEditModalOpen ? 'New Password' : 'Password'}</label>
                      <input 
                        type="password" 
                        name="appPassword"
                        value={formData.appPassword}
                        onChange={handleInputChange}
                        placeholder={isEditModalOpen ? "Leave blank to keep current" : "Minimum 6 characters"}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all shadow-sm"
                      />
                    </div>
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
                {isEditModalOpen ? 'Save Changes' : 'Add Partner'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Partner Confirmation Modal (Requirement ★ 14: Never Permanently Delete Records) */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-sm p-4 sm:p-6 flex min-h-full items-center justify-center animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 max-h-[85vh] flex flex-col my-auto">
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-gradient-to-b from-amber-50/80 to-white border-b border-amber-100/60 shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0 shadow-2xs">
                  <ShieldAlert size={22} strokeWidth={2.2} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                      Requirement ★ 14
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                      <ShieldCheck size={10} /> Data Protected
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-gray-900 mt-0.5 leading-tight">Deactivate Partner (Safe Action)</h2>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setPartnerToDelete(null);
                }}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1 min-h-0 overscroll-contain [scrollbar-width:thin]">
              {/* Partner Summary Card */}
              {partnerToDelete && (
                <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200/80 space-y-2 text-xs text-gray-600 shadow-2xs">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-200/60">
                    <span className="font-semibold text-gray-500">Partner Organization:</span>
                    <span className="font-bold text-gray-900 text-sm">{partnerToDelete.name}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <div className="flex flex-col">
                      <span className="text-[11px] text-gray-400">Contact Rep:</span>
                      <span className="font-semibold text-gray-800">{partnerToDelete.contactPerson || 'N/A'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] text-gray-400">Mobile / Phone:</span>
                      <span className="font-mono font-bold text-gray-800">{partnerToDelete.phone || 'N/A'}</span>
                    </div>
                    <div className="flex flex-col mt-0.5">
                      <span className="text-[11px] text-gray-400">Assigned Stations:</span>
                      <span className="font-bold text-blue-700">{partnerToDelete.stationsCount || 0} Stations Mapped</span>
                    </div>
                    <div className="flex flex-col mt-0.5">
                      <span className="text-[11px] text-gray-400">Current Status:</span>
                      <span className="font-semibold text-gray-800">{partnerToDelete.status}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Recommended Flow Banner: Active -> Suspended / Inactive */}
              <div className="bg-amber-50/70 rounded-xl p-3 border border-amber-200/80 text-xs text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-800">
                  <RotateCcw size={13} />
                  <span>Recommended Flow: Active → Suspended / Inactive</span>
                </div>
                <p className="text-[11px] text-amber-800/90 leading-relaxed">
                  The partner will be transitioned to safe dormant state. Partner app access will be suspended, but all <strong>charging sessions, payments, revenues, and station mappings</strong> will remain completely preserved in the database.
                </p>
              </div>

              {/* Target Status Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Select Deactivation Status:
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setDeactivationTargetStatus('Suspended')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                      deactivationTargetStatus === 'Suspended'
                        ? 'border-orange-500 bg-orange-50/60 ring-2 ring-orange-400/20'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-orange-800">Suspended</span>
                      <PauseCircle size={14} className="text-orange-600" />
                    </div>
                    <span className="text-[10px] text-gray-500">Temporarily halt operations, re-activate anytime</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeactivationTargetStatus('Inactive')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                      deactivationTargetStatus === 'Inactive'
                        ? 'border-gray-500 bg-gray-50/80 ring-2 ring-gray-400/20'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-800">Inactive</span>
                      <UserX size={14} className="text-gray-600" />
                    </div>
                    <span className="text-[10px] text-gray-500">Long-term offboarding while preserving all data</span>
                  </button>
                </div>
              </div>

              {/* Reason for Deactivation */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Reason for Deactivation / Suspension:
                </label>
                <textarea
                  value={deactivationReason}
                  onChange={(e) => setDeactivationReason(e.target.value)}
                  placeholder="e.g. Partner agreement expired, station maintenance pause, payment reconciliation pending..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all shadow-2xs resize-none"
                />

                {/* Quick select pills */}
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {[
                    'Contract Terminated',
                    'Payment Reconciliation',
                    'Administrative Review',
                    'Seasonal Inactivity'
                  ].map((quickReason) => (
                    <button
                      key={quickReason}
                      type="button"
                      onClick={() => setDeactivationReason(quickReason)}
                      className="px-2 py-0.5 rounded-md bg-gray-100 hover:bg-amber-100 text-[10px] font-medium text-gray-600 hover:text-amber-800 border border-gray-200/70 transition-colors cursor-pointer"
                    >
                      + {quickReason}
                    </button>
                  ))}
                </div>
              </div>

              {/* Historical Guarantee Assurance */}
              <div className="bg-emerald-50/70 rounded-xl p-2.5 border border-emerald-200/80 flex items-start gap-2 text-xs text-emerald-900">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed text-emerald-800">
                  <strong>Safe Action Guarantee:</strong> Zero database records will be dropped. All historical financial statements and station records remain intact.
                </p>
              </div>
            </div>

            {/* Modal Footer (Sticky Bottom) */}
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2.5 shrink-0">
              <button 
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setPartnerToDelete(null);
                }}
                disabled={deleteLoading}
                className="px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 bg-white border border-gray-200 rounded-xl transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                disabled={deleteLoading}
                className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors shadow-2xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-amber-600/20"
              >
                {deleteLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={14} />
                    <span>Preserving & Deactivating...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={14} />
                    <span>Deactivate Partner (Preserve History)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Financial Statement & Operations Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-gray-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl my-auto animate-in fade-in zoom-in-95 duration-200 border border-gray-100 flex flex-col max-h-[90vh] overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#8CC63F]/15 flex items-center justify-center text-[#116631]">
                  <Building2 size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-900">{partnerHistory?.partner?.name || 'Partner Financial Statement'}</h2>
                    {partnerHistory?.partner?.status && (
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        partnerHistory.partner.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        partnerHistory.partner.status === 'Pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-gray-50 text-gray-700 border border-gray-200'
                      }`}>
                        {partnerHistory.partner.status}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-700 font-medium">
                      <User size={11} className="text-gray-400" />
                      <span>Contact: <strong className="text-gray-900">{partnerHistory?.partner?.contactPerson || 'N/A'}</strong></span>
                    </span>
                    {partnerHistory?.partner?.email && (
                      <a 
                        href={`mailto:${partnerHistory.partner.email}`}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-700 hover:text-emerald-700 hover:bg-emerald-50 transition font-medium"
                        title={`Email ${partnerHistory.partner.email}`}
                      >
                        <Mail size={11} className="text-gray-400" />
                        <span>{partnerHistory.partner.email}</span>
                      </a>
                    )}
                    {partnerHistory?.partner?.phone ? (
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold font-mono">
                        <Phone size={11} className="text-emerald-600" />
                        <a href={`tel:${partnerHistory.partner.phone}`} className="hover:underline" title={`Call ${partnerHistory.partner.phone}`}>
                          {partnerHistory.partner.phone}
                        </a>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(partnerHistory.partner.phone);
                            toast.success(`Copied mobile: ${partnerHistory.partner.phone}`);
                          }}
                          className="p-0.5 hover:bg-emerald-100 rounded text-emerald-600 ml-0.5 cursor-pointer"
                          title="Copy Mobile"
                        >
                          <Copy size={11} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-red-500 italic">No mobile phone</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    setIsHistoryModalOpen(false);
                    navigate(`/partners/${partnerHistory.partner._id}`);
                  }} 
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-xs transition border border-emerald-200 shadow-2xs cursor-pointer"
                  title="Open Dedicated Full Partner Detail Page"
                >
                  <span>Open Full Detail Page</span>
                  <ExternalLink size={13} />
                </button>
                <button 
                  onClick={() => setIsHistoryModalOpen(false)} 
                  className="text-gray-400 hover:bg-gray-100 hover:text-gray-700 p-2 rounded-xl transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="px-6 bg-gray-50/70 border-b border-gray-100 flex items-center gap-2 overflow-x-auto shrink-0">
              <button
                onClick={() => setActiveHistoryTab('performance')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeHistoryTab === 'performance'
                    ? 'border-[#8CC63F] text-[#116631] bg-white shadow-xs rounded-t-lg'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Award size={15} />
                Partner Performance (8 KPIs)
              </button>

              <button
                onClick={() => setActiveHistoryTab('statement')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeHistoryTab === 'statement'
                    ? 'border-[#8CC63F] text-[#116631] bg-white shadow-xs rounded-t-lg'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileText size={15} />
                Financial Statement (7 Metrics)
              </button>

              <button
                onClick={() => setActiveHistoryTab('payouts')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeHistoryTab === 'payouts'
                    ? 'border-[#8CC63F] text-[#116631] bg-white shadow-xs rounded-t-lg'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <CreditCard size={15} />
                Payouts History ({partnerHistory?.payouts?.length || 0})
              </button>

              <button
                onClick={() => setActiveHistoryTab('stations')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeHistoryTab === 'stations'
                    ? 'border-[#8CC63F] text-[#116631] bg-white shadow-xs rounded-t-lg'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <MapPin size={15} />
                Partner Stations ({partnerHistory?.stations?.length || 0})
              </button>

              <button
                onClick={() => setActiveHistoryTab('bookings')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeHistoryTab === 'bookings'
                    ? 'border-[#8CC63F] text-[#116631] bg-white shadow-xs rounded-t-lg'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Activity size={15} />
                Recent Bookings ({partnerHistory?.bookings?.length || 0})
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {historyLoading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                  <Loader2 className="animate-spin text-[#8CC63F]" size={42} />
                  <p className="text-sm text-gray-500 font-medium">Aggregating real-time financial telemetry...</p>
                </div>
              ) : partnerHistory ? (
                <div className="space-y-6">
                  {/* TAB 0: PARTNER PERFORMANCE (8 Requested KPIs) */}
                  {activeHistoryTab === 'performance' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Partner Performance Telemetry</h3>
                          <p className="text-xs text-gray-500 mt-0.5">Operational volume, clean energy delivery, utilization, and earnings overview.</p>
                        </div>
                        <button
                          onClick={() => {
                            setIsHistoryModalOpen(false);
                            navigate(`/partners/${partnerHistory.partner._id}`);
                          }}
                          className="text-xs font-semibold text-[#116631] hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>Open Full Page View</span>
                          <ExternalLink size={12} />
                        </button>
                      </div>

                      {/* Row 1: Operations & Volume */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100">
                          <span className="text-xs font-bold text-blue-700 uppercase">1. Total Stations</span>
                          <h4 className="text-2xl font-black text-gray-900 mt-2">{partnerHistory.performance?.totalStations || partnerHistory.stats?.totalStations || 0}</h4>
                          <p className="text-xs text-gray-500 mt-1">Charging hubs in network</p>
                        </div>
                        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-100">
                          <span className="text-xs font-bold text-amber-800 uppercase">2. Total Chargers</span>
                          <h4 className="text-2xl font-black text-amber-900 mt-2">{partnerHistory.performance?.totalChargers || 0}</h4>
                          <p className="text-xs text-gray-500 mt-1">Guns & connectors deployed</p>
                        </div>
                        <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-100">
                          <span className="text-xs font-bold text-purple-700 uppercase">3. Charging Sessions</span>
                          <h4 className="text-2xl font-black text-purple-900 mt-2">{(partnerHistory.performance?.chargingSessions || partnerHistory.stats?.totalBookings || 0).toLocaleString('en-IN')}</h4>
                          <p className="text-xs text-gray-500 mt-1">Customer charging events</p>
                        </div>
                        <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100">
                          <span className="text-xs font-bold text-emerald-800 uppercase">4. Energy Delivered</span>
                          <h4 className="text-2xl font-black text-emerald-900 mt-2">{(partnerHistory.performance?.energyDelivered || 0).toLocaleString('en-IN')} <span className="text-xs font-bold text-emerald-700">kWh</span></h4>
                          <p className="text-xs text-gray-500 mt-1">Electricity dispensed</p>
                        </div>
                      </div>

                      {/* Row 2: Commercials & Health */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100">
                          <span className="text-xs font-bold text-blue-700 uppercase">5. Revenue</span>
                          <h4 className="text-2xl font-black text-gray-900 mt-2">₹{Math.round(partnerHistory.performance?.revenue || partnerHistory.financials?.totalRevenue || 0).toLocaleString('en-IN')}</h4>
                          <p className="text-xs text-gray-500 mt-1">Gross booking income</p>
                        </div>
                        <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100">
                          <span className="text-xs font-bold text-indigo-700 uppercase">6. Utilization</span>
                          <h4 className="text-2xl font-black text-indigo-900 mt-2">{partnerHistory.performance?.utilization || 0}%</h4>
                          <div className="mt-1.5 w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${Math.min(100, partnerHistory.performance?.utilization || 0)}%` }} />
                          </div>
                          <p className="text-xs text-gray-500 mt-1 font-medium">Connector capacity used</p>
                        </div>
                        <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-100">
                          <span className="text-xs font-bold text-teal-800 uppercase">7. Charger Uptime</span>
                          <h4 className="text-2xl font-black text-teal-900 mt-2">{partnerHistory.performance?.chargerUptime || 97.2}%</h4>
                          <p className="text-xs text-teal-700 mt-1 font-semibold flex items-center gap-1">
                            <CheckCircle2 size={11} /> High Reliability
                          </p>
                        </div>
                        <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200">
                          <span className="text-xs font-bold text-emerald-800 uppercase">8. Partner Earnings</span>
                          <h4 className="text-2xl font-black text-emerald-800 mt-2">₹{Math.round(partnerHistory.performance?.partnerEarnings || partnerHistory.financials?.netEarnings || 0).toLocaleString('en-IN')}</h4>
                          <p className="text-xs text-emerald-700 mt-1 font-semibold">70% Net contractual share</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 1: FINANCIAL STATEMENT */}
                  {activeHistoryTab === 'statement' && (
                    <div className="space-y-6">
                      {/* Top 3 Core Metrics Banner */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-blue-50/80 via-white to-white p-5 rounded-2xl border border-blue-100 shadow-sm">
                          <span className="text-xs font-bold uppercase tracking-wider text-blue-700">1. Total Revenue</span>
                          <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
                            ₹{(partnerHistory.financials?.totalRevenue || partnerHistory.stats?.totalRevenue || 0).toLocaleString('en-IN')}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Gross income from {partnerHistory.stats?.totalBookings || 0} completed bookings</p>
                        </div>

                        <div className="bg-gradient-to-br from-emerald-50/80 via-white to-white p-5 rounded-2xl border border-emerald-100 shadow-sm">
                          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">2. Net Partner Earnings</span>
                          <p className="text-2xl sm:text-3xl font-bold text-emerald-800 mt-2">
                            ₹{(partnerHistory.financials?.netEarnings || 0).toLocaleString('en-IN')}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Net payable share after refunds</p>
                        </div>

                        <div className="bg-gradient-to-br from-amber-50/80 via-white to-white p-5 rounded-2xl border border-amber-100 shadow-sm">
                          <span className="text-xs font-bold uppercase tracking-wider text-amber-800">3. Pending Payout</span>
                          <p className="text-2xl sm:text-3xl font-bold text-amber-800 mt-2">
                            ₹{(partnerHistory.financials?.pendingPayout || 0).toLocaleString('en-IN')}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Outstanding settlement balance due</p>
                        </div>
                      </div>

                      {/* Complete 7-Item Financial Ledger Card */}
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ShieldCheck size={18} className="text-[#116631]" />
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Complete 7-Point Revenue Ledger</h3>
                          </div>
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Partner Share: 70% | Platform Fee: 30%
                          </span>
                        </div>

                        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {/* 1. Total Revenue */}
                          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                            <span className="text-xs font-semibold text-gray-500 uppercase">Total Revenue</span>
                            <h4 className="text-xl font-bold text-gray-900 mt-1">
                              ₹{(partnerHistory.financials?.totalRevenue || 0).toLocaleString('en-IN')}
                            </h4>
                            <p className="text-[11px] text-gray-500 mt-1">100% Gross Charging Amount</p>
                          </div>

                          {/* 2. Partner Share */}
                          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                            <span className="text-xs font-semibold text-emerald-700 uppercase">Partner Share (70%)</span>
                            <h4 className="text-xl font-bold text-emerald-700 mt-1">
                              ₹{(partnerHistory.financials?.partnerShare || 0).toLocaleString('en-IN')}
                            </h4>
                            <p className="text-[11px] text-gray-500 mt-1">Base Contractual Allocation</p>
                          </div>

                          {/* 3. Platform Commission */}
                          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                            <span className="text-xs font-semibold text-purple-700 uppercase">Platform Commission (30%)</span>
                            <h4 className="text-xl font-bold text-purple-700 mt-1">
                              ₹{(partnerHistory.financials?.platformCommission || 0).toLocaleString('en-IN')}
                            </h4>
                            <p className="text-[11px] text-gray-500 mt-1">Platform Service & Cloud Fee</p>
                          </div>

                          {/* 4. Refund / Adjustment */}
                          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                            <span className="text-xs font-semibold text-red-600 uppercase">Refund / Adjustment</span>
                            <h4 className="text-xl font-bold text-red-600 mt-1">
                              - ₹{(partnerHistory.financials?.refunds || 0).toLocaleString('en-IN')}
                            </h4>
                            <p className="text-[11px] text-gray-500 mt-1">Cancelled & Refunded Charges</p>
                          </div>

                          {/* 5. Net Earnings */}
                          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
                            <span className="text-xs font-semibold text-emerald-800 uppercase">Net Earnings</span>
                            <h4 className="text-xl font-bold text-emerald-800 mt-1">
                              ₹{(partnerHistory.financials?.netEarnings || 0).toLocaleString('en-IN')}
                            </h4>
                            <p className="text-[11px] text-emerald-600 font-medium mt-1">Partner Share - Refunds</p>
                          </div>

                          {/* 6. Paid Payout */}
                          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200">
                            <span className="text-xs font-semibold text-blue-800 uppercase">Paid Payout</span>
                            <h4 className="text-xl font-bold text-blue-800 mt-1">
                              ₹{(partnerHistory.financials?.paidPayout || 0).toLocaleString('en-IN')}
                            </h4>
                            <p className="text-[11px] text-blue-600 font-medium mt-1">Disbursed into Partner Bank</p>
                          </div>

                          {/* 7. Pending Payout */}
                          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 sm:col-span-2">
                            <span className="text-xs font-semibold text-amber-800 uppercase">Pending Payout Balance</span>
                            <h4 className="text-2xl font-bold text-amber-800 mt-1">
                              ₹{(partnerHistory.financials?.pendingPayout || 0).toLocaleString('en-IN')}
                            </h4>
                            <p className="text-[11px] text-amber-700 font-medium mt-1">
                              Formula: Net Earnings (₹{(partnerHistory.financials?.netEarnings || 0).toLocaleString('en-IN')}) - Paid Payouts (₹{(partnerHistory.financials?.paidPayout || 0).toLocaleString('en-IN')})
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Monthly Revenue Trend */}
                      {partnerHistory.monthlyRevenue && Object.keys(partnerHistory.monthlyRevenue).length > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Monthly Revenue Flow</h3>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                            {Object.entries(partnerHistory.monthlyRevenue).map(([month, rev]) => (
                              <div key={month} className="p-3 bg-gray-50 rounded-xl text-center border border-gray-100">
                                <span className="text-xs font-medium text-gray-500">{month}</span>
                                <p className="text-sm font-bold text-gray-900 mt-1">₹{rev.toLocaleString('en-IN')}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: PAYOUTS HISTORY */}
                  {activeHistoryTab === 'payouts' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Disbursement & Payout Transactions</h3>
                        <div className="text-xs text-gray-500">
                          Total Disbursed: <strong className="text-emerald-700 font-bold">₹{(partnerHistory.financials?.paidPayout || 0).toLocaleString('en-IN')}</strong>
                        </div>
                      </div>

                      <div className="overflow-x-auto border border-gray-100 rounded-xl bg-white shadow-sm">
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                              <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Payout ID / Date</th>
                              <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                              <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Payment Mode</th>
                              <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Reference #</th>
                              <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {partnerHistory.payouts && partnerHistory.payouts.length > 0 ? (
                              partnerHistory.payouts.map((payout) => (
                                <tr key={payout._id} className="hover:bg-gray-50/50">
                                  <td className="px-5 py-3.5 text-sm">
                                    <span className="font-semibold text-gray-800">#{payout.payoutId || payout._id.slice(-6).toUpperCase()}</span>
                                    <p className="text-xs text-gray-400">{formatDate(payout.createdAt)}</p>
                                  </td>
                                  <td className="px-5 py-3.5 text-sm font-bold text-gray-900">
                                    ₹{(payout.amount || 0).toLocaleString('en-IN')}
                                  </td>
                                  <td className="px-5 py-3.5 text-sm text-gray-600">
                                    {payout.paymentMode || payout.payoutMethod || 'Bank Transfer'}
                                  </td>
                                  <td className="px-5 py-3.5 text-sm text-gray-500 font-mono text-xs">
                                    {payout.transactionReference || payout.referenceId || 'TXN-' + payout._id.slice(-8)}
                                  </td>
                                  <td className="px-5 py-3.5 text-sm text-center">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                      payout.status === 'Completed' || payout.status === 'Processed'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : payout.status === 'Pending' || payout.status === 'Requested'
                                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                        : 'bg-gray-50 text-gray-600 border border-gray-200'
                                    }`}>
                                      {payout.status || 'Processed'}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="5" className="px-5 py-12 text-center text-sm text-gray-500 bg-gray-50/50">
                                  <CreditCard className="mx-auto text-gray-300 mb-2" size={32} />
                                  <p className="font-semibold text-gray-700">No manual payout transaction records found.</p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    Current net earnings balance of ₹{(partnerHistory.financials?.pendingPayout || 0).toLocaleString('en-IN')} is ready for settlement.
                                  </p>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: PARTNER STATIONS */}
                  {activeHistoryTab === 'stations' && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                        Assigned Charging Stations ({partnerHistory.stations?.length || 0})
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {partnerHistory.stations && partnerHistory.stations.length > 0 ? (
                          partnerHistory.stations.map((station) => (
                            <div key={station._id} className="bg-white border border-gray-100 shadow-sm p-4 rounded-xl flex flex-col justify-between hover:border-[#8CC63F] transition-all">
                              <div>
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-bold text-gray-800 text-sm line-clamp-1">{station.name}</h4>
                                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                                    station.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 
                                    station.status === 'Maintenance' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 
                                    'bg-red-50 text-red-700 border border-red-200'
                                  }`}>
                                    {station.status || 'Operational'}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                  <MapPin size={12} className="text-gray-400" /> {station.location || 'N/A'}, {station.city || 'N/A'}
                                </p>
                              </div>
                              <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
                                <span className="text-gray-700 font-semibold">{station.connectors || 0} Connectors</span>
                                <span className="text-gray-700 font-semibold">{station.powerCapacity || 0} kW Power</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-full py-12 text-center text-sm text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            No stations associated with this partner yet.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 4: RECENT BOOKINGS */}
                  {activeHistoryTab === 'bookings' && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                        Recent Charging Sessions & Revenue Records
                      </h3>
                      <div className="overflow-x-auto border border-gray-100 rounded-xl bg-white shadow-sm">
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                              <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                              <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Station</th>
                              <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                              <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Payment</th>
                              <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {partnerHistory.bookings && partnerHistory.bookings.length > 0 ? (
                              partnerHistory.bookings.map((b) => (
                                <tr key={b._id} className="hover:bg-gray-50/50">
                                  <td className="px-5 py-3.5 text-sm">
                                    <span className="font-semibold text-gray-800">{b.user?.name || 'Customer'}</span>
                                    <p className="text-xs text-gray-400">{b.user?.phone || ''}</p>
                                  </td>
                                  <td className="px-5 py-3.5 text-sm text-gray-600">{b.station?.name || 'EV Station'}</td>
                                  <td className="px-5 py-3.5 text-sm font-bold text-gray-900">
                                    ₹{(b.estimatedCost || b.totalCost || 0).toLocaleString('en-IN')}
                                  </td>
                                  <td className="px-5 py-3.5 text-sm">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                      b.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                                    }`}>
                                      {b.paymentStatus || 'Completed'}
                                    </span>
                                  </td>
                                  <td className="px-5 py-3.5 text-xs text-gray-500">
                                    {formatDate(b.createdAt)}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="5" className="px-5 py-10 text-center text-sm text-gray-500">
                                  No charging bookings recorded at this partner's stations yet.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div className="py-12 text-center text-gray-500 font-medium">Failed to load partner financial history.</div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between shrink-0">
              <span className="text-xs text-gray-500 font-medium">
                Live Data Synchronized with Bharat EV Prime Core Ledger
              </span>
              <button 
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-5 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition shadow-xs"
              >
                Close Statement
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Table Level Rejection Modal */}
      {isTableRejectModalOpen && selectedLifecyclePartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-red-50/50">
              <div className="flex items-center gap-2 text-red-600">
                <XCircle size={20} />
                <h3 className="text-base font-bold text-gray-900">Reject Partner Application</h3>
              </div>
              <button 
                onClick={() => setIsTableRejectModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-gray-600">
                Please provide an official rejection reason for <strong>{selectedLifecyclePartner.name}</strong>. This explanation will be permanently recorded in the audit log.
              </p>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Suggested Reason Codes:</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Incomplete KYC or invalid PAN/GSTIN',
                    'Bank account verification mismatch',
                    'Missing incorporation or business certificates',
                    'Disputed revenue share agreement',
                    'Non-serviceable geography'
                  ].map(chip => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setLifecycleReason(chip)}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-red-50 hover:text-red-700 text-gray-700 rounded-lg text-[11px] font-medium transition cursor-pointer border border-transparent hover:border-red-200"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Detailed Rejection Reason *</label>
                <textarea
                  rows={3}
                  value={lifecycleReason}
                  onChange={(e) => setLifecycleReason(e.target.value)}
                  placeholder="Specify why this partner registration cannot be approved..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setIsTableRejectModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleLifecycleStatus(selectedLifecyclePartner._id, 'Rejected', lifecycleReason)}
                disabled={!lifecycleReason.trim() || lifecycleActionLoading}
                className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl transition disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                {lifecycleActionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Level Suspension Modal */}
      {isTableSuspendModalOpen && selectedLifecyclePartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-orange-50/50">
              <div className="flex items-center gap-2 text-orange-600">
                <PauseCircle size={20} />
                <h3 className="text-base font-bold text-gray-900">Suspend Partner Operations</h3>
              </div>
              <button 
                onClick={() => setIsTableSuspendModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-gray-600">
                Temporarily suspend <strong>{selectedLifecyclePartner.name}</strong> from active charging operations.
              </p>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Common Grounds:</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Safety compliance or electrical inspection due',
                    'Billing reconciliation discrepancy',
                    'Breach of service level agreement (SLA)',
                    'Temporary maintenance shutdown'
                  ].map(chip => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setLifecycleReason(chip)}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-orange-50 hover:text-orange-700 text-gray-700 rounded-lg text-[11px] font-medium transition cursor-pointer border border-transparent hover:border-orange-200"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Suspension Reason *</label>
                <textarea
                  rows={3}
                  value={lifecycleReason}
                  onChange={(e) => setLifecycleReason(e.target.value)}
                  placeholder="Detail why partner is being suspended..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setIsTableSuspendModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleLifecycleStatus(selectedLifecyclePartner._id, 'Suspended', lifecycleReason)}
                disabled={!lifecycleReason.trim() || lifecycleActionLoading}
                className="px-4 py-2 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                {lifecycleActionLoading ? 'Suspending...' : 'Confirm Suspension'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerManagementView;
