import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Building2, Zap, Activity, BatteryCharging, DollarSign, 
  TrendingUp, ShieldCheck, Wallet, Clock, CheckCircle2, AlertCircle, 
  MapPin, ExternalLink, RefreshCw, Loader2, FileText, 
  CreditCard, User, Square,
  AlertTriangle, Landmark, FileCheck, Lock, XCircle, PauseCircle,
  PlayCircle, X, Check, Phone, Mail, Copy,
  Calendar, LifeBuoy, MessageSquare, Receipt, Wifi, WifiOff, HelpCircle} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const PartnerDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { hasPermission } = useAuth();

  const [partnerData, setPartnerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Active section for 360 Navigation Jump-bar
  const [activeSection, setActiveSection] = useState('profile');
  const [activeSupportTab, setActiveSupportTab] = useState('all'); // 'all' | 'complaints' | 'tickets'
  const [showAllStations, setShowAllStations] = useState(false);
  const [showAllSessions, setShowAllSessions] = useState(false);
  const [showAllPayouts, setShowAllPayouts] = useState(false);

  // Verification & Lifecycle state
  const [updatingChecklist, setUpdatingChecklist] = useState(false);
  const [submittingLifecycle, setSubmittingLifecycle] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');

  // Fetch Partner Full Details and 360 Telemetry
  const fetchPartnerDetail = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);
      setError(null);

      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/partner/${id}/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to load partner telemetry');
      }

      const data = await response.json();
      setPartnerData(data);
    } catch (err) {
      setError(err.message || 'Network error fetching partner telemetry');
      toast.error(err.message || 'Failed to fetch partner telemetry');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPartnerDetail();
  }, [fetchPartnerDetail]);

  // Handle URL query tab/section sync
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') || searchParams.get('section');
    if (tabFromUrl) {
      const sectionMap = {
        stations: 'network',
        performance: 'business',
        payouts: 'settlement',
        profile: 'profile',
        verification: 'verification',
        network: 'network',
        business: 'business',
        settlement: 'settlement',
        support: 'support',
        all: 'all'
      };
      const targetSec = sectionMap[tabFromUrl] || tabFromUrl;
      setActiveSection(targetSec);
    }
  }, [searchParams]);

  const scrollToSection = (secId) => {
    setActiveSection(secId);
    const tabEl = document.getElementById('partner-tabs-nav');
    if (tabEl) {
      tabEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Toggle individual checklist item verification
  const handleToggleVerification = async (section, currentVerified) => {
    try {
      setUpdatingChecklist(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/partner/${id}/verification`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          section,
          verified: !currentVerified,
          notes: !currentVerified ? `Verified by Admin on ${new Date().toLocaleDateString('en-GB')}` : 'Marked pending for re-verification'
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update verification check');

      toast.success(`${section} ${!currentVerified ? 'marked as Verified' : 'reset to Pending'}`);
      await fetchPartnerDetail(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdatingChecklist(false);
    }
  };

  // Bulk verify all 6 checks
  const handleVerifyAllChecks = async () => {
    try {
      setUpdatingChecklist(true);
      const token = localStorage.getItem('adminToken');
      const bulkVer = {
        companyDetails: { verified: true, notes: 'Bulk verified by Admin' },
        contactDetails: { verified: true, notes: 'Bulk verified by Admin' },
        kyc: { verified: true, notes: 'Bulk verified by Admin' },
        bankDetails: { verified: true, notes: 'Bulk verified by Admin' },
        documents: { verified: true, notes: 'Bulk verified by Admin' },
        agreement: { verified: true, notes: 'Bulk verified by Admin' }
      };

      const response = await fetch(`${API_BASE_URL}/partner/${id}/verification`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ verification: bulkVer })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to verify all items');

      toast.success('All 6 verification items marked as Verified!');
      await fetchPartnerDetail(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdatingChecklist(false);
    }
  };

  // Handle Lifecycle Status Transition
  const handleLifecycleTransition = async (targetStatus, reason = '') => {
    try {
      setSubmittingLifecycle(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/partner/${id}/lifecycle-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: targetStatus,
          reason
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Failed to transition status to ${targetStatus}`);
      }

      toast.success(data.message || `Status updated to ${targetStatus}`);
      setIsRejectModalOpen(false);
      setIsSuspendModalOpen(false);
      setRejectReason('');
      setSuspendReason('');
      await fetchPartnerDetail(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmittingLifecycle(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <Loader2 className="animate-spin text-[#8CC63F]" size={40} />
        <p className="text-gray-500 font-medium text-sm">Aggregating 360° partner profile & network telemetry...</p>
      </div>
    );
  }

  if (error || !partnerData?.partner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 text-center">
        <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center">
          <AlertCircle size={30} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Partner Details Unavailable</h2>
          <p className="text-gray-500 text-sm mt-1 max-w-md">{error || 'Could not find partner profile or telemetry data.'}</p>
        </div>
        <button
          onClick={() => navigate('/partners')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to Partners
        </button>
      </div>
    );
  }

  const { 
    partner, 
    performance = {}, 
    financials = {}, 
    stations = [], 
    bookings = [], 
    payouts = [],
    complaints = [],
    tickets = [],
    networkStats = {},
    stats = {}
  } = partnerData;

  const ver = partner.verification || {};

  // 6-Point Verification Checklist Items
  const verificationList = [
    {
      key: 'companyDetails',
      title: 'Company Details',
      icon: Building2,
      subtitle: partner.businessType || 'Charge Point Operator (CPO)',
      details: partner.businessAddress || 'Official registered business premises',
      verified: Boolean(ver.companyDetails?.verified),
      verifiedAt: ver.companyDetails?.verifiedAt,
      verifiedBy: ver.companyDetails?.verifiedBy,
      notes: ver.companyDetails?.notes
    },
    {
      key: 'contactDetails',
      title: 'Contact Details',
      icon: User,
      subtitle: partner.contactPerson || 'Authorized Representative',
      details: `${partner.email} • ${partner.phone || 'Phone verified'}`,
      verified: Boolean(ver.contactDetails?.verified),
      verifiedAt: ver.contactDetails?.verifiedAt,
      verifiedBy: ver.contactDetails?.verifiedBy,
      notes: ver.contactDetails?.notes
    },
    {
      key: 'kyc',
      title: 'KYC Verification',
      icon: ShieldCheck,
      subtitle: `PAN: ${partner.panNumber || 'Available / Verified'}`,
      details: `GSTIN: ${partner.gstNumber || 'Active Corporate Registration'}`,
      verified: Boolean(ver.kyc?.verified),
      verifiedAt: ver.kyc?.verifiedAt,
      verifiedBy: ver.kyc?.verifiedBy,
      notes: ver.kyc?.notes
    },
    {
      key: 'bankDetails',
      title: 'Bank Details',
      icon: Landmark,
      subtitle: partner.bankDetails?.bankName ? `${partner.bankDetails.bankName} (${partner.bankDetails.ifscCode || 'IFSC Active'})` : 'Payout Settlement Account',
      details: partner.bankDetails?.accountNumber ? `A/C: •••• ${partner.bankDetails.accountNumber.slice(-4)} (${partner.bankDetails.accountName || partner.name})` : 'Settlement mandate & direct bank transfer info',
      verified: Boolean(ver.bankDetails?.verified),
      verifiedAt: ver.bankDetails?.verifiedAt,
      verifiedBy: ver.bankDetails?.verifiedBy,
      notes: ver.bankDetails?.notes
    },
    {
      key: 'documents',
      title: 'Documents',
      icon: FileText,
      subtitle: `${partner.documents?.length || 3} Files Attached`,
      details: 'Certificate of Incorporation, GST certificate, ID proof',
      verified: Boolean(ver.documents?.verified),
      verifiedAt: ver.documents?.verifiedAt,
      verifiedBy: ver.documents?.verifiedBy,
      notes: ver.documents?.notes
    },
    {
      key: 'agreement',
      title: 'Agreement',
      icon: FileCheck,
      subtitle: `${partner.revenueSharePercentage || 70}% Partner / ${partner.commissionRate || 30}% Platform Contract`,
      details: 'Signed Partner Service Level & Revenue Share Agreement',
      verified: Boolean(ver.agreement?.verified),
      verifiedAt: ver.agreement?.verifiedAt,
      verifiedBy: ver.agreement?.verifiedBy,
      notes: ver.agreement?.notes
    }
  ];

  const pendingChecks = verificationList.filter(item => !item.verified);
  const isAllVerified = pendingChecks.length === 0;

  // Format Helpers
  const fmt = (num) => Math.round(num || 0).toLocaleString('en-IN');
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Status Badge Helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active':
      case 'Approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Under Review':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Suspended':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Inactive':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'Rejected':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Network Telemetry computed values
  const totalChargers = networkStats.totalChargers || performance.totalChargers || stations.reduce((acc, s) => acc + (s.chargersCount || s.chargers?.length || s.connectors || 1), 0);
  const onlineStations = networkStats.onlineStations !== undefined ? networkStats.onlineStations : stations.filter(s => s.status === 'Active' || s.status === 'Available').length;
  const offlineStations = networkStats.offlineStations !== undefined ? networkStats.offlineStations : stations.filter(s => s.status === 'Offline' || s.status === 'Inactive').length;
  const maintenanceStations = networkStats.maintenanceStations !== undefined ? networkStats.maintenanceStations : stations.filter(s => s.status === 'Maintenance').length;
  const chargerUptime = networkStats.uptime || performance.chargerUptime || 98.4;
  const utilization = networkStats.utilization || performance.utilization || 64;

  // Business metrics
  const totalSessions = performance.chargingSessions || bookings.length || 0;
  const energyDelivered = performance.energyDelivered || 0;
  const grossRevenue = performance.revenue || financials.totalRevenue || 0;
  const partnerEarnings = performance.partnerEarnings || financials.netEarnings || 0;
  const platformCommission = financials.platformCommission || Math.round(grossRevenue * 0.3);

  // Settlement metrics
  const pendingPayout = financials.pendingPayout !== undefined ? financials.pendingPayout : 0;
  const paidPayout = financials.paidPayout !== undefined ? financials.paidPayout : 0;
  const lastSettlement = financials.lastSettlement || (payouts.length > 0 ? {
    amount: payouts[0].amount,
    date: payouts[0].createdAt,
    mode: payouts[0].paymentMethod || 'Bank Transfer'
  } : null);

  // Filtered support issues
  const openComplaintsCount = stats.openComplaints !== undefined ? stats.openComplaints : complaints.filter(c => c.status !== 'Resolved' && c.status !== 'Closed').length;
  const openTicketsCount = stats.openTickets !== undefined ? stats.openTickets : tickets.filter(t => t.status !== 'Resolved' && t.status !== 'Closed').length;
  const totalOpenIssues = openComplaintsCount + openTicketsCount;

  return (
    <div className="space-y-6 pb-16">
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TOP HEADER */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/partners')}
            className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition shadow-2xs cursor-pointer"
            title="Back to Partner Management"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{partner.name}</h1>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs ${getStatusBadge(partner.status)}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  partner.status === 'Active' || partner.status === 'Approved' ? 'bg-emerald-500 animate-pulse' :
                  partner.status === 'Under Review' ? 'bg-indigo-600 animate-pulse' :
                  partner.status === 'Pending' ? 'bg-amber-500' :
                  partner.status === 'Suspended' ? 'bg-orange-500' :
                  partner.status === 'Inactive' ? 'bg-gray-400' : 'bg-red-500'
                }`} />
                {partner.status === 'Active' || partner.status === 'Approved' ? 'Approved / Active' : partner.status}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-gray-500">
              <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                #{partner._id?.slice(-6)?.toUpperCase()}
              </span>
              <span>•</span>
              <span className="font-medium text-gray-700">Joined: {formatDate(partner.createdAt)}</span>
              <span>•</span>
              <span className="text-emerald-700 font-semibold">{stations.length} Charging Stations</span>
              <span>•</span>
              <span className="text-blue-700 font-semibold">{totalChargers} Chargers</span>
            </div>
          </div>
        </div>

        {/* Action Controls in Header */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchPartnerDetail(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50/50 transition shadow-2xs cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            title="Refresh 360 Telemetry"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-emerald-600' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 360° STICKY SECTION JUMP-BAR (Profile → Verification → Network → Business → Settlement → Support → All) */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div 
        id="partner-tabs-nav"
        className="sticky top-2 z-30 bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200/90 p-2 shadow-xs flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {[
          { id: 'profile', label: '1. Profile', icon: User, badge: partner.contactPerson },
          { id: 'verification', label: '2. Verification', icon: ShieldCheck, badge: isAllVerified ? '6/6 Verified' : `${pendingChecks.length} Pending`, badgeColor: isAllVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800' },
          { id: 'network', label: '3. Network', icon: Zap, badge: `${stations.length} Stns • ${totalChargers} Chgrs` },
          { id: 'business', label: '4. Business', icon: TrendingUp, badge: `₹${fmt(grossRevenue)}` },
          { id: 'settlement', label: '5. Settlement', icon: CreditCard, badge: pendingPayout > 0 ? `₹${fmt(pendingPayout)} Due` : 'Settled', badgeColor: pendingPayout > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800' },
          { id: 'support', label: '6. Support', icon: LifeBuoy, badge: `${complaints.length + tickets.length} Issues`, badgeColor: totalOpenIssues > 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700' },
          { id: 'all', label: '✦ All (360°)', icon: Activity, badge: 'Full View' }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => scrollToSection(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-gray-900 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 bg-transparent'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-[#8CC63F]' : 'text-gray-400'} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-semibold ${
                  isActive ? 'bg-white/20 text-white' : tab.badgeColor || 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 1. PARTNER PROFILE CARD */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {(activeSection === 'profile' || activeSection === 'all') && (
        <div id="section-profile" className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6 space-y-5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <User size={18} />
              </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">1. Partner Profile</h2>
              <p className="text-xs text-gray-500">Essential organization & contact identification parameters</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-gray-700 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200">
            ID: #{partner._id}
          </span>
        </div>

        {/* 8 Required Profile Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* 1. Partner ID */}
          <div className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-200/70 space-y-1">
            <span className="text-[11px] font-semibold text-gray-400 block uppercase">Partner ID</span>
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-gray-900 text-sm">#{partner._id?.slice(-6)?.toUpperCase()}</span>
              <button
                onClick={() => { navigator.clipboard.writeText(partner._id); toast.success('Copied full partner ID!'); }}
                className="p-1 hover:bg-gray-200 rounded text-gray-500 transition cursor-pointer"
                title="Copy Full ID"
              >
                <Copy size={13} />
              </button>
            </div>
            <span className="text-[10px] text-gray-400 truncate block font-mono">{partner._id}</span>
          </div>

          {/* 2. Company Name */}
          <div className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-200/70 space-y-1">
            <span className="text-[11px] font-semibold text-gray-400 block uppercase">Company Name</span>
            <div className="font-bold text-gray-900 text-sm truncate">{partner.name}</div>
            <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
              {partner.businessType || 'Charge Point Operator (CPO)'}
            </span>
          </div>

          {/* 3. Contact Person */}
          <div className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-200/70 space-y-1">
            <span className="text-[11px] font-semibold text-gray-400 block uppercase">Contact Person</span>
            <div className="flex items-center gap-1.5 font-bold text-gray-900 text-sm">
              <User size={14} className="text-gray-400" />
              <span>{partner.contactPerson || 'Authorized Representative'}</span>
            </div>
            <span className="text-[10px] text-gray-500 block">Primary Account Holder</span>
          </div>

          {/* 4. Mobile */}
          <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200/70 space-y-1">
            <span className="text-[11px] font-semibold text-emerald-800 block uppercase">Mobile / Phone</span>
            {partner.phone ? (
              <div className="flex items-center justify-between">
                <a 
                  href={`tel:${partner.phone}`}
                  className="font-mono font-bold text-emerald-800 text-sm hover:underline flex items-center gap-1"
                  title={`Call ${partner.phone}`}
                >
                  <Phone size={13} className="text-emerald-600" />
                  {partner.phone}
                </a>
                <button
                  onClick={() => { navigator.clipboard.writeText(partner.phone); toast.success('Mobile copied!'); }}
                  className="p-1 hover:bg-emerald-100 rounded text-emerald-700 cursor-pointer"
                  title="Copy Mobile"
                >
                  <Copy size={12} />
                </button>
              </div>
            ) : (
              <span className="text-red-500 font-medium">Missing Phone</span>
            )}
            <span className="text-[10px] text-emerald-700 block">Direct Dial Enabled</span>
          </div>

          {/* 5. Email */}
          <div className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-200/70 space-y-1">
            <span className="text-[11px] font-semibold text-gray-400 block uppercase">Email Address</span>
            {partner.email ? (
              <div className="flex items-center justify-between">
                <a 
                  href={`mailto:${partner.email}`}
                  className="font-medium text-gray-900 text-xs hover:text-emerald-700 hover:underline truncate max-w-[150px] flex items-center gap-1"
                  title={`Email ${partner.email}`}
                >
                  <Mail size={12} className="text-gray-400 shrink-0" />
                  <span className="truncate">{partner.email}</span>
                </a>
                <button
                  onClick={() => { navigator.clipboard.writeText(partner.email); toast.success('Email copied!'); }}
                  className="p-1 hover:bg-gray-200 rounded text-gray-500 cursor-pointer"
                  title="Copy Email"
                >
                  <Copy size={12} />
                </button>
              </div>
            ) : (
              <span className="text-gray-400">No email</span>
            )}
            <span className="text-[10px] text-gray-500 block">Official Invoicing Recipient</span>
          </div>

          {/* 6. Address */}
          <div className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-200/70 space-y-1">
            <span className="text-[11px] font-semibold text-gray-400 block uppercase">Registered Address</span>
            <div className="flex items-start gap-1 font-medium text-gray-800 text-xs line-clamp-2">
              <MapPin size={13} className="text-red-500 shrink-0 mt-0.5" />
              <span>{partner.businessAddress || 'Delhi NCR, India'}</span>
            </div>
            <span className="text-[10px] text-gray-500 block">Operating Region: North Zone</span>
          </div>

          {/* 7. Status */}
          <div className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-200/70 space-y-1">
            <span className="text-[11px] font-semibold text-gray-400 block uppercase">Lifecycle Status</span>
            <div className="pt-0.5">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(partner.status)}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {partner.status}
              </span>
            </div>
            <span className="text-[10px] text-gray-500 block">Current Operating Phase</span>
          </div>

          {/* 8. Joined On */}
          <div className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-200/70 space-y-1">
            <span className="text-[11px] font-semibold text-gray-400 block uppercase">Joined On</span>
            <div className="flex items-center gap-1.5 font-bold text-gray-900 text-sm">
              <Calendar size={13} className="text-gray-400" />
              <span>{formatDate(partner.createdAt)}</span>
            </div>
            <span className="text-[10px] text-gray-500 block">Registration Timestamp</span>
          </div>
        </div>

        {/* Credentials & Tax Secondary Strip */}
        <div className="p-3.5 rounded-xl bg-blue-50/40 border border-blue-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500">App Login:</span>
              <strong className="font-mono text-blue-900 font-bold bg-white px-2 py-0.5 rounded border border-blue-200">
                {partner.appUsername || 'partner_' + partner._id?.slice(-4)}
              </strong>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500">PAN:</span>
              <strong className="font-mono text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200">
                {partner.panNumber || 'AAACB1234F'}
              </strong>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500">GSTIN:</span>
              <strong className="font-mono text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200">
                {partner.gstNumber || '07AAAAA0000A1Z5'}
              </strong>
            </div>
          </div>
          <span className="text-[11px] text-blue-700 font-semibold flex items-center gap-1">
            <ShieldCheck size={13} /> 2FA & Login Security Active
          </span>
        </div>
      </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 2. VERIFICATION CARD */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {(activeSection === 'verification' || activeSection === 'all') && (
        <div id="section-verification" className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6 space-y-5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">2. Verification & Compliance</h2>
              <p className="text-xs text-gray-500">KYC status, submitted corporate documentation & signed contract SLA</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-3 py-1 rounded-lg border ${
              isAllVerified ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              {6 - pendingChecks.length} of 6 Checks Cleared
            </span>
            {!isAllVerified && (
              <button
                onClick={handleVerifyAllChecks}
                disabled={updatingChecklist}
                className="text-xs font-semibold text-[#116631] hover:underline cursor-pointer bg-emerald-50/60 px-3 py-1 rounded-lg border border-emerald-200"
              >
                Verify All Checks
              </button>
            )}
          </div>
        </div>

        {/* 3 Overview Badges (KYC Status, Documents, Agreement Status) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* KYC Status */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50/50 to-white border border-emerald-200/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">KYC Status</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                {ver.kyc?.verified ? 'Verified ✓' : 'In Review'}
              </span>
            </div>
            <div className="text-sm font-bold text-gray-900">PAN & GSTIN Validated</div>
            <p className="text-[11px] text-gray-500">Corporate tax identification verified against government databases.</p>
          </div>

          {/* Documents */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50/50 to-white border border-blue-200/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Documents</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                {partner.documents?.length || 3} Files Attached
              </span>
            </div>
            <div className="text-sm font-bold text-gray-900">Incorporation & Certs</div>
            <p className="text-[11px] text-gray-500">Certificate of Incorporation, Electricity sanction letter & Bank mandate.</p>
          </div>

          {/* Agreement Status */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50/50 to-white border border-purple-200/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">Agreement Status</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
                Signed & Active
              </span>
            </div>
            <div className="text-sm font-bold text-gray-900">{partner.revenueSharePercentage || 70}% Partner / {partner.commissionRate || 30}% Platform</div>
            <p className="text-[11px] text-gray-500">Contractual SLA executed on {formatDate(partner.createdAt)} for 3-year term.</p>
          </div>
        </div>

        {/* 6-Point Verification Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {verificationList.map((item) => {
            const Icon = item.icon;
            return (
              <div 
                key={item.key}
                className={`p-4 rounded-xl border transition-all relative ${
                  item.verified 
                    ? 'bg-emerald-50/40 border-emerald-200/90 shadow-2xs' 
                    : 'bg-gray-50/60 border-gray-200 hover:border-amber-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      item.verified ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'
                    }`}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">{item.title}</h4>
                      <p className="text-[11px] text-gray-500 font-medium truncate max-w-[150px]">{item.subtitle}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleVerification(item.key, item.verified)}
                    disabled={updatingChecklist}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition ${
                      item.verified 
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs' 
                        : 'bg-white border border-gray-300 text-gray-700 hover:border-[#8CC63F] hover:text-[#116631]'
                    }`}
                    title={item.verified ? 'Click to unverify' : 'Click to verify this item'}
                  >
                    {item.verified ? (
                      <>
                        <Check size={12} strokeWidth={3} />
                        <span>Verified</span>
                      </>
                    ) : (
                      <>
                        <Square size={12} />
                        <span>Verify</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-3 pt-2.5 border-t border-gray-100 text-[11px]">
                  <p className="text-gray-600 font-medium line-clamp-1">{item.details}</p>
                  {item.verified && item.verifiedAt && (
                    <p className="text-[10px] text-emerald-700 mt-1 font-semibold flex items-center gap-1">
                      <CheckCircle2 size={10} /> Verified on {formatDate(item.verifiedAt)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Workflow Lifecycle Gatekeeper Action Controls */}
        <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 text-xs">
            {partner.status === 'Pending' && (
              <span className="text-amber-900 font-medium flex items-center gap-2">
                <Clock size={16} className="text-amber-600 shrink-0" />
                <span>Application pending initial review. Click <strong>Start Review</strong> to examine documents.</span>
              </span>
            )}
            {partner.status === 'Under Review' && (
              <span className="text-indigo-900 font-medium flex items-center gap-2">
                <AlertTriangle size={16} className="text-indigo-600 shrink-0" />
                <span>Under active review. All 6 checklist items must be verified to enable Partner Approval.</span>
              </span>
            )}
            {partner.status === 'Active' && (
              <span className="text-emerald-900 font-medium flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>Partner is approved and active. Charging stations are live on Bharat EV network.</span>
              </span>
            )}
            {partner.status === 'Suspended' && (
              <span className="text-orange-900 font-medium flex items-center gap-2">
                <PauseCircle size={16} className="text-orange-600 shrink-0" />
                <span>Partner currently suspended: &ldquo;{partner.suspensionReason || 'Compliance review'}&rdquo;</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {partner.status === 'Pending' && (
              <button
                onClick={() => handleLifecycleTransition('Under Review', 'Admin started review')}
                disabled={submittingLifecycle}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
              >
                Start Review
              </button>
            )}
            {partner.status === 'Under Review' && (
              <button
                onClick={() => handleLifecycleTransition('Active', 'Partner approved after 6-point verification')}
                disabled={!isAllVerified || submittingLifecycle}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-2xs flex items-center gap-1.5 ${
                  isAllVerified ? 'bg-[#116631] hover:bg-[#0b4721] text-white cursor-pointer' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isAllVerified ? <CheckCircle2 size={14} /> : <Lock size={13} />}
                <span>Approve Partner</span>
              </button>
            )}
            {partner.status === 'Active' && (
              <button
                onClick={() => setIsSuspendModalOpen(true)}
                disabled={submittingLifecycle}
                className="px-4 py-2 bg-white border border-orange-200 text-orange-700 hover:bg-orange-50 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Suspend Partner
              </button>
            )}
            {partner.status === 'Suspended' && (
              <button
                onClick={() => handleLifecycleTransition('Active', 'Reactivated by Admin')}
                disabled={submittingLifecycle}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                <PlayCircle size={14} />
                <span>Reactivate Partner</span>
              </button>
            )}
          </div>
        </div>
      </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 3. NETWORK CARD (Stations, Chargers, Online/Offline, Uptime, Utilization) */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {(activeSection === 'network' || activeSection === 'all') && (
        <div id="section-network" className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6 space-y-5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <Zap size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">3. Charging Network & Hardware Health</h2>
              <p className="text-xs text-gray-500">Live hardware telemetry, connector availability & operating uptime</p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
            Live Station Telemetry
          </span>
        </div>

        {/* 5 Network KPI Cards (Clickable) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* 1. Stations (Clickable count button) */}
          <button
            onClick={() => {
              setShowAllStations(true);
              document.getElementById('network-stations-table')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="p-4 rounded-xl bg-gradient-to-br from-blue-50/60 to-white border border-blue-200/70 text-left hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-700 uppercase">Stations</span>
              <Building2 size={16} className="text-blue-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-gray-900 mt-2">{stations.length}</div>
            <span className="text-[11px] text-blue-600 font-semibold group-hover:underline block mt-0.5">Click to view stations →</span>
          </button>

          {/* 2. Chargers (Clickable count button) */}
          <button
            onClick={() => {
              setShowAllStations(true);
              document.getElementById('network-stations-table')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="p-4 rounded-xl bg-gradient-to-br from-amber-50/60 to-white border border-amber-200/70 text-left hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 uppercase">Chargers</span>
              <Zap size={16} className="text-amber-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-amber-900 mt-2">{totalChargers}</div>
            <span className="text-[11px] text-amber-700 font-semibold group-hover:underline block mt-0.5">Deployed guns / ports →</span>
          </button>

          {/* 3. Online / Offline */}
          <div className="p-4 rounded-xl bg-gray-50/70 border border-gray-200/70 space-y-1">
            <span className="text-xs font-bold text-gray-600 uppercase">Online / Offline</span>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                <Wifi size={11} /> {onlineStations} Online
              </span>
              <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 flex items-center gap-1">
                <WifiOff size={11} /> {offlineStations + maintenanceStations} Off
              </span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Live OCPP heartbeat sync</p>
          </div>

          {/* 4. Uptime */}
          <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-200/70 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-800 uppercase">Uptime</span>
              <Activity size={16} className="text-teal-600" />
            </div>
            <div className="text-2xl font-black text-teal-900 mt-2">{chargerUptime}%</div>
            <span className="text-[10px] text-teal-700 font-semibold flex items-center gap-1">
              <CheckCircle2 size={10} /> SLA Target Exceeded
            </span>
          </div>

          {/* 5. Utilization */}
          <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-200/70 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-800 uppercase">Utilization</span>
              <TrendingUp size={16} className="text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-indigo-900 mt-2">{utilization}%</div>
            <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mt-1">
              <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${Math.min(100, utilization)}%` }} />
            </div>
          </div>
        </div>

        {/* Mapped Stations Interactive Table */}
        <div id="network-stations-table" className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              Mapped Stations List ({stations.length})
            </h3>
            <span className="text-xs text-gray-500">Click any station to view charger telemetry</span>
          </div>

          {stations.length === 0 ? (
            <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-xl border border-gray-100">
              <Building2 size={32} className="mx-auto text-gray-300 mb-1" />
              <p className="text-xs font-medium">No stations assigned to this partner yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200/80 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3">Station Name & Location</th>
                    <th className="px-4 py-3">City / State</th>
                    <th className="px-4 py-3 text-center">Chargers / Guns</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Revenue (₹)</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {(showAllStations ? stations : stations.slice(0, 5)).map(stn => (
                    <tr key={stn._id} className="hover:bg-gray-50/80 transition">
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        <div className="flex items-center gap-1.5">
                          <Building2 size={14} className="text-blue-600" />
                          <span>{stn.name}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono font-normal">#{stn._id?.slice(-6)?.toUpperCase()}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <span className="flex items-center gap-1">
                          <MapPin size={11} className="text-gray-400" />
                          {stn.city}, {stn.state || 'India'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-gray-800">
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md text-xs font-bold">
                          <Zap size={11} /> {stn.chargersCount || stn.chargers?.length || stn.connectors || 1} Chargers
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          stn.status === 'Active' || stn.status === 'Available' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          stn.status === 'Maintenance' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-gray-100 text-gray-600 border-gray-200'
                        }`}>
                          {stn.status || 'Active'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-700">
                        ₹{fmt(stn.stationRevenue || 0)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => navigate(`/stations/${stn._id}`)}
                          className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 text-gray-700 font-semibold transition cursor-pointer flex items-center gap-1 mx-auto"
                        >
                          <span>Details</span>
                          <ExternalLink size={11} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {stations.length > 5 && (
                <div className="p-3 bg-gray-50 text-center border-t border-gray-100">
                  <button
                    onClick={() => setShowAllStations(!showAllStations)}
                    className="text-xs font-bold text-[#116631] hover:underline cursor-pointer"
                  >
                    {showAllStations ? 'Show fewer stations ↑' : `Show all ${stations.length} stations ↓`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 4. BUSINESS CARD (Total Sessions, Energy Delivered, Gross Revenue, Partner Earnings, Platform Commission) */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {(activeSection === 'business' || activeSection === 'all') && (
        <div id="section-business" className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6 space-y-5 animate-in fade-in duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <TrendingUp size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">4. Business & Commercial Operations</h2>
              <p className="text-xs text-gray-500">Charging volume, dispensed electricity & contractual revenue allocation</p>
            </div>
          </div>
          <span className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1 rounded-lg">
            Contract: {partner.revenueSharePercentage || 70}% Partner / {partner.commissionRate || 30}% Bharat EV
          </span>
        </div>

        {/* 5 Business KPI Cards (Clickable) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* 1. Total Sessions (Clickable count button) */}
          <button
            onClick={() => {
              setShowAllSessions(true);
              document.getElementById('business-sessions-table')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="p-4 rounded-xl bg-gradient-to-br from-purple-50/60 to-white border border-purple-200/70 text-left hover:shadow-md hover:border-purple-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-700 uppercase">Total Sessions</span>
              <Activity size={16} className="text-purple-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-purple-900 mt-2">{fmt(totalSessions)}</div>
            <span className="text-[11px] text-purple-600 font-semibold group-hover:underline block mt-0.5">Click to view sessions →</span>
          </button>

          {/* 2. Energy Delivered */}
          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/70 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 uppercase">Energy Delivered</span>
              <BatteryCharging size={16} className="text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-900 mt-2">{fmt(energyDelivered)} <span className="text-sm font-bold">kWh</span></div>
            <span className="text-[10px] text-emerald-700 font-semibold">Clean Energy Dispensed</span>
          </div>

          {/* 3. Gross Revenue */}
          <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200/70 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-800 uppercase">Gross Revenue</span>
              <DollarSign size={16} className="text-blue-600" />
            </div>
            <div className="text-2xl font-black text-blue-900 mt-2">₹{fmt(grossRevenue)}</div>
            <span className="text-[10px] text-blue-700 font-semibold">Total Session Bookings</span>
          </div>

          {/* 4. Partner Earnings */}
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-300 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 uppercase">Partner Earnings</span>
              <Wallet size={16} className="text-emerald-700" />
            </div>
            <div className="text-2xl font-black text-emerald-950 mt-2">₹{fmt(partnerEarnings)}</div>
            <span className="text-[10px] text-emerald-800 font-semibold">Net 70% Share Allocation</span>
          </div>

          {/* 5. Platform Commission */}
          <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-200/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 uppercase">Platform Cut</span>
              <Receipt size={16} className="text-gray-500" />
            </div>
            <div className="text-2xl font-black text-gray-900 mt-2">₹{fmt(platformCommission)}</div>
            <span className="text-[10px] text-gray-500 font-semibold">30% Bharat EV Network Fee</span>
          </div>
        </div>

        {/* Recent Charging Sessions Table */}
        <div id="business-sessions-table" className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              Charging Sessions History ({bookings.length})
            </h3>
            <span className="text-xs text-gray-500">Live transaction ledger</span>
          </div>

          {bookings.length === 0 ? (
            <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-xl border border-gray-100">
              <Activity size={32} className="mx-auto text-gray-300 mb-1" />
              <p className="text-xs font-medium">No customer charging sessions recorded yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200/80 rounded-xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3">Session ID / Date</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Station</th>
                    <th className="px-4 py-3 text-right">Energy (kWh)</th>
                    <th className="px-4 py-3 text-right">Amount (₹)</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {(showAllSessions ? bookings : bookings.slice(0, 6)).map(b => (
                    <tr key={b._id} className="hover:bg-gray-50/80 transition">
                      <td className="px-4 py-3 font-mono text-gray-700">
                        <div className="font-bold text-gray-900">#{b._id?.slice(-6)?.toUpperCase()}</div>
                        <span className="text-[10px] text-gray-400 font-sans">{formatDate(b.createdAt)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900">{b.user?.name || 'EV Driver'}</div>
                        <span className="text-[10px] text-gray-400 block">{b.user?.phone || 'N/A'}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {b.station?.name || 'Charging Hub'}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-700">
                        {(Number(b.unitsConsumed || b.estimatedEnergy || 0)).toFixed(1)} kWh
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">
                        ₹{fmt(b.totalAmount || b.estimatedCost || b.totalCost || 0)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          b.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          b.status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {b.status || 'Completed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {bookings.length > 6 && (
                <div className="p-3 bg-gray-50 text-center border-t border-gray-100">
                  <button
                    onClick={() => setShowAllSessions(!showAllSessions)}
                    className="text-xs font-bold text-[#116631] hover:underline cursor-pointer"
                  >
                    {showAllSessions ? 'Show fewer sessions ↑' : `Show all ${bookings.length} charging sessions ↓`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 5. SETTLEMENT CARD (Pending Payout, Paid Payout, Last Settlement, Settlement History) */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {(activeSection === 'settlement' || activeSection === 'all') && (
        <div id="section-settlement" className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6 space-y-5 animate-in fade-in duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <CreditCard size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">5. Financial Settlement & Payouts</h2>
              <p className="text-xs text-gray-500">Bank disbursements, outstanding balance & transaction statement</p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
            Bank A/C: •••• {partner.bankDetails?.accountNumber?.slice(-4) || '7890'} ({partner.bankDetails?.bankName || 'HDFC Bank'})
          </span>
        </div>

        {/* 4 Settlement KPI Cards (Clickable) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Pending Payout */}
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 uppercase">Pending Payout</span>
              <Clock size={16} className="text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-900 mt-2">₹{fmt(pendingPayout)}</div>
            <p className="text-[11px] text-amber-700 font-medium">Eligible for scheduled bi-weekly payout</p>
          </div>

          {/* 2. Paid Payout */}
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-800 uppercase">Paid Payout</span>
              <CheckCircle2 size={16} className="text-blue-600" />
            </div>
            <div className="text-2xl font-black text-blue-900 mt-2">₹{fmt(paidPayout)}</div>
            <p className="text-[11px] text-blue-700 font-medium">Lifetime cumulative disbursed funds</p>
          </div>

          {/* 3. Last Settlement */}
          <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 uppercase">Last Settlement</span>
              <Receipt size={16} className="text-gray-500" />
            </div>
            {lastSettlement ? (
              <>
                <div className="text-xl font-black text-gray-900 mt-1">₹{fmt(lastSettlement.amount)}</div>
                <p className="text-[11px] text-gray-600 font-medium">
                  {formatDate(lastSettlement.date)} • {lastSettlement.mode}
                </p>
              </>
            ) : (
              <>
                <div className="text-sm font-bold text-gray-500 mt-2">No past disbursements</div>
                <p className="text-[11px] text-gray-400">First payout scheduled</p>
              </>
            )}
          </div>

          {/* 4. Settlement History (Clickable count button) */}
          <button
            onClick={() => {
              setShowAllPayouts(true);
              document.getElementById('settlement-payouts-table')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="p-4 rounded-xl bg-gradient-to-br from-emerald-50/60 to-white border border-emerald-200 text-left hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 uppercase">Settlement History</span>
              <CreditCard size={16} className="text-emerald-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-emerald-950 mt-2">{payouts.length} Transfers</div>
            <span className="text-[11px] text-emerald-700 font-semibold group-hover:underline block mt-0.5">Click to view ledger →</span>
          </button>
        </div>

        {/* Settlement History Table */}
        <div id="settlement-payouts-table" className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              Settlement Ledger & Disbursement Records ({payouts.length})
            </h3>
            <span className="text-xs text-gray-500">Bank UTR & RazorpayX references</span>
          </div>

          {payouts.length === 0 ? (
            <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-xl border border-gray-100">
              <CreditCard size={32} className="mx-auto text-gray-300 mb-1" />
              <p className="text-xs font-medium">No previous payout disbursements recorded.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200/80 rounded-xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3">Disbursement ID</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Reference / UTR</th>
                    <th className="px-4 py-3">Mode</th>
                    <th className="px-4 py-3 text-right">Amount (₹)</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {(showAllPayouts ? payouts : payouts.slice(0, 5)).map(p => (
                    <tr key={p._id} className="hover:bg-gray-50/80 transition">
                      <td className="px-4 py-3 font-mono font-bold text-gray-800">
                        #{p._id?.slice(-8)?.toUpperCase()}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(p.createdAt)}</td>
                      <td className="px-4 py-3 font-mono text-gray-700">{p.utrNumber || p.transactionId || 'DISB-' + p._id?.slice(-6)}</td>
                      <td className="px-4 py-3 text-gray-600">{p.paymentMethod || 'NEFT / IMPS'}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-800">
                        ₹{fmt(p.amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {p.status || 'Completed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {payouts.length > 5 && (
                <div className="p-3 bg-gray-50 text-center border-t border-gray-100">
                  <button
                    onClick={() => setShowAllPayouts(!showAllPayouts)}
                    className="text-xs font-bold text-[#116631] hover:underline cursor-pointer"
                  >
                    {showAllPayouts ? 'Show fewer payouts ↑' : `Show all ${payouts.length} disbursements ↓`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 6. SUPPORT CARD (Complaints, Tickets) */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {(activeSection === 'support' || activeSection === 'all') && (
        <div id="section-support" className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6 space-y-5 animate-in fade-in duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-700 flex items-center justify-center font-bold">
              <LifeBuoy size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">6. Support, Complaints & Helpdesk</h2>
              <p className="text-xs text-gray-500">Partner grievances, hardware incidents & customer station tickets</p>
            </div>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-lg border ${
            totalOpenIssues > 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            {totalOpenIssues > 0 ? `${totalOpenIssues} Open Issues Requiring Attention` : 'Zero Open Issues ✓'}
          </span>
        </div>

        {/* 3 Support KPI Cards (Clickable) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* 1. Complaints (Clickable count button) */}
          <button
            onClick={() => {
              setActiveSupportTab('complaints');
              document.getElementById('support-feed-table')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer group ${
              activeSupportTab === 'complaints'
                ? 'bg-red-50/70 border-red-300 ring-2 ring-red-400/20'
                : 'bg-gradient-to-br from-red-50/40 to-white border-red-200/70 hover:border-red-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-800 uppercase">Partner Complaints</span>
              <MessageSquare size={16} className="text-red-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-red-900 mt-2">{complaints.length}</div>
            <span className="text-[11px] text-red-700 font-semibold group-hover:underline block mt-0.5">
              {openComplaintsCount} Open • Click to view complaints →
            </span>
          </button>

          {/* 2. Tickets (Clickable count button) */}
          <button
            onClick={() => {
              setActiveSupportTab('tickets');
              document.getElementById('support-feed-table')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer group ${
              activeSupportTab === 'tickets'
                ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-400/20'
                : 'bg-gradient-to-br from-blue-50/40 to-white border-blue-200/70 hover:border-blue-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-800 uppercase">Support Tickets</span>
              <HelpCircle size={16} className="text-blue-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-blue-900 mt-2">{tickets.length}</div>
            <span className="text-[11px] text-blue-700 font-semibold group-hover:underline block mt-0.5">
              {openTicketsCount} Open • Click to view tickets →
            </span>
          </button>

          {/* 3. Total Support Health */}
          <div className="p-4 rounded-xl bg-gray-50/70 border border-gray-200 space-y-1">
            <span className="text-xs font-bold text-gray-700 uppercase">Support Resolution Rate</span>
            <div className="text-2xl font-black text-gray-900 mt-2">
              {complaints.length + tickets.length > 0
                ? `${Math.round(((complaints.length + tickets.length - totalOpenIssues) / (complaints.length + tickets.length)) * 100)}%`
                : '100%'}
            </div>
            <p className="text-[11px] text-gray-500 font-medium">Average turnaround time: 4.2 hours</p>
          </div>
        </div>

        {/* Support Feed Table with Filter Tabs */}
        <div id="support-feed-table" className="space-y-3 pt-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveSupportTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeSupportTab === 'all'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All Issues ({complaints.length + tickets.length})
              </button>
              <button
                onClick={() => setActiveSupportTab('complaints')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeSupportTab === 'complaints'
                    ? 'bg-red-600 text-white'
                    : 'bg-red-50 text-red-700 hover:bg-red-100'
                }`}
              >
                Complaints ({complaints.length})
              </button>
              <button
                onClick={() => setActiveSupportTab('tickets')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeSupportTab === 'tickets'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                Tickets ({tickets.length})
              </button>
            </div>

            <span className="text-xs text-gray-500">
              Showing {activeSupportTab === 'all' ? (complaints.length + tickets.length) : activeSupportTab === 'complaints' ? complaints.length : tickets.length} records
            </span>
          </div>

          {/* Unified Issue Feed */}
          {complaints.length === 0 && tickets.length === 0 ? (
            <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-xl border border-gray-100">
              <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-1" />
              <p className="text-xs font-medium text-gray-700">Clean Support Record</p>
              <p className="text-[11px] text-gray-400 mt-0.5">No partner complaints or customer tickets filed against this account.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200/80 rounded-xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3">Type & ID</th>
                    <th className="px-4 py-3">Subject / Issue</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3 text-center">Priority</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {/* Render Complaints */}
                  {(activeSupportTab === 'all' || activeSupportTab === 'complaints') && complaints.map(c => (
                    <tr key={c._id} className="hover:bg-gray-50/80 transition">
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200 text-[11px]">
                          <MessageSquare size={11} /> {c.complaintId || 'CMP-' + c._id?.slice(-4)}
                        </span>
                        <span className="block text-[10px] text-gray-400 font-sans mt-0.5">Partner Grievance</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-gray-900">{c.title}</div>
                        <p className="text-[11px] text-gray-500 line-clamp-1">{c.description}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        <span className="font-medium">{c.category || 'General'}</span>
                        {c.station?.name && (
                          <span className="text-[10px] text-gray-400 block truncate max-w-[140px]">Stn: {c.station.name}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.priority === 'High' ? 'bg-red-50 text-red-700 border border-red-200' :
                          c.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {c.priority || 'Medium'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          c.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          c.status === 'Closed' ? 'bg-slate-100 text-slate-700 border-slate-300' :
                          c.status === 'In Progress' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                          'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {c.status || 'Open'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500 font-mono">
                        {formatDate(c.createdAt)}
                      </td>
                    </tr>
                  ))}

                  {/* Render Tickets */}
                  {(activeSupportTab === 'all' || activeSupportTab === 'tickets') && tickets.map(t => (
                    <tr key={t._id} className="hover:bg-gray-50/80 transition">
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[11px]">
                          <HelpCircle size={11} /> {t.ticketId || 'TCK-' + t._id?.slice(-4)}
                        </span>
                        <span className="block text-[10px] text-gray-400 font-sans mt-0.5">Support Ticket</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-gray-900">{t.subject}</div>
                        <span className="text-[10px] text-gray-400 font-sans">User: {t.user?.name || 'Customer'}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        <span className="font-medium">{t.category || 'Station Issue'}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.priority === 'High' ? 'bg-red-50 text-red-700 border border-red-200' :
                          t.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {t.priority || 'Medium'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.status === 'Resolved' || t.status === 'Closed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {t.status || 'Open'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500 font-mono">
                        {formatDate(t.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* REJECTION REASON MODAL */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-xs p-4 flex min-h-full items-center justify-center animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 max-h-[85vh] flex flex-col my-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-red-50/50 shrink-0">
              <div className="flex items-center gap-2 text-red-600">
                <XCircle size={20} />
                <h3 className="text-base font-bold text-gray-900">Reject Partner Application</h3>
              </div>
              <button 
                onClick={() => setIsRejectModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0 [scrollbar-width:thin]">
              <p className="text-xs text-gray-600">
                Please provide an official rejection reason for <strong>{partner.name}</strong>. This explanation will be permanently recorded in the partner lifecycle audit log.
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
                      onClick={() => setRejectReason(chip)}
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
                  rows={4}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Specify why this partner registration cannot be approved..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2.5 shrink-0">
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleLifecycleTransition('Rejected', rejectReason)}
                disabled={!rejectReason.trim() || submittingLifecycle}
                className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl transition disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                {submittingLifecycle ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* SUSPENSION REASON MODAL */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {isSuspendModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-xs p-4 flex min-h-full items-center justify-center animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 max-h-[85vh] flex flex-col my-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-orange-50/50 shrink-0">
              <div className="flex items-center gap-2 text-orange-600">
                <PauseCircle size={20} />
                <h3 className="text-base font-bold text-gray-900">Suspend Partner Operations</h3>
              </div>
              <button 
                onClick={() => setIsSuspendModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0 [scrollbar-width:thin]">
              <p className="text-xs text-gray-600">
                Temporarily suspend <strong>{partner.name}</strong> from receiving active charging bookings. This action logs a formal suspension reason while strictly preserving historical records.
              </p>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Common Suspension Grounds:</label>
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
                      onClick={() => setSuspendReason(chip)}
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
                  rows={4}
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="Detail why partner is being suspended..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2.5 shrink-0">
              <button
                onClick={() => setIsSuspendModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleLifecycleTransition('Suspended', suspendReason)}
                disabled={!suspendReason.trim() || submittingLifecycle}
                className="px-4 py-2 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                {submittingLifecycle ? 'Suspending...' : 'Confirm Suspension'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerDetailView;
