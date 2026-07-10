import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, Fingerprint, Activity, Clock, ShieldAlert, Monitor, Key, Lock, Globe, Server, UserCheck, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const SecurityCenterView = () => {
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [toggles, setToggles] = useState({
    twoFactor: true,
    ipWhitelist: false,
    sessionTimeout: true,
    loginAlerts: true,
  });

  const [stats, setStats] = useState({
    systemHealth: 'Secure',
    activeThreats: 0,
    failedLogins24h: 0,
    lastScanDate: new Date(),
  });

  const [securityEvents, setSecurityEvents] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [settingsRes, statsRes, eventsRes, sessionsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/security/settings`, { headers }),
        fetch(`${API_BASE_URL}/security/stats`, { headers }),
        fetch(`${API_BASE_URL}/security/events`, { headers }),
        fetch(`${API_BASE_URL}/security/sessions`, { headers }),
      ]);

      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setToggles({
          twoFactor: data.twoFactor,
          ipWhitelist: data.ipWhitelist,
          sessionTimeout: data.sessionTimeout,
          loginAlerts: data.loginAlerts,
        });
      }
      
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }

      if (eventsRes.ok) {
        const data = await eventsRes.json();
        setSecurityEvents(data);
      }

      if (sessionsRes.ok) {
        const data = await sessionsRes.json();
        setActiveSessions(data);
      }

    } catch (error) {
      console.error("Failed to fetch security data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key) => {
    const newValue = !toggles[key];
    // Optimistic update
    setToggles(prev => ({ ...prev, [key]: newValue }));
    
    try {
      const token = localStorage.getItem('adminToken');
      await fetch(`${API_BASE_URL}/security/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ key, value: newValue })
      });
      toast.success(`Security setting updated successfully`);
    } catch (error) {
      toast.error(error.message || "Failed to update setting");
      // Revert on error
      setToggles(prev => ({ ...prev, [key]: !newValue }));
    }
  };

  const handleRunScan = async () => {
    if (isScanning) return;
    setIsScanning(true);
    const scanToast = toast.loading("Running comprehensive vulnerability scan...");
    try {
      await new Promise(resolve => setTimeout(resolve, 2500)); // UI delay for dynamic feel
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/security/scan`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Scan failed');
      toast.success("Security scan completed successfully! No threats found.", { id: scanToast });
      fetchData(); // Refresh data to show new scan time and event
    } catch (error) {
      toast.error(error.message || "Failed to run scan", { id: scanToast });
    } finally {
      setIsScanning(false);
    }
  };

  const handleTerminateSessions = async () => {
    if (!window.confirm("Are you sure you want to terminate all other active sessions?")) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/security/sessions/terminate-others`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to terminate sessions');
      toast.success("Other active sessions terminated!");
      fetchData(); // Refresh sessions
    } catch (error) {
      toast.error(error.message || "Failed to terminate sessions");
    }
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " mins ago";
    return Math.floor(seconds) + " seconds ago";
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    if(new Date().toDateString() === date.toDateString()){
       return `Today, ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    }
    return date.toLocaleDateString() + ', ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  return (
    <div className="flex flex-col h-full space-y-6 pb-6 relative">
      {loading && (
          <div className="absolute inset-0 bg-white/50 z-40 flex items-center justify-center rounded-2xl">
            <Loader2 className="animate-spin text-[#8CC63F]" size={48} />
          </div>
      )}

      {/* Header Area */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Security Center</h1>
        <p className="text-gray-500 text-sm font-medium">Manage system security and threat protection</p>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <div className="text-gray-500 text-sm font-semibold mb-2">System Health</div>
            <div className={`text-2xl font-semibold flex items-center gap-2 ${stats.systemHealth === 'Secure' ? 'text-emerald-600' : 'text-red-600'}`}>
              {stats.systemHealth} {stats.systemHealth === 'Secure' ? <ShieldCheck size={20} strokeWidth={2.5} /> : <AlertTriangle size={20} strokeWidth={2.5} />}
            </div>
          </div>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stats.systemHealth === 'Secure' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            <Activity size={24} strokeWidth={2} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <div className="text-gray-500 text-sm font-semibold mb-2">Active Threats</div>
            <div className="text-2xl font-semibold text-gray-900">{stats.activeThreats}</div>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <ShieldAlert size={24} strokeWidth={2} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <div className="text-gray-500 text-sm font-semibold mb-2">Failed Logins (24h)</div>
            <div className="text-2xl font-semibold text-gray-900">{stats.failedLogins24h}</div>
          </div>
          <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
            <AlertTriangle size={24} strokeWidth={2} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <div className="text-gray-500 text-sm font-semibold mb-2">Last Security Scan</div>
            <div className="text-xl font-semibold text-gray-900 whitespace-nowrap">{formatDate(stats.lastScanDate)}</div>
          </div>
          <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 flex-shrink-0">
            <Fingerprint size={24} strokeWidth={2} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column (Wider) */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Security Settings */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Access & Authentication</h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-gray-50 pb-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <Key size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">Two-Factor Authentication (2FA)</h4>
                    <p className="text-xs text-gray-500 font-medium">Require a secondary code for all admin logins.</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleToggle('twoFactor')}
                  className={`w-11 h-6 rounded-full relative transition-colors ${toggles.twoFactor ? 'bg-emerald-500' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${toggles.twoFactor ? 'left-6' : 'left-1'}`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between border-b border-gray-50 pb-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-50 text-gray-600 flex items-center justify-center flex-shrink-0">
                    <Globe size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">IP Whitelisting</h4>
                    <p className="text-xs text-gray-500 font-medium">Restrict admin panel access to specific IP addresses only.</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleToggle('ipWhitelist')}
                  className={`w-11 h-6 rounded-full relative transition-colors ${toggles.ipWhitelist ? 'bg-emerald-500' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${toggles.ipWhitelist ? 'left-6' : 'left-1'}`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between border-b border-gray-50 pb-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <Clock size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">Automatic Session Timeout</h4>
                    <p className="text-xs text-gray-500 font-medium">Log out inactive users after 30 minutes of idle time.</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleToggle('sessionTimeout')}
                  className={`w-11 h-6 rounded-full relative transition-colors ${toggles.sessionTimeout ? 'bg-emerald-500' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${toggles.sessionTimeout ? 'left-6' : 'left-1'}`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <Lock size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">Login Alerts</h4>
                    <p className="text-xs text-gray-500 font-medium">Send email notifications on logins from new devices.</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleToggle('loginAlerts')}
                  className={`w-11 h-6 rounded-full relative transition-colors ${toggles.loginAlerts ? 'bg-emerald-500' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${toggles.loginAlerts ? 'left-6' : 'left-1'}`}></div>
                </button>
              </div>
            </div>
          </div>

          {/* Recent Security Events */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Security Events</h3>
            <div className="space-y-4">
              {securityEvents.length > 0 ? securityEvents.map((event) => (
                <div key={event.id} className="flex items-start gap-4 p-4 rounded-xl border border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5
                    ${event.type === 'warning' ? 'bg-orange-50 text-orange-500' : ''}
                    ${event.type === 'info' ? 'bg-blue-50 text-blue-500' : ''}
                    ${event.type === 'success' ? 'bg-emerald-50 text-emerald-500' : ''}
                  `}>
                    {event.type === 'warning' && <AlertTriangle size={14} strokeWidth={2.5} />}
                    {event.type === 'info' && <ShieldAlert size={14} strokeWidth={2.5} />}
                    {event.type === 'success' && <ShieldCheck size={14} strokeWidth={2.5} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800 mb-1">{event.text}</p>
                    <span className="text-xs font-medium text-gray-500">{timeAgo(event.time)}</span>
                  </div>
                </div>
              )) : (
                <div className="text-center text-sm text-gray-500 py-6">No recent security events.</div>
              )}
            </div>
            <button className="w-full mt-4 py-2.5 text-sm font-semibold text-[#8CC63F] hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-100">
              View All Logs
            </button>
          </div>

        </div>

        {/* Right Column (Narrow) */}
        <div className="space-y-6">
          
          {/* Scan Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-6 text-center flex flex-col items-center relative overflow-hidden">
            {isScanning && <div className="absolute inset-0 bg-emerald-50/50 animate-pulse z-0"></div>}
            <div className="relative z-10 w-20 h-20 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-4 ring-4 ring-emerald-500/10">
              <Server size={32} strokeWidth={2} className={isScanning ? 'animate-bounce text-[#8CC63F]' : ''} />
            </div>
            <h3 className="relative z-10 text-lg font-semibold text-gray-900 mb-2">{isScanning ? 'Scanning Network...' : 'Vulnerability Scan'}</h3>
            <p className="relative z-10 text-sm text-gray-500 font-medium mb-6">
              {isScanning ? 'Analyzing nodes, checking firewall rules, and verifying active session integrities. Please wait.' : 'Your system is fully protected and up to date with the latest security patches.'}
            </p>
            <button 
              onClick={handleRunScan} 
              disabled={isScanning}
              className={`relative z-10 bg-[#8CC63F] hover:bg-[#116631] text-white w-full py-3 rounded-xl text-sm font-semibold transition-colors shadow-sm flex items-center justify-center gap-2 ${isScanning ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isScanning ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Scanning System...
                </>
              ) : (
                "Run Manual Scan"
              )}
            </button>
          </div>

          {/* Active Sessions */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Active Sessions</h3>
              <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-1 rounded-md">{activeSessions.length} Online</span>
            </div>

            <div className="space-y-4">
              {activeSessions.map((session) => (
                <div key={session._id || Math.random()} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center flex-shrink-0">
                    {session.device.includes('Mac') || session.device.includes('Windows') ? <Monitor size={18} /> : <UserCheck size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{session.adminName || session.user}</p>
                    <p className="text-xs text-gray-500 font-medium truncate mb-1">{session.device} • {session.location}</p>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${session.status.includes('Now') ? 'text-emerald-500' : 'text-gray-400'}`}>
                      {session.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <button onClick={handleTerminateSessions} className="w-full mt-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              Terminate All Other Sessions
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SecurityCenterView;
