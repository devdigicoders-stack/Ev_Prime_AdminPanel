import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, Check, X, RefreshCcw, Clock, Building2, Search, 
  Copy, CheckCheck, FileText, Printer, AlertCircle, ArrowUpRight, 
  ShieldCheck, User, Wallet, CheckCircle2, XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const PayoutManagementView = () => {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedAccount, setCopiedAccount] = useState(null);

  // Modals state
  const [selectedPayoutForReceipt, setSelectedPayoutForReceipt] = useState(null);
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    payout: null,
    type: 'Completed', // 'Completed' or 'Rejected'
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

  const handleCopy = (text, id) => {
    if (!text || text === 'N/A') return;
    navigator.clipboard.writeText(text);
    setCopiedAccount(id);
    toast.success('Account number copied!');
    setTimeout(() => setCopiedAccount(null), 2000);
  };

  const openActionModal = (payout, type) => {
    setActionModal({
      isOpen: true,
      payout,
      type,
      transactionId: type === 'Completed' ? `TXN-${Math.floor(10000000 + Math.random() * 90000000)}` : '',
      remarks: type === 'Completed' ? 'Transfer completed via IMPS/NEFT' : ''
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

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      if (data.success) {
        toast.success(`Payout ${actionModal.type === 'Completed' ? 'Approved & Completed' : 'Rejected'} successfully!`);
        setActionModal({ isOpen: false, payout: null, type: 'Completed', transactionId: '', remarks: '' });
        fetchPayouts();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update payout status');
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics calculation
  const metrics = useMemo(() => {
    const totalCount = payouts.length;
    const totalAmount = payouts.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const pendingPayouts = payouts.filter(p => p.status === 'Pending');
    const pendingCount = pendingPayouts.length;
    const pendingAmount = pendingPayouts.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const completedPayouts = payouts.filter(p => p.status === 'Completed');
    const completedCount = completedPayouts.length;
    const completedAmount = completedPayouts.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const rejectedCount = payouts.filter(p => p.status === 'Rejected').length;

    return {
      totalCount,
      totalAmount,
      pendingCount,
      pendingAmount,
      completedCount,
      completedAmount,
      rejectedCount
    };
  }, [payouts]);

  // Filtered payouts
  const filteredPayouts = useMemo(() => {
    return payouts.filter(payout => {
      const matchesStatus = statusFilter === 'All' || payout.status === statusFilter;
      const partnerName = (payout.partner?.name || '').toLowerCase();
      const partnerPhone = (payout.partner?.phone || '').toLowerCase();
      const bankName = (payout.bankDetails?.bankName || '').toLowerCase();
      const accNumber = (payout.bankDetails?.accountNumber || '').toLowerCase();
      const accName = (payout.bankDetails?.accountName || '').toLowerCase();
      const query = searchQuery.toLowerCase().trim();

      const matchesSearch = !query || 
        partnerName.includes(query) || 
        partnerPhone.includes(query) || 
        bankName.includes(query) || 
        accNumber.includes(query) || 
        accName.includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [payouts, statusFilter, searchQuery]);

  const getStatusBadge = (status) => {
    switch(status) {
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
      default:
        return (
          <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200/60 rounded-full text-xs font-bold flex items-center gap-1.5 w-max animate-pulse">
            <Clock size={14} className="text-amber-600" /> Pending
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
        <title>Payout Settlement Advice - ${payout.transactionId || 'TXN-' + payout._id.slice(-6).toUpperCase()}</title>
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
            <div style="font-size: 13px; font-weight: bold; margin-top: 4px;">Ref: ${payout.transactionId || 'TXN-' + payout._id.slice(-6).toUpperCase()}</div>
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
            A/c No: ${payout.bankDetails?.accountNumber || 'N/A'}<br/>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Requests</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">₹{metrics.totalAmount.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1 font-medium">{metrics.totalCount} total withdrawals</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-gray-50 text-gray-700 flex items-center justify-center">
            <Wallet size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-100/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Pending Approvals</p>
            <p className="text-2xl font-extrabold text-amber-600 mt-1">₹{metrics.pendingAmount.toLocaleString()}</p>
            <p className="text-xs text-amber-600 font-semibold mt-1">{metrics.pendingCount} awaiting transfer</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-100/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Completed / Paid</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">₹{metrics.completedAmount.toLocaleString()}</p>
            <p className="text-xs text-emerald-600 font-semibold mt-1">{metrics.completedCount} settled successfully</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Rejected</p>
            <p className="text-2xl font-extrabold text-gray-800 mt-1">{metrics.rejectedCount}</p>
            <p className="text-xs text-gray-500 mt-1 font-medium">Declined withdrawal requests</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <XCircle size={24} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100/80 rounded-xl w-full md:w-auto overflow-x-auto">
          {[
            { id: 'All', label: 'All', count: metrics.totalCount },
            { id: 'Pending', label: 'Pending', count: metrics.pendingCount },
            { id: 'Completed', label: 'Completed', count: metrics.completedCount },
            { id: 'Rejected', label: 'Rejected', count: metrics.rejectedCount },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
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
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search partner, phone, A/c..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#8CC63F] focus:bg-white transition-all"
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

      {/* Main Payouts Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
                <th className="p-4">Date</th>
                <th className="p-4">Partner</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Bank Details</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredPayouts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-gray-400">
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

                  return (
                    <tr key={payout._id} className="hover:bg-gray-50/60 transition-colors">
                      {/* Date */}
                      <td className="p-4 text-gray-600 whitespace-nowrap">
                        <div className="font-medium text-gray-800 text-sm">
                          {new Date(payout.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                        <div className="text-xs text-gray-400 font-mono mt-0.5">
                          {new Date(payout.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Partner */}
                      <td className="p-4">
                        <div className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                          {payout.partner?.name || 'Unknown Partner'}
                        </div>
                        <div className="text-xs text-gray-500 font-mono mt-0.5">
                          📞 {payout.partner?.phone || 'No phone'}
                        </div>
                        {payout.partner?.email && (
                          <div className="text-[11px] text-gray-400 truncate max-w-[180px]">
                            ✉️ {payout.partner.email}
                          </div>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="p-4 font-extrabold text-gray-900 text-base">
                        ₹{Number(payout.amount).toLocaleString()}
                      </td>

                      {/* Bank Details */}
                      <td className="p-4">
                        {hasBank ? (
                          <div className="text-xs space-y-1 bg-gray-50/80 p-2.5 rounded-xl border border-gray-100 max-w-xs">
                            <div className="flex items-center justify-between font-bold text-gray-800">
                              <span className="flex items-center gap-1 text-emerald-800">
                                <Building2 size={13} className="text-[#8CC63F]" />
                                {bDetails.bankName || 'Partner Bank'}
                              </span>
                              {bDetails.ifscCode && (
                                <span className="bg-white border border-gray-200 px-1.5 py-0.5 rounded font-mono text-[10px] text-gray-600">
                                  {bDetails.ifscCode}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between font-mono text-gray-700">
                              <span>A/c: {bDetails.accountNumber}</span>
                              <button
                                onClick={() => handleCopy(bDetails.accountNumber, payout._id)}
                                className="text-gray-400 hover:text-emerald-700 transition-colors cursor-pointer p-0.5"
                                title="Copy Account Number"
                              >
                                {copiedAccount === payout._id ? <CheckCheck size={13} className="text-emerald-600" /> : <Copy size={13} />}
                              </button>
                            </div>
                            <div className="text-[11px] text-gray-600 font-medium truncate">
                              Name: {bDetails.accountName || payout.partner?.name || 'N/A'}
                            </div>
                            {bDetails.upiId && (
                              <div className="text-[10px] text-emerald-700 font-mono bg-emerald-50/60 px-1 rounded inline-block">
                                UPI: {bDetails.upiId}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400 italic">
                            Bank details not submitted
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-4 whitespace-nowrap">
                        {getStatusBadge(payout.status)}
                        {payout.transactionId && (
                          <div className="text-[10px] text-gray-400 font-mono mt-1">
                            Ref: {payout.transactionId}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right whitespace-nowrap">
                        {payout.status === 'Pending' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => openActionModal(payout, 'Completed')}
                              className="px-3 py-1.5 bg-[#8CC63F] hover:bg-[#116631] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                              title="Approve and Complete Transfer"
                            >
                              <Check size={14} /> Approve
                            </button>
                            <button 
                              onClick={() => openActionModal(payout, 'Rejected')}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Reject Payout Request"
                            >
                              <X size={14} /> Reject
                            </button>
                          </div>
                        ) : payout.status === 'Completed' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => setSelectedPayoutForReceipt(payout)}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                              title="View Payout Receipt & Transfer Slip"
                            >
                              <FileText size={14} /> View Receipt
                            </button>
                            <button 
                              onClick={() => printReceipt(payout)}
                              className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                              title="Print / Save PDF"
                            >
                              <Printer size={15} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs text-rose-600 font-medium bg-rose-50 px-2 py-1 rounded border border-rose-200/50">
                              {payout.remarks || 'Rejected by Admin'}
                            </span>
                            <button
                              onClick={() => openActionModal(payout, 'Completed')}
                              className="text-xs text-gray-500 hover:text-emerald-700 underline font-semibold ml-1 cursor-pointer"
                            >
                              Re-open
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approve / Reject Action Modal */}
      {actionModal.isOpen && actionModal.payout && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 my-8 animate-scale-up">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <span className={`p-2 rounded-xl ${actionModal.type === 'Completed' ? 'bg-emerald-50 text-[#8CC63F]' : 'bg-rose-50 text-rose-600'}`}>
                  {actionModal.type === 'Completed' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                </span>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {actionModal.type === 'Completed' ? 'Approve & Transfer Payout' : 'Reject Payout Request'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Request from {actionModal.payout.partner?.name || 'Partner'}
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
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/80 mb-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Payout Amount:</span>
                <span className="font-extrabold text-base text-gray-900">₹{Number(actionModal.payout.amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Bank Name:</span>
                <span className="font-bold text-gray-800">{actionModal.payout.bankDetails?.bankName || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Account Number:</span>
                <span className="font-mono text-gray-800">{actionModal.payout.bankDetails?.accountNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">IFSC Code:</span>
                <span className="font-mono text-gray-800">{actionModal.payout.bankDetails?.ifscCode || 'N/A'}</span>
              </div>
            </div>

            <form onSubmit={handleConfirmAction} className="space-y-4">
              {actionModal.type === 'Completed' ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Bank Transaction / UTR Reference ID
                  </label>
                  <input
                    type="text"
                    required
                    value={actionModal.transactionId}
                    onChange={(e) => setActionModal(prev => ({ ...prev, transactionId: e.target.value }))}
                    placeholder="e.g. TXN-98472910"
                    className="w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded-lg focus:outline-none focus:border-[#8CC63F] focus:ring-1 focus:ring-[#8CC63F]"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">This will be shared with the partner in their transfer slip.</p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Reason for Rejection
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={actionModal.remarks}
                    onChange={(e) => setActionModal(prev => ({ ...prev, remarks: e.target.value }))}
                    placeholder="e.g. Bank IFSC does not match branch, please update details."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              )}

              {actionModal.type === 'Completed' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Admin Note / Remarks (Optional)
                  </label>
                  <input
                    type="text"
                    value={actionModal.remarks}
                    onChange={(e) => setActionModal(prev => ({ ...prev, remarks: e.target.value }))}
                    placeholder="e.g. Processed via IMPS"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#8CC63F]"
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
                    actionModal.type === 'Completed'
                      ? 'bg-[#8CC63F] hover:bg-[#116631]'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {actionLoading ? (
                    'Processing...'
                  ) : actionModal.type === 'Completed' ? (
                    <>Confirm Transfer</>
                  ) : (
                    <>Reject Payout</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Receipt Modal */}
      {selectedPayoutForReceipt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                  <FileText size={20} />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Payout Transfer Advice</h3>
                  <p className="text-xs text-gray-500 font-mono">
                    ID: {selectedPayoutForReceipt.transactionId || selectedPayoutForReceipt._id}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPayoutForReceipt(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Transfer Amount Seal */}
            <div className="text-center py-4 bg-emerald-50/50 border border-emerald-100 rounded-xl mb-5">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Net Disbursed Amount</span>
              <div className="text-3xl font-extrabold text-emerald-800 mt-1">
                ₹{Number(selectedPayoutForReceipt.amount).toLocaleString()}
              </div>
              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full mt-2">
                <CheckCircle2 size={12} /> {selectedPayoutForReceipt.status} & Settled
              </div>
            </div>

            {/* Details Breakdown */}
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl space-y-2 border border-gray-100">
                <div className="flex justify-between">
                  <span className="text-gray-500">Beneficiary Partner:</span>
                  <span className="font-bold text-gray-900">{selectedPayoutForReceipt.partner?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Contact Phone:</span>
                  <span className="font-mono text-gray-800">{selectedPayoutForReceipt.partner?.phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Contact Email:</span>
                  <span className="text-gray-800">{selectedPayoutForReceipt.partner?.email || 'N/A'}</span>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl space-y-2 border border-gray-100">
                <div className="flex justify-between">
                  <span className="text-gray-500">Bank Name:</span>
                  <span className="font-bold text-gray-900">{selectedPayoutForReceipt.bankDetails?.bankName || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Account Number:</span>
                  <span className="font-mono font-semibold text-gray-900">{selectedPayoutForReceipt.bankDetails?.accountNumber || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Account Holder Name:</span>
                  <span className="text-gray-900 font-medium">{selectedPayoutForReceipt.bankDetails?.accountName || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">IFSC Code:</span>
                  <span className="font-mono text-gray-900">{selectedPayoutForReceipt.bankDetails?.ifscCode || 'N/A'}</span>
                </div>
                {selectedPayoutForReceipt.bankDetails?.upiId && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">UPI VPA:</span>
                    <span className="font-mono text-emerald-700">{selectedPayoutForReceipt.bankDetails.upiId}</span>
                  </div>
                )}
              </div>

              <div className="p-3 bg-gray-50 rounded-xl space-y-2 border border-gray-100">
                <div className="flex justify-between">
                  <span className="text-gray-500">Requested On:</span>
                  <span className="text-gray-800">{new Date(selectedPayoutForReceipt.createdAt).toLocaleString('en-GB')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Processed At:</span>
                  <span className="text-gray-800">
                    {selectedPayoutForReceipt.processedAt ? new Date(selectedPayoutForReceipt.processedAt).toLocaleString('en-GB') : new Date(selectedPayoutForReceipt.updatedAt).toLocaleString('en-GB')}
                  </span>
                </div>
                {selectedPayoutForReceipt.remarks && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Remarks:</span>
                    <span className="text-gray-800 italic">{selectedPayoutForReceipt.remarks}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 mt-5">
              <button
                type="button"
                onClick={() => setSelectedPayoutForReceipt(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => printReceipt(selectedPayoutForReceipt)}
                className="px-5 py-2 text-sm font-semibold text-white bg-[#8CC63F] hover:bg-[#116631] rounded-lg transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Printer size={16} /> Print Transfer Receipt
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PayoutManagementView;
