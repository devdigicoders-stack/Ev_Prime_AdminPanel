import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  DollarSign, Check, X, RefreshCcw, Clock, Building2, Search, 
  Copy, CheckCheck, FileText, Printer, AlertCircle, 
  ShieldCheck, User, Wallet, CheckCircle2, XCircle, Eye, EyeOff, Shield,
  Calendar, Filter, RotateCcw, AlertTriangle, Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Mask Account Number: display e.g. ******5798 (only last 4 digits visible)
const maskAccountNumber = (accNo) => {
  if (!accNo || accNo === 'N/A') return 'N/A';
  const clean = String(accNo).trim();
  if (clean.length <= 4) return '******' + clean;
  return '******' + clean.slice(-4);
};

// Mask UPI ID: display e.g. v****n@okhdfcbank
const maskUpiId = (upi) => {
  if (!upi || upi === 'N/A') return 'N/A';
  const clean = String(upi).trim();
  const parts = clean.split('@');
  if (parts.length !== 2) {
    if (clean.length <= 4) return '****';
    return clean.slice(0, 2) + '****' + clean.slice(-2);
  }
  const [user, handle] = parts;
  if (user.length <= 2) {
    return user[0] + '****@' + handle;
  }
  const first = user[0];
  const last = user[user.length - 1];
  return `${first}****${last}@${handle}`;
};

