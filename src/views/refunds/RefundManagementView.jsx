import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  ChevronDown,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  X,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Check,
  AlertTriangle,
  FileText,
  Wallet,
  Building2,
  Smartphone,
  RefreshCw,
  Info,
  Copy,
  MapPin,
  Zap,
  Calendar,
  CreditCard,
  Tag,
  RotateCcw,
  Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Format amount to exactly 2 decimal places (Indian Currency Format)
export const formatCurrency = (amt) => {
  const num = Number(amt) || 0;
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Mask sensitive account number
const maskAccountNumber = (acc) => {
  if (!acc) return 'N/A';
  const str = String(acc).trim();
  if (str.length <= 4) return str;
  return `•••• •••• ${str.slice(-4)}`;
};

// Mask sensitive UPI ID
const maskUpiId = (upi) => {
  if (!upi) return 'N/A';
  const parts = String(upi).split('@');
  if (parts.length === 2) {
    const handle = parts[0];
    const maskedHandle = handle.length > 3 ? `${handle.slice(0, 3)}•••` : '•••';
    return `${maskedHandle}@${parts[1]}`;
  }
  return upi;
};

// Predefined controlled refund categories (Requirement 5)
export const REFUND_CATEGORIES = [
  'Booking Cancelled',
  'Duplicate Payment',
  'Payment Failed',
  'Charger/Station Issue',
  'Overcharged Amount',
  'Customer Request',
  'Technical Issue',
  'Other'
];

// Predefined controlled rejection reasons (Requirement 14)
export const REJECTION_REASONS = [
  'Refund already processed',
  'Booking not eligible',
  'Duplicate request',
  'Policy violation',
  'Other'
];

// 5-Stage Refund Lifecycle Definitions
const LIFECYCLE_STAGES = [
  { key: 'Requested', label: '1. Requested', desc: 'Claim Created' },
  { key: 'Under Review', label: '2. Under Review', desc: 'Audit & Meter Logs' },
  { key: 'Approved', label: '3. Approved', desc: 'Claim Approved (Funds Pending)' },
  { key: 'Processing', label: '4. Processing', desc: 'Disbursement In-Flight' },
  { key: 'Refunded', label: '5. Refunded', desc: 'Settled & Credited' }
];

const getStageIndex = (status) => {
  switch (status) {
    case 'Pending':
    case 'Requested':
      return 0;
    case 'Under Review':
      return 1;
    case 'Approved':
      return 2;
    case 'Processing':
      return 3;
    case 'Refunded':
      return 4;
    default:
      return -1; // Rejected or Failed
  }
};

const getStatusBadge = (status) => {
  switch (status) {
    case 'Refunded':
      return {
        classes: 'text-emerald-700 bg-emerald-50 border border-emerald-300 font-bold',
        label: 'Refunded (Settled)'
      };
    case 'Approved':
      return {
        classes: 'text-indigo-700 bg-indigo-50 border border-indigo-200 font-semibold',
        label: 'Approved (Pending Payout)'
      };
    case 'Processing':
      return {
        classes: 'text-purple-700 bg-purple-50 border border-purple-200 font-semibold',
        label: 'Processing (In-Flight)'
      };
    case 'Under Review':
      return {
        classes: 'text-amber-700 bg-amber-50 border border-amber-200 font-semibold',
        label: 'Under Review'
      };
    case 'Pending':
    case 'Requested':
      return {
        classes: 'text-blue-700 bg-blue-50 border border-blue-200 font-semibold',
        label: 'Requested'
      };
    case 'Rejected':
      return {
        classes: 'text-rose-700 bg-rose-50 border border-rose-200 font-semibold',
        label: 'Rejected'
      };
    case 'Failed':
      return {
        classes: 'text-red-800 bg-red-100 border border-red-300 font-bold',
        label: 'Failed'
      };
    default:
      return {
        classes: 'text-gray-600 bg-gray-50 border border-gray-200 font-medium',
        label: status || 'Unknown'
      };
  }
};

const getCategoryColor = (category) => {
  switch (category) {
    case 'Booking Cancelled':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Duplicate Payment':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'Payment Failed':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'Charger/Station Issue':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Overcharged Amount':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'Technical Issue':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'Other':
      return 'bg-gray-100 text-gray-700 border-gray-300';
    default:
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
};

const RefundManagementView = () => {
  const [searchParams] = useSearchParams();
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search (Points 10, 11 & 12)
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All'); // 'All' | 'Today' | '7Days' | '30Days' | 'ThisMonth' | 'Custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [stationFilter, setStationFilter] = useState('All');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('All');
  const [refundTypeFilter, setRefundTypeFilter] = useState('All'); // 'All' | 'Full' | 'Partial'

  // Modal States
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states for stage transition in modal
  const [transitionNotes, setTransitionNotes] = useState('');
  const [transactionRefInput, setTransactionRefInput] = useState('');
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [rejectionExplanationInput, setRejectionExplanationInput] = useState('');
  const [utrInput, setUtrInput] = useState('');
  const [gatewayRefInput, setGatewayRefInput] = useState('');
  const [refundTxnIdInput, setRefundTxnIdInput] = useState('');
  const [activeActionForm, setActiveActionForm] = useState(null); // 'reject', 'process', 'settle'

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Sync status filter with URL query params
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam) {
      setStatusFilter(statusParam);
    }
  }, [searchParams]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    statusFilter,
    categoryFilter,
    dateFilter,
    customStartDate,
    customEndDate,
    stationFilter,
    paymentMethodFilter,
    refundTypeFilter
  ]);

  // Check if any filter is active
  const isAnyFilterActive = useMemo(() => {
    return (
      searchTerm !== '' ||
      statusFilter !== 'All' ||
      categoryFilter !== 'All' ||
      dateFilter !== 'All' ||
      customStartDate !== '' ||
      customEndDate !== '' ||
      stationFilter !== 'All' ||
      paymentMethodFilter !== 'All' ||
      refundTypeFilter !== 'All'
    );
  }, [
    searchTerm,
    statusFilter,
    categoryFilter,
    dateFilter,
    customStartDate,
    customEndDate,
    stationFilter,
    paymentMethodFilter,
    refundTypeFilter
  ]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setCategoryFilter('All');
    setDateFilter('All');
    setCustomStartDate('');
    setCustomEndDate('');
    setStationFilter('All');
    setPaymentMethodFilter('All');
    setRefundTypeFilter('All');
    setCurrentPage(1);
  };

  // Fetch Refunds
  const fetchRefunds = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/refund`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch refunds');
      const data = await response.json();
      setRefunds(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, []);

  // Extract unique stations dynamically for Station Filter (Point 11)
  const uniqueStations = useMemo(() => {
    const list = refunds
      .map((r) => r.booking?.station?.name)
      .filter(Boolean);
    return Array.from(new Set(list));
  }, [refunds]);

  // Filtered Data (includes search by Refund ID, Booking ID, Transaction ID, User Name, Email, Mobile and all filters)
  const filteredRefunds = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = todayStart - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = todayStart - 30 * 24 * 60 * 60 * 1000;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return refunds.filter((refund) => {
      const bookingId = refund.booking?.bookingId || refund.bookingId || '';
      const txnId =
        refund.transactionId ||
        refund.booking?.razorpayPaymentId ||
        refund.booking?.razorpayOrderId ||
        refund.transactionRef ||
        '';

      const userName = refund.user?.name || '';
      const userEmail = refund.user?.email || '';
      const userMobile = refund.user?.mobile || refund.user?.phone || '';
      const category = refund.category || '';
      const reason = refund.reason || '';
      const stationName = refund.booking?.station?.name || '';

      // Point 12: Comprehensive search across Refund ID, Booking ID, Transaction ID, User Name, Email, Mobile, UTR, Gateway Ref
      const searchString = `${refund.refundId || ''} ${bookingId} ${txnId} ${refund.refundTransactionId || ''} ${refund.utr || ''} ${refund.gatewayRef || ''} ${userName} ${userEmail} ${userMobile} ${category} ${reason} ${stationName}`.toLowerCase();
      const matchesSearch = searchString.includes(searchTerm.toLowerCase());

      // Status filter
      let matchesStatus = true;
      if (statusFilter === 'All') {
        matchesStatus = true;
      } else if (statusFilter === 'Requested') {
        matchesStatus = ['requested', 'pending'].includes(refund.status?.toLowerCase());
      } else if (statusFilter === 'Rejected / Failed') {
        matchesStatus = ['rejected', 'failed'].includes(refund.status?.toLowerCase());
      } else {
        matchesStatus = refund.status?.toLowerCase() === statusFilter.toLowerCase();
      }

      // Point 10: Date filter
      const rDate = new Date(refund.createdAt || Date.now()).getTime();
      let matchesDate = true;
      if (dateFilter === 'Today') {
        matchesDate = rDate >= todayStart;
      } else if (dateFilter === '7Days') {
        matchesDate = rDate >= sevenDaysAgo;
      } else if (dateFilter === '30Days') {
        matchesDate = rDate >= thirtyDaysAgo;
      } else if (dateFilter === 'ThisMonth') {
        matchesDate = rDate >= monthStart;
      } else if (dateFilter === 'Custom') {
        if (customStartDate) {
          const sTime = new Date(customStartDate).setHours(0, 0, 0, 0);
          if (rDate < sTime) matchesDate = false;
        }
        if (customEndDate) {
          const eTime = new Date(customEndDate).setHours(23, 59, 59, 999);
          if (rDate > eTime) matchesDate = false;
        }
      }

      // Point 11: Category filter
      const matchesCategory = categoryFilter === 'All' || refund.category === categoryFilter;

      // Point 11: Station filter
      const matchesStation = stationFilter === 'All' || stationName === stationFilter;

      // Point 11: Payment method filter
      const rPayMethod = (refund.refundDestination || refund.paymentMethod || refund.booking?.paymentMethod || '').toLowerCase();
      const matchesPaymentMethod =
        paymentMethodFilter === 'All' ||
        rPayMethod.includes(paymentMethodFilter.toLowerCase());

      // Point 11: Refund type filter (Full / Partial)
      const rType = refund.refundType || refund.financials?.refundType || 'Full';
      const matchesRefundType = refundTypeFilter === 'All' || rType.toLowerCase() === refundTypeFilter.toLowerCase();

      return (
        matchesSearch &&
        matchesStatus &&
        matchesDate &&
        matchesCategory &&
        matchesStation &&
        matchesPaymentMethod &&
        matchesRefundType
      );
    });
  }, [
    refunds,
    searchTerm,
    statusFilter,
    dateFilter,
    customStartDate,
    customEndDate,
    categoryFilter,
    stationFilter,
    paymentMethodFilter,
    refundTypeFilter
  ]);

  // KPI Metrics Calculation (Point 9)
  const metrics = useMemo(() => {
    const totalCount = refunds.length;
    const totalAmount = refunds.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

    const pendingRefunds = refunds.filter((r) =>
      ['requested', 'pending'].includes(r.status?.toLowerCase())
    );
    const pendingCount = pendingRefunds.length;
    const pendingAmount = pendingRefunds.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

    const pipelineRefunds = refunds.filter((r) =>
      ['under review', 'approved', 'processing'].includes(r.status?.toLowerCase())
    );
    const pipelineCount = pipelineRefunds.length;
    const pipelineAmount = pipelineRefunds.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

    const settledRefunds = refunds.filter((r) => r.status?.toLowerCase() === 'refunded');
    const settledCount = settledRefunds.length;
    const settledAmount = settledRefunds.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

    const rejectedRefunds = refunds.filter((r) =>
      ['rejected', 'failed'].includes(r.status?.toLowerCase())
    );
    const rejectedCount = rejectedRefunds.length;
    const rejectedAmount = rejectedRefunds.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

    return {
      totalCount,
      totalAmount,
      pendingCount,
      pendingAmount,
      pipelineCount,
      pipelineAmount,
      settledCount,
      settledAmount,
      rejectedCount,
      rejectedAmount
    };
  }, [refunds]);

  // Pagination Calculation
  const totalPages = Math.ceil(filteredRefunds.length / itemsPerPage);
  const paginatedRefunds = filteredRefunds.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Helper for generating page numbers with ellipses (matches Partner & Station views)
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

  // Format Date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-GB', options);
  };

  // Format Concise Date (for Recommended Table - e.g. "27 Jul 2026")
  const formatConciseDate = (dateString) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Status Update Actions with Over-Refund Guard & Point 14 Mandatory Validation
  const handleUpdateStatus = async (targetStatus, customPayload = {}) => {
    if (!selectedRefund) return;

    // Point 14: Rejection Reason Mandatory Validation
    if (targetStatus === 'Rejected') {
      const chosen = rejectionReasonInput || customPayload.rejectionReason || customPayload.reason;
      if (!chosen || !chosen.trim()) {
        toast.error('Rejection Reason is mandatory. Please select a reason.');
        return;
      }
      if (chosen.trim() === 'Other' && !(rejectionExplanationInput || customPayload.rejectionExplanation)?.trim()) {
        toast.error('Detailed explanation/reason field is mandatory when rejection reason is "Other".');
        return;
      }
    }

    // Over-Refund Protection Guard
    if (targetStatus === 'Approved' || targetStatus === 'Refunded') {
      const remaining = selectedRefund.financials?.remainingRefundable ?? selectedRefund.amount;
      if (Number(selectedRefund.amount) > Number(remaining)) {
        toast.error(
          `Over-Refund Violation: Requested amount (₹${formatCurrency(selectedRefund.amount)}) exceeds remaining refundable balance of ₹${formatCurrency(remaining)}.`
        );
        return;
      }
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const payload = {
        status: targetStatus,
        adminNotes: transitionNotes || customPayload.adminNotes || '',
        transactionRef: transactionRefInput || utrInput || customPayload.transactionRef || '',
        utr: utrInput || customPayload.utr || '',
        gatewayRef: gatewayRefInput || customPayload.gatewayRef || '',
        refundTransactionId: refundTxnIdInput || customPayload.refundTransactionId || '',
        reason: rejectionReasonInput || customPayload.reason || '',
        rejectionReason: rejectionReasonInput || customPayload.rejectionReason || '',
        rejectionExplanation: rejectionExplanationInput || customPayload.rejectionExplanation || ''
      };

      const response = await fetch(`${API_BASE_URL}/refund/${selectedRefund._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || 'Failed to update refund status');
      }

      toast.success(
        targetStatus === 'Refunded'
          ? `₹${formatCurrency(selectedRefund.amount)} settled and refunded successfully!`
          : targetStatus === 'Rejected'
          ? 'Refund claim rejected with reason recorded'
          : `Refund status moved to ${targetStatus}`
      );

      // Clear transition inputs
      setTransitionNotes('');
      setTransactionRefInput('');
      setRejectionReasonInput('');
      setRejectionExplanationInput('');
      setUtrInput('');
      setGatewayRefInput('');
      setRefundTxnIdInput('');
      setActiveActionForm(null);

      // Refresh list
      await fetchRefunds();
      if (resData.refund) {
        setSelectedRefund(resData.refund);
      } else {
        setIsViewModalOpen(false);
        setSelectedRefund(null);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const openViewModal = (refund) => {
    setSelectedRefund(refund);
    setTransitionNotes('');
    setTransactionRefInput(refund.transactionRef || refund.utr || '');
    setRejectionReasonInput(refund.rejectionReason || '');
    setRejectionExplanationInput(refund.rejectionExplanation || '');
    setUtrInput(refund.utr || refund.transactionRef || `UTR${Math.floor(100000000000 + Math.random() * 900000000000)}`);
    setGatewayRefInput(refund.gatewayRef || refund.transactionId || `gw_rfnd_${Math.floor(10000000 + Math.random() * 90000000)}`);
    setRefundTxnIdInput(refund.refundTransactionId || `RF-TXN-${refund.refundId?.replace(/\D/g, '').slice(-8) || Math.floor(10000000 + Math.random() * 90000000)}`);
    setActiveActionForm(null);
    setIsViewModalOpen(true);
  };

  const currentStageIndex = selectedRefund ? getStageIndex(selectedRefund.status) : -1;
  const isFailedOrRejected = ['Rejected', 'Failed'].includes(selectedRefund?.status);

  // Financial calculations for selected refund (Points 7 & 8)
  const fin = selectedRefund?.financials || {
    paidAmount: Number(selectedRefund?.booking?.estimatedCost) || Number(selectedRefund?.amount) || 0,
    previousRefunds: 0,
    currentRequested: Number(selectedRefund?.amount) || 0,
    remainingRefundable: Number(selectedRefund?.booking?.estimatedCost) || Number(selectedRefund?.amount) || 0,
    isOverRefund: false,
    refundType: selectedRefund?.refundType || (Number(selectedRefund?.amount) < (Number(selectedRefund?.booking?.estimatedCost) || Number(selectedRefund?.amount)) ? 'Partial' : 'Full')
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Refund Management</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Controlled Categories • Pre-Approval Over-Refund Validation • Complete Traceability
          </p>
        </div>
        <button
          onClick={fetchRefunds}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Point 9: KPI Financial Summary Cards (Total | Pending | Approved/Processing | Refunded | Rejected) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* 1. Total Refund Amount */}
        <div
          onClick={() => setStatusFilter('All')}
          className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer shadow-xs hover:shadow-md ${
            statusFilter === 'All' ? 'ring-2 ring-gray-900 border-transparent' : 'border-gray-100 hover:border-gray-200'
          }`}
          title="Show All Refunds"
        >
          <div className="flex items-center justify-between text-gray-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600">Total Refund Amount</span>
            <div className="w-7 h-7 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center">
              <FileText size={15} />
            </div>
          </div>
          <div className="text-xl font-bold text-gray-900 font-mono">₹{formatCurrency(metrics.totalAmount)}</div>
          <div className="text-[11px] text-gray-500 mt-1 font-medium">
            Total Claims: <strong className="text-gray-800">{metrics.totalCount}</strong>
          </div>
        </div>

        {/* 2. Pending Refunds */}
        <div
          onClick={() => setStatusFilter('Requested')}
          className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer shadow-xs hover:shadow-md ${
            statusFilter === 'Requested' ? 'ring-2 ring-blue-500 border-transparent' : 'border-gray-100 hover:border-blue-200'
          }`}
          title="Filter by Pending / Requested"
        >
          <div className="flex items-center justify-between text-gray-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Pending Refunds</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock size={15} />
            </div>
          </div>
          <div className="text-xl font-bold text-blue-700 font-mono">₹{formatCurrency(metrics.pendingAmount)}</div>
          <div className="text-[11px] text-blue-600 mt-1 font-semibold">
            Pending: {metrics.pendingCount} — ₹{formatCurrency(metrics.pendingAmount)}
          </div>
        </div>

        {/* 3. Approved / Processing */}
        <div
          onClick={() => setStatusFilter('Approved')}
          className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer shadow-xs hover:shadow-md ${
            statusFilter === 'Approved' ? 'ring-2 ring-indigo-500 border-transparent' : 'border-gray-100 hover:border-indigo-200'
          }`}
          title="Filter by Approved / Processing"
        >
          <div className="flex items-center justify-between text-gray-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">Approved / Processing</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <RefreshCw size={15} />
            </div>
          </div>
          <div className="text-xl font-bold text-indigo-700 font-mono">₹{formatCurrency(metrics.pipelineAmount)}</div>
          <div className="text-[11px] text-indigo-600 mt-1 font-semibold">
            In-Flight: {metrics.pipelineCount} — ₹{formatCurrency(metrics.pipelineAmount)}
          </div>
        </div>

        {/* 4. Refunded (Settled) */}
        <div
          onClick={() => setStatusFilter('Refunded')}
          className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer shadow-xs hover:shadow-md ${
            statusFilter === 'Refunded' ? 'ring-2 ring-emerald-500 border-transparent' : 'border-gray-100 hover:border-emerald-200'
          }`}
          title="Filter by Refunded (Settled)"
        >
          <div className="flex items-center justify-between text-gray-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Refunded</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle size={15} />
            </div>
          </div>
          <div className="text-xl font-bold text-emerald-700 font-mono">₹{formatCurrency(metrics.settledAmount)}</div>
          <div className="text-[11px] text-emerald-600 mt-1 font-semibold">
            Refunded: {metrics.settledCount} — ₹{formatCurrency(metrics.settledAmount)}
          </div>
        </div>

        {/* 5. Rejected / Failed */}
        <div
          onClick={() => setStatusFilter('Rejected / Failed')}
          className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer shadow-xs hover:shadow-md ${
            statusFilter === 'Rejected / Failed' ? 'ring-2 ring-rose-500 border-transparent' : 'border-gray-100 hover:border-rose-200'
          }`}
          title="Filter by Rejected / Failed"
        >
          <div className="flex items-center justify-between text-gray-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Rejected</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle size={15} />
            </div>
          </div>
          <div className="text-xl font-bold text-rose-700 font-mono">₹{formatCurrency(metrics.rejectedAmount)}</div>
          <div className="text-[11px] text-rose-600 mt-1 font-semibold">
            Declined: {metrics.rejectedCount} — ₹{formatCurrency(metrics.rejectedAmount)}
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        {/* Toolbar (Points 10, 11 & 12) */}
        <div className="p-4 sm:p-5 flex flex-col gap-3.5 border-b border-gray-100">
          {/* Row 1: Search, Date Filters, and Lifecycle Tabs */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              {/* Point 12: Search Input (Refund ID, Booking ID, Transaction ID, User, Mobile) */}
              <div className="relative w-full sm:max-w-xs">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search ID, Booking, Txn, User, Mobile..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-[#8CC63F] transition-all placeholder:text-gray-400 font-medium bg-white"
                />
              </div>

              {/* Point 10: Date Filter Dropdown */}
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
                <Calendar size={13} className="text-gray-400 shrink-0" />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="bg-transparent text-gray-700 font-semibold focus:outline-none cursor-pointer pr-1 text-xs"
                >
                  <option value="All">Date: All Time</option>
                  <option value="Today">Today</option>
                  <option value="7Days">Last 7 Days</option>
                  <option value="30Days">Last 30 Days</option>
                  <option value="ThisMonth">This Month</option>
                  <option value="Custom">Custom Date Range...</option>
                </select>
              </div>

              {/* Point 10: Custom Date Pickers */}
              {dateFilter === 'Custom' && (
                <div className="flex items-center gap-1.5 bg-blue-50/80 border border-blue-200 rounded-xl px-2.5 py-1 text-blue-900 shadow-2xs animate-in fade-in duration-150">
                  <span className="text-[11px] font-bold text-blue-700">From:</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="bg-white border border-blue-200 rounded px-1.5 py-0.5 text-xs text-gray-700 focus:outline-none"
                  />
                  <span className="text-[11px] font-bold text-blue-700 ml-1">To:</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="bg-white border border-blue-200 rounded px-1.5 py-0.5 text-xs text-gray-700 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Lifecycle Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1 overflow-x-auto pb-1 xl:pb-0">
              {[
                { key: 'All', label: 'All' },
                { key: 'Requested', label: 'Requested' },
                { key: 'Under Review', label: 'Under Review' },
                { key: 'Approved', label: 'Approved' },
                { key: 'Processing', label: 'Processing' },
                { key: 'Refunded', label: 'Refunded' },
                { key: 'Rejected / Failed', label: 'Rejected / Failed' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    statusFilter === tab.key
                      ? 'bg-gray-900 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2 (Point 11): Advanced Filters Dropdowns & Reset Button */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100/80">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1 mr-1">
              <Filter size={12} className="text-gray-400" />
              Filters:
            </span>

            {/* 1. Controlled Category Filter */}
            <div className="relative min-w-[150px]">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full appearance-none bg-white border border-gray-200 rounded-xl pl-2.5 pr-7 py-1.5 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8CC63F] cursor-pointer shadow-2xs"
              >
                <option value="All">Reason: All</option>
                {REFUND_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>

            {/* 2. Station Filter */}
            {uniqueStations.length > 0 && (
              <div className="relative min-w-[140px]">
                <select
                  value={stationFilter}
                  onChange={(e) => setStationFilter(e.target.value)}
                  className="w-full appearance-none bg-white border border-gray-200 rounded-xl pl-2.5 pr-7 py-1.5 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8CC63F] cursor-pointer shadow-2xs"
                >
                  <option value="All">Station: All</option>
                  {uniqueStations.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={13}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            )}

            {/* 3. Payment Method Filter */}
            <div className="relative min-w-[130px]">
              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="w-full appearance-none bg-white border border-gray-200 rounded-xl pl-2.5 pr-7 py-1.5 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8CC63F] cursor-pointer shadow-2xs capitalize"
              >
                <option value="All">Payment: All</option>
                <option value="wallet">Wallet</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="upi">UPI</option>
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>

            {/* 4. Refund Type Filter (Full / Partial) */}
            <div className="relative min-w-[125px]">
              <select
                value={refundTypeFilter}
                onChange={(e) => setRefundTypeFilter(e.target.value)}
                className="w-full appearance-none bg-white border border-gray-200 rounded-xl pl-2.5 pr-7 py-1.5 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8CC63F] cursor-pointer shadow-2xs"
              >
                <option value="All">Type: All</option>
                <option value="Full">Full Refund</option>
                <option value="Partial">Partial Refund</option>
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>

            {/* Reset All Filters Button */}
            {isAnyFilterActive && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition shadow-2xs cursor-pointer ml-auto"
                title="Reset all search and filters"
              >
                <RotateCcw size={12} />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Table Container - Horizontal scroll only when needed, no inner vertical scroll trap */}
        <div className="overflow-x-auto w-full relative">
          {loading ? (
            <div className="py-20 flex items-center justify-center bg-white/80">
              <Loader2 className="animate-spin text-[#8CC63F]" size={36} />
            </div>
          ) : error ? (
            <div className="py-20 flex flex-col items-center justify-center text-red-500 font-medium gap-2">
              <AlertCircle size={32} />
              <span>{error}</span>
            </div>
          ) : filteredRefunds.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400 font-medium gap-2">
              <FileText size={36} className="text-gray-300" />
              <span>No refund claims match your search or filter.</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/90 border-b border-gray-200/80 select-none">
                <tr>
                  <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Refund ID</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Booking ID</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Original Amount</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Refund Amount</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Reason</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Requested On</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedRefunds.map((refund) => {
                  const badge = getStatusBadge(refund.status);
                  const bookingId = refund.booking?.bookingId || refund.bookingId || 'BK-DIRECT';
                  const originalAmount = refund.originalAmount || refund.financials?.originalAmount || refund.booking?.estimatedCost || refund.amount;

                  return (
                    <tr key={refund._id} className="hover:bg-gray-50/70 transition-colors">
                      {/* 1. Refund ID */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-gray-900 font-mono tracking-tight">
                            {refund.refundId}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(refund.refundId);
                              toast.success('Refund ID copied');
                            }}
                            className="text-gray-400 hover:text-gray-700 p-0.5 rounded transition cursor-pointer"
                            title="Copy Refund ID"
                          >
                            <Copy size={11} />
                          </button>
                        </div>
                      </td>

                      {/* 2. Booking ID */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-xs text-gray-800 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 font-mono">
                            {bookingId}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(bookingId);
                              toast.success('Booking ID copied');
                            }}
                            className="text-gray-400 hover:text-gray-700 p-0.5 rounded transition cursor-pointer"
                            title="Copy Booking ID"
                          >
                            <Copy size={11} />
                          </button>
                        </div>
                      </td>

                      {/* 3. User */}
                      <td className="px-4 py-3">
                        <div className="text-xs font-bold text-gray-800">
                          {refund.user?.name || (typeof refund.user === 'string' ? refund.user : 'Unknown User')}
                        </div>
                        <div className="text-[11px] text-gray-400 truncate max-w-[130px]">
                          {refund.user?.phone || refund.user?.email || 'N/A'}
                        </div>
                      </td>

                      {/* 4. Original Amount */}
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold text-gray-700 font-mono">
                          ₹{formatCurrency(originalAmount)}
                        </span>
                      </td>

                      {/* 5. Refund Amount */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-extrabold text-gray-900 font-mono">
                            ₹{formatCurrency(refund.amount)}
                          </span>
                          {(refund.refundType === 'Partial' || refund.financials?.refundType === 'Partial') && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                              Partial
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 6. Reason */}
                      <td className="px-4 py-3">
                        <div className="space-y-0.5 max-w-[150px]">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border truncate max-w-full ${getCategoryColor(
                              refund.category || refund.reason || 'Customer Request'
                            )}`}
                            title={refund.explanation || refund.reason || refund.category}
                          >
                            {refund.category || refund.reason || 'Customer Request'}
                          </span>
                        </div>
                      </td>

                      {/* 7. Status */}
                      <td className="px-4 py-3">
                        <span className={`text-[11px] px-2.5 py-1 rounded-full whitespace-nowrap inline-block ${badge.classes}`}>
                          {badge.label}
                        </span>
                      </td>

                      {/* 8. Requested On */}
                      <td className="px-4 py-3 text-xs text-gray-600 font-medium whitespace-nowrap">
                        {formatConciseDate(refund.createdAt)}
                      </td>

                      {/* 9. Action */}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => openViewModal(refund)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 transition shadow-2xs cursor-pointer"
                          title="View full details & review refund"
                        >
                          <Eye size={13} />
                          <span>View / Review</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Complete Full Pagination Bar (matching Partner & Station management views) */}
        {filteredRefunds.length > 0 && (
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100 bg-white">
            {/* Left side: Showing X to Y of Z + Page Size selector */}
            <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs sm:text-sm text-gray-600 font-medium w-full sm:w-auto justify-between sm:justify-start shadow-2xs">
              <span className="whitespace-nowrap">
                Showing <strong className="text-gray-900 font-semibold">{(currentPage - 1) * itemsPerPage + 1}</strong> to <strong className="text-gray-900 font-semibold">{Math.min(currentPage * itemsPerPage, filteredRefunds.length)}</strong> of <strong className="text-gray-900 font-semibold">{filteredRefunds.length}</strong> refunds
              </span>
              <div className="relative ml-2 border-l border-gray-200 pl-3">
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="appearance-none bg-transparent pr-6 py-0.5 focus:outline-none cursor-pointer text-gray-700 font-semibold text-xs sm:text-sm"
                >
                  <option value={10} className="text-gray-900 bg-white">10 / page</option>
                  <option value={20} className="text-gray-900 bg-white">20 / page</option>
                  <option value={50} className="text-gray-900 bg-white">50 / page</option>
                  <option value={100} className="text-gray-900 bg-white">100 / page</option>
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
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
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
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
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
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

      {/* Point 6: Complete Context & Validation Modal */}
      {isViewModalOpen && selectedRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-auto animate-in fade-in zoom-in-95 duration-200 border border-gray-100 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center text-emerald-600 font-bold">
                  ₹
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    Review Refund Claim: {selectedRefund.refundId}
                  </h2>
                  <p className="text-xs text-gray-500">Requested on {formatDate(selectedRefund.createdAt)}</p>
                </div>
              </div>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-gray-400 hover:bg-gray-200/60 hover:text-gray-700 p-1.5 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* 5-Stage Stepper */}
              <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock size={14} className="text-gray-500" />
                    Refund Lifecycle Progression
                  </span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full ${getStatusBadge(selectedRefund.status).classes}`}>
                    {getStatusBadge(selectedRefund.status).label}
                  </span>
                </div>

                {isFailedOrRejected ? (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-800 text-xs">
                    <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Lifecycle Halted ({selectedRefund.status}): </span>
                      {selectedRefund.audit?.rejectedReason || selectedRefund.reason || 'No specific reason provided.'}
                    </div>
                  </div>
                ) : (
                  <div className="relative pt-2 pb-1">
                    <div className="grid grid-cols-5 gap-2 text-center relative z-10">
                      {LIFECYCLE_STAGES.map((stage, idx) => {
                        const isDone = currentStageIndex > idx;
                        const isCurrent = currentStageIndex === idx;

                        return (
                          <div key={stage.key} className="flex flex-col items-center">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                                isDone
                                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-200'
                                  : isCurrent
                                  ? 'bg-[#8CC63F] text-white ring-4 ring-[#8CC63F]/20 scale-110 font-extrabold'
                                  : 'bg-white border border-gray-200 text-gray-400'
                              }`}
                            >
                              {isDone ? <Check size={14} strokeWidth={3} /> : idx + 1}
                            </div>
                            <span
                              className={`text-[11px] mt-2 font-semibold ${
                                isCurrent
                                  ? 'text-gray-900 font-bold'
                                  : isDone
                                  ? 'text-emerald-700'
                                  : 'text-gray-400'
                              }`}
                            >
                              {stage.key}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Point 6 & 8: Section 2 - Payment Information & Amount Validation Pipeline */}
              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-gray-100 gap-2">
                  <div className="flex items-center gap-2">
                    <CreditCard size={18} className="text-indigo-600" />
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                      Payment & Refund Amount Validation
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Point 8: Partial vs Full Refund Badge */}
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${
                        fin.refundType === 'Partial'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {fin.refundType === 'Partial' ? 'Partial Refund' : 'Full Refund'}
                    </span>
                    <span className="text-xs font-mono font-semibold text-gray-500">
                      Method: <strong className="text-gray-800 capitalize">{selectedRefund.booking?.paymentMethod || selectedRefund.paymentMethod || 'Wallet'}</strong>
                    </span>
                  </div>
                </div>

                {/* Validation Flow Visual Formula: Paid → Previous Refund → Current Request → Remaining */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  {/* 1. Paid Amount */}
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase block">Paid Amount</span>
                    <span className="text-lg font-bold font-mono text-gray-900 block mt-0.5">
                      ₹{formatCurrency(fin.paidAmount)}
                    </span>
                    <span className="text-[10px] text-gray-400">Total Charged</span>
                  </div>

                  {/* 2. Previous Refund */}
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase block">Previous Refund</span>
                    <span className="text-lg font-bold font-mono text-amber-600 block mt-0.5">
                      ₹{formatCurrency(fin.previousRefunds)}
                    </span>
                    <span className="text-[10px] text-gray-400">Already Settled</span>
                  </div>

                  {/* 3. Current Requested */}
                  <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200">
                    <span className="text-[11px] font-bold text-blue-700 uppercase block">Current Request</span>
                    <span className="text-lg font-extrabold font-mono text-blue-800 block mt-0.5">
                      ₹{formatCurrency(fin.currentRequested)}
                    </span>
                    <span className="text-[10px] text-blue-600 font-medium">Under Review</span>
                  </div>

                  {/* 4. Remaining Refundable */}
                  <div
                    className={`p-3 rounded-xl border ${
                      fin.isOverRefund
                        ? 'bg-rose-50 border-rose-200 text-rose-800'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    }`}
                  >
                    <span className="text-[11px] font-bold uppercase block">Max Refundable</span>
                    <span className="text-lg font-black font-mono block mt-0.5">
                      ₹{formatCurrency(fin.remainingRefundable)}
                    </span>
                    <span className="text-[10px] font-medium">Available Cap</span>
                  </div>
                </div>

                {/* Over-Refund Validation Banner */}
                {fin.isOverRefund ? (
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-900 text-xs">
                    <ShieldAlert size={20} className="text-red-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-bold text-red-700">⛔ Over-Refund Validation Failed!</p>
                      <p>
                        Current requested refund (<strong>₹{formatCurrency(fin.currentRequested)}</strong>) exceeds the
                        maximum allowable remaining refundable balance of{' '}
                        <strong>₹{formatCurrency(fin.remainingRefundable)}</strong>.
                      </p>
                      <p className="text-[11px] text-red-600 font-medium">
                        Admin approval is automatically blocked to prevent accidental financial over-disbursement.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-900 text-xs font-medium">
                    <CheckCircle size={16} className="text-emerald-600 shrink-0" />
                    <span>
                      ✅ <strong>Financial Validation Passed:</strong> Requested amount of{' '}
                      <strong>₹{formatCurrency(fin.currentRequested)}</strong> is within the safe limit of{' '}
                      <strong>₹{formatCurrency(fin.remainingRefundable)}</strong>.
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between text-xs pt-1 text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-gray-700">Payment Transaction ID:</span>
                    <span className="font-mono font-bold text-gray-900">
                      {selectedRefund.transactionId ||
                        selectedRefund.booking?.razorpayPaymentId ||
                        selectedRefund.booking?.razorpayOrderId ||
                        selectedRefund.transactionRef ||
                        'TXN-DIRECT'}
                    </span>
                  </div>
                  {selectedRefund.transactionRef && (
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-gray-700">Disbursement UTR:</span>
                      <span className="font-mono font-bold text-emerald-700">{selectedRefund.transactionRef}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Point 15: Refund Transaction Reference Card (Displayed when Refunded) */}
              {selectedRefund.status === 'Refunded' && (
                <div className="bg-emerald-50/70 rounded-2xl p-5 border border-emerald-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-200/70">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={18} className="text-emerald-700" />
                      <h3 className="text-sm font-bold text-emerald-900 uppercase tracking-wider">
                        Refund Settlement & Gateway References
                      </h3>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                      Settlement Complete
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800/80">
                    These reference identifiers are permanently stored to verify and cross-reconcile the refund on your payment gateway portal (Razorpay/Cashfree) or bank settlement statement:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    {/* 1. Refund Transaction ID */}
                    <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs space-y-1">
                      <div className="flex items-center justify-between text-gray-500">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600">Refund Transaction ID</span>
                        <button
                          onClick={() => {
                            const val = selectedRefund.refundTransactionId || `RF-TXN-${selectedRefund.refundId?.replace(/\D/g, '') || '82910382'}`;
                            navigator.clipboard.writeText(val);
                            toast.success('Refund Transaction ID copied');
                          }}
                          className="text-gray-400 hover:text-gray-700 p-0.5"
                          title="Copy"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                      <div className="font-mono font-bold text-xs text-gray-900 truncate" title={selectedRefund.refundTransactionId}>
                        {selectedRefund.refundTransactionId || `RF-TXN-${selectedRefund.refundId?.replace(/\D/g, '') || '82910382'}`}
                      </div>
                      <span className="text-[10px] text-gray-400">Internal Refund Identifier</span>
                    </div>

                    {/* 2. Bank UTR Reference */}
                    <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs space-y-1">
                      <div className="flex items-center justify-between text-gray-500">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Bank UTR Number</span>
                        <button
                          onClick={() => {
                            const val = selectedRefund.utr || selectedRefund.transactionRef || 'UTR982736192837';
                            navigator.clipboard.writeText(val);
                            toast.success('Bank UTR copied');
                          }}
                          className="text-gray-400 hover:text-gray-700 p-0.5"
                          title="Copy"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                      <div className="font-mono font-bold text-xs text-emerald-800 truncate" title={selectedRefund.utr || selectedRefund.transactionRef}>
                        {selectedRefund.utr || selectedRefund.transactionRef || 'UTR982736192837'}
                      </div>
                      <span className="text-[10px] text-gray-400">Bank Settlement UTR</span>
                    </div>

                    {/* 3. Gateway Reference */}
                    <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs space-y-1">
                      <div className="flex items-center justify-between text-gray-500">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Gateway Reference</span>
                        <button
                          onClick={() => {
                            const val = selectedRefund.gatewayRef || selectedRefund.transactionId || 'gw_rfnd_28193821';
                            navigator.clipboard.writeText(val);
                            toast.success('Gateway Reference copied');
                          }}
                          className="text-gray-400 hover:text-gray-700 p-0.5"
                          title="Copy"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                      <div className="font-mono font-bold text-xs text-indigo-900 truncate" title={selectedRefund.gatewayRef || selectedRefund.transactionId}>
                        {selectedRefund.gatewayRef || selectedRefund.transactionId || 'gw_rfnd_28193821'}
                      </div>
                      <span className="text-[10px] text-gray-400">Payment Gateway ID</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Point 6: Section 1 - Booking Information */}
              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Zap size={18} className="text-emerald-600" />
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                      Booking Information
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                      {selectedRefund.booking?.bookingId || selectedRefund.bookingId || 'BK-DIRECT'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Station Details */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-gray-500 font-semibold uppercase">
                      <MapPin size={13} className="text-rose-500" /> Station
                    </div>
                    <p className="font-bold text-gray-900 text-sm">
                      {selectedRefund.booking?.station?.name || 'EV Prime Charging Hub'}
                    </p>
                    <p className="text-gray-500">
                      {selectedRefund.booking?.station?.address || selectedRefund.booking?.station?.location || 'Main Expressway Hub'}
                    </p>
                  </div>

                  {/* Charger & Connector */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-gray-500 font-semibold uppercase">
                      <Zap size={13} className="text-amber-500" /> Charger & Gun
                    </div>
                    <p className="font-bold text-gray-900 text-sm">
                      {selectedRefund.booking?.chargerId || 'CHG-01'} •{' '}
                      {selectedRefund.booking?.connectorType || 'CCS2'}
                    </p>
                    <p className="text-gray-500">
                      Power: {selectedRefund.booking?.connectorPower || '60 kW'} DC Fast Gun
                    </p>
                  </div>

                  {/* Booking Date & Time */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-gray-500 font-semibold uppercase">
                      <Calendar size={13} className="text-blue-500" /> Scheduled Slot
                    </div>
                    <p className="font-bold text-gray-900">
                      {selectedRefund.booking?.scheduledDate || formatDate(selectedRefund.createdAt)}
                    </p>
                    <p className="text-gray-500 font-mono">
                      Slot: {selectedRefund.booking?.scheduledTime || 'Standard Slot'}
                    </p>
                  </div>

                  {/* Session Status */}
                  <div className="space-y-1">
                    <span className="text-gray-500 font-semibold uppercase block">Session Status</span>
                    <span className="inline-block font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-800 border border-gray-200">
                      {selectedRefund.booking?.status || 'Completed'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Point 5 & 6: Section 3 - Controlled Reason & Customer Details */}
              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Tag size={18} className="text-purple-600" />
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                      Refund Claim Reason & Beneficiary
                    </h3>
                  </div>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${getCategoryColor(
                      selectedRefund.category || 'Customer Request'
                    )}`}
                  >
                    Category: {selectedRefund.category || 'Customer Request'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-400 font-medium block">Customer</span>
                    <span className="font-bold text-gray-900 text-sm block">
                      {selectedRefund.user?.name || (typeof selectedRefund.user === 'string' ? selectedRefund.user : 'N/A')}
                    </span>
                    <span className="text-gray-500 block">{selectedRefund.user?.email || selectedRefund.user?.phone}</span>
                  </div>

                  <div>
                    <span className="text-gray-400 font-medium block">Refund Destination</span>
                    <span className="inline-flex items-center gap-1.5 font-bold text-gray-800 capitalize mt-0.5 text-sm">
                      {selectedRefund.refundDestination === 'bank_transfer' ? (
                        <>
                          <Building2 size={16} className="text-indigo-600" /> Bank Transfer
                        </>
                      ) : selectedRefund.refundDestination === 'upi' ? (
                        <>
                          <Smartphone size={16} className="text-blue-600" /> UPI Instant
                        </>
                      ) : (
                        <>
                          <Wallet size={16} className="text-emerald-600" /> Customer EV Wallet
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Reason Explanation Box */}
                <div>
                  <span className="text-xs text-gray-500 font-semibold block mb-1">
                    Claim Reason & Explanation {selectedRefund.category === 'Other' && <span className="text-rose-500 font-bold">(Mandatory for Other)</span>}
                  </span>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-800 font-medium">
                    <p>{selectedRefund.explanation || selectedRefund.reason || 'No detailed explanation provided.'}</p>
                  </div>
                </div>

                {/* Masked Bank / UPI Details */}
                {selectedRefund.refundDestination === 'bank_transfer' && selectedRefund.bankDetails && (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs space-y-1.5">
                    <span className="font-bold text-gray-700 block">Masked Bank Account</span>
                    <div className="flex justify-between text-gray-600">
                      <span>Account Holder:</span>
                      <span className="font-semibold text-gray-800">{selectedRefund.bankDetails.accountName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Account Number:</span>
                      <span className="font-mono font-bold text-gray-900">
                        {maskAccountNumber(selectedRefund.bankDetails.accountNumber)}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>IFSC Code:</span>
                      <span className="font-mono font-bold text-gray-900">{selectedRefund.bankDetails.ifsc || 'N/A'}</span>
                    </div>
                  </div>
                )}

                {selectedRefund.refundDestination === 'upi' && selectedRefund.upiDetails && (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs flex justify-between items-center">
                    <span className="font-bold text-gray-700">Masked UPI ID:</span>
                    <span className="font-mono font-bold text-gray-900">{maskUpiId(selectedRefund.upiDetails.upiId)}</span>
                  </div>
                )}

                {/* Point 13: Detailed Audit Trail with Timestamps & Admin Info */}
                <div className="pt-3 border-t border-gray-100 space-y-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-emerald-600" />
                      Refund Lifecycle Audit Trail & Timeline
                    </span>
                    {selectedRefund.transactionRef && (
                      <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        UTR / Ref: {selectedRefund.transactionRef}
                      </span>
                    )}
                  </div>

                  <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-200/80 space-y-2 text-xs">
                    {/* 1. Requested */}
                    <div className="flex items-center justify-between pb-1 border-b border-gray-200/60">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                        <span className="text-gray-600 font-medium">Requested:</span>
                        <strong className="text-gray-900">{selectedRefund.user?.name || 'Customer'}</strong>
                      </div>
                      <span className="text-gray-500 font-mono text-[11px]">
                        {formatDate(selectedRefund.createdAt)}
                      </span>
                    </div>

                    {/* 2. Reviewed by */}
                    {(selectedRefund.reviewedBy?.name || selectedRefund.audit?.reviewedBy) && (
                      <div className="flex items-center justify-between pb-1 border-b border-gray-200/60">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                          <span className="text-gray-600 font-medium">Reviewed by:</span>
                          <strong className="text-gray-900">
                            {selectedRefund.reviewedBy?.name || selectedRefund.audit?.reviewedBy}
                          </strong>
                          {selectedRefund.reviewedBy?.notes && (
                            <span className="text-gray-500 italic truncate max-w-[200px]">
                              ({selectedRefund.reviewedBy.notes})
                            </span>
                          )}
                        </div>
                        <span className="text-gray-500 font-mono text-[11px]">
                          {formatDate(selectedRefund.reviewedBy?.at || selectedRefund.audit?.reviewedAt || selectedRefund.updatedAt)}
                        </span>
                      </div>
                    )}

                    {/* 3. Approved */}
                    {(selectedRefund.approvedBy?.name || selectedRefund.audit?.approvedBy) && (
                      <div className="flex items-center justify-between pb-1 border-b border-gray-200/60">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></span>
                          <span className="text-gray-600 font-medium">Approved:</span>
                          <strong className="text-gray-900">
                            {selectedRefund.approvedBy?.name || selectedRefund.audit?.approvedBy}
                          </strong>
                          {selectedRefund.approvedBy?.notes && (
                            <span className="text-gray-500 italic truncate max-w-[200px]">
                              ({selectedRefund.approvedBy.notes})
                            </span>
                          )}
                        </div>
                        <span className="text-gray-500 font-mono text-[11px]">
                          {formatDate(selectedRefund.approvedBy?.at || selectedRefund.audit?.approvedAt || selectedRefund.updatedAt)}
                        </span>
                      </div>
                    )}

                    {/* 4. Processed */}
                    {['Processing', 'Refunded'].includes(selectedRefund.status) && (
                      <div className="flex items-center justify-between pb-1 border-b border-gray-200/60">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0"></span>
                          <span className="text-gray-600 font-medium">Processed:</span>
                          <strong className="text-gray-900">Disbursement In-Flight</strong>
                        </div>
                        <span className="text-gray-500 font-mono text-[11px]">
                          {formatDate(selectedRefund.updatedAt)}
                        </span>
                      </div>
                    )}

                    {/* 5. Refunded (Settled) */}
                    {(selectedRefund.refundedBy?.name || selectedRefund.status === 'Refunded') && (
                      <div className="flex items-center justify-between pb-1 border-b border-gray-200/60">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                          <span className="text-gray-600 font-medium">Refunded:</span>
                          <strong className="text-emerald-700">
                            {selectedRefund.refundedBy?.name || 'Financial Settlement'}
                          </strong>
                          <span className="font-mono text-emerald-800 font-bold bg-emerald-100 px-1 py-0.2 rounded text-[10px]">
                            UTR/Ref: {selectedRefund.transactionRef || selectedRefund.transactionId || 'Confirmed'}
                          </span>
                        </div>
                        <span className="text-gray-500 font-mono text-[11px]">
                          {formatDate(selectedRefund.refundedBy?.at || selectedRefund.updatedAt)}
                        </span>
                      </div>
                    )}

                    {/* 6. Rejected */}
                    {(selectedRefund.rejectedBy?.name || selectedRefund.status === 'Rejected') && (
                      <div className="flex items-center justify-between pb-1 border-b border-gray-200/60">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                          <span className="text-gray-600 font-medium">Rejected by:</span>
                          <strong className="text-rose-700">
                            {selectedRefund.rejectedBy?.name || 'Admin'}
                          </strong>
                          <span className="text-rose-600 italic">
                            (Reason: {selectedRefund.rejectedBy?.reason || selectedRefund.adminNotes || 'Declined'})
                          </span>
                        </div>
                        <span className="text-gray-500 font-mono text-[11px]">
                          {formatDate(selectedRefund.rejectedBy?.at || selectedRefund.updatedAt)}
                        </span>
                      </div>
                    )}

                    {/* Admin Remark Note */}
                    {selectedRefund.adminNotes && (
                      <div className="mt-1.5 p-2 bg-white rounded-lg border border-gray-200 text-gray-700">
                        <strong className="text-gray-900">Admin Remark:</strong> {selectedRefund.adminNotes}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Contextual Action Inputs */}
              {activeActionForm && (
                <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200/80 space-y-3 animate-in fade-in duration-150">
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wider block">
                    {activeActionForm === 'reject'
                      ? 'Point 14: Rejection Reason (Mandatory)'
                      : activeActionForm === 'settle'
                      ? 'Point 15: Settlement & Reference Details'
                      : 'Processing Notes'}
                  </span>

                  {/* Point 14: Rejection Reason Dropdown + Mandatory Other Explanation */}
                  {activeActionForm === 'reject' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-800 mb-1">
                          Rejection Reason <span className="text-rose-600 font-bold">* (Mandatory)</span>
                        </label>
                        <select
                          value={rejectionReasonInput}
                          onChange={(e) => setRejectionReasonInput(e.target.value)}
                          className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white cursor-pointer shadow-2xs"
                        >
                          <option value="">-- Select Rejection Reason --</option>
                          {REJECTION_REASONS.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </div>

                      {rejectionReasonInput === 'Other' && (
                        <div className="animate-in fade-in duration-150">
                          <label className="block text-xs font-bold text-gray-800 mb-1">
                            Explanation / Detailed Reason <span className="text-rose-600 font-bold">* (Mandatory for "Other")</span>
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Please specify detailed explanation for rejecting this refund request..."
                            value={rejectionExplanationInput}
                            onChange={(e) => setRejectionExplanationInput(e.target.value)}
                            className="w-full text-xs px-3 py-2 rounded-xl border border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white shadow-2xs"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Point 15: Settlement Reference Inputs */}
                  {activeActionForm === 'settle' && (
                    <div className="space-y-2.5">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-1">
                            Refund Transaction ID
                          </label>
                          <input
                            type="text"
                            placeholder="RF-TXN-XXXXXXXX"
                            value={refundTxnIdInput}
                            onChange={(e) => setRefundTxnIdInput(e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 font-mono bg-white shadow-2xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-1">
                            Bank UTR Reference
                          </label>
                          <input
                            type="text"
                            placeholder="UTR982736192837"
                            value={utrInput}
                            onChange={(e) => setUtrInput(e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 font-mono bg-white shadow-2xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-1">
                            Gateway Reference
                          </label>
                          <input
                            type="text"
                            placeholder="gw_rfnd_xxxxxxxx"
                            value={gatewayRefInput}
                            onChange={(e) => setGatewayRefInput(e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 font-mono bg-white shadow-2xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeActionForm === 'process' && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        UTR / Transaction Reference (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. UTR-HDFC-992211 or TXN-DISP-1002"
                        value={transactionRefInput}
                        onChange={(e) => setTransactionRefInput(e.target.value)}
                        className="w-full text-sm px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-mono"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Internal Admin Audit Note</label>
                    <input
                      type="text"
                      placeholder="Audit note..."
                      value={transitionNotes}
                      onChange={(e) => setTransitionNotes(e.target.value)}
                      className="w-full text-sm px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions Footer with Over-Refund Guard */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => {
                  if (activeActionForm) {
                    setActiveActionForm(null);
                  } else {
                    setIsViewModalOpen(false);
                  }
                }}
                disabled={actionLoading}
                className="px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-200 bg-white border border-gray-200 rounded-xl transition-colors shadow-sm disabled:opacity-50"
              >
                {activeActionForm ? 'Cancel Form' : 'Close'}
              </button>

              <div className="flex flex-wrap items-center gap-2">
                {/* Stage 1: Requested / Pending */}
                {['Pending', 'Requested'].includes(selectedRefund.status) && (
                  <>
                    {!activeActionForm && (
                      <>
                        <button
                          onClick={() => setActiveActionForm('reject')}
                          disabled={actionLoading}
                          className="px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-xl transition shadow-sm flex items-center gap-1.5"
                        >
                          <XCircle size={15} /> Reject
                        </button>
                        <button
                          onClick={() => handleUpdateStatus('Under Review')}
                          disabled={actionLoading}
                          className="px-4 py-2 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-xl transition shadow-sm flex items-center gap-1.5"
                        >
                          {actionLoading ? <Loader2 className="animate-spin" size={14} /> : <Clock size={15} />}
                          Start Review
                        </button>
                        <button
                          onClick={() => handleUpdateStatus('Approved')}
                          disabled={actionLoading || fin.isOverRefund}
                          className={`px-4 py-2 text-xs font-semibold text-white rounded-xl transition shadow-sm flex items-center gap-1.5 ${
                            fin.isOverRefund
                              ? 'bg-gray-400 cursor-not-allowed opacity-60'
                              : 'bg-indigo-600 hover:bg-indigo-700'
                          }`}
                          title={fin.isOverRefund ? 'Over-Refund Detected: Approval is blocked' : 'Approve Claim'}
                        >
                          {actionLoading ? <Loader2 className="animate-spin" size={14} /> : <ShieldCheck size={15} />}
                          {fin.isOverRefund ? 'Over-Refund Blocked' : 'Approve Claim'}
                        </button>
                      </>
                    )}
                  </>
                )}

                {/* Stage 2: Under Review */}
                {selectedRefund.status === 'Under Review' && (
                  <>
                    {!activeActionForm && (
                      <>
                        <button
                          onClick={() => setActiveActionForm('reject')}
                          disabled={actionLoading}
                          className="px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-xl transition shadow-sm flex items-center gap-1.5"
                        >
                          <XCircle size={15} /> Reject Claim
                        </button>
                        <button
                          onClick={() => handleUpdateStatus('Approved')}
                          disabled={actionLoading || fin.isOverRefund}
                          className={`px-4 py-2 text-xs font-semibold text-white rounded-xl transition shadow-sm flex items-center gap-1.5 ${
                            fin.isOverRefund
                              ? 'bg-gray-400 cursor-not-allowed opacity-60'
                              : 'bg-indigo-600 hover:bg-indigo-700'
                          }`}
                          title={fin.isOverRefund ? 'Over-Refund Detected: Approval is blocked' : 'Approve Claim'}
                        >
                          {actionLoading ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle size={15} />}
                          {fin.isOverRefund ? 'Over-Refund Blocked' : 'Approve Claim'}
                        </button>
                      </>
                    )}
                  </>
                )}

                {/* Stage 3: Approved */}
                {selectedRefund.status === 'Approved' && (
                  <>
                    {!activeActionForm && (
                      <>
                        <button
                          onClick={() => setActiveActionForm('reject')}
                          disabled={actionLoading}
                          className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition"
                        >
                          Cancel / Reject
                        </button>
                        <button
                          onClick={() => setActiveActionForm('process')}
                          disabled={actionLoading}
                          className="px-4 py-2 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100 rounded-xl transition shadow-sm flex items-center gap-1.5"
                        >
                          Send to Processing
                        </button>
                        <button
                          onClick={() => setActiveActionForm('settle')}
                          disabled={actionLoading || fin.isOverRefund}
                          className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-sm flex items-center gap-1.5 font-bold"
                        >
                          <CheckCircle size={15} />
                          Confirm Settlement (Refund Now)
                        </button>
                      </>
                    )}
                  </>
                )}

                {/* Stage 4: Processing */}
                {selectedRefund.status === 'Processing' && (
                  <>
                    {!activeActionForm && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus('Failed', { reason: 'Payment disbursement failed' })}
                          disabled={actionLoading}
                          className="px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-xl transition shadow-sm flex items-center gap-1.5"
                        >
                          <XCircle size={15} /> Mark Failed
                        </button>
                        <button
                          onClick={() => setActiveActionForm('settle')}
                          disabled={actionLoading}
                          className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-sm flex items-center gap-1.5 font-bold"
                        >
                          <CheckCircle size={15} />
                          Confirm Settlement (Mark Refunded)
                        </button>
                      </>
                    )}
                  </>
                )}

                {/* Submission buttons when form is open */}
                {activeActionForm === 'reject' && (
                  <button
                    onClick={() => handleUpdateStatus('Rejected')}
                    disabled={actionLoading}
                    className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-sm flex items-center gap-1.5"
                  >
                    {actionLoading ? <Loader2 className="animate-spin" size={14} /> : <XCircle size={15} />}
                    Confirm Rejection
                  </button>
                )}

                {activeActionForm === 'process' && (
                  <button
                    onClick={() => handleUpdateStatus('Processing')}
                    disabled={actionLoading}
                    className="px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition shadow-sm flex items-center gap-1.5"
                  >
                    {actionLoading ? <Loader2 className="animate-spin" size={14} /> : <ArrowRight size={15} />}
                    Advance to Processing
                  </button>
                )}

                {activeActionForm === 'settle' && (
                  <button
                    onClick={() => handleUpdateStatus('Refunded')}
                    disabled={actionLoading}
                    className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-sm flex items-center gap-1.5"
                  >
                    {actionLoading ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle size={15} />}
                    Execute Settlement (Credit ₹{formatCurrency(selectedRefund.amount)})
                  </button>
                )}

                {/* If Rejected or Failed: allow retry */}
                {isFailedOrRejected && (
                  <button
                    onClick={() => handleUpdateStatus('Under Review', { adminNotes: 'Reopened for review' })}
                    disabled={actionLoading}
                    className="px-4 py-2 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-xl transition shadow-sm flex items-center gap-1.5"
                  >
                    {actionLoading ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={15} />}
                    Reopen for Review
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RefundManagementView;
