import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Send,
  Building,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Archive,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  RotateCcw
} from 'lucide-react';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
import toast from 'react-hot-toast';

export default function PartnerComplaintDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const messagesEndRef = useRef(null);

  const LIFECYCLE_STEPS = [
    { id: 'Open', label: '1. Open', icon: AlertTriangle, desc: 'Triage Pending' },
    { id: 'In Progress', label: '2. In Progress', icon: Clock, desc: 'Under Investigation' },
    { id: 'Resolved', label: '3. Resolved', icon: CheckCircle2, desc: 'Solution Provided' },
    { id: 'Closed', label: '4. Closed', icon: Archive, desc: 'Archived & Complete' }
  ];

  useEffect(() => {
    fetchDetails();
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [complaint?.messages]);

  const fetchDetails = async (isSilent = false) => {
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
        const found = (data.data || []).find(c => c._id === id || c.complaintId === id);
        if (found) setComplaint(found);
      }
    } catch (error) {
      toast.error('Failed to fetch complaint details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!complaint || complaint.status === newStatus) return;
    
    // Instant optimistic update so UI changes immediately without waiting or refreshing
    const previousStatus = complaint.status;
    setComplaint(prev => ({ ...prev, status: newStatus }));
    setStatusUpdating(true);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/admin/partner-complaints/${complaint._id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Complaint status transitioned to ${newStatus}`);
        if (data.data) {
          setComplaint(prev => ({ ...prev, ...data.data, status: newStatus }));
        }
      } else {
        // Rollback on server rejection
        setComplaint(prev => ({ ...prev, status: previousStatus }));
        toast.error(data.message || 'Failed to update status');
      }
    } catch (error) {
      // Rollback on network failure
      setComplaint(prev => ({ ...prev, status: previousStatus }));
      toast.error('Failed to update status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSending(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/admin/partner-complaints/${complaint._id}/reply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: message.trim() })
      });
      const data = await response.json();
      if (data.success) {
        setComplaint(data.data);
        setMessage('');
        toast.success('Reply sent successfully');
      } else {
        toast.error(data.message || 'Failed to send reply');
      }
    } catch (error) {
      toast.error('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const getStepIndex = (status) => {
    return LIFECYCLE_STEPS.findIndex(s => s.id.toLowerCase() === (status || '').toLowerCase());
  };

  if (loading) {
    return (
      <div className="p-20 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8CC63F] mx-auto"></div>
        <p className="mt-4 text-xs font-semibold text-gray-500">Loading complaint details...</p>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="p-16 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto text-red-500">
          <AlertTriangle size={24} />
        </div>
        <h3 className="text-sm font-bold text-gray-900">Complaint Not Found</h3>
        <p className="text-xs text-gray-500">The requested partner complaint does not exist or has been removed.</p>
        <button
          onClick={() => navigate('/partner-complaints')}
          className="mt-2 px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl"
        >
          Back to Partner Complaints
        </button>
      </div>
    );
  }

  const currentStepIdx = getStepIndex(complaint.status);

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)] space-y-3">
      {/* Top Header Card */}
      <div className="bg-white px-5 py-4 border border-gray-200/80 rounded-2xl shadow-xs shrink-0 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/partner-complaints')}
              className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors border border-gray-200 cursor-pointer"
              title="Back to Complaints"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono text-xs font-bold text-[#116631] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  #{complaint.complaintId}
                </span>
                <h1 className="text-base font-bold text-gray-900">{complaint.title}</h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-blue-50 text-blue-700 border-blue-200">
                  {complaint.category}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                <span>Created: {new Date(complaint.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                {complaint.station?.name && (
                  <span>• Station: <strong className="text-gray-700">{complaint.station.name}</strong></span>
                )}
              </div>
            </div>
          </div>

          {/* Right Status Controls */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Current Status</span>
              <select
                value={complaint.status}
                onChange={(e) => handleUpdateStatus(e.target.value)}
                disabled={statusUpdating}
                className={`text-xs font-bold rounded-xl py-1.5 pl-3 pr-8 border shadow-2xs transition-all cursor-pointer outline-none ${
                  complaint.status === 'Open' ? 'bg-red-50 text-red-800 border-red-200 focus:ring-2 focus:ring-red-400' :
                  complaint.status === 'In Progress' ? 'bg-amber-50 text-amber-800 border-amber-200 focus:ring-2 focus:ring-amber-400' :
                  complaint.status === 'Resolved' ? 'bg-emerald-50 text-emerald-800 border-emerald-300 focus:ring-2 focus:ring-emerald-400' :
                  'bg-slate-100 text-slate-800 border-slate-300 focus:ring-2 focus:ring-slate-400'
                }`}
              >
                <option value="Open">● Open</option>
                <option value="In Progress">● In Progress</option>
                <option value="Resolved">✓ Resolved</option>
                <option value="Closed">■ Closed</option>
              </select>
            </div>

            <button
              onClick={() => fetchDetails(true)}
              disabled={refreshing}
              className="p-2 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-600 transition cursor-pointer"
              title="Refresh"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin text-emerald-600' : ''} />
            </button>
          </div>
        </div>

        {/* Visual Lifecycle Stepper Pipeline: Open → In Progress → Resolved → Closed */}
        <div className="pt-2 border-t border-gray-100">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {LIFECYCLE_STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isCurrent = complaint.status === step.id;
              const isPassed = currentStepIdx >= 0 && idx < currentStepIdx;
              
              let stepStyle = 'bg-gray-50 text-gray-400 border-gray-200';
              if (isCurrent) {
                if (step.id === 'Open') stepStyle = 'bg-red-50 text-red-800 border-red-300 ring-2 ring-red-400/20';
                else if (step.id === 'In Progress') stepStyle = 'bg-amber-50 text-amber-800 border-amber-300 ring-2 ring-amber-400/20';
                else if (step.id === 'Resolved') stepStyle = 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-400/20';
                else stepStyle = 'bg-slate-100 text-slate-800 border-slate-300 ring-2 ring-slate-400/20';
              } else if (isPassed) {
                stepStyle = 'bg-gray-100/80 text-gray-600 border-gray-200';
              }

              return (
                <button
                  key={step.id}
                  onClick={() => handleUpdateStatus(step.id)}
                  disabled={statusUpdating}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${stepStyle}`}
                  title={`Transition status to ${step.id}`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isCurrent ? 'bg-white shadow-2xs' : 'bg-gray-200/60'
                  }`}>
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate leading-tight flex items-center gap-1">
                      <span>{step.label}</span>
                      {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />}
                    </div>
                    <span className="text-[10px] text-gray-500 block truncate">{step.desc}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area: Original Complaint + Thread */}
      <div className="flex-1 bg-white border border-gray-200/80 rounded-2xl shadow-xs overflow-hidden flex flex-col min-h-0">
        {/* Original Partner Submission Card */}
        <div className="bg-gradient-to-r from-blue-50/80 via-white to-blue-50/30 p-4 shrink-0 border-b border-blue-100/80 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
            <Building size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-bold text-blue-900">
                Partner Issue: {complaint.partner?.name || 'Partner'}
              </span>
              <span className="text-[11px] text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded border border-blue-200">
                Direct B2B Submission
              </span>
            </div>
            <p className="text-xs text-gray-700 mt-1 whitespace-pre-wrap leading-relaxed font-medium">
              {complaint.description}
            </p>
          </div>
        </div>

        {/* Communication Thread Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-gray-50/50 flex flex-col gap-3 min-h-0">
          <div className="text-center my-1">
            <span className="text-[11px] font-semibold text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-2xs">
              Audit-Logged Resolution Thread
            </span>
          </div>

          {complaint.messages?.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mx-auto text-gray-400">
                <Clock size={18} />
              </div>
              <p className="text-xs text-gray-500 font-medium">No replies exchanged yet.</p>
              <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
                Type an official administrative response below to start communication with the partner representative.
              </p>
            </div>
          ) : (
            complaint.messages?.map((msg, index) => {
              const isAdmin = msg.sender === 'Admin';
              return (
                <div key={index} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-[80%] sm:max-w-[70%] rounded-2xl p-3.5 shadow-2xs space-y-1 ${
                      isAdmin 
                        ? 'bg-gray-900 text-white rounded-tr-xs' 
                        : 'bg-white text-gray-900 border border-gray-200/80 rounded-tl-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 text-[11px] pb-1 border-b border-white/10">
                      <span className={`font-bold ${isAdmin ? 'text-[#8CC63F]' : 'text-blue-700'}`}>
                        {isAdmin ? '🛡️ Admin Support' : `👤 ${msg.senderName || 'Partner'}`}
                      </span>
                      <span className={`text-[10px] ${isAdmin ? 'text-gray-300' : 'text-gray-400'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(msg.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                    <p className="text-xs whitespace-pre-wrap leading-relaxed pt-0.5">
                      {msg.text}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply Box & Quick Transition Actions */}
        <div className="bg-white p-3.5 border-t border-gray-200 shrink-0 space-y-2">
          {/* Quick 1-Click State Shifter Shortcuts */}
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-gray-400">Quick Actions:</span>
              {complaint.status === 'Open' && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus('In Progress')}
                  disabled={statusUpdating}
                  className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                >
                  <Clock size={12} />
                  <span>Start Investigation → In Progress</span>
                </button>
              )}
              {complaint.status !== 'Resolved' && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus('Resolved')}
                  disabled={statusUpdating}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                >
                  <CheckCircle2 size={12} />
                  <span>Mark as Resolved ✓</span>
                </button>
              )}
              {complaint.status !== 'Closed' && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus('Closed')}
                  disabled={statusUpdating}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                >
                  <Archive size={12} />
                  <span>Archive / Close</span>
                </button>
              )}
              {(complaint.status === 'Resolved' || complaint.status === 'Closed') && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus('In Progress')}
                  disabled={statusUpdating}
                  className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw size={12} />
                  <span>Reopen Ticket</span>
                </button>
              )}
            </div>
          </div>

          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type official reply or resolution details to partner..."
              className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-xs focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent outline-none transition shadow-2xs"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !message.trim()}
              className="inline-flex items-center justify-center px-5 py-2.5 text-xs font-bold rounded-xl text-white bg-[#8CC63F] hover:bg-[#116631] disabled:opacity-50 transition-colors shadow-2xs cursor-pointer gap-1.5"
            >
              {sending ? (
                <span>Sending...</span>
              ) : (
                <>
                  <span>Reply</span>
                  <Send size={13} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
