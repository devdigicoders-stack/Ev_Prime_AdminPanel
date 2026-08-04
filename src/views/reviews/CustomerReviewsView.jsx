import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, XCircle, Trash2, RefreshCw, Search, MessageSquare, Clock, AlertTriangle, ThumbsUp } from 'lucide-react';
import Swal from 'sweetalert2';

const CustomerReviewsView = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all'); // all | approved | pending
  const [searchTerm, setSearchTerm] = useState('');

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const token = localStorage.getItem('adminToken');

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${baseUrl}/enquiries/reviews?status=${statusFilter}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setReviews(data.data);
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: data.message || 'Failed to load reviews' });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Network Error', text: 'Failed to fetch reviews' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, [statusFilter]);

  const handleApprove = async (id, approve) => {
    try {
      const res = await fetch(`${baseUrl}/enquiries/reviews/${id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isApproved: approve })
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: approve ? 'Approved!' : 'Unapproved!',
          text: approve ? 'Review is now live on the website.' : 'Review has been hidden from the website.',
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
        fetchReviews();
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: data.message });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Network Error', text: 'Failed to update review' });
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Review?',
      text: "This action cannot be undone!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Delete!'
    });
    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`${baseUrl}/enquiries/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire({ icon: 'success', title: 'Deleted!', text: 'Review permanently removed.', timer: 2000, showConfirmButton: false });
        fetchReviews();
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: data.message });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Network Error', text: 'Failed to delete review' });
    }
  };

  const filteredReviews = reviews.filter(r =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.role && r.role.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const renderStars = (rating) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <svg key={s} className={`w-4 h-4 ${rating >= s ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );

  const approvedCount = reviews.filter(r => r.isApproved).length;
  const pendingCount = reviews.filter(r => !r.isApproved).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-green-600" />
            Customer Reviews
          </h1>
          <p className="text-gray-500 mt-1">Approve or reject user-submitted reviews before they appear on the website</p>
        </div>
        <button
          onClick={fetchReviews}
          className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-600 transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-green-600' : ''}`} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
          <div className="text-2xl font-extrabold text-gray-900">{reviews.length}</div>
          <div className="text-xs text-gray-500 font-medium mt-0.5">Total Reviews</div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-100 text-center">
          <div className="text-2xl font-extrabold text-emerald-600">{approvedCount}</div>
          <div className="text-xs text-gray-500 font-medium mt-0.5">Approved</div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-amber-100 text-center">
          <div className="text-2xl font-extrabold text-amber-500">{pendingCount}</div>
          <div className="text-xs text-gray-500 font-medium mt-0.5">Pending</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, review, or EV model..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'All', icon: <Star className="w-3.5 h-3.5" /> },
            { key: 'pending', label: 'Pending', icon: <Clock className="w-3.5 h-3.5" /> },
            { key: 'approved', label: 'Approved', icon: <CheckCircle className="w-3.5 h-3.5" /> }
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${statusFilter === key ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="text-center py-16">
          <RefreshCw className="w-10 h-10 text-green-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading reviews...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="bg-white p-14 rounded-2xl shadow-sm border border-gray-100 text-center">
          <MessageSquare className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-700 mb-2">No reviews found</h3>
          <p className="text-gray-400 text-sm">No reviews match your current filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <div key={review._id} className={`bg-white p-5 rounded-2xl shadow-sm border transition-all ${review.isApproved ? 'border-emerald-100' : 'border-amber-100'}`}>
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    {/* Approval Badge */}
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${review.isApproved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {review.isApproved ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {review.isApproved ? 'Live on Website' : 'Pending Approval'}
                    </span>
                    {/* Star Rating */}
                    {review.rating && renderStars(review.rating)}
                  </div>

                  {/* Review Content */}
                  <p className="text-gray-800 text-sm leading-relaxed mb-3 italic">"{review.message}"</p>

                  {/* Author Info */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm">
                      {review.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{review.name}</p>
                      <p className="text-xs text-green-600 font-medium">{review.role || '—'}</p>
                      <p className="text-xs text-gray-400">{review.email} • {review.phone}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Submitted: {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex md:flex-col gap-2 justify-end md:justify-start md:items-end">
                  {!review.isApproved ? (
                    <button
                      onClick={() => handleApprove(review._id, true)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                  ) : (
                    <button
                      onClick={() => handleApprove(review._id, false)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Unapprove
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(review._id)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-semibold transition-colors border border-red-200"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerReviewsView;
