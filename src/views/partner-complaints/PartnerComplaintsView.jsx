import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building, 
  AlertCircle,
  Search,
  Filter,
  ChevronRight
} from 'lucide-react';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
import { useNotification } from '../../contexts/NotificationContext';

export default function PartnerComplaintsView() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/admin/partner-complaints`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setComplaints(data.data);
      }
    } catch (error) {
      showNotification('Failed to fetch partner complaints', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'bg-red-100 text-red-800 border-red-200';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Closed': case 'Resolved': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredComplaints = complaints.filter(comp => {
    const matchesSearch = 
      comp.complaintId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.partner?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'All') return matchesSearch;
    return matchesSearch && comp.status === filter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Partner Complaints</h1>
          <p className="mt-1 text-sm text-gray-500">Manage and resolve B2B partner issues</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ID, Partner, or Title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent outline-none transition-shadow"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
            {['All', 'Open', 'In Progress', 'Closed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                  ${filter === status 
                    ? 'bg-[#8CC63F] text-white shadow-sm' 
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8CC63F] mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading complaints...</p>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-300 mx-auto" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No complaints found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filter !== 'All' ? 'Try adjusting your filters' : 'Great job! No partner complaints.'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filteredComplaints.map((comp) => (
              <li 
                key={comp._id}
                onClick={() => navigate(`/partner-complaints/${comp._id}`)}
                className="hover:bg-gray-50 transition-colors cursor-pointer p-4 sm:p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-semibold text-[#8CC63F] truncate">
                        {comp.complaintId}
                      </p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(comp.status)}`}>
                        {comp.status}
                      </span>
                    </div>
                    
                    <div className="mt-2 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-4">
                      <p className="text-base font-medium text-gray-900 truncate">
                        {comp.title}
                      </p>
                      <div className="flex items-center text-sm text-gray-500">
                        <Building className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        {comp.partner?.name || 'Unknown Partner'}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Filter className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        {comp.category}
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
