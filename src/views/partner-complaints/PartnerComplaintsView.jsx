import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Building, 
  AlertCircle,
  Search,
  Filter,
  ChevronRight,
  Clock,
  CheckCircle2,
  Archive,
  RefreshCw,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
import toast from 'react-hot-toast';

export default function PartnerComplaintsView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState(searchParams.get('status') || 'All');
  const navigate = useNavigate();

  // Defined Partner Complaint Lifecycle: Open → In Progress → Resolved → Closed
  const STATUS_TABS = ['All', 'Open', 'In Progress', 'Resolved', 'Closed'];

  // Sync status filter with URL query params
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam && STATUS_TABS.includes(statusParam)) {
      setFilter(statusParam);
    } else if (statusParam === null) {
      setFilter('All');
    }
  }, [searchParams]);

  const handleFilterChange = (newStatus) => {
    setFilter(newStatus);
    if (newStatus === 'All') {
      searchParams.delete('status');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ status: newStatus });
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/admin/partner-complaints`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setComplaints(data.data || []);
      }
    } catch (error) {
      toast.error('Failed to fetch partner complaints');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Open': 
        return {
          bg: 'bg-red-50 text-red-700 border-red-200',
          dot: 'bg-red-500',
          label: 'Open'
        };
      case 'In Progress': 
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500',
          label: 'In Progress'
        };
      case 'Resolved': 
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
          label: 'Resolved'
        };
      case 'Closed': 
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-300',
          dot: 'bg-slate-500',
          label: 'Closed'
        };
      default: 
        return {
          bg: 'bg-gray-100 text-gray-700 border-gray-200',
          dot: 'bg-gray-400',
          label: status || 'Unknown'
        };
    }
  };

  const statusCounts = useMemo(() => {
    const counts = {
      All: complaints.length,
      Open: 0,
      'In Progress': 0,
      Resolved: 0,
      Closed: 0
    };
    complaints.forEach(c => {
      const s = c.status;
      if (counts[s] !== undefined) {
        counts[s]++;
      }
    });
    return counts;
  }, [complaints]);

  const filteredComplaints = useMemo(() => {
    return complaints.filter(comp => {
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch = !q ||
        comp.complaintId?.toLowerCase().includes(q) ||
        comp.title?.toLowerCase().includes(q) ||
        comp.partner?.name?.toLowerCase().includes(q) ||
        comp.category?.toLowerCase().includes(q) ||
        comp.station?.name?.toLowerCase().includes(q);
      
      if (filter === 'All') return matchesSearch;
      return matchesSearch && comp.status?.toLowerCase() === filter.toLowerCase();
    });
  }, [complaints, searchTerm, filter]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Partner Complaints</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {complaints.length} Total Registered
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Manage, investigate, and resolve partner tickets through the defined lifecycle
          </p>
        </div>

        <button
          onClick={() => fetchComplaints(true)}
          disabled={refreshing || loading}
          className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50/50 transition shadow-2xs cursor-pointer flex items-center gap-2 text-xs font-semibold"
          title="Refresh Complaints"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin text-emerald-600' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 4-Step Lifecycle Pipeline KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* 1. Open */}
        <button
          onClick={() => handleFilterChange('Open')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer group ${
            filter === 'Open'
              ? 'bg-red-50/80 border-red-300 ring-2 ring-red-400/20 shadow-xs'
              : 'bg-white border-gray-200/80 hover:border-red-200 hover:shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-700 uppercase tracking-wider">1. Open</span>
            <AlertTriangle size={16} className="text-red-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-red-900 mt-2">{statusCounts['Open']}</div>
          <span className="text-[11px] text-red-700 font-medium block mt-0.5">Awaiting initial triage</span>
        </button>

        {/* 2. In Progress */}
        <button
          onClick={() => handleFilterChange('In Progress')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer group ${
            filter === 'In Progress'
              ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/20 shadow-xs'
              : 'bg-white border-gray-200/80 hover:border-amber-200 hover:shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">2. In Progress</span>
            <Clock size={16} className="text-amber-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-amber-900 mt-2">{statusCounts['In Progress']}</div>
          <span className="text-[11px] text-amber-700 font-medium block mt-0.5">Active investigation</span>
        </button>

        {/* 3. Resolved */}
        <button
          onClick={() => handleFilterChange('Resolved')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer group ${
            filter === 'Resolved'
              ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-400/20 shadow-xs'
              : 'bg-white border-gray-200/80 hover:border-emerald-200 hover:shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">3. Resolved</span>
            <CheckCircle2 size={16} className="text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-emerald-900 mt-2">{statusCounts['Resolved']}</div>
          <span className="text-[11px] text-emerald-700 font-medium block mt-0.5">Solution delivered</span>
        </button>

        {/* 4. Closed */}
        <button
          onClick={() => handleFilterChange('Closed')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer group ${
            filter === 'Closed'
              ? 'bg-slate-100 border-slate-300 ring-2 ring-slate-400/20 shadow-xs'
              : 'bg-white border-gray-200/80 hover:border-slate-300 hover:shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">4. Closed</span>
            <Archive size={16} className="text-slate-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{statusCounts['Closed']}</div>
          <span className="text-[11px] text-slate-600 font-medium block mt-0.5">Finalized & archived</span>
        </button>
      </div>

      {/* Lifecycle Flow Explanation Header */}
      <div className="bg-gradient-to-r from-gray-50 via-white to-gray-50 rounded-xl p-3 border border-gray-200/80 flex items-center justify-between flex-wrap gap-2 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-700 uppercase tracking-wider text-[11px]">Lifecycle Pipeline:</span>
          <div className="flex items-center gap-1 font-semibold text-[11px]">
            <span className="px-2 py-0.5 rounded bg-red-100 text-red-800">Open</span>
            <ArrowRight size={12} className="text-gray-400" />
            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800">In Progress</span>
            <ArrowRight size={12} className="text-gray-400" />
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">Resolved</span>
            <ArrowRight size={12} className="text-gray-400" />
            <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800">Closed</span>
          </div>
        </div>
        <span className="text-[11px] text-gray-500">
          Showing: <strong className="text-gray-900">{filter}</strong> ({filteredComplaints.length} records)
        </span>
      </div>

      {/* Search and 5-Status Filter Toolbar */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-4 space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ID, partner name, title, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent outline-none transition-shadow bg-gray-50/50"
            />
          </div>
          
          {/* Status Tabs: All | Open | In Progress | Resolved | Closed */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden shrink-0">
            {STATUS_TABS.map((status) => {
              const count = statusCounts[status] || 0;
              const isActive = filter === status;
              return (
                <button
                  key={status}
                  onClick={() => handleFilterChange(status)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                    isActive 
                      ? 'bg-gray-900 text-white shadow-xs' 
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200/80'
                  }`}
                >
                  <span>{status}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive 
                      ? 'bg-white/20 text-white' 
                      : count > 0 
                        ? 'bg-gray-200 text-gray-800' 
                        : 'bg-gray-100 text-gray-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Complaints Feed List */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8CC63F] mx-auto"></div>
            <p className="mt-4 text-xs font-semibold text-gray-500">Loading partner complaints telemetry...</p>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center mx-auto text-gray-400">
              <AlertCircle size={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                {filter === 'All' ? 'No complaints found' : `No complaints found with status "${filter}"`}
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                {searchTerm 
                  ? `No partner complaints match your search query "${searchTerm}".`
                  : filter !== 'All'
                    ? `There are currently 0 partner complaints in the "${filter}" lifecycle stage.`
                    : 'Great job! Zero complaints registered in the system.'}
              </p>
            </div>
            {filter !== 'All' && (
              <button
                onClick={() => handleFilterChange('All')}
                className="mt-2 px-4 py-1.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition shadow-2xs cursor-pointer"
              >
                View All Complaints ({complaints.length})
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredComplaints.map((comp) => {
              const badge = getStatusBadge(comp.status);
              return (
                <div 
                  key={comp._id}
                  onClick={() => navigate(`/partner-complaints/${comp._id}`)}
                  className="hover:bg-gray-50/80 transition-colors cursor-pointer p-4 sm:p-5 group"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-col min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-xs font-mono font-bold text-[#116631] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          #{comp.complaintId}
                        </span>

                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {comp.status}
                        </span>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          comp.priority === 'High' ? 'bg-red-50 text-red-700 border-red-200' :
                          comp.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {comp.priority || 'Medium'} Priority
                        </span>

                        <span className="text-[11px] text-gray-400 font-mono">
                          {new Date(comp.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                        <h3 className="text-sm font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                          {comp.title}
                        </h3>
                        {comp.description && (
                          <p className="text-xs text-gray-500 truncate max-w-xl">
                            — {comp.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-500 pt-0.5 flex-wrap">
                        <div className="flex items-center gap-1 font-semibold text-gray-700">
                          <Building className="h-3.5 w-3.5 text-gray-400" />
                          <span>{comp.partner?.name || 'Unknown Partner'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Filter className="h-3.5 w-3.5 text-gray-400" />
                          <span>{comp.category}</span>
                        </div>
                        {comp.station?.name && (
                          <span className="text-gray-400">
                            Station: <strong className="text-gray-600 font-medium">{comp.station.name}</strong>
                          </span>
                        )}
                        {comp.messages?.length > 0 && (
                          <span className="text-[11px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.2 rounded border border-blue-200">
                            {comp.messages.length} Messages in Thread
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="ml-2 flex-shrink-0 flex items-center gap-1 text-gray-400 group-hover:text-emerald-700 transition-colors">
                      <span className="text-xs font-semibold hidden md:inline">Open Thread</span>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