const PayoutManagementView = () => {
  const [searchParams] = useSearchParams();
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'All');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedAccount, setCopiedAccount] = useState(null);

  // Multi-Filter states (Points 7, 9, 10)
  const [dateFilter, setDateFilter] = useState('All'); // 'All', 'Today', '7Days', '30Days', 'ThisMonth', 'Custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [partnerFilter, setPartnerFilter] = useState('All');
  const [bankFilter, setBankFilter] = useState('All');
  const [amountFilter, setAmountFilter] = useState('All'); // 'All', '0-1000', '1000-10000', '10000+'

  // Bank Account Verification state & quick modal (Point 5)
  const [verifyModal, setVerifyModal] = useState({
    isOpen: false,
    partnerId: null,
    partnerName: '',
    currentStatus: 'Verified',
    newStatus: 'Verified',
    notes: '',
    loading: false
  });

  const { admin, isSuperAdmin, hasPermission } = useAuth();
  const canRevealSensitiveData = Boolean(isSuperAdmin || hasPermission('payouts'));

  // Masking / Reveal state for rows & modals
  const [revealedAccounts, setRevealedAccounts] = useState({}); // { [payoutId]: boolean }
  const [actionModalRevealed, setActionModalRevealed] = useState(false);
  const [receiptModalRevealed, setReceiptModalRevealed] = useState(false);
  const [detailsModalRevealed, setDetailsModalRevealed] = useState(false);

  // Sync status filter with URL query params
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam) {
      setStatusFilter(statusParam);
    }
  }, [searchParams]);

  // Modals state
  const [selectedPayoutForDetails, setSelectedPayoutForDetails] = useState(null); // Point 12: View Details (360° Payout Info)
  const [selectedPayoutForReceipt, setSelectedPayoutForReceipt] = useState(null); // Point 12: View Receipt (Payment Slip)
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    payout: null,
    type: 'Completed', // 'Verified', 'Approved', 'Processing', 'Completed', 'Rejected', 'Failed'
    transactionId: '',
    remarks: ''
  });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/admin/payouts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      if (data.success) {
        setPayouts(data.data || []);
      }
    } catch (err) {
      toast.error('Failed to load payout requests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  const handleCopy = (text, id, isSensitive = false) => {
    if (!text || text === 'N/A') return;
    if (isSensitive && !canRevealSensitiveData) {
      toast.error('Access Denied: You cannot copy unmasked financial data.');
      return;
    }
    navigator.clipboard.writeText(text);
    setCopiedAccount(id);
    toast.success(isSensitive ? 'Account number copied!' : 'Copied to clipboard!');
    setTimeout(() => setCopiedAccount(null), 2000);
  };

  const handleToggleReveal = async (payoutId, partnerName, field = 'Bank Account Number') => {
    if (!canRevealSensitiveData) {
      toast.error('Access Denied: You do not have permission to view unmasked banking details.');
      return;
    }

    const isCurrentlyRevealed = Boolean(revealedAccounts[payoutId]);
    const willReveal = !isCurrentlyRevealed;

    setRevealedAccounts(prev => ({
      ...prev,
      [payoutId]: willReveal
    }));

    if (willReveal) {
      toast.success('Sensitive banking details revealed');
      try {
        const token = localStorage.getItem('adminToken');
        await fetch(`${API_BASE_URL}/admin/payouts/${payoutId}/audit-reveal`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            field,
            partnerName
          })
        });
      } catch (err) {
        console.error('Failed to log reveal to audit trail:', err);
      }
    }
  };

  const handleToggleActionModalReveal = async () => {
    if (!canRevealSensitiveData) {
      toast.error('Access Denied: You do not have permission to view unmasked banking details.');
      return;
    }

    const willReveal = !actionModalRevealed;
    setActionModalRevealed(willReveal);

    if (willReveal && actionModal.payout) {
      toast.success('Banking details revealed');
      try {
        const token = localStorage.getItem('adminToken');
        await fetch(`${API_BASE_URL}/admin/payouts/${actionModal.payout._id}/audit-reveal`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            field: 'Bank Account (Process Action Modal)',
            partnerName: actionModal.payout.partner?.name
          })
        });
      } catch (err) {
        console.error('Failed to log reveal in audit trail:', err);
      }
    }
  };

  const handleToggleReceiptModalReveal = async () => {
    if (!canRevealSensitiveData) {
      toast.error('Access Denied: You do not have permission to view unmasked banking details.');
      return;
    }

    const willReveal = !receiptModalRevealed;
    setReceiptModalRevealed(willReveal);

    if (willReveal && selectedPayoutForReceipt) {
      toast.success('Disbursement banking details revealed');
      try {
        const token = localStorage.getItem('adminToken');
        await fetch(`${API_BASE_URL}/admin/payouts/${selectedPayoutForReceipt._id}/audit-reveal`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            field: 'Disbursement Advice Bank Details (Receipt Modal)',
            partnerName: selectedPayoutForReceipt.partner?.name
          })
        });
      } catch (err) {
        console.error('Failed to log reveal in audit trail:', err);
      }
    }
  };

  const handleToggleDetailsModalReveal = async () => {
    if (!canRevealSensitiveData) {
      toast.error('Access Denied: You do not have permission to view unmasked banking details.');
      return;
    }

    const willReveal = !detailsModalRevealed;
    setDetailsModalRevealed(willReveal);

    if (willReveal && selectedPayoutForDetails) {
      toast.success('Banking details unmasked');
      try {
        const token = localStorage.getItem('adminToken');
        await fetch(`${API_BASE_URL}/admin/payouts/${selectedPayoutForDetails._id}/audit-reveal`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            field: 'Bank Account & UPI (Payout Details 360 View)',
            partnerName: selectedPayoutForDetails.partner?.name
          })
        });
      } catch (err) {
        console.error('Failed to log reveal in audit trail:', err);
      }
    }
  };

  const openActionModal = (payout, type) => {
    setActionModalRevealed(false);
    let defaultTxn = '';
    let defaultRemarks = '';

    if (type === 'Verified') {
      defaultRemarks = 'Verified financial ledger, station charging sessions, and bank credentials (Maker).';
    } else if (type === 'Approved') {
      defaultRemarks = 'Approved by Checker. Authorized for corporate bank disbursement.';
    } else if (type === 'Processing') {
      defaultTxn = payout.transactionId || `TXN-${Math.floor(10000000 + Math.random() * 90000000)}`;
      defaultRemarks = 'Initiated transfer via corporate banking IMPS/NEFT gateway.';
    } else if (type === 'Completed') {
      defaultTxn = payout.transactionId || `TXN-${Math.floor(10000000 + Math.random() * 90000000)}`;
      defaultRemarks = 'Transfer completed and credited to beneficiary account.';
    } else if (type === 'Pending') {
      defaultRemarks = 'Reopened by Admin for re-review.';
    }

    setActionModal({
      isOpen: true,
      payout,
      type,
      transactionId: defaultTxn,
      remarks: defaultRemarks
    });
  };

  const handleConfirmAction = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!actionModal.payout) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/admin/payouts/${actionModal.payout._id}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          status: actionModal.type,
          remarks: actionModal.remarks,
          transactionId: actionModal.transactionId
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || `HTTP error! status: ${res.status}`);
      }
      if (data.success) {
        toast.success(`Payout marked as ${actionModal.type} successfully!`);
        setActionModal({ isOpen: false, payout: null, type: 'Completed', transactionId: '', remarks: '' });
        fetchPayouts();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to update payout status');
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics calculation
  const metrics = useMemo(() => {
    const totalCount = payouts.length;
    const totalAmount = payouts.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const pendingPayouts = payouts.filter(p => (p.status || 'Pending') === 'Pending');
    const pendingCount = pendingPayouts.length;
    const pendingAmount = pendingPayouts.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const verifiedPayouts = payouts.filter(p => p.status === 'Verified');
    const verifiedCount = verifiedPayouts.length;
    const verifiedAmount = verifiedPayouts.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const approvedPayouts = payouts.filter(p => p.status === 'Approved');
    const approvedCount = approvedPayouts.length;
    const approvedAmount = approvedPayouts.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const processingPayouts = payouts.filter(p => p.status === 'Processing');
    const processingCount = processingPayouts.length;
    const processingAmount = processingPayouts.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const completedPayouts = payouts.filter(p => p.status === 'Completed');
    const completedCount = completedPayouts.length;
    const completedAmount = completedPayouts.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const rejectedPayouts = payouts.filter(p => p.status === 'Rejected');
    const rejectedCount = rejectedPayouts.length;
    const rejectedAmount = rejectedPayouts.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const failedPayouts = payouts.filter(p => p.status === 'Failed');
    const failedCount = failedPayouts.length;
    const failedAmount = failedPayouts.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    return {
      totalCount,
      totalAmount,
      pendingCount,
      pendingAmount,
      verifiedCount,
      verifiedAmount,
      approvedCount,
      approvedAmount,
      processingCount,
      processingAmount,
      completedCount,
      completedAmount,
      rejectedCount,
      rejectedAmount,
      failedCount,
      failedAmount
    };
  }, [payouts]);

  // Open Bank Verification Modal (Points 5 & 12)
  const openVerifyModal = (payout) => {
    if (!payout) return;
    const partnerId = payout.partner?._id || payout.partner;
    const partnerName = payout.partner?.name || 'Partner';
    const vStatus = payout.bankDetails?.verificationStatus || payout.partner?.bankDetails?.verificationStatus || 'Verified';

    setVerifyModal({
      isOpen: true,
      partnerId,
      partnerName,
      currentStatus: vStatus,
      newStatus: vStatus,
      notes: '',
      loading: false
    });
  };

  // Bank Account Verification Update Handler (Point 5)
  const handleUpdateBankVerification = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!verifyModal.partnerId) return;

    setVerifyModal(prev => ({ ...prev, loading: true }));
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/admin/partners/${verifyModal.partnerId}/verify-bank`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          verificationStatus: verifyModal.newStatus,
          notes: verifyModal.notes
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Bank account verification status updated to ${verifyModal.newStatus}!`);

        // Real-time sync into selectedPayoutForDetails if currently open
        setSelectedPayoutForDetails(prev => {
          if (!prev) return null;
          return {
            ...prev,
            bankDetails: {
              ...(prev.bankDetails || {}),
              verificationStatus: verifyModal.newStatus,
              isVerified: verifyModal.newStatus === 'Verified'
            }
          };
        });

        setVerifyModal({ isOpen: false, partnerId: null, partnerName: '', currentStatus: 'Verified', newStatus: 'Verified', notes: '', loading: false });
        fetchPayouts();
      } else {
        throw new Error(data.message || 'Failed to update verification status');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to update bank verification');
    } finally {
      setVerifyModal(prev => ({ ...prev, loading: false }));
    }
  };

  // Dynamic unique Partner & Bank options (Point 9)
  const uniquePartners = useMemo(() => {
    const names = payouts.map(p => p.partner?.name).filter(Boolean);
    return Array.from(new Set(names)).sort();
  }, [payouts]);

  const uniqueBanks = useMemo(() => {
    const banks = payouts.map(p => p.bankDetails?.bankName).filter(Boolean);
    return Array.from(new Set(banks)).sort();
  }, [payouts]);

  // Active filter count & reset handler
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (dateFilter !== 'All') count++;
    if (partnerFilter !== 'All') count++;
    if (bankFilter !== 'All') count++;
    if (amountFilter !== 'All') count++;
    return count;
  }, [searchQuery, dateFilter, partnerFilter, bankFilter, amountFilter]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setDateFilter('All');
    setCustomStartDate('');
    setCustomEndDate('');
    setPartnerFilter('All');
    setBankFilter('All');
    setAmountFilter('All');
    toast.success('All filters cleared');
  };

  // Multi-Filter payouts (Points 7, 9, 10)
  const filteredPayouts = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return payouts.filter(payout => {
      // 1. Status Filter Tab
      const currentStatus = payout.status || 'Pending';
      const matchesStatus = statusFilter === 'All' || currentStatus.toLowerCase() === statusFilter.toLowerCase();
      
      // 2. Search Query
      const payoutIdStr = (payout.payoutId || `PAY-2026-${payout._id.slice(-6).toUpperCase()}`).toLowerCase();
      const partnerName = (payout.partner?.name || '').toLowerCase();
      const partnerPhone = (payout.partner?.phone || '').toLowerCase();
      const bankName = (payout.bankDetails?.bankName || '').toLowerCase();
      const accNumber = (payout.bankDetails?.accountNumber || '').toLowerCase();
      const accName = (payout.bankDetails?.accountName || '').toLowerCase();
      const txnId = (payout.transactionId || '').toLowerCase();
      const query = searchQuery.toLowerCase().trim();

      const matchesSearch = !query || 
        payoutIdStr.includes(query) ||
        txnId.includes(query) ||
        partnerName.includes(query) || 
        partnerPhone.includes(query) || 
        bankName.includes(query) || 
        accNumber.includes(query) || 
        accName.includes(query);

      // 3. Date Filter (Point 7)
      const pDate = new Date(payout.createdAt || Date.now()).getTime();
      let matchesDate = true;
      if (dateFilter === 'Today') {
        matchesDate = pDate >= todayStart;
      } else if (dateFilter === '7Days') {
        matchesDate = pDate >= sevenDaysAgo;
      } else if (dateFilter === '30Days') {
        matchesDate = pDate >= thirtyDaysAgo;
      } else if (dateFilter === 'ThisMonth') {
        matchesDate = pDate >= monthStart;
      } else if (dateFilter === 'Custom') {
        if (customStartDate) {
          const sTime = new Date(customStartDate).setHours(0, 0, 0, 0);
          if (pDate < sTime) matchesDate = false;
        }
        if (customEndDate) {
          const eTime = new Date(customEndDate).setHours(23, 59, 59, 999);
          if (pDate > eTime) matchesDate = false;
        }
      }

      // 4. Partner Filter (Point 9)
      const matchesPartner = partnerFilter === 'All' || (payout.partner?.name || '') === partnerFilter;

      // 5. Bank Filter (Point 9)
      const matchesBank = bankFilter === 'All' || (payout.bankDetails?.bankName || '') === bankFilter;

      // 6. Amount Range Filter (Point 10)
      const amt = Number(payout.amount) || 0;
      let matchesAmount = true;
      if (amountFilter === '0-1000') {
        matchesAmount = amt <= 1000;
      } else if (amountFilter === '1000-10000') {
        matchesAmount = amt > 1000 && amt <= 10000;
      } else if (amountFilter === '10000+') {
        matchesAmount = amt > 10000;
      }

      return matchesStatus && matchesSearch && matchesDate && matchesPartner && matchesBank && matchesAmount;
    });
  }, [payouts, statusFilter, searchQuery, dateFilter, customStartDate, customEndDate, partnerFilter, bankFilter, amountFilter]);

  // Bank Verification Badge Component (Point 5)
  const getBankVerificationBadge = (payout) => {
    const vStatus = payout.bankDetails?.verificationStatus || 'Verified';
    const partnerId = payout.partner?._id || payout.partner;
    const partnerName = payout.partner?.name || 'Partner';

    let colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100';
    let IconComp = CheckCircle2;
    let label = 'Verified';

    if (vStatus === 'Pending Verification') {
      colorClasses = 'bg-amber-50 text-amber-700 border-amber-200/80 hover:bg-amber-100';
      IconComp = Clock;
      label = 'Pending Verification';
    } else if (vStatus === 'Failed') {
      colorClasses = 'bg-rose-50 text-rose-700 border-rose-200/80 hover:bg-rose-100';
      IconComp = AlertTriangle;
      label = 'Failed';
    }

    return (
      <button
        type="button"
        onClick={() => openVerifyModal(payout)}
        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border transition cursor-pointer shrink-0 ${colorClasses}`}
        title={`Bank Verification: ${label}. Click to update status.`}
      >
        <IconComp size={11} className="shrink-0" />
        <span>{label}</span>
      </button>
    );
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Verified':
        return (
          <span className="px-2.5 py-1 bg-cyan-50 text-cyan-800 border border-cyan-200/90 rounded-full text-xs font-bold flex items-center gap-1.5 w-max">
            <Check size={14} className="text-cyan-600" /> Verified (Maker)
          </span>
        );
      case 'Approved':
        return (
          <span className="px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200/80 rounded-full text-xs font-bold flex items-center gap-1.5 w-max">
            <ShieldCheck size={14} className="text-blue-600" /> Approved (Checker)
          </span>
        );
      case 'Processing':
        return (
          <span className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200/70 rounded-full text-xs font-bold flex items-center gap-1.5 w-max">
            <RefreshCcw size={14} className="text-purple-600 animate-spin" /> Processing
          </span>
        );
      case 'Completed':
        return (
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-full text-xs font-bold flex items-center gap-1.5 w-max">
            <CheckCircle2 size={14} className="text-emerald-600" /> Completed
          </span>
        );
      case 'Rejected':
        return (
          <span className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200/60 rounded-full text-xs font-bold flex items-center gap-1.5 w-max">
            <XCircle size={14} className="text-rose-600" /> Rejected
          </span>
        );
      case 'Failed':
        return (
          <span className="px-3 py-1 bg-red-100 text-red-800 border border-red-300 rounded-full text-xs font-bold flex items-center gap-1.5 w-max">
            <AlertCircle size={14} className="text-red-600" /> Failed
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200/70 rounded-full text-xs font-bold flex items-center gap-1.5 w-max animate-pulse">
            <Clock size={14} className="text-amber-600" /> Pending (Maker Review)
          </span>
        );
    }
  };

  const printReceipt = (payout) => {
    if (!payout) return;
    const printWindow = window.open('', '_blank', 'width=800,height=850');
    if (!printWindow) {
      toast.error('Please allow popups to print payout receipt');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payout Settlement Advice - ${payout.payoutId || 'PAY-2026-' + payout._id.slice(-6).toUpperCase()}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 30px; color: #1f2937; }
          .header { border-bottom: 2px solid #8CC63F; padding-bottom: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; }
          .title { font-size: 22px; font-weight: 800; color: #116631; }
          .grid { display: flex; justify-content: space-between; margin-bottom: 24px; font-size: 13px; line-height: 1.6; }
          .badge { display: inline-block; background: #ecfdf5; color: #047857; font-weight: 700; padding: 4px 10px; border-radius: 9999px; border: 1px solid #a7f3d0; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          th { background: #f3f4f6; text-align: left; padding: 10px; font-size: 12px; text-transform: uppercase; }
          td { padding: 12px 10px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
          .total { font-size: 18px; font-weight: 800; color: #116631; text-align: right; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="no-print" style="text-align: right; margin-bottom: 16px;">
          <button onclick="window.print()" style="background:#8CC63F; color:#fff; border:none; padding:8px 16px; border-radius:6px; font-weight:bold; cursor:pointer;">🖨️ Print Receipt</button>
        </div>
        <div class="header">
          <div>
            <div class="title">⚡ BHARAT EV PRIME</div>
            <div style="font-size: 13px; color: #6b7280;">Partner Withdrawal & Settlement Advice</div>
          </div>
          <div style="text-align: right;">
            <span class="badge">SETTLEMENT ADVICE</span>
            <div style="font-size: 13px; font-weight: bold; margin-top: 4px; font-family: monospace;">Payout ID: ${payout.payoutId || 'PAY-2026-' + payout._id.slice(-6).toUpperCase()}</div>
            <div style="font-size: 12px; color: #4b5563; font-family: monospace;">Bank Ref: ${payout.transactionId || 'N/A'}</div>
            <div style="font-size: 12px; color: #6b7280;">Date: ${new Date(payout.createdAt).toLocaleDateString('en-GB')}</div>
          </div>
        </div>

        <div class="grid">
          <div>
            <strong>Beneficiary Partner:</strong><br/>
            ${payout.partner?.name || 'Partner'}<br/>
            Phone: ${payout.partner?.phone || 'N/A'}<br/>
            Email: ${payout.partner?.email || 'N/A'}
          </div>
          <div>
            <strong>Disbursed To Bank Account:</strong><br/>
            Bank: ${payout.bankDetails?.bankName || 'N/A'}<br/>
            A/c No: ${receiptModalRevealed ? (payout.bankDetails?.accountNumber || 'N/A') : maskAccountNumber(payout.bankDetails?.accountNumber)}<br/>
            IFSC: ${payout.bankDetails?.ifscCode || 'N/A'}<br/>
            Holder: ${payout.bankDetails?.accountName || 'N/A'}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Status</th>
              <th style="text-align: right;">Amount (INR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Partner EV Charging Revenue Withdrawal<br/><span style="font-size:11px; color:#6b7280;">Processed via e-Bharat Corporate Automated Settlement</span></td>
              <td><strong style="color:#059669;">${payout.status}</strong></td>
              <td style="text-align: right; font-weight: bold;">₹${Number(payout.amount).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <div style="text-align: right; margin-bottom: 30px;">
          <div style="font-size: 13px; color: #6b7280;">Net Transferred:</div>
          <div class="total">₹${Number(payout.amount).toLocaleString()}</div>
        </div>

        <div style="font-size: 11px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 16px;">
          This is an official system generated settlement receipt by Bharat EV Prime. Requires no physical signature.
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8CC63F]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-[#8CC63F] rounded-xl">
              <DollarSign size={24} />
            </span>
            Payout Requests
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">
            Manage, verify bank accounts, and approve partner withdrawal requests
          </p>
        </div>
        <button 
          onClick={fetchPayouts}
          className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors shadow-xs font-semibold text-sm cursor-pointer"
        >
          <RefreshCcw size={16} /> Refresh
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* 1. Total Requests Count */}
        <div className="bg-white p-4.5 rounded-2xl border border-gray-200/90 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">Total Requests</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <FileText size={18} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-gray-900 tracking-tight">{metrics.totalCount}</p>
            <p className="text-xs text-gray-500 mt-1 font-medium truncate">Total withdrawal requests</p>
          </div>
        </div>

        {/* 2. Total Payout Amount */}
        <div className="bg-white p-4.5 rounded-2xl border border-gray-200/90 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">Gross Volume</span>
            <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center shrink-0">
              <Wallet size={18} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-gray-900 tracking-tight font-mono">₹{metrics.totalAmount.toLocaleString('en-IN')}</p>
            <p className="text-xs text-gray-500 mt-1 font-medium truncate">Gross requested volume</p>
          </div>
        </div>

        {/* 3. In Pipeline / Queue */}
        <div className="bg-white p-4.5 rounded-2xl border border-amber-200/80 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between overflow-hidden bg-gradient-to-b from-white to-amber-50/20">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider truncate">In Pipeline</span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-amber-600 tracking-tight font-mono">
              ₹{(metrics.pendingAmount + metrics.verifiedAmount + metrics.approvedAmount + metrics.processingAmount).toLocaleString('en-IN')}
            </p>
            <p
              className="text-xs text-amber-700 font-medium mt-1 truncate"
              title={`${metrics.pendingCount} Pending • ${metrics.verifiedCount} Verified • ${metrics.approvedCount} Approved • ${metrics.processingCount} Processing`}
            >
              {metrics.pendingCount} Pend • {metrics.verifiedCount} Ver • {metrics.approvedCount} Appr • {metrics.processingCount} Proc
            </p>
          </div>
        </div>

        {/* 4. Completed / Paid */}
        <div className="bg-white p-4.5 rounded-2xl border border-emerald-200/80 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between overflow-hidden bg-gradient-to-b from-white to-emerald-50/20">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider truncate">Completed / Paid</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-emerald-600 tracking-tight font-mono">₹{metrics.completedAmount.toLocaleString('en-IN')}</p>
            <p className="text-xs text-emerald-700 font-medium mt-1 truncate">{metrics.completedCount} settled successfully</p>
          </div>
        </div>

        {/* 5. Rejected / Failed */}
        <div className="bg-white p-4.5 rounded-2xl border border-rose-200/80 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between overflow-hidden bg-gradient-to-b from-white to-rose-50/20">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider truncate">Declined / Failed</span>
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <XCircle size={18} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-gray-900 tracking-tight">{metrics.rejectedCount + metrics.failedCount}</p>
            <p className="text-xs text-rose-600 font-medium mt-1 truncate">
              {metrics.rejectedCount} Rejected • {metrics.failedCount} Failed
            </p>
          </div>
        </div>
      </div>

      {/* Multi-Filter and Search Bar (Points 7, 9, 10) */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-3.5">
        {/* Row 1: Status Filter Tabs & Search Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-gray-100/80 rounded-xl overflow-x-auto [scrollbar-width:none]">
            {[
              { id: 'All', label: 'All', count: metrics.totalCount },
              { id: 'Pending', label: 'Pending', count: metrics.pendingCount },
              { id: 'Verified', label: 'Verified', count: metrics.verifiedCount },
              { id: 'Approved', label: 'Approved', count: metrics.approvedCount },
              { id: 'Processing', label: 'Processing', count: metrics.processingCount },
              { id: 'Completed', label: 'Completed', count: metrics.completedCount },
              { id: 'Rejected', label: 'Rejected', count: metrics.rejectedCount },
              { id: 'Failed', label: 'Failed', count: metrics.failedCount },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  statusFilter === tab.id
                    ? 'bg-white text-gray-900 shadow-xs font-bold'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {tab.label}
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  statusFilter === tab.id ? 'bg-gray-100 text-gray-800' : 'bg-gray-200/70 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full lg:w-84 shrink-0">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search Payout ID, partner, A/c..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#8CC63F] focus:bg-white transition-all font-sans"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Secondary Dropdown Filters (Points 7, 9, 10) */}
        <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center gap-2.5 text-xs">
          <div className="flex items-center gap-1.5 text-gray-500 font-semibold text-[11px] uppercase tracking-wider mr-1 select-none">
            <Filter size={13} className="text-gray-400" /> Filters:
          </div>

          {/* 1. Date Range Filter (Point 7) */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200/90 rounded-xl px-2.5 py-1.5 shadow-2xs">
            <Calendar size={13} className="text-gray-400 shrink-0" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent text-gray-700 font-medium focus:outline-none cursor-pointer pr-1 text-xs"
            >
              <option value="All">Date: All Time</option>
              <option value="Today">Today</option>
              <option value="7Days">Last 7 Days</option>
              <option value="30Days">Last 30 Days</option>
              <option value="ThisMonth">This Month</option>
              <option value="Custom">Custom Date Range...</option>
            </select>
          </div>

          {/* Custom Date Pickers (Point 7) */}
          {dateFilter === 'Custom' && (
            <div className="flex items-center gap-1.5 bg-blue-50/70 border border-blue-200 rounded-xl px-2.5 py-1 text-blue-900 shadow-2xs">
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

          {/* 2. Partner Filter (Point 9) */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200/90 rounded-xl px-2.5 py-1.5 shadow-2xs">
            <User size={13} className="text-gray-400 shrink-0" />
            <select
              value={partnerFilter}
              onChange={(e) => setPartnerFilter(e.target.value)}
              className="bg-transparent text-gray-700 font-medium focus:outline-none cursor-pointer pr-1 text-xs max-w-[150px] truncate"
            >
              <option value="All">Partner: All</option>
              {uniquePartners.map(pName => (
                <option key={pName} value={pName}>{pName}</option>
              ))}
            </select>
          </div>

          {/* 3. Bank Filter (Point 9) */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200/90 rounded-xl px-2.5 py-1.5 shadow-2xs">
            <Building2 size={13} className="text-gray-400 shrink-0" />
            <select
              value={bankFilter}
              onChange={(e) => setBankFilter(e.target.value)}
              className="bg-transparent text-gray-700 font-medium focus:outline-none cursor-pointer pr-1 text-xs max-w-[140px] truncate"
            >
              <option value="All">Bank: All</option>
              {uniqueBanks.map(bName => (
                <option key={bName} value={bName}>{bName}</option>
              ))}
            </select>
          </div>

          {/* 4. Amount Range Filter (Point 10) */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200/90 rounded-xl px-2.5 py-1.5 shadow-2xs">
            <Wallet size={13} className="text-gray-400 shrink-0" />
            <select
              value={amountFilter}
              onChange={(e) => setAmountFilter(e.target.value)}
              className="bg-transparent text-gray-700 font-medium focus:outline-none cursor-pointer pr-1 text-xs"
            >
              <option value="All">Amount: All</option>
              <option value="0-1000">₹0 — ₹1,000</option>
              <option value="1000-10000">₹1,000 — ₹10,000</option>
              <option value="10000+">₹10,000+ (High Value)</option>
            </select>
          </div>

          {/* Reset Filters Button */}
          {activeFilterCount > 0 && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/70 rounded-xl transition cursor-pointer ml-auto shadow-2xs"
              title="Reset all active filters"
            >
              <RotateCcw size={12} />
              Reset Filters ({activeFilterCount})
            </button>
          )}
        </div>
      </div>

      {/* Security Privacy Notice */}
      <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl px-4 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs text-emerald-900 shadow-2xs">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-[#8CC63F] shrink-0" />
          <span>
            <strong>P0 Banking Data Privacy:</strong> Bank Account Numbers &amp; UPI IDs are masked by default (<code className="bg-emerald-100/70 px-1.5 py-0.5 rounded text-[11px] font-mono text-emerald-950 font-bold">A/c: ******5798</code>). Only authorized admins can unmask data, and all reveal actions are permanently audit-logged.
          </span>
        </div>
        <span className="shrink-0 text-[11px] font-semibold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full flex items-center gap-1">
          <Shield size={12} /> RBAC &amp; Audit Protected
        </span>
      </div>

      {/* Main Payouts Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
                <th className="p-3.5 whitespace-nowrap">Date</th>
                <th className="p-3.5 whitespace-nowrap">Payout ID</th>
                <th className="p-3.5">Partner</th>
                <th className="p-3.5 whitespace-nowrap">Amount</th>
                <th className="p-3.5">Bank</th>
                <th className="p-3.5 whitespace-nowrap">Verification</th>
                <th className="p-3.5 whitespace-nowrap">Status</th>
                <th className="p-3.5 whitespace-nowrap">UTR / Reference</th>
                <th className="p-3.5 text-right whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredPayouts.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-2">
                        <Wallet size={24} />
                      </div>
                      <p className="font-semibold text-gray-700">No payout requests found</p>
                      <p className="text-xs text-gray-400 mt-0.5">Try adjusting your filters or search keywords.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPayouts.map((payout) => {
                  const bDetails = payout.bankDetails || payout.partner?.bankDetails || {};
                  const hasBank = Boolean(bDetails.accountNumber && bDetails.accountNumber !== 'N/A');
                  const isRevealed = Boolean(revealedAccounts[payout._id]);
                  const displayPayoutId = payout.payoutId || `PAY-2026-${payout._id.slice(-6).toUpperCase()}`;
                  const isHighVal = Boolean(payout.isHighValue || Number(payout.amount) >= 10000);

                  return (
                    <tr key={payout._id} className="hover:bg-gray-50/60 transition-colors">
                      {/* 1. Date */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="text-xs font-semibold text-gray-900">
                          {new Date(payout.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                        <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                          {new Date(payout.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* 2. Payout ID */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs bg-gray-100 hover:bg-gray-200/80 text-gray-800 px-2 py-0.5 rounded-md border border-gray-200 transition-colors select-all">
                            {displayPayoutId}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(displayPayoutId, payout._id + '-id')}
                            className="text-gray-400 hover:text-emerald-700 transition cursor-pointer p-0.5"
                            title="Copy Payout ID"
                          >
                            {copiedAccount === payout._id + '-id' ? <CheckCheck size={12} className="text-emerald-600" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </td>

                      {/* 3. Partner (with High-Value badge) */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-gray-900 text-sm">
                            {payout.partner?.name || 'Unknown Partner'}
                          </span>
                          {isHighVal && (
                            <span 
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs" 
                              title="High-Value Payout (≥ ₹10,000): Dual-Admin Maker/Checker Approval Required"
                            >
                              🛡️ High Value
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 font-mono mt-0.5">
                          📞 {payout.partner?.phone || 'No phone'}
                        </div>
                        {payout.partner?.email && (
                          <div className="text-[11px] text-gray-400 truncate max-w-[170px]">
                            ✉️ {payout.partner.email}
                          </div>
                        )}
                      </td>

                      {/* 4. Amount */}
                      <td className="p-3.5 whitespace-nowrap font-extrabold text-gray-900 text-base">
                        ₹{Number(payout.amount).toLocaleString()}
                      </td>

                      {/* 5. Bank Details (Masked with Eye Toggle) */}
                      <td className="p-3.5">
                        {hasBank ? (
                          <div className="text-xs space-y-1 bg-gray-50/80 p-2 rounded-xl border border-gray-100 max-w-[240px]">
                            <div className="flex items-center gap-1 font-bold text-gray-800 truncate">
                              <Building2 size={13} className="text-[#8CC63F] shrink-0" />
                              <span className="truncate">{bDetails.bankName || 'Partner Bank'}</span>
                            </div>

                            {/* Masked / Revealed Account Number */}
                            <div className="flex items-center justify-between font-mono bg-white/80 px-2 py-0.5 rounded-lg border border-gray-200/60 shadow-2xs">
                              <span className="text-[11px] truncate">
                                <span className="text-gray-400 font-sans font-medium mr-1 select-none">A/c:</span>
                                {isRevealed ? (
                                  <span className="text-gray-900 font-bold tracking-tight">{bDetails.accountNumber}</span>
                                ) : (
                                  <span className="text-gray-600 tracking-wider font-semibold">{maskAccountNumber(bDetails.accountNumber)}</span>
                                )}
                              </span>
                              <div className="flex items-center gap-1 shrink-0 ml-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleToggleReveal(payout._id, payout.partner?.name, 'Bank Account Number')}
                                  className={`p-0.5 rounded cursor-pointer transition-colors ${
                                    isRevealed 
                                      ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100' 
                                      : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                                  }`}
                                  title={isRevealed ? 'Mask Account Number' : 'Reveal Account Number (Permission-controlled & Audit Logged)'}
                                >
                                  {isRevealed ? <EyeOff size={12} /> : <Eye size={12} />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(bDetails.accountNumber, payout._id, true)}
                                  className="text-gray-400 hover:text-emerald-700 transition-colors cursor-pointer p-0.5 rounded hover:bg-gray-100"
                                  title="Copy Full Account Number"
                                >
                                  {copiedAccount === payout._id ? <CheckCheck size={12} className="text-emerald-600" /> : <Copy size={12} />}
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium">
                              <span className="truncate">Holder: {bDetails.accountName || payout.partner?.name || 'N/A'}</span>
                              {bDetails.ifscCode && (
                                <span className="bg-white border border-gray-200 px-1 py-0.2 rounded font-mono text-[9px] text-gray-600 shrink-0 ml-1">
                                  {bDetails.ifscCode}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400 italic">
                            Bank details not submitted
                          </div>
                        )}
                      </td>

                      {/* 6. Bank Verification */}
                      <td className="p-3.5 whitespace-nowrap">
                        {getBankVerificationBadge(payout)}
                      </td>

                      {/* 7. Status & Audit Actors */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div>{getStatusBadge(payout.status)}</div>
                        {payout.verifiedBy?.name && (
                          <div className="text-[10px] text-cyan-800 font-medium mt-1 truncate max-w-[140px]" title={`Verified by Maker: ${payout.verifiedBy.name} (${payout.verifiedBy.email || ''})`}>
                            Maker: <span className="font-bold">{payout.verifiedBy.name}</span>
                          </div>
                        )}
                        {payout.approvedBy?.name && (
                          <div className="text-[10px] text-blue-800 font-medium mt-0.5 truncate max-w-[140px]" title={`Approved by Checker: ${payout.approvedBy.name} (${payout.approvedBy.email || ''})`}>
                            Checker: <span className="font-bold">{payout.approvedBy.name}</span>
                          </div>
                        )}
                      </td>

                      {/* 8. UTR / Bank Reference */}
                      <td className="p-3.5 whitespace-nowrap">
                        {payout.status === 'Completed' ? (
                          payout.transactionId ? (
                            <div className="flex items-center gap-1 bg-emerald-50 text-emerald-900 border border-emerald-200/90 px-2 py-1 rounded-md font-mono text-xs font-bold w-fit shadow-2xs">
                              <span className="text-emerald-700 font-bold select-none text-[10px]">UTR:</span>
                              <span className="select-all">{payout.transactionId}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(payout.transactionId, payout._id + '-utr')}
                                className="text-emerald-600 hover:text-emerald-950 p-0.5 rounded transition cursor-pointer"
                                title="Copy UTR / Bank Reference"
                              >
                                {copiedAccount === payout._id + '-utr' ? <CheckCheck size={11} className="text-emerald-700" /> : <Copy size={11} />}
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md w-fit">
                              <AlertCircle size={11} />
                              <span>UTR Pending</span>
                            </div>
                          )
                        ) : payout.transactionId ? (
                          <div className="text-[11px] text-gray-600 font-mono bg-gray-50 border border-gray-200 px-2 py-0.5 rounded w-fit">
                            Ref: {payout.transactionId}
                          </div>
                        ) : (
                          <span className="text-gray-400 font-mono text-xs">—</span>
                        )}
                      </td>

                      {/* 9. Action Buttons (Point 13: Maker–Checker Flow) */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Point 12: View Details button on EVERY row */}
                          <button
                            type="button"
                            onClick={() => { setDetailsModalRevealed(false); setSelectedPayoutForDetails(payout); }}
                            className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200/80 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                            title="View Full 360° Payout Details, Partner & Audit Timeline"
                          >
                            <Info size={13} className="text-gray-500" /> Details
                          </button>

                          {/* Pending status: Maker can Verify or Reject */}
                          {(!payout.status || payout.status === 'Pending') && (
                            <>
                              <button 
                                onClick={() => openActionModal(payout, 'Verified')}
                                className="px-2.5 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                title="Maker Verification: Verify billing ledger and bank information"
                              >
                                <Check size={13} /> Verify (Maker)
                              </button>
                              <button 
                                onClick={() => openActionModal(payout, 'Rejected')}
                                className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                title="Reject Payout Request (Reason Mandatory)"
                              >
                                <X size={13} /> Reject
                              </button>
                            </>
                          )}

                          {/* Verified status: Checker can Approve or Reject */}
                          {payout.status === 'Verified' && (
                            <>
                              <button 
                                onClick={() => openActionModal(payout, 'Approved')}
                                className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                title="Checker Authorization: Approve verified payout for bank disbursement"
                              >
                                <ShieldCheck size={13} /> Approve (Checker)
                              </button>
                              <button 
                                onClick={() => openActionModal(payout, 'Rejected')}
                                className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                title="Reject Request"
                              >
                                <X size={13} /> Reject
                              </button>
                            </>
                          )}

                          {/* Approved status: Finance Admin can initiate bank transfer */}
                          {payout.status === 'Approved' && (
                            <>
                              <button 
                                onClick={() => openActionModal(payout, 'Processing')}
                                className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                title="Initiate Transfer via Corporate Banking IMPS/NEFT"
                              >
                                <RefreshCcw size={13} /> Process
                              </button>
                              <button 
                                onClick={() => openActionModal(payout, 'Rejected')}
                                className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg text-xs transition-colors cursor-pointer"
                                title="Reject Request"
                              >
                                <X size={13} />
                              </button>
                            </>
                          )}

                          {/* Processing status: Confirm Completed (with UTR) or mark Failed */}
                          {payout.status === 'Processing' && (
                            <>
                              <button 
                                onClick={() => openActionModal(payout, 'Completed')}
                                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                title="Complete Settlement Transfer with UTR"
                              >
                                <Check size={13} /> Complete
                              </button>
                              <button 
                                onClick={() => openActionModal(payout, 'Failed')}
                                className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                title="Mark Transfer as Failed"
                              >
                                <AlertCircle size={13} /> Failed
                              </button>
                            </>
                          )}

                          {/* Completed status: View Receipt & Print */}
                          {payout.status === 'Completed' && (
                            <>
                              <button 
                                onClick={() => { setReceiptModalRevealed(false); setSelectedPayoutForReceipt(payout); }}
                                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                title="View Downloadable / Printable Payment Receipt"
                              >
                                <FileText size={13} /> Receipt
                              </button>
                              <button 
                                onClick={() => printReceipt(payout)}
                                className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                                title="Print / Save PDF Receipt"
                              >
                                <Printer size={14} />
                              </button>
                            </>
                          )}

                          {/* Rejected or Failed: Reason tag & Retry button */}
                          {(payout.status === 'Rejected' || payout.status === 'Failed') && (
                            <>
                              <span className="text-[11px] text-rose-600 font-medium bg-rose-50 px-2 py-0.5 rounded border border-rose-200/50 max-w-[120px] truncate" title={payout.remarks || payout.status}>
                                {payout.remarks || payout.status}
                              </span>
                              <button
                                onClick={() => openActionModal(payout, 'Pending')}
                                className="text-xs text-blue-600 hover:text-blue-800 underline font-semibold cursor-pointer"
                                title="Re-open into review queue"
                              >
                                Retry
                              </button>
                            </>
                          )}
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

      {/* Approve / Process / Complete / Reject / Fail Action Modal */}
      {actionModal.isOpen && actionModal.payout && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-gray-100 my-auto animate-scale-up max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className={`p-2 rounded-xl ${
                  actionModal.type === 'Verified' ? 'bg-cyan-50 text-cyan-600' :
                  actionModal.type === 'Approved' ? 'bg-blue-50 text-blue-600' :
                  actionModal.type === 'Processing' ? 'bg-purple-50 text-purple-600' :
                  actionModal.type === 'Completed' ? 'bg-emerald-50 text-emerald-600' :
                  actionModal.type === 'Failed' ? 'bg-red-50 text-red-600' :
                  actionModal.type === 'Pending' ? 'bg-amber-50 text-amber-600' :
                  'bg-rose-50 text-rose-600'
                }`}>
                  {actionModal.type === 'Verified' ? <Check size={20} /> :
                   actionModal.type === 'Approved' ? <ShieldCheck size={20} /> :
                   actionModal.type === 'Processing' ? <RefreshCcw size={20} className="animate-spin" /> :
                   actionModal.type === 'Completed' ? <CheckCircle2 size={20} /> :
                   actionModal.type === 'Pending' ? <Clock size={20} /> :
                   <AlertCircle size={20} />}
                </span>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {actionModal.type === 'Verified' ? 'Maker Verification: Verify Payout' :
                     actionModal.type === 'Approved' ? 'Checker Authorization: Approve Payout' :
                     actionModal.type === 'Processing' ? 'Initiate Payout Transfer' :
                     actionModal.type === 'Completed' ? 'Confirm Settlement Completion' :
                     actionModal.type === 'Failed' ? 'Mark Transfer as Failed' :
                     actionModal.type === 'Pending' ? 'Reopen Payout Request' :
                     'Reject Payout Request'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {actionModal.type === 'Verified' 
                      ? 'Maker Review: Validate billing ledger and bank credentials'
                      : actionModal.type === 'Approved'
                      ? 'Checker Review: Authorize disbursement for processing'
                      : `Request from ${actionModal.payout.partner?.name || 'Partner'}`}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setActionModal({ isOpen: false, payout: null, type: 'Completed', transactionId: '', remarks: '' })}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Payout Summary Preview */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/80 mb-4 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">Payout Request ID:</span>
                <span className="font-mono font-bold text-xs bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded">
                  {actionModal.payout.payoutId || `PAY-2026-${actionModal.payout._id.slice(-6).toUpperCase()}`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">Payout Amount:</span>
                <span className="font-extrabold text-base text-gray-900">₹{Number(actionModal.payout.amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">Current Status:</span>
                <div>{getStatusBadge(actionModal.payout.status || 'Pending')}</div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">Bank Name:</span>
                <span className="font-bold text-gray-800">{actionModal.payout.bankDetails?.bankName || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">Account Number:</span>
                <div className="flex items-center gap-1.5 font-mono">
                  <span className={actionModalRevealed ? 'text-gray-900 font-bold' : 'text-gray-700 font-semibold'}>
                    {actionModalRevealed 
                      ? (actionModal.payout.bankDetails?.accountNumber || 'N/A') 
                      : maskAccountNumber(actionModal.payout.bankDetails?.accountNumber)}
                  </span>
                  <button
                    type="button"
                    onClick={handleToggleActionModalReveal}
                    className={`p-1 rounded cursor-pointer transition ${
                      actionModalRevealed ? 'text-emerald-700 bg-emerald-100/60' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-200/60'
                    }`}
                    title={actionModalRevealed ? 'Mask Account Number' : 'Reveal Account Number (Audit Logged)'}
                  >
                    {actionModalRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">IFSC Code:</span>
                <span className="font-mono text-gray-800">{actionModal.payout.bankDetails?.ifscCode || 'N/A'}</span>
              </div>
              {actionModal.payout.bankDetails?.upiId && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">UPI VPA:</span>
                  <span className="font-mono text-emerald-700 font-medium">
                    {actionModalRevealed ? actionModal.payout.bankDetails.upiId : maskUpiId(actionModal.payout.bankDetails.upiId)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pt-1 border-t border-gray-200/60">
                <span className="text-gray-500 font-medium">Bank Verification:</span>
                <div>{getBankVerificationBadge(actionModal.payout)}</div>
              </div>
            </div>

            {/* High-Value Security Notice */}
            {(actionModal.payout.isHighValue || Number(actionModal.payout.amount) >= 10000) && (
              <div className="bg-amber-50/90 border border-amber-300/80 rounded-xl p-3 text-amber-950 text-xs flex items-start gap-2 mb-3.5 shadow-2xs">
                <Shield size={16} className="text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-950">High-Value Payout Security Policy (≥ ₹10,000)</p>
                  <p className="mt-0.5 text-amber-900 leading-relaxed">
                    Dual-admin verification (Maker Review + Checker Authorization) is strictly enforced for this high-value withdrawal before bank disbursement.
                  </p>
                </div>
              </div>
            )}

            {/* Maker-Checker Segregation Alert */}
            {actionModal.type === 'Approved' && actionModal.payout?.verifiedBy?.email && actionModal.payout.verifiedBy.email === admin?.email && !isSuperAdmin && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-amber-950 text-xs flex items-start gap-2 mb-3.5 shadow-2xs">
                <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-950">Maker–Checker Segregation Alert</p>
                  <p className="mt-0.5 text-amber-900 leading-relaxed">
                    You verified this payout as <strong>Maker</strong>. In accordance with financial security policy, Checker approval should be authorized by a different administrator or Super Admin.
                  </p>
                </div>
              </div>
            )}

            {/* Bank Verification Safeguard Alert (Point 5) */}
            {actionModal.payout.bankDetails?.verificationStatus && actionModal.payout.bankDetails.verificationStatus !== 'Verified' && (
              <div className="bg-amber-50 border border-amber-200/90 rounded-xl p-3 text-amber-900 text-xs flex items-start gap-2.5 mb-4 shadow-2xs">
                <AlertTriangle size={17} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-950">Bank Account Verification Alert</p>
                  <p className="mt-0.5 text-amber-800 leading-relaxed">
                    This partner's bank account status is currently <strong className="uppercase underline font-extrabold text-amber-950">{actionModal.payout.bankDetails.verificationStatus}</strong>. Please ensure the banking details match the partner's verified company documents before approving disbursement.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleConfirmAction} className="space-y-4">
              {actionModal.type === 'Completed' ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Bank Transaction / UTR Reference ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={actionModal.transactionId}
                    onChange={(e) => setActionModal(prev => ({ ...prev, transactionId: e.target.value }))}
                    placeholder="e.g. TXN-98472910"
                    className="w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded-lg focus:outline-none focus:border-[#8CC63F] focus:ring-1 focus:ring-[#8CC63F]"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">This official UTR will be shared with the partner in their settlement slip.</p>
                </div>
              ) : actionModal.type === 'Processing' ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Bank Reference / Gateway Txn ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={actionModal.transactionId}
                    onChange={(e) => setActionModal(prev => ({ ...prev, transactionId: e.target.value }))}
                    placeholder="e.g. TXN-82739411"
                    className="w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">IMPS/NEFT/RTGS initiation transaction reference.</p>
                </div>
              ) : null}

              {actionModal.type === 'Rejected' || actionModal.type === 'Failed' ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {actionModal.type === 'Rejected' ? 'Reason for Rejection' : 'Reason for Failure / Bank Return Note'} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={actionModal.remarks}
                    onChange={(e) => setActionModal(prev => ({ ...prev, remarks: e.target.value }))}
                    placeholder={actionModal.type === 'Rejected' 
                      ? "e.g. Bank IFSC does not match branch, please update details in profile."
                      : "e.g. Beneficiary account inactive / Bank server timed out during NEFT transfer."
                    }
                    className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none ${
                      actionModal.type === 'Rejected' ? 'focus:border-rose-500 focus:ring-1 focus:ring-rose-500' : 'focus:border-red-500 focus:ring-1 focus:ring-red-500'
                    }`}
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Admin Note / Remarks {actionModal.type === 'Pending' ? '(Reason for reopening)' : '(Optional)'}
                  </label>
                  <input
                    type="text"
                    value={actionModal.remarks}
                    onChange={(e) => setActionModal(prev => ({ ...prev, remarks: e.target.value }))}
                    placeholder={
                      actionModal.type === 'Verified' ? "e.g. Verified charging station revenue and bank credentials (Maker)" :
                      actionModal.type === 'Approved' ? "e.g. Checker authorization granted for bank disbursement" :
                      actionModal.type === 'Processing' ? "e.g. Sent to Bank IMPS gateway" :
                      actionModal.type === 'Completed' ? "e.g. Disbursed successfully" :
                      "e.g. Reopened for re-review"
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setActionModal({ isOpen: false, payout: null, type: 'Completed', transactionId: '', remarks: '' })}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className={`px-5 py-2 text-sm font-semibold text-white rounded-lg transition-colors flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 ${
                    actionModal.type === 'Verified' ? 'bg-cyan-600 hover:bg-cyan-700' :
                    actionModal.type === 'Approved' ? 'bg-blue-600 hover:bg-blue-700' :
                    actionModal.type === 'Processing' ? 'bg-purple-600 hover:bg-purple-700' :
                    actionModal.type === 'Completed' ? 'bg-[#8CC63F] hover:bg-[#116631]' :
                    actionModal.type === 'Failed' ? 'bg-red-600 hover:bg-red-700' :
                    actionModal.type === 'Pending' ? 'bg-amber-600 hover:bg-amber-700' :
                    'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {actionLoading ? (
                    'Processing...'
                  ) : actionModal.type === 'Verified' ? (
                    <>Verify Payout (Maker)</>
                  ) : actionModal.type === 'Approved' ? (
                    <>Authorize &amp; Approve (Checker)</>
                  ) : actionModal.type === 'Processing' ? (
                    <>Initiate Transfer</>
                  ) : actionModal.type === 'Completed' ? (
                    <>Confirm Settlement</>
                  ) : actionModal.type === 'Failed' ? (
                    <>Mark as Failed</>
                  ) : actionModal.type === 'Pending' ? (
                    <>Reopen Request</>
                  ) : (
                    <>Reject Payout</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 360° Payout Details Modal (Point 12: View Details separated from View Receipt) */}
      {selectedPayoutForDetails && (() => {
        const p = selectedPayoutForDetails;
        const bDetails = p.bankDetails || p.partner?.bankDetails || {};
        const pId = p.payoutId || `PAY-2026-${p._id.slice(-6).toUpperCase()}`;
        const isCompleted = p.status === 'Completed';

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl border border-gray-100 my-auto animate-scale-up max-h-[90vh] flex flex-col">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-3">
                  <span className="p-2.5 bg-blue-50 text-blue-700 rounded-xl">
                    <Info size={22} />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-900">Payout Details &amp; Audit Overview</h3>
                      {getStatusBadge(p.status)}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 select-all">
                        {pId}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(pId, 'modal-pid')}
                        className="text-gray-400 hover:text-blue-700 transition cursor-pointer p-0.5"
                        title="Copy Payout ID"
                      >
                        {copiedAccount === 'modal-pid' ? <CheckCheck size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      </button>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">
                        Requested: {new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} at {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => { setSelectedPayoutForDetails(null); setDetailsModalRevealed(false); }}
                  className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Modal Body */}
              <div className="overflow-y-auto pr-1 space-y-4 py-4 text-xs">

                {/* High-Value Security Banner */}
                {(p.isHighValue || Number(p.amount) >= 10000) && (
                  <div className="bg-amber-50/90 border border-amber-300 rounded-xl p-3 text-amber-950 text-xs flex items-center justify-between gap-2 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <Shield size={16} className="text-amber-700 shrink-0" />
                      <div>
                        <strong className="text-amber-950 font-bold">Dual-Control High-Value Transaction (₹{Number(p.amount).toLocaleString()}):</strong>
                        <span className="text-amber-900 ml-1">Subject to Maker–Checker dual-admin authentication and audit surveillance.</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200/90 text-amber-950 shrink-0">
                      DUAL APPROVAL ENFORCED
                    </span>
                  </div>
                )}
                
                {/* 1. Metric Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-3.5 rounded-xl border border-emerald-200/80">
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Disbursal Amount</span>
                    <div className="text-2xl font-black text-emerald-900 mt-1">
                      ₹{Number(p.amount).toLocaleString()}
                    </div>
                    <span className="text-[10px] text-emerald-700 font-medium mt-0.5 block">Net Settlement Amount</span>
                  </div>

                  <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200/80">
                    <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block">Bank UTR / Reference</span>
                    <div className="font-mono font-bold text-sm text-gray-900 mt-1.5 truncate">
                      {p.transactionId ? (
                        <div className="flex items-center gap-1">
                          <span className="select-all">{p.transactionId}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(p.transactionId, 'modal-utr')}
                            className="text-gray-400 hover:text-emerald-700 transition cursor-pointer p-0.5"
                            title="Copy UTR"
                          >
                            {copiedAccount === 'modal-utr' ? <CheckCheck size={12} className="text-emerald-600" /> : <Copy size={12} />}
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 font-sans italic text-xs font-normal">Pending Bank Dispatch</span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-500 mt-0.5 block">
                      {p.status === 'Completed' ? 'Settled with Clearing House' : 'To be assigned upon transfer'}
                    </span>
                  </div>

                  <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200/80">
                    <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block">Account Verification</span>
                    <div className="mt-1.5">
                      {getBankVerificationBadge(p)}
                    </div>
                    <span className="text-[10px] text-gray-500 mt-1 block">
                      {bDetails.isVerified ? 'Verified & Pre-approved' : 'Requires penny-drop verification'}
                    </span>
                  </div>
                </div>

                {/* 2. Partner Profile Card */}
                <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-200/70 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-gray-200/60 pb-2">
                    <div className="flex items-center gap-1.5 font-bold text-gray-800 text-sm">
                      <User size={15} className="text-blue-600" /> Partner Information
                    </div>
                    <span className="text-[11px] font-mono text-gray-500">ID: {p.partner?._id || 'N/A'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-gray-500 block text-[11px]">Partner / Business Name</span>
                      <span className="font-bold text-gray-900 text-sm">{p.partner?.name || 'Unknown Partner'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[11px]">Primary Contact</span>
                      <span className="font-mono text-gray-800 font-semibold">📞 {p.partner?.phone || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[11px]">Email Address</span>
                      <span className="text-gray-800">✉️ {p.partner?.email || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[11px]">Registered Address</span>
                      <span className="text-gray-700">{p.partner?.address || 'India (Partner Registered Location)'}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Banking & Settlement Card with Mask/Unmask */}
                <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-200/70 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-gray-200/60 pb-2">
                    <div className="flex items-center gap-1.5 font-bold text-gray-800 text-sm">
                      <Building2 size={15} className="text-[#8CC63F]" /> Bank Account &amp; Disbursement Channel
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openVerifyModal(p)}
                        className="text-[11px] text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200/90 px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        title="Update Bank Verification Status"
                      >
                        <ShieldCheck size={13} className="text-blue-600" /> Change Verification
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-gray-500 block text-[11px]">Bank Name</span>
                      <span className="font-bold text-gray-900">{bDetails.bankName || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[11px]">Account Holder Name</span>
                      <span className="font-semibold text-gray-900">{bDetails.accountName || p.partner?.name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[11px]">Account Number (P0 Masked)</span>
                      <div className="flex items-center gap-1.5 font-mono mt-0.5">
                        <span className={`px-2 py-0.5 rounded border ${
                          detailsModalRevealed 
                            ? 'bg-emerald-50 text-emerald-950 font-bold border-emerald-200' 
                            : 'bg-white text-gray-800 font-semibold border-gray-200'
                        }`}>
                          {detailsModalRevealed 
                            ? (bDetails.accountNumber || 'N/A')
                            : maskAccountNumber(bDetails.accountNumber)}
                        </span>
                        <button
                          type="button"
                          onClick={handleToggleDetailsModalReveal}
                          className={`p-1 rounded cursor-pointer transition ${
                            detailsModalRevealed ? 'text-emerald-700 bg-emerald-100/70' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-200/60'
                          }`}
                          title={detailsModalRevealed ? 'Mask Account Number' : 'Reveal Account Number (Audit Logged)'}
                        >
                          {detailsModalRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopy(bDetails.accountNumber, 'modal-acc', true)}
                          className="text-gray-400 hover:text-emerald-700 transition cursor-pointer p-1 rounded hover:bg-gray-200/60"
                          title="Copy Full Account Number"
                        >
                          {copiedAccount === 'modal-acc' ? <CheckCheck size={13} className="text-emerald-600" /> : <Copy size={13} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[11px]">IFSC Code</span>
                      <span className="font-mono font-bold text-gray-900">{bDetails.ifscCode || 'N/A'}</span>
                    </div>
                    {bDetails.upiId && (
                      <div>
                        <span className="text-gray-500 block text-[11px]">UPI VPA (Masked)</span>
                        <div className="flex items-center gap-1.5 font-mono mt-0.5 text-emerald-800">
                          <span className="bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {detailsModalRevealed ? bDetails.upiId : maskUpiId(bDetails.upiId)}
                          </span>
                        </div>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500 block text-[11px]">Payment Mode</span>
                      <span className="text-gray-800 font-medium">NEFT / RTGS / IMPS Automated Clearing</span>
                    </div>
                  </div>
                </div>

                {/* 4. Complete 5-Stage Maker–Checker Lifecycle & Audit Stepper */}
                <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-200/70 space-y-3">
                  <div className="flex items-center gap-1.5 font-bold text-gray-800 text-sm border-b border-gray-200/60 pb-2">
                    <Clock size={15} className="text-purple-600" /> 5-Stage Maker–Checker Approval &amp; Settlement Stepper
                  </div>

                  <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                    
                    {/* Stage 1: Request Created */}
                    <div className="relative">
                      <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                        ✓
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">1. Payout Request Submitted</div>
                        <p className="text-gray-500 text-[11px]">
                          Partner requested withdrawal of ₹{Number(p.amount).toLocaleString()} from charging station revenue.
                        </p>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {new Date(p.createdAt).toLocaleString('en-GB')}
                        </span>
                      </div>
                    </div>

                    {/* Stage 2: Maker Verification */}
                    <div className="relative">
                      <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs ${
                        ['Verified', 'Approved', 'Processing', 'Completed'].includes(p.status)
                          ? 'bg-cyan-600 text-white'
                          : p.status === 'Rejected' && !p.verifiedBy?.name
                          ? 'bg-rose-500 text-white'
                          : 'bg-cyan-500 text-white animate-pulse'
                      }`}>
                        {['Verified', 'Approved', 'Processing', 'Completed'].includes(p.status) ? '✓' : p.status === 'Rejected' && !p.verifiedBy?.name ? '✕' : '2'}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">
                          {['Verified', 'Approved', 'Processing', 'Completed'].includes(p.status)
                            ? '2. Maker Verification Completed'
                            : p.status === 'Rejected' && !p.verifiedBy?.name
                            ? '2. Rejected at Maker Review'
                            : '2. Maker Review & Verification (Pending)'}
                        </div>
                        <p className="text-gray-600 text-[11px] mt-0.5">
                          {p.verifiedBy?.name ? (
                            <span>
                              Verified by Maker: <strong className="text-cyan-900">{p.verifiedBy.name}</strong> ({p.verifiedBy.email || 'Admin'}) on {p.verifiedBy.at ? new Date(p.verifiedBy.at).toLocaleString('en-GB') : 'Verified'}.
                              {p.verifiedBy.notes && <span className="block italic text-gray-500 mt-0.5">"{p.verifiedBy.notes}"</span>}
                            </span>
                          ) : p.status === 'Rejected' ? (
                            `Rejected before Maker verification. Reason: ${p.remarks || 'Compliance criteria not met'}`
                          ) : (
                            'Awaiting administrator / employee verification against partner billing ledger and bank credentials.'
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Stage 3: Checker Authorization */}
                    <div className="relative">
                      <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs ${
                        ['Approved', 'Processing', 'Completed'].includes(p.status)
                          ? 'bg-blue-600 text-white'
                          : p.status === 'Verified'
                          ? 'bg-blue-500 text-white animate-pulse'
                          : p.status === 'Rejected' && p.verifiedBy?.name
                          ? 'bg-rose-500 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}>
                        {['Approved', 'Processing', 'Completed'].includes(p.status) ? '✓' : p.status === 'Rejected' && p.verifiedBy?.name ? '✕' : '3'}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">
                          {['Approved', 'Processing', 'Completed'].includes(p.status)
                            ? '3. Checker Authorization Approved'
                            : p.status === 'Verified'
                            ? '3. Awaiting Checker Authorization (Dual-Control)'
                            : p.status === 'Rejected' && p.verifiedBy?.name
                            ? '3. Rejected by Checker'
                            : '3. Checker Authorization'}
                        </div>
                        <p className="text-gray-600 text-[11px] mt-0.5">
                          {p.approvedBy?.name ? (
                            <span>
                              Authorized by Checker: <strong className="text-blue-900">{p.approvedBy.name}</strong> ({p.approvedBy.email || 'Checker'}) on {p.approvedBy.at ? new Date(p.approvedBy.at).toLocaleString('en-GB') : 'Approved'}.
                              {p.approvedBy.notes && <span className="block italic text-gray-500 mt-0.5">"{p.approvedBy.notes}"</span>}
                            </span>
                          ) : p.status === 'Verified' ? (
                            'Maker review passed. Awaiting independent Checker authorization for corporate bank disbursement.'
                          ) : p.status === 'Rejected' && p.verifiedBy?.name ? (
                            `Rejected by Checker. Reason: ${p.remarks || 'Authorization declined'}`
                          ) : (
                            'Queued after Maker verification.'
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Stage 4: Corporate Banking Dispatch */}
                    <div className="relative">
                      <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs ${
                        ['Processing', 'Completed'].includes(p.status)
                          ? 'bg-purple-500 text-white'
                          : p.status === 'Failed'
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}>
                        {['Processing', 'Completed'].includes(p.status) ? '✓' : p.status === 'Failed' ? '✕' : '4'}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">
                          {p.status === 'Processing' ? '4. Corporate Bank Transfer Dispatching' :
                           p.status === 'Completed' ? '4. Corporate Bank Transfer Cleared' :
                           p.status === 'Failed' ? '4. Transfer Failed at Bank' : '4. Bank Processing Dispatch'}
                        </div>
                        <p className="text-gray-500 text-[11px] mt-0.5">
                          {p.status === 'Processing' ? 'Payment batch dispatched to partner bank clearing system (IMPS/NEFT).' :
                           p.status === 'Completed' ? 'Dispatched and cleared via banking network.' :
                           p.status === 'Failed' ? `Bank rejected transaction. Notes: ${p.remarks || 'Account or IFSC mismatch'}` :
                           'Pending batch creation.'}
                        </p>
                      </div>
                    </div>

                    {/* Stage 5: Settlement & UTR Confirmation */}
                    <div className="relative">
                      <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs ${
                        p.status === 'Completed'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}>
                        {p.status === 'Completed' ? '✓' : '5'}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">
                          {p.status === 'Completed' ? '5. Settlement Completed & Disbursed' : '5. Final Settlement & UTR Confirmation'}
                        </div>
                        <div className="text-gray-500 text-[11px] mt-0.5">
                          {p.status === 'Completed' ? (
                            <span>
                              Disbursed with Bank UTR: <strong className="font-mono text-emerald-800">{p.transactionId}</strong> on {p.processedAt ? new Date(p.processedAt).toLocaleString('en-GB') : new Date(p.updatedAt).toLocaleString('en-GB')}
                              {p.completedBy?.name && (
                                <span className="block text-[10px] text-gray-400 mt-0.5">Settled by {p.completedBy.name} ({p.completedBy.email})</span>
                              )}
                            </span>
                          ) : (
                            'Pending final acknowledgement from clearing bank.'
                          )}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Remarks & Notes (if any) */}
                {p.remarks && (
                  <div className="bg-amber-50/70 border border-amber-200/80 p-3 rounded-xl text-amber-900">
                    <span className="font-bold text-[11px] uppercase tracking-wide block">Audit Notes / Remarks:</span>
                    <p className="mt-0.5 text-xs italic">{p.remarks}</p>
                  </div>
                )}

              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-2 shrink-0">
                <button
                  type="button"
                  onClick={() => { setSelectedPayoutForDetails(null); setDetailsModalRevealed(false); }}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                >
                  Close
                </button>

                <div className="flex items-center gap-2">
                  {/* View & Print Receipt shortcut if Completed */}
                  {isCompleted && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPayoutForDetails(null);
                          setReceiptModalRevealed(false);
                          setSelectedPayoutForReceipt(p);
                        }}
                        className="px-4 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                        title="Open Printable Payment Advice Slip"
                      >
                        <FileText size={14} /> View Receipt
                      </button>
                      <button
                        type="button"
                        onClick={() => printReceipt(p)}
                        className="px-4 py-2 text-xs font-semibold text-white bg-[#8CC63F] hover:bg-[#116631] rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                        title="Print PDF Receipt"
                      >
                        <Printer size={14} /> Print Receipt
                      </button>
                    </>
                  )}

                  {/* Pending: Maker can Verify or Reject */}
                  {(!p.status || p.status === 'Pending') && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPayoutForDetails(null);
                          openActionModal(p, 'Verified');
                        }}
                        className="px-4 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Check size={14} /> Verify (Maker)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPayoutForDetails(null);
                          openActionModal(p, 'Rejected');
                        }}
                        className="px-3 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {/* Verified: Checker can Approve or Reject */}
                  {p.status === 'Verified' && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPayoutForDetails(null);
                          openActionModal(p, 'Approved');
                        }}
                        className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <ShieldCheck size={14} /> Authorize &amp; Approve (Checker)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPayoutForDetails(null);
                          openActionModal(p, 'Rejected');
                        }}
                        className="px-3 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {/* Approved: Initiate Bank Transfer */}
                  {p.status === 'Approved' && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPayoutForDetails(null);
                        openActionModal(p, 'Processing');
                      }}
                      className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <RefreshCcw size={14} /> Initiate Bank Transfer
                    </button>
                  )}

                  {/* Processing: Complete with UTR */}
                  {p.status === 'Processing' && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPayoutForDetails(null);
                        openActionModal(p, 'Completed');
                      }}
                      className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Check size={14} /> Confirm Transfer (Enter UTR)
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Transaction Receipt Modal (Compact & Viewport Managed) */}
      {selectedPayoutForReceipt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-[460px] w-full p-4 sm:p-5 shadow-2xl border border-gray-100 flex flex-col max-h-[92vh] my-auto animate-scale-up">
            
            {/* Modal Header (Fixed, Never Cut Off) */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                  <FileText size={18} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-gray-900 leading-tight">Payout Transfer Advice</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                      {selectedPayoutForReceipt.payoutId || `PAY-2026-${selectedPayoutForReceipt._id.slice(-6).toUpperCase()}`}
                    </span>
                    {selectedPayoutForReceipt.transactionId && (
                      <span className="text-[10px] font-mono text-gray-500 font-medium">
                        Ref: {selectedPayoutForReceipt.transactionId}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPayoutForReceipt(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Content Body (Compact Receipt Slip) */}
            <div className="overflow-y-auto pr-1 space-y-2.5 text-xs">
              
              {/* Compact Transfer Amount Seal */}
              <div className="py-2.5 px-3.5 bg-gradient-to-r from-emerald-50 to-emerald-100/50 border border-emerald-200/80 rounded-xl flex items-center justify-between shadow-2xs">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest block">Net Disbursed Amount</span>
                  <div className="text-2xl font-black text-emerald-900 leading-tight mt-0.5">
                    ₹{Number(selectedPayoutForReceipt.amount).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full">
                    <CheckCircle2 size={11} /> Settled
                  </div>
                  <span className="block text-[10px] text-emerald-700 font-medium mt-1">
                    {selectedPayoutForReceipt.processedAt 
                      ? new Date(selectedPayoutForReceipt.processedAt).toLocaleDateString('en-GB')
                      : new Date(selectedPayoutForReceipt.updatedAt).toLocaleDateString('en-GB')}
                  </span>
                </div>
              </div>

              {/* Card 1: Beneficiary & Payout Details */}
              <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-200/70 space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-500 font-medium">Payout Request ID:</span>
                  <span className="font-mono font-bold text-blue-800 bg-blue-50/80 px-1.5 py-0.5 rounded border border-blue-200">
                    {selectedPayoutForReceipt.payoutId || `PAY-2026-${selectedPayoutForReceipt._id.slice(-6).toUpperCase()}`}
                  </span>
                </div>
                {selectedPayoutForReceipt.transactionId && (
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-gray-500 font-medium">Bank Reference / UTR:</span>
                    <span className="font-mono text-gray-900 font-bold bg-white px-1.5 py-0.5 rounded border border-gray-200">
                      {selectedPayoutForReceipt.transactionId}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-500 font-medium">Beneficiary Partner:</span>
                  <span className="font-bold text-gray-900">{selectedPayoutForReceipt.partner?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-500 font-medium">Contact:</span>
                  <span className="text-gray-700 font-mono">
                    {selectedPayoutForReceipt.partner?.phone || selectedPayoutForReceipt.partner?.email || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] pt-1 border-t border-gray-200/50">
                  <span className="text-gray-500">Requested:</span>
                  <span className="text-gray-700">
                    {new Date(selectedPayoutForReceipt.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-500">Processed:</span>
                  <span className="text-gray-700">
                    {selectedPayoutForReceipt.processedAt 
                      ? new Date(selectedPayoutForReceipt.processedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : new Date(selectedPayoutForReceipt.updatedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Card 2: Bank Account Details */}
              <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-200/70 space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-500">Bank Name:</span>
                  <span className="font-bold text-gray-900">{selectedPayoutForReceipt.bankDetails?.bankName || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-500">Account Number:</span>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className={receiptModalRevealed ? 'text-gray-900 font-bold bg-white px-1.5 py-0.5 rounded border border-gray-200' : 'text-gray-700 font-semibold'}>
                      {receiptModalRevealed 
                        ? (selectedPayoutForReceipt.bankDetails?.accountNumber || 'N/A')
                        : maskAccountNumber(selectedPayoutForReceipt.bankDetails?.accountNumber)}
                    </span>
                    <button
                      type="button"
                      onClick={handleToggleReceiptModalReveal}
                      className={`p-0.5 rounded cursor-pointer transition ${
                        receiptModalRevealed ? 'text-emerald-700 bg-emerald-100/60' : 'text-gray-400 hover:text-gray-700'
                      }`}
                      title={receiptModalRevealed ? 'Mask Account Number' : 'Reveal Account Number (Audit Logged)'}
                    >
                      {receiptModalRevealed ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-500">Account Holder:</span>
                  <span className="text-gray-900 font-medium truncate max-w-[200px]">
                    {selectedPayoutForReceipt.bankDetails?.accountName || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-500">IFSC Code:</span>
                  <span className="font-mono text-gray-900 font-bold bg-white px-1.5 py-0.5 rounded border border-gray-200 text-[10px]">
                    {selectedPayoutForReceipt.bankDetails?.ifscCode || 'N/A'}
                  </span>
                </div>
                {selectedPayoutForReceipt.bankDetails?.upiId && (
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-gray-500">UPI VPA:</span>
                    <span className="font-mono text-emerald-700 font-medium">
                      {receiptModalRevealed ? selectedPayoutForReceipt.bankDetails.upiId : maskUpiId(selectedPayoutForReceipt.bankDetails.upiId)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-1 border-t border-gray-200/50 text-[11px]">
                  <span className="text-gray-500">Bank Verification:</span>
                  <div>{getBankVerificationBadge(selectedPayoutForReceipt)}</div>
                </div>
              </div>

              {/* Optional Remarks */}
              {selectedPayoutForReceipt.remarks && (
                <div className="px-3 py-2 bg-amber-50/70 border border-amber-200/60 rounded-xl text-[11px] text-amber-900 flex items-start gap-1.5">
                  <span className="font-bold shrink-0">Note:</span>
                  <span className="italic">{selectedPayoutForReceipt.remarks}</span>
                </div>
              )}

            </div>

            {/* Modal Actions Footer (Fixed, Never Cut Off) */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100 mt-3 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedPayoutForReceipt(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => printReceipt(selectedPayoutForReceipt)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#8CC63F] hover:bg-[#116631] rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Printer size={14} /> Print Transfer Receipt
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Bank Account Verification Modal (Point 5) */}
      {verifyModal.isOpen && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-gray-100 my-auto max-h-[92vh] flex flex-col animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-emerald-50 text-[#8CC63F] rounded-xl">
                  <Building2 size={20} />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Verify Bank Account</h3>
                  <p className="text-xs text-gray-500">Partner: {verifyModal.partnerName}</p>
                </div>
              </div>
              <button 
                onClick={() => setVerifyModal(prev => ({ ...prev, isOpen: false }))}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateBankVerification} className="space-y-4 text-xs overflow-y-auto pr-1">
              <div>
                <label className="block font-semibold text-gray-700 mb-1.5">Verification Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Verified', label: 'Verified', color: 'border-emerald-500 text-emerald-700 bg-emerald-50' },
                    { id: 'Pending Verification', label: 'Pending', color: 'border-amber-500 text-amber-700 bg-amber-50' },
                    { id: 'Failed', label: 'Failed', color: 'border-rose-500 text-rose-700 bg-rose-50' },
                  ].map(statusOption => (
                    <button
                      key={statusOption.id}
                      type="button"
                      onClick={() => setVerifyModal(prev => ({ ...prev, newStatus: statusOption.id }))}
                      className={`py-2 px-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                        verifyModal.newStatus === statusOption.id 
                          ? `${statusOption.color} ring-2 ring-offset-1 ring-gray-400 shadow-xs` 
                          : 'border-gray-200 text-gray-600 bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      {statusOption.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Verification / Audit Notes (Optional)</label>
                <textarea
                  rows={3}
                  value={verifyModal.notes}
                  onChange={(e) => setVerifyModal(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="e.g. IFSC branch validated with cancelled cheque / Bank penny-drop passed."
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-[#8CC63F]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100 mt-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setVerifyModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifyModal.loading}
                  className="px-5 py-2 font-semibold text-white bg-[#8CC63F] hover:bg-[#116631] rounded-lg transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {verifyModal.loading ? 'Updating...' : 'Save Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default PayoutManagementView;
