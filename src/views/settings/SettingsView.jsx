import React, { useState, useEffect } from 'react';
import { User, Bell, Palette, CreditCard, Link as LinkIcon, Upload, CheckCircle2, ChevronRight, Globe, Clock, DollarSign, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from '../../contexts/ThemeContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const SettingsView = () => {
  const { updateThemeMode, updateFontFamily } = useTheme();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Profile State
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    profileImage: null,
    profileImageUrl: ''
  });

  // Settings State
  const [settings, setSettings] = useState({
    language: 'English (US)',
    timezone: '(GMT+05:30) India Standard Time',
    currency: 'INR (₹)',
    emailWeeklyReports: true,
    emailSupportTickets: true,
    emailPaymentFailures: false,
    pushStationOffline: true,
    pushCriticalErrors: true,
    themeMode: 'light',
    fontFamily: 'Outfit',
    apiProductionKey: '',
    stripeEnabled: true,
    awsEnabled: true,
    zendeskEnabled: false,
  });

  // Billing State
  const [billing, setBilling] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [profileRes, settingsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/profile`, { headers }),
        fetch(`${API_BASE_URL}/settings`, { headers })
      ]);

      if (profileRes.ok) {
        const pData = await profileRes.json();
        const names = pData.name ? pData.name.split(' ') : ['Super', 'Admin'];
        setProfile({
          firstName: names[0] || '',
          lastName: names.slice(1).join(' ') || '',
          email: pData.email || '',
          profileImage: null,
          profileImageUrl: pData.profileImage ? `${API_BASE_URL.replace('/api', '')}${pData.profileImage}` : ''
        });
      }

      if (settingsRes.ok) {
        const sData = await settingsRes.json();
        if (sData.settings) {
          setSettings(prev => ({ ...prev, ...sData.settings }));
        }
        if (sData.billing) {
          setBilling(sData.billing);
        }
      }
    } catch (error) {
      console.error('Error fetching settings data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSettingsChange = (name, value) => {
    setSettings(prev => ({ ...prev, [name]: value }));
    if (name === 'themeMode') updateThemeMode(value);
    if (name === 'fontFamily') updateFontFamily(value);
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setProfile(prev => ({
        ...prev,
        profileImage: e.target.files[0],
        profileImageUrl: URL.createObjectURL(e.target.files[0])
      }));
    }
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const token = localStorage.getItem('adminToken');
      const formData = new FormData();
      formData.append('name', `${profile.firstName} ${profile.lastName}`.trim());
      formData.append('email', profile.email);
      if (profile.profileImage) {
        formData.append('profileImage', profile.profileImage);
      }

      const res = await fetch(`${API_BASE_URL}/admin/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) throw new Error('Failed to save profile');
      toast.success('Profile saved successfully!');
    } catch (error) {
      toast.error(error.message || 'Error saving profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (!res.ok) throw new Error('Failed to save settings');
      toast.success('Preferences saved successfully!');
    } catch (error) {
      toast.error(error.message || 'Error saving settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const generateApiKey = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/settings/apikey`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(prev => ({ ...prev, apiProductionKey: data.apiProductionKey }));
        toast.success('New API key generated');
      } else {
        throw new Error('Failed to generate key');
      }
    } catch (error) {
      toast.error(error.message || 'Error generating API key');
    }
  };

  const tabs = [
    { id: 'general', label: 'General Info', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'billing', label: 'Billing & Plans', icon: CreditCard },
    { id: 'integrations', label: 'Integrations', icon: LinkIcon },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-emerald-500" size={48} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-6 pb-6">
      {/* Header Area */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Settings</h1>
        <p className="text-gray-500 text-sm font-medium">Manage your account and platform preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Navigation */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-4 flex flex-col gap-2">
            {tabs.map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all ${
                  activeTab === tab.id 
                    ? 'bg-emerald-50 text-[#8CC63F] font-semibold border border-emerald-100' 
                    : 'text-gray-600 hover:bg-gray-50 font-semibold border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <tab.icon size={18} strokeWidth={activeTab === tab.id ? 2.5 : 2} className={activeTab === tab.id ? 'text-[#8CC63F]' : 'text-gray-400'} />
                  <span className="text-sm">{tab.label}</span>
                </div>
                {activeTab === tab.id && <ChevronRight size={16} />}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-6 md:p-8">
          
          {activeTab === 'general' && (
            <div className="max-w-2xl">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h3>
              
              {/* Profile Photo */}
              <div className="flex items-center gap-6 mb-8">
                {profile.profileImageUrl ? (
                  <img src={profile.profileImageUrl} alt="Profile" className="w-24 h-24 rounded-full object-cover shadow-sm border-4 border-white ring-2 ring-gray-50" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-emerald-100 text-[#8CC63F] flex items-center justify-center font-semibold text-3xl shadow-sm border-4 border-white ring-2 ring-gray-50">
                    {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">Profile Photo</h4>
                  <p className="text-xs text-gray-500 font-medium mb-3">Recommended size: 500x500px (JPG or PNG).</p>
                  <div className="flex gap-3">
                    <label className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm cursor-pointer">
                      <Upload size={16} /> Upload New
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                    <button onClick={() => setProfile(prev => ({...prev, profileImage: null, profileImageUrl: ''}))} className="text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                      Remove
                    </button>
                  </div>
                </div>
              </div>

              <div className="h-px w-full bg-gray-100 mb-8"></div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">First Name</label>
                  <input type="text" name="firstName" value={profile.firstName} onChange={handleProfileChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all shadow-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Last Name</label>
                  <input type="text" name="lastName" value={profile.lastName} onChange={handleProfileChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all shadow-sm" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Email Address</label>
                  <input type="email" name="email" value={profile.email} onChange={handleProfileChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all shadow-sm" />
                </div>
              </div>

              <div className="flex justify-end pt-2 mb-8">
                <button onClick={saveProfile} disabled={savingProfile} className="bg-[#8CC63F] hover:bg-[#116631] text-white px-8 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm disabled:opacity-70">
                  {savingProfile ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} strokeWidth={2.5} />} Save Profile
                </button>
              </div>

              <div className="h-px w-full bg-gray-100 mb-8"></div>

              <h3 className="text-xl font-semibold text-gray-900 mb-6 mt-10">Platform Preferences</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Language</label>
                  <div className="relative">
                    <Globe size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select value={settings.language} onChange={(e) => handleSettingsChange('language', e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all shadow-sm appearance-none bg-white">
                      <option>English (US)</option>
                      <option>Hindi</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Timezone</label>
                  <div className="relative">
                    <Clock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select value={settings.timezone} onChange={(e) => handleSettingsChange('timezone', e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all shadow-sm appearance-none bg-white">
                      <option>(GMT+05:30) India Standard Time</option>
                      <option>(GMT+00:00) UTC</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Currency</label>
                  <div className="relative">
                    <DollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select value={settings.currency} onChange={(e) => handleSettingsChange('currency', e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all shadow-sm appearance-none bg-white">
                      <option>INR (₹)</option>
                      <option>USD ($)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t border-gray-100">
                <button onClick={saveSettings} disabled={savingSettings} className="bg-[#8CC63F] hover:bg-[#116631] text-white px-8 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm disabled:opacity-70">
                  {savingSettings ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} strokeWidth={2.5} />} Save Preferences
                </button>
              </div>

            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="max-w-2xl">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Notification Preferences</h3>
              
              <div className="space-y-6 mb-8">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-4 border-b border-gray-100 pb-2">Email Notifications</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Weekly Reports</p>
                        <p className="text-xs text-gray-500 font-medium">Receive a weekly summary of platform performance.</p>
                      </div>
                      <div onClick={() => handleSettingsChange('emailWeeklyReports', !settings.emailWeeklyReports)} className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${settings.emailWeeklyReports ? 'bg-emerald-500' : 'bg-gray-200'}`}><div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${settings.emailWeeklyReports ? 'left-6' : 'left-1'}`}></div></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">New Support Tickets</p>
                        <p className="text-xs text-gray-500 font-medium">Get notified when a high-priority ticket is created.</p>
                      </div>
                      <div onClick={() => handleSettingsChange('emailSupportTickets', !settings.emailSupportTickets)} className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${settings.emailSupportTickets ? 'bg-emerald-500' : 'bg-gray-200'}`}><div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${settings.emailSupportTickets ? 'left-6' : 'left-1'}`}></div></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Payment Failures</p>
                        <p className="text-xs text-gray-500 font-medium">Alerts for failed transactions from users.</p>
                      </div>
                      <div onClick={() => handleSettingsChange('emailPaymentFailures', !settings.emailPaymentFailures)} className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${settings.emailPaymentFailures ? 'bg-emerald-500' : 'bg-gray-200'}`}><div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${settings.emailPaymentFailures ? 'left-6' : 'left-1'}`}></div></div>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4 border-b border-gray-100 pb-2">Push & SMS Alerts</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Station Offline Alerts</p>
                        <p className="text-xs text-gray-500 font-medium">Immediate SMS when a station goes offline.</p>
                      </div>
                      <div onClick={() => handleSettingsChange('pushStationOffline', !settings.pushStationOffline)} className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${settings.pushStationOffline ? 'bg-emerald-500' : 'bg-gray-200'}`}><div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${settings.pushStationOffline ? 'left-6' : 'left-1'}`}></div></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Critical System Errors</p>
                        <p className="text-xs text-gray-500 font-medium">Push notifications for server or API downtime.</p>
                      </div>
                      <div onClick={() => handleSettingsChange('pushCriticalErrors', !settings.pushCriticalErrors)} className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${settings.pushCriticalErrors ? 'bg-emerald-500' : 'bg-gray-200'}`}><div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${settings.pushCriticalErrors ? 'left-6' : 'left-1'}`}></div></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t border-gray-100">
                <button onClick={saveSettings} disabled={savingSettings} className="bg-[#8CC63F] hover:bg-[#116631] text-white px-8 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm disabled:opacity-70">
                  {savingSettings ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} strokeWidth={2.5} />} Save Preferences
                </button>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="max-w-2xl">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Appearance Settings</h3>
              
              <div className="mb-8">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-4">Theme Mode</label>
                <div className="grid grid-cols-3 gap-4">
                  <div onClick={() => handleSettingsChange('themeMode', 'light')} className={`border-2 rounded-xl p-4 cursor-pointer relative overflow-hidden bg-white transition-colors ${settings.themeMode === 'light' ? 'border-[#8CC63F]' : 'border-gray-100'}`}>
                    {settings.themeMode === 'light' && <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#8CC63F] flex items-center justify-center text-white"><CheckCircle2 size={12} /></div>}
                    <div className="w-full h-16 bg-gray-50 rounded-lg mb-3 border border-gray-200"></div>
                    <p className="text-sm font-semibold text-center text-gray-900">Light</p>
                  </div>
                  <div onClick={() => handleSettingsChange('themeMode', 'dark')} className={`border-2 rounded-xl p-4 cursor-pointer relative overflow-hidden bg-gray-900 transition-colors ${settings.themeMode === 'dark' ? 'border-[#8CC63F]' : 'border-gray-100'}`}>
                    {settings.themeMode === 'dark' && <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#8CC63F] flex items-center justify-center text-white"><CheckCircle2 size={12} /></div>}
                    <div className="w-full h-16 bg-gray-800 rounded-lg mb-3 border border-gray-700"></div>
                    <p className="text-sm font-semibold text-center text-white">Dark</p>
                  </div>
                  <div onClick={() => handleSettingsChange('themeMode', 'system')} className={`border-2 rounded-xl p-4 cursor-pointer relative overflow-hidden bg-gradient-to-r from-gray-50 to-gray-900 transition-colors ${settings.themeMode === 'system' ? 'border-[#8CC63F]' : 'border-gray-100'}`}>
                    {settings.themeMode === 'system' && <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#8CC63F] flex items-center justify-center text-white"><CheckCircle2 size={12} /></div>}
                    <div className="w-full h-16 flex rounded-lg mb-3 overflow-hidden border border-gray-300">
                      <div className="w-1/2 h-full bg-gray-50"></div>
                      <div className="w-1/2 h-full bg-gray-800"></div>
                    </div>
                    <p className="text-sm font-semibold text-center text-gray-900">System Default</p>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-4">Font Family</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {['Outfit', 'Inter', 'Roboto', 'Space Grotesk'].map(font => (
                    <div 
                      key={font} 
                      onClick={() => handleSettingsChange('fontFamily', font)} 
                      className={`border-2 rounded-xl p-4 cursor-pointer relative overflow-hidden bg-white transition-colors flex flex-col items-center justify-center h-24 ${settings.fontFamily === font ? 'border-[#8CC63F] bg-emerald-50' : 'border-gray-100'}`}
                      style={{ fontFamily: font === 'Space Grotesk' ? '"Space Grotesk", sans-serif' : `'${font}', sans-serif` }}
                    >
                      {settings.fontFamily === font && <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#8CC63F] flex items-center justify-center text-white"><CheckCircle2 size={12} /></div>}
                      <span className="text-3xl font-bold text-gray-800 mb-1">Aa</span>
                      <p className="text-xs font-semibold text-center text-gray-600">{font}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t border-gray-100">
                <button onClick={saveSettings} disabled={savingSettings} className="bg-[#8CC63F] hover:bg-[#116631] text-white px-8 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm disabled:opacity-70">
                  {savingSettings ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} strokeWidth={2.5} />} Save Appearance
                </button>
              </div>
            </div>
          )}

          {activeTab === 'billing' && billing && (
            <div className="max-w-3xl">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Billing & Plans</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gradient-to-br from-[#8CC63F] to-emerald-800 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                  <h4 className="text-emerald-100 text-sm font-semibold mb-1">Current Plan</h4>
                  <div className="text-2xl font-semibold mb-4">{billing.planName}</div>
                  <div className="text-3xl font-semibold mb-6">₹{billing.planPrice.toLocaleString()}<span className="text-sm font-medium text-emerald-200">/mo</span></div>
                  <button className="bg-white text-emerald-800 font-semibold px-4 py-2.5 rounded-lg text-sm w-full hover:bg-gray-50 transition-colors">
                    Change Plan
                  </button>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h4 className="text-gray-500 text-sm font-semibold mb-1">Payment Method</h4>
                    <div className="flex items-center gap-3 mt-4">
                      <div className="w-12 h-8 bg-blue-50 border border-blue-100 rounded flex items-center justify-center font-semibold text-blue-700 italic">{billing.paymentMethodType}</div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">•••• •••• •••• {billing.paymentMethodLast4}</p>
                        <p className="text-xs font-medium text-gray-500">Expires {billing.paymentMethodExpiry}</p>
                      </div>
                    </div>
                  </div>
                  <button className="text-emerald-600 font-semibold border border-emerald-100 bg-emerald-50 px-4 py-2.5 rounded-lg text-sm w-full hover:bg-emerald-100 transition-colors mt-6">
                    Update Method
                  </button>
                </div>
              </div>

              <h4 className="text-base font-semibold text-gray-900 mb-4">Billing History</h4>
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {billing.billingHistory.map((history, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-semibold text-gray-800">{new Date(history.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-600">₹{history.amount.toLocaleString()}</td>
                        <td className="px-4 py-3"><span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">{history.status}</span></td>
                        <td className="px-4 py-3 text-right"><button className="text-emerald-600 hover:text-emerald-700 font-semibold text-sm">Download</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="max-w-2xl">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Integrations & API</h3>
              
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-gray-900">API Keys</h4>
                  <button onClick={generateApiKey} className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors">
                    Generate New Key
                  </button>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">Production Key</p>
                    <p className="text-sm font-mono text-gray-800">{settings.apiProductionKey}</p>
                  </div>
                  <button onClick={() => { navigator.clipboard.writeText(settings.apiProductionKey); toast.success('Copied!'); }} className="text-gray-500 hover:text-gray-700 bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm">
                    Copy
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-4 border-b border-gray-100 pb-2">Connected Apps</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-emerald-100 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-semibold text-xl">St</div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Stripe Payments</p>
                        <p className="text-xs text-gray-500 font-medium">Process refunds and wallet top-ups.</p>
                      </div>
                    </div>
                    <div onClick={() => { handleSettingsChange('stripeEnabled', !settings.stripeEnabled); saveSettings(); }} className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${settings.stripeEnabled ? 'bg-emerald-500' : 'bg-gray-200'}`}><div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${settings.stripeEnabled ? 'left-6' : 'left-1'}`}></div></div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-emerald-100 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center font-semibold text-xl">AWS</div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">AWS S3 Storage</p>
                        <p className="text-xs text-gray-500 font-medium">Cloud backup for station logs.</p>
                      </div>
                    </div>
                    <div onClick={() => { handleSettingsChange('awsEnabled', !settings.awsEnabled); saveSettings(); }} className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${settings.awsEnabled ? 'bg-emerald-500' : 'bg-gray-200'}`}><div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${settings.awsEnabled ? 'left-6' : 'left-1'}`}></div></div>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-emerald-100 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center font-semibold text-xl">Z</div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Zendesk Support</p>
                        <p className="text-xs text-gray-500 font-medium">Sync support tickets automatically.</p>
                      </div>
                    </div>
                    <div onClick={() => { handleSettingsChange('zendeskEnabled', !settings.zendeskEnabled); saveSettings(); }} className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${settings.zendeskEnabled ? 'bg-emerald-500' : 'bg-gray-200'}`}><div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${settings.zendeskEnabled ? 'left-6' : 'left-1'}`}></div></div>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SettingsView;
