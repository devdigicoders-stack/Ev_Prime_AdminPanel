import React, { useState, useEffect } from 'react';
import { Mail, Phone, Calendar, CheckCircle, Clock, Check, X, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const EnquiriesView = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('All'); // All, General, Partner
  
  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      const fetchUrl = filterType === 'All'
        ? `${import.meta.env.VITE_API_BASE_URL}/enquiries`
        : `${import.meta.env.VITE_API_BASE_URL}/enquiries?type=${filterType}`;

      const res = await fetch(fetchUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setEnquiries(data.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch enquiries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, [filterType]);

  const updateStatus = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/enquiries/${id}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus })
      });
      toast.success('Status updated');
      fetchEnquiries();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'New': return 'bg-blue-100 text-blue-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enquiries</h1>
          <p className="text-gray-500 text-sm mt-1">Manage general and partner enquiries</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          {['All', 'General', 'Partner', 'Review'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap shadow-sm ${
                filterType === type 
                  ? 'bg-green-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {type} {type !== 'All' && 'Enquiries'}
            </button>
          ))}
        </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name / Contact</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type / Subject</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Message</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {enquiries.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-500">
                      No enquiries found.
                    </td>
                  </tr>
                ) : (
                  enquiries.map((enq) => (
                    <tr key={enq._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 align-top">
                        <div className="text-sm text-gray-900 font-medium">
                          {new Date(enq.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(enq.createdAt).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="p-4 align-top">
                        <div className="text-sm font-bold text-gray-900">{enq.name}</div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <Mail size={12} /> {enq.email}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <Phone size={12} /> {enq.phone}
                        </div>
                      </td>
                      <td className="p-4 align-top">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${enq.type === 'Partner' ? 'bg-purple-100 text-purple-700' : enq.type === 'Review' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'}`}>
                          {enq.type}
                        </span>
                        {enq.subject && (
                          <div className="text-sm text-gray-800 mt-2 font-medium">
                            {enq.subject}
                          </div>
                        )}
                        {enq.type === 'Review' && enq.rating && (
                          <div className="flex items-center mt-1 text-amber-500">
                            {'★'.repeat(enq.rating)}{'☆'.repeat(5 - enq.rating)}
                          </div>
                        )}
                        {enq.type === 'Review' && enq.role && (
                          <div className="text-xs text-gray-500 mt-1">
                            {enq.role}
                          </div>
                        )}
                      </td>
                      <td className="p-4 align-top max-w-xs">
                        <p className="text-sm text-gray-600 line-clamp-3" title={enq.message}>
                          {enq.message}
                        </p>
                      </td>
                      <td className="p-4 align-top">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(enq.status)}`}>
                          {enq.status}
                        </span>
                      </td>
                      <td className="p-4 align-top text-right">
                        <select 
                          className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                          value={enq.status}
                          onChange={(e) => updateStatus(enq._id, e.target.value)}
                        >
                          <option value="New">New</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnquiriesView;
