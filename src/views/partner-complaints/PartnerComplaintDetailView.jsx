import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Send
} from 'lucide-react';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
import { useNotification } from '../../contexts/NotificationContext';

export default function PartnerComplaintDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { showNotification } = useNotification();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchDetails();
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [complaint?.messages]);

  const fetchDetails = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/admin/partner-complaints`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        const found = data.data.find(c => c._id === id);
        if (found) setComplaint(found);
      }
    } catch (error) {
      showNotification('Failed to fetch details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/admin/partner-complaints/${id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();
      if (data.success) {
        showNotification(`Status updated to ${newStatus}`, 'success');
        setComplaint({ ...complaint, status: newStatus });
      }
    } catch (error) {
      showNotification('Failed to update status', 'error');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSending(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/admin/partner-complaints/${id}/reply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: message })
      });
      const data = await response.json();
      if (data.success) {
        setComplaint(data.data);
        setMessage('');
      }
    } catch (error) {
      showNotification('Failed to send message', 'error');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!complaint) {
    return <div className="p-8 text-center text-red-500">Complaint not found.</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="bg-white px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 rounded-t-xl">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/partner-complaints')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">{complaint.complaintId}</h1>
              <select
                value={complaint.status}
                onChange={(e) => handleUpdateStatus(e.target.value)}
                className="text-sm border-gray-300 rounded-full focus:ring-[#8CC63F] focus:border-[#8CC63F] py-1 pl-3 pr-8"
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
            <p className="text-sm text-gray-500 mt-1">{complaint.title}</p>
          </div>
        </div>
        
        <div className="text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
          <span className="font-semibold block">{complaint.partner?.name}</span>
          <span className="text-xs">{complaint.category}</span>
        </div>
      </div>

      {/* Description */}
      <div className="bg-blue-50 p-6 shrink-0 border-b border-blue-100">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">Original Complaint</h3>
        <p className="text-sm text-blue-800 whitespace-pre-wrap">{complaint.description}</p>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50 flex flex-col gap-4">
        {complaint.messages?.length === 0 ? (
          <div className="text-center text-gray-400 mt-10">No messages yet. Reply to the partner to start conversation.</div>
        ) : (
          complaint.messages?.map((msg, index) => {
            const isAdmin = msg.sender === 'Admin';
            return (
              <div key={index} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[75%] rounded-2xl px-5 py-3 shadow-sm ${
                    isAdmin 
                      ? 'bg-[#8CC63F] text-white rounded-tr-none' 
                      : 'bg-white text-gray-900 border border-gray-100 rounded-tl-none'
                  }`}
                >
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className={`text-xs font-semibold ${isAdmin ? 'text-white' : 'text-gray-500'}`}>
                      {msg.senderName}
                    </span>
                    <span className={`text-[10px] ${isAdmin ? 'text-white/80' : 'text-gray-400'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white p-4 border-t border-gray-200 shrink-0 rounded-b-xl">
        <form onSubmit={handleSendMessage} className="flex gap-4">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your reply to the partner..."
            className="flex-1 rounded-xl border-gray-300 focus:ring-[#8CC63F] focus:border-[#8CC63F] shadow-sm px-4 py-3"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !message.trim()}
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-[#8CC63F] hover:bg-[#7AB52E] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8CC63F] disabled:opacity-50 transition-colors shadow-sm"
          >
            {sending ? 'Sending...' : (
              <>
                <span>Send</span>
                <Send className="ml-2 h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
