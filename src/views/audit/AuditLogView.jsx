import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, Download, ChevronLeft, ChevronRight, Clock, Loader2, AlertCircle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const getStatusColor = (action) => {
  const act = action.toLowerCase();
  if (act.includes('creat')) return 'text-emerald-500 bg-emerald-50';
  if (act.includes('updat')) return 'text-blue-500 bg-blue-50';
  if (act.includes('delet') || act.includes('remov')) return 'text-orange-500 bg-orange-50';
  if (act.includes('fail') || act.includes('error')) return 'text-red-500 bg-red-50';
  if (act.includes('login') || act.includes('logout')) return 'text-gray-600 bg-gray-100';
  return 'text-gray-500 bg-gray-50';
};

const AuditLogView = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination & Filtering state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  
  const [moduleFilter, setModuleFilter] = useState('All Modules');
  const [dateFilter, setDateFilter] = useState('All Time');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchLogs();
  }, [page, limit, moduleFilter, dateFilter, debouncedSearch]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      let url = `${API_BASE_URL}/audit?page=${page}&limit=${limit}`;
      if (moduleFilter !== 'All Modules') url += `&module=${moduleFilter}`;
      if (dateFilter !== 'All Time') url += `&dateFilter=${dateFilter}`;
      if (debouncedSearch) url += `&search=${debouncedSearch}`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch audit logs');
      
      const data = await response.json();
      setLogs(data.logs);
      setTotalPages(data.pages || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      let url = `${API_BASE_URL}/audit?page=1&limit=10000`; // fetch all matching for export
      if (moduleFilter !== 'All Modules') url += `&module=${moduleFilter}`;
      if (dateFilter !== 'All Time') url += `&dateFilter=${dateFilter}`;
      if (debouncedSearch) url += `&search=${debouncedSearch}`;

      const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) throw new Error('Failed to fetch data for export');
      
      const data = await response.json();
      const exportLogs = data.logs;
      
      if (exportLogs.length === 0) return alert("No data to export");

      const headers = ['Timestamp', 'User', 'Role', 'Action', 'Module', 'Details', 'IP Address'];
      const csvRows = [headers.join(',')];

      exportLogs.forEach(log => {
        const values = [
           new Date(log.createdAt).toLocaleString(),
           log.user,
           log.role,
           log.action,
           log.module,
           `"${log.details.replace(/"/g, '""')}"`,
           log.ip
        ];
        csvRows.push(values.join(','));
      });

      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      alert("Error exporting logs: " + error.message);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6 pb-6 relative">
      
      {loading && logs.length === 0 && (
          <div className="absolute inset-0 bg-white/50 z-40 flex items-center justify-center rounded-2xl">
            <Loader2 className="animate-spin text-[#8CC63F]" size={48} />
          </div>
      )}

      {/* Header Area */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Audit Logs</h1>
          <p className="text-gray-500 text-sm font-medium">Track system activities and admin actions</p>
        </div>
        
        <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
          <div className="flex w-full sm:w-auto gap-3">
            <div className="relative flex-1 sm:flex-none">
              <select 
                value={moduleFilter}
                onChange={e => {setModuleFilter(e.target.value); setPage(1);}}
                className="w-full appearance-none bg-white border border-gray-200 rounded-xl pl-4 pr-10 py-2.5 text-sm text-gray-600 font-medium cursor-pointer shadow-sm hover:bg-gray-50 transition focus:outline-none focus:ring-2 focus:ring-[#8CC63F]"
              >
                <option value="All Modules">All Modules</option>
                <option value="Authentication">Authentication</option>
                <option value="Station Management">Station Management</option>
                <option value="User Management">User Management</option>
                <option value="Ticket Management">Ticket Management</option>
                <option value="Refund Management">Refund Management</option>
                <option value="Partner Management">Partner Management</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            
            <div className="relative flex-1 sm:flex-none">
              <select 
                value={dateFilter}
                onChange={e => {setDateFilter(e.target.value); setPage(1);}}
                className="w-full appearance-none bg-white border border-gray-200 rounded-xl pl-4 pr-10 py-2.5 text-sm text-gray-600 font-medium cursor-pointer shadow-sm hover:bg-gray-50 transition focus:outline-none focus:ring-2 focus:ring-[#8CC63F]"
              >
                <option value="All Time">All Time</option>
                <option value="Today">Today</option>
                <option value="This Week">This Week</option>
                <option value="This Month">This Month</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="relative w-full sm:w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => {setSearchQuery(e.target.value); setPage(1);}}
              placeholder="Search logs..." 
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all shadow-sm"
            />
          </div>

          <button onClick={handleExport} className="w-full sm:w-auto bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm font-semibold flex items-center gap-2">
           <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col relative">
        
        {loading && logs.length > 0 && (
          <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <Loader2 className="animate-spin text-[#8CC63F]" size={32} />
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-6 py-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                <th className="px-6 py-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Module</th>
                <th className="px-6 py-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Details</th>
                <th className="px-6 py-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.length === 0 && !loading ? (
                 <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-sm text-gray-500 font-medium">No audit logs found matching your criteria.</td>
                 </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-gray-400" />
                        <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">{log.user}</span>
                        <span className="text-xs font-medium text-gray-500 whitespace-nowrap">{log.role}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-md whitespace-nowrap inline-block ${getStatusColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">{log.module}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-600 truncate max-w-[300px] block" title={log.details}>
                        {log.details}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-500 whitespace-nowrap">{log.ip}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100">
          <div className="relative flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-600 font-medium cursor-pointer hover:bg-gray-50 transition w-full sm:w-auto justify-between sm:justify-start order-2 sm:order-1">
            <span className="whitespace-nowrap">{limit} / page</span> 
            <select 
               value={limit} 
               onChange={e => {setLimit(parseInt(e.target.value)); setPage(1);}}
               className="opacity-0 absolute inset-0 cursor-pointer"
            >
               <option value="10">10</option>
               <option value="25">25</option>
               <option value="50">50</option>
            </select>
            <ChevronDown size={14} className="text-gray-400 ml-1 flex-shrink-0" />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-1 w-full sm:w-auto order-1 sm:order-2">
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
              className="p-1.5 text-gray-400 hover:text-gray-700 transition disabled:opacity-30 disabled:hover:text-gray-400"
            >
              <ChevronLeft size={18} />
            </button>
            
            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#8CC63F] text-white font-semibold text-sm">
              {page}
            </button>
            <span className="text-gray-400 text-xs font-semibold px-2">of {totalPages}</span>

            <button 
              disabled={page === totalPages || totalPages === 0} 
              onClick={() => setPage(p => p + 1)}
              className="p-1.5 text-gray-400 hover:text-gray-700 transition disabled:opacity-30 disabled:hover:text-gray-400"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default AuditLogView;
