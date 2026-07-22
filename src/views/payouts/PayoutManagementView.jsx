import React, { useState, useEffect } from 'react';
import { DollarSign, Check, X, RefreshCcw, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const PayoutManagementView = () => {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/payouts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      if (data.success) {
        setPayouts(data.data);
      }
    } catch (err) {
      toast.error('Failed to load payouts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/payouts/${id}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ status })
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      if (data.success) {
        toast.success(`Payout ${status}`);
        fetchPayouts();
      }
    } catch (err) {
      toast.error('Failed to update payout status');
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Approved':
        return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1 w-max"><Check size={14} /> Approved</span>;
      case 'Rejected':
        return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold flex items-center gap-1 w-max"><X size={14} /> Rejected</span>;
      default:
        return <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold flex items-center gap-1 w-max"><Clock size={14} /> Pending</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <DollarSign className="text-primary" /> Payout Requests
          </h1>
          <p className="text-gray-500 mt-1">Manage and approve partner withdrawal requests</p>
        </div>
        <button 
          onClick={fetchPayouts}
          className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
        >
          <RefreshCcw size={18} /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-gray-500 text-sm uppercase tracking-wider">
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Partner</th>
                <th className="p-4 font-semibold">Amount</th>
                <th className="p-4 font-semibold">Bank Details</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {payouts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    No payout requests found.
                  </td>
                </tr>
              ) : (
                payouts.map((payout) => (
                  <tr key={payout._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 text-gray-600">
                      {new Date(payout.createdAt).toLocaleDateString()} <br/>
                      <span className="text-xs">{new Date(payout.createdAt).toLocaleTimeString()}</span>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-gray-800">{payout.partner?.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{payout.partner?.phone}</div>
                    </td>
                    <td className="p-4 font-bold text-gray-800">
                      ₹{payout.amount}
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        <p className="font-semibold text-gray-800">{payout.bankDetails?.bankName || 'N/A'}</p>
                        <p className="text-gray-600">A/c: {payout.bankDetails?.accountNumber || 'N/A'}</p>
                        <p className="text-gray-600">Name: {payout.bankDetails?.accountName || 'N/A'}</p>
                        <p className="text-gray-500 text-xs">IFSC: {payout.bankDetails?.ifscCode || 'N/A'}</p>
                        {payout.bankDetails?.upiId && <p className="text-gray-500 text-xs">UPI: {payout.bankDetails.upiId}</p>}
                      </div>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(payout.status)}
                    </td>
                    <td className="p-4">
                      {payout.status === 'Pending' && (
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => updateStatus(payout._id, 'Approved')}
                            className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                            title="Approve"
                          >
                            <Check size={18} />
                          </button>
                          <button 
                            onClick={() => updateStatus(payout._id, 'Rejected')}
                            className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title="Reject"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PayoutManagementView;
