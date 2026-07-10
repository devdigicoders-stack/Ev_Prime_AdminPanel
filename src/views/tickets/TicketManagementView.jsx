import { useState, useEffect } from 'react';
import { Search, ChevronDown, Download, Eye, MessageSquare, X, Loader2, Send } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'High': return 'text-red-500';
    case 'Medium': return 'text-amber-500';
    case 'Low': return 'text-gray-500';
    default: return 'text-gray-500';
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'Open': return 'text-blue-500 bg-blue-50 px-2 py-1 rounded-full text-xs';
    case 'In Progress': return 'text-indigo-500 bg-indigo-50 px-2 py-1 rounded-full text-xs';
    case 'Resolved': return 'text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full text-xs';
    case 'Closed': return 'text-gray-500 bg-gray-100 px-2 py-1 rounded-full text-xs';
    default: return 'text-gray-500';
  }
};

const TicketManagementView = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Modals
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  
  // Reply State
  const [replyText, setReplyText] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, priorityFilter, debouncedSearch]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      let url = `${API_BASE_URL}/tickets?`;
      if (statusFilter) url += `status=${statusFilter}&`;
      if (priorityFilter) url += `priority=${priorityFilter}&`;
      if (debouncedSearch) url += `search=${debouncedSearch}&`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch tickets');
      const data = await response.json();
      setTickets(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openTicket = (ticket) => {
    setSelectedTicket(ticket);
    setNewStatus(ticket.status);
    setReplyText('');
    setIsViewModalOpen(true);
  };

  const handleUpdateTicket = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setIsReplying(true);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/tickets/${selectedTicket._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: newStatus,
          replyMessage: replyText,
          adminName: 'Admin Team'
        })
      });

      if (!response.ok) throw new Error('Failed to update ticket');
      
      const updatedData = await response.json();
      setSelectedTicket(updatedData); // update modal data
      setReplyText('');
      toast.success('Ticket updated successfully');
      fetchTickets(); // refresh list
    } catch (err) {
      toast.error(err.message || 'Failed to update ticket');
    } finally {
      setIsReplying(false);
    }
  };

  const downloadCSV = () => {
    if (tickets.length === 0) return;
    const headers = ['Ticket ID', 'User', 'Subject', 'Category', 'Priority', 'Status', 'Created On'];
    const rows = tickets.map(t => [
      t.ticketId,
      t.user,
      t.subject,
      t.category,
      t.priority,
      t.status,
      new Date(t.createdAt).toLocaleDateString()
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(field => `"${field}"`).join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Tickets_Export_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full space-y-6 pb-6 relative">
      
      {loading && tickets.length === 0 && (
          <div className="absolute inset-0 bg-white/50 z-40 flex items-center justify-center rounded-2xl">
            <Loader2 className="animate-spin text-[#8CC63F]" size={48} />
          </div>
      )}

      {/* Header Area */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Ticket Management</h1>
          <p className="text-gray-500 text-sm font-medium">Manage and resolve support tickets</p>
        </div>
        
        <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
          <div className="flex w-full sm:w-auto gap-3">
            <div className="relative flex-1 sm:flex-none">
              <select 
                value={statusFilter} 
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full appearance-none bg-white border border-gray-200 rounded-xl pl-4 pr-10 py-2.5 text-sm text-gray-600 font-medium cursor-pointer shadow-sm hover:bg-gray-50 transition focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            
            <div className="relative flex-1 sm:flex-none">
              <select 
                value={priorityFilter} 
                onChange={e => setPriorityFilter(e.target.value)}
                className="w-full appearance-none bg-white border border-gray-200 rounded-xl pl-4 pr-10 py-2.5 text-sm text-gray-600 font-medium cursor-pointer shadow-sm hover:bg-gray-50 transition focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent"
              >
                <option value="">All Priority</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="relative w-full sm:w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search tickets..." 
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all shadow-sm"
            />
          </div>

          <button onClick={downloadCSV} className="w-full sm:w-auto bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {error && <div className="text-red-500 text-sm font-semibold bg-red-50 p-4 rounded-lg">{error}</div>}

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col">
        
        {/* Table */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ticket ID</th>
                <th className="px-6 py-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created On</th>
                <th className="px-6 py-5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tickets.length === 0 && !loading ? (
                 <tr>
                    <td colSpan="8" className="px-6 py-8 text-center text-sm text-gray-500 font-medium">No tickets found.</td>
                 </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr key={ticket._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">{ticket.ticketId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-600 whitespace-nowrap">{ticket.user}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-gray-800 whitespace-nowrap max-w-[200px] truncate block">{ticket.subject}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-600 whitespace-nowrap">{ticket.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-semibold whitespace-nowrap ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-semibold whitespace-nowrap ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-600 whitespace-nowrap">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-3">
                        <button onClick={() => openTicket(ticket)} className="text-gray-400 hover:text-emerald-600 transition-colors p-1.5 hover:bg-emerald-50 rounded-lg">
                          <Eye size={18} strokeWidth={2} />
                        </button>
                        <button onClick={() => openTicket(ticket)} className="text-gray-400 hover:text-blue-500 transition-colors p-1.5 hover:bg-blue-50 rounded-lg">
                          <MessageSquare size={18} strokeWidth={2} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination (Simplified visually for now) */}
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100">
          <div className="text-sm font-medium text-gray-500">
             Showing {tickets.length} tickets
          </div>
        </div>
        
      </div>

      {/* Ticket View/Reply Modal */}
      {isViewModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0 bg-gray-50">
              <div>
                 <h2 className="text-lg font-bold text-gray-900 flex items-center gap-3">
                   {selectedTicket.ticketId}
                   <span className={getStatusColor(selectedTicket.status)}>{selectedTicket.status}</span>
                 </h2>
                 <p className="text-sm text-gray-500 font-medium mt-1">{selectedTicket.subject} • {selectedTicket.category}</p>
              </div>
              <button type="button" onClick={() => setIsViewModalOpen(false)} className="text-gray-400 hover:bg-gray-200 hover:text-gray-600 p-1.5 rounded-lg transition-colors"><X size={20} /></button>
            </div>

            {/* Chat History */}
            <div className="p-6 flex-1 overflow-y-auto space-y-4 bg-white">
               {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                 selectedTicket.messages.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.sender === 'Admin' ? 'items-end' : 'items-start'}`}>
                       <span className="text-xs font-semibold text-gray-400 mb-1 px-1">{msg.senderName} • {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                       <div className={`px-4 py-3 rounded-2xl max-w-[80%] text-sm ${msg.sender === 'Admin' ? 'bg-[#8CC63F] text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm'}`}>
                          {msg.text}
                       </div>
                    </div>
                 ))
               ) : (
                 <div className="text-center text-gray-400 text-sm py-8">No messages in this ticket yet.</div>
               )}
            </div>

            {/* Reply Action Area */}
            <form onSubmit={handleUpdateTicket} className="px-6 py-4 border-t border-gray-100 bg-white flex-shrink-0">
               <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                     <span className="text-sm font-semibold text-gray-700">Update Status:</span>
                     <select 
                        value={newStatus}
                        onChange={e => setNewStatus(e.target.value)}
                        className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-[#8CC63F] focus:border-[#8CC63F] block p-2"
                     >
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                     </select>
                  </div>
                  
                  <div className="flex gap-3">
                    <input 
                      type="text" 
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="Type a reply message (optional)..."
                      className="flex-1 px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all"
                    />
                    <button type="submit" disabled={isReplying} className="bg-[#8CC63F] hover:bg-[#116631] text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-50">
                      {isReplying ? <Loader2 size={18} className="animate-spin" /> : <><Send size={16} /> Send</>}
                    </button>
                  </div>
               </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default TicketManagementView;
