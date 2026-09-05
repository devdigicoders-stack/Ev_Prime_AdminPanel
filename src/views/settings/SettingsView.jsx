import { useState, useEffect } from 'react';
import { User, Palette, CreditCard, Upload, CheckCircle2, ChevronRight, Loader2, Share2, Phone, Mail, MapPin, MessageSquare, X, Check, Printer, Download, Sparkles, FileText, Plus } from 'lucide-react';
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
    phone: '+91 98765 43210',
    contactEmail: 'hello@bharatevprime.com',
    address: 'New Delhi, India',
    facebookUrl: 'https://facebook.com',
    instagramUrl: 'https://instagram.com',
    linkedinUrl: 'https://linkedin.com',
    youtubeUrl: 'https://youtube.com',
    twitterUrl: 'https://twitter.com',
    tawkEnabled: true,
    tawkPropertyId: '6a787fd78775771d44219111',
    tawkWidgetId: '1jvjb6ouh',
    tawkDirectChatUrl: 'https://embed.tawk.to/6a787fd78775771d44219111/1jvjb6ouh',
  });

  // Billing State
  const [billing, setBilling] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [updatingBilling, setUpdatingBilling] = useState(false);
  const [selectedPlanName, setSelectedPlanName] = useState('Enterprise EV');
  const [paymentForm, setPaymentForm] = useState({
    cardType: 'VISA',
    cardNumber: '•••• •••• •••• 4242',
    cardHolder: 'Bharat EV Prime Admin',
    expiry: '12/26',
    cvv: '888'
  });

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

  const AVAILABLE_PLANS = [
    {
      id: 'starter',
      name: 'Starter EV',
      price: 15000,
      description: 'Ideal for local charging hubs & small commercial EV operations.',
      badge: 'Starter Tier',
      stations: 'Up to 10 Stations',
      features: [
        'Up to 10 Active Charging Stations',
        'Standard OCPI / OCPP 1.6 Protocol Support',
        'Real-time Charger Status & Diagnostics',
        'Email Support with 24h turnaround SLA',
        'Daily Automated Cloud Backups'
      ]
    },
    {
      id: 'growth',
      name: 'Growth EV',
      price: 28000,
      description: 'Designed for rapidly expanding regional & highway charging hubs.',
      badge: 'Fast Scaling',
      stations: 'Up to 30 Stations',
      features: [
        'Up to 30 Active Charging Stations',
        'Smart Dynamic Load Balancing & Peak Shaving',
        'OCPP 2.0.1 Fast-Charging Protocol Integration',
        'Priority 24/7 Phone & Email Engineering Support',
        'Live Heatmap & Revenue Breakdown'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise EV',
      price: 45000,
      description: 'Full capabilities with unrestricted enterprise scale and 99.99% SLA.',
      badge: 'Most Popular',
      stations: 'Unlimited Stations',
      features: [
        'Unlimited Charging Stations & Connectors',
        'AI Predictive Maintenance & Telemetry Insights',
        'Custom Webhooks & Platform REST API Access',
        '99.99% Guaranteed Cloud Infrastructure SLA',
        'Dedicated Enterprise Technical Account Manager'
      ]
    }
  ];

  const handleOpenPlanModal = () => {
    setSelectedPlanName(billing?.planName || 'Enterprise EV');
    setShowPlanModal(true);
  };

  const handleConfirmPlanChange = async () => {
    const targetPlan = AVAILABLE_PLANS.find(p => p.name === selectedPlanName);
    if (!targetPlan) return;
    setUpdatingBilling(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/settings/billing`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          planName: targetPlan.name,
          planPrice: targetPlan.price,
          addInvoice: true
        })
      });
      if (!res.ok) throw new Error('Failed to update subscription plan');
      const updatedBilling = await res.json();
      setBilling(updatedBilling);
      toast.success(`Subscription updated to ${targetPlan.name}!`);
      setShowPlanModal(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to change plan.');
    } finally {
      setUpdatingBilling(false);
    }
  };

  const handleOpenPaymentModal = () => {
    setPaymentForm({
      cardType: billing?.paymentMethodType || 'VISA',
      cardNumber: `4242 4242 4242 ${billing?.paymentMethodLast4 || '4242'}`,
      cardHolder: `${profile.firstName} ${profile.lastName}`.trim() || 'Bharat EV Prime Admin',
      expiry: billing?.paymentMethodExpiry || '12/26',
      cvv: '888'
    });
    setShowPaymentModal(true);
  };

  const handleSavePaymentMethod = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setUpdatingBilling(true);
    try {
      const cleanCard = paymentForm.cardNumber.replace(/\s+/g, '');
      const last4 = cleanCard.length >= 4 ? cleanCard.slice(-4) : (billing?.paymentMethodLast4 || '4242');
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/settings/billing`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          paymentMethodType: paymentForm.cardType,
          paymentMethodLast4: last4,
          paymentMethodExpiry: paymentForm.expiry
        })
      });
      if (!res.ok) throw new Error('Failed to update payment method');
      const updatedBilling = await res.json();
      setBilling(updatedBilling);
      toast.success('Payment method updated successfully!');
      setShowPaymentModal(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update payment method.');
    } finally {
      setUpdatingBilling(false);
    }
  };

  const handleViewInvoice = (historyItem) => {
    setSelectedInvoice(historyItem);
    setShowInvoiceModal(true);
  };

  const handleAddCycleInvoice = async () => {
    setUpdatingBilling(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/settings/billing`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          addInvoice: true
        })
      });
      if (!res.ok) throw new Error('Failed to generate cycle invoice');
      const updatedBilling = await res.json();
      setBilling(updatedBilling);
      toast.success('New billing cycle invoice generated!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate invoice.');
    } finally {
      setUpdatingBilling(false);
    }
  };

  const printInvoice = (invoice) => {
    if (!invoice) return;
    const invDate = new Date(invoice.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const invId = invoice._id ? invoice._id.toString().slice(-6).toUpperCase() : '062601';
    const amount = Number(invoice.amount) || (billing?.planPrice || 45000);
    const baseAmount = (amount / 1.18).toFixed(2);
    const gstAmount = ((amount - baseAmount) / 2).toFixed(2);
    const invoiceNumber = `BEV-INV-2026-${invId}`;
    
    const printWindow = window.open('', '_blank', 'width=880,height=920');
    if (!printWindow) {
      toast.error('Please allow popups to download or print invoice.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice - ${invoiceNumber}</title>
        <style>
          @page { size: A4; margin: 15mm; }
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #111827;
            background: #ffffff;
            padding: 24px;
            margin: 0;
            line-height: 1.5;
          }
          .invoice-card {
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 32px;
            max-width: 800px;
            margin: 0 auto;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #8CC63F;
            padding-bottom: 20px;
            margin-bottom: 24px;
          }
          .brand-title {
            font-size: 24px;
            font-weight: 800;
            color: #116631;
            margin: 0 0 4px 0;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .brand-subtitle {
            font-size: 13px;
            color: #4b5563;
            margin: 0;
            font-weight: 500;
          }
          .inv-meta {
            text-align: right;
          }
          .badge {
            display: inline-block;
            background: #ecfdf5;
            color: #065f46;
            font-size: 11px;
            font-weight: 700;
            padding: 4px 12px;
            border-radius: 9999px;
            border: 1px solid #a7f3d0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 6px;
          }
          .inv-no {
            font-size: 17px;
            font-weight: 700;
            color: #111827;
            margin: 0;
          }
          .inv-date {
            font-size: 13px;
            color: #6b7280;
            margin-top: 2px;
          }
          .parties-grid {
            display: flex;
            justify-content: space-between;
            gap: 30px;
            margin-bottom: 28px;
            background: #f9fafb;
            padding: 18px 20px;
            border-radius: 8px;
            font-size: 13px;
          }
          .party-col {
            flex: 1;
          }
          .party-label {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            color: #6b7280;
            letter-spacing: 0.5px;
            margin-bottom: 6px;
          }
          .party-name {
            font-size: 14px;
            font-weight: 700;
            color: #111827;
            margin-bottom: 3px;
          }
          table.items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
          }
          table.items-table th {
            background-color: #f3f4f6;
            color: #374151;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 12px 14px;
            border-top: 1px solid #e5e7eb;
            border-bottom: 1px solid #e5e7eb;
            text-align: left;
          }
          table.items-table td {
            padding: 14px;
            border-bottom: 1px solid #f3f4f6;
            font-size: 13px;
            color: #1f2937;
          }
          .text-right { text-align: right !important; }
          .breakdown-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 24px;
          }
          .stamp-box {
            border: 2px dashed #10b981;
            background: #f0fdf4;
            color: #047857;
            padding: 10px 18px;
            border-radius: 8px;
            font-weight: 800;
            font-size: 16px;
            text-transform: uppercase;
            display: inline-block;
            margin-top: 8px;
          }
          .totals-table {
            width: 320px;
            border-collapse: collapse;
            font-size: 13px;
          }
          .totals-table td {
            padding: 6px 12px;
          }
          .grand-total {
            border-top: 2px solid #116631;
            font-size: 16px;
            font-weight: 800;
            color: #116631;
            padding-top: 10px !important;
          }
          .footer-section {
            border-top: 1px solid #e5e7eb;
            padding-top: 18px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
          }
          .print-btn-bar {
            text-align: center;
            margin-bottom: 20px;
          }
          .btn-print {
            background-color: #8CC63F;
            color: #ffffff;
            border: none;
            padding: 10px 24px;
            font-size: 14px;
            font-weight: 600;
            border-radius: 8px;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .btn-print:hover {
            background-color: #116631;
          }
          @media print {
            .print-btn-bar { display: none !important; }
            .invoice-card { border: none !important; box-shadow: none !important; padding: 0 !important; }
            body { padding: 0 !important; }
          }
        </style>
      </head>
      <body>
        <div class="print-btn-bar">
          <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
        </div>

        <div class="invoice-card">
          <div class="header">
            <div>
              <div class="brand-title">⚡ BHARAT EV PRIME</div>
              <p class="brand-subtitle">Smart EV Charging Infrastructure Management Platform</p>
            </div>
            <div class="inv-meta">
              <span class="badge">GST TAX INVOICE</span>
              <div class="inv-no">${invoiceNumber}</div>
              <div class="inv-date">Date: <strong>${invDate}</strong></div>
            </div>
          </div>

          <div class="parties-grid">
            <div class="party-col">
              <div class="party-label">Supplier Details</div>
              <div class="party-name">Bharat EV Prime Technologies Pvt. Ltd.</div>
              <div>Tech Zone 4, Tower B, Sector 62</div>
              <div>Noida, Uttar Pradesh - 201309, India</div>
              <div><strong>GSTIN:</strong> 07AAACB2183Q1Z2</div>
              <div><strong>PAN:</strong> AAACB2183Q</div>
              <div><strong>Email:</strong> billing@bharatevprime.com</div>
            </div>
            <div class="party-col">
              <div class="party-label">Customer / Billed To</div>
              <div class="party-name">${(profile.firstName + ' ' + profile.lastName).trim() || 'Super Administrator'}</div>
              <div>Tenant: Bharat EV Prime Cloud Ops</div>
              <div><strong>Email:</strong> ${profile.email || 'admin@bharatevprime.com'}</div>
              <div><strong>Address:</strong> ${settings.address || 'New Delhi, India'}</div>
              <div><strong>Payment Mode:</strong> ${billing?.paymentMethodType || 'VISA'} (•••• ${billing?.paymentMethodLast4 || '4242'})</div>
              <div><strong>Status:</strong> <span style="color:#059669; font-weight:700;">Paid</span></div>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>Service Description</th>
                <th>SAC</th>
                <th>Qty</th>
                <th class="text-right">Unit Rate</th>
                <th class="text-right">Taxable Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>${billing?.planName || 'Enterprise EV'} Cloud Platform Subscription</strong><br>
                  <span style="color:#6b7280; font-size:12px;">Monthly recurring subscription for EV charger telemetry, dynamic load balancing, and admin suite</span>
                </td>
                <td>998313</td>
                <td>1 Month</td>
                <td class="text-right">₹${Number(baseAmount).toLocaleString()}</td>
                <td class="text-right" style="font-weight:700;">₹${Number(baseAmount).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <div class="breakdown-row">
            <div>
              <div class="stamp-box">✓ PAID IN FULL</div>
              <div style="font-size:12px; color:#6b7280; margin-top:8px;">
                Transaction ID: <strong>TXN-${invoice._id ? invoice._id.toString().slice(-8).toUpperCase() : '77218392'}</strong><br>
                Payment Gateway: e-Bharat Secure Corporate Billing
              </div>
            </div>
            <table class="totals-table">
              <tr>
                <td>Taxable Subtotal:</td>
                <td class="text-right font-mono">₹${Number(baseAmount).toLocaleString()}</td>
              </tr>
              <tr>
                <td>CGST (9.0%):</td>
                <td class="text-right font-mono">₹${Number(gstAmount).toLocaleString()}</td>
              </tr>
              <tr>
                <td>SGST (9.0%):</td>
                <td class="text-right font-mono">₹${Number(gstAmount).toLocaleString()}</td>
              </tr>
              <tr class="grand-total">
                <td>Total Paid (INR):</td>
                <td class="text-right font-mono">₹${amount.toLocaleString()}</td>
              </tr>
            </table>
          </div>

          <div class="footer-section">
            <p style="margin:0 0 4px 0;">This is a computer generated invoice and requires no physical signature under Indian Information Technology Act.</p>
            <p style="margin:0; color:#9ca3af;">Thank you for partnering with Bharat EV Prime to accelerate India's electric mobility revolution.</p>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 400);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const tabs = [
    { id: 'general', label: 'General Info', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Palette },
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

              <div className="flex justify-end pt-2">
                <button onClick={saveProfile} disabled={savingProfile} className="bg-[#8CC63F] hover:bg-[#116631] text-white px-8 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm disabled:opacity-70 cursor-pointer">
                  {savingProfile ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} strokeWidth={2.5} />} Save Profile
                </button>
              </div>

            </div>
          )}

          {activeTab === 'contactSocial' && (
            <div className="max-w-2xl">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Contact & Social Media Links</h3>
              <p className="text-xs text-gray-500 font-medium mb-6">Update contact details and social media links displayed across the website.</p>

              {/* Contact Information */}
              <div className="mb-8">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Phone size={14} className="text-[#8CC63F]" /> Website Contact Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Phone Number</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text" 
                        value={settings.phone || ''} 
                        onChange={(e) => handleSettingsChange('phone', e.target.value)} 
                        placeholder="+91 98765 43210"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all shadow-sm" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Contact Email</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="email" 
                        value={settings.contactEmail || ''} 
                        onChange={(e) => handleSettingsChange('contactEmail', e.target.value)} 
                        placeholder="hello@bharatevprime.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all shadow-sm" 
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Office Address</label>
                    <div className="relative">
                      <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text" 
                        value={settings.address || ''} 
                        onChange={(e) => handleSettingsChange('address', e.target.value)} 
                        placeholder="New Delhi, India"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all shadow-sm" 
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-px w-full bg-gray-100 mb-8"></div>

              {/* Social Media Links */}
              <div className="mb-8">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Share2 size={14} className="text-[#8CC63F]" /> Social Media URLs
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Facebook URL</label>
                    <input 
                      type="url" 
                      value={settings.facebookUrl || ''} 
                      onChange={(e) => handleSettingsChange('facebookUrl', e.target.value)} 
                      placeholder="https://facebook.com/yourpage"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all shadow-sm" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Instagram URL</label>
                    <input 
                      type="url" 
                      value={settings.instagramUrl || ''} 
                      onChange={(e) => handleSettingsChange('instagramUrl', e.target.value)} 
                      placeholder="https://instagram.com/yourhandle"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all shadow-sm" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">LinkedIn URL</label>
                    <input 
                      type="url" 
                      value={settings.linkedinUrl || ''} 
                      onChange={(e) => handleSettingsChange('linkedinUrl', e.target.value)} 
                      placeholder="https://linkedin.com/company/yourpage"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all shadow-sm" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">YouTube URL</label>
                    <input 
                      type="url" 
                      value={settings.youtubeUrl || ''} 
                      onChange={(e) => handleSettingsChange('youtubeUrl', e.target.value)} 
                      placeholder="https://youtube.com/@yourchannel"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all shadow-sm" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Twitter / X URL</label>
                    <input 
                      type="url" 
                      value={settings.twitterUrl || ''} 
                      onChange={(e) => handleSettingsChange('twitterUrl', e.target.value)} 
                      placeholder="https://twitter.com/yourhandle"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all shadow-sm" 
                    />
                  </div>
                </div>
              </div>

              <div className="h-px w-full bg-gray-100 mb-8"></div>

              {/* Tawk.to Live Chat Settings */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                    <MessageSquare size={14} className="text-[#8CC63F]" /> Tawk.to Live Chat Integration
                  </h4>
                  <div 
                    onClick={() => handleSettingsChange('tawkEnabled', !settings.tawkEnabled)} 
                    className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${settings.tawkEnabled ? 'bg-emerald-500' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${settings.tawkEnabled ? 'left-6' : 'left-1'}`}></div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 font-medium mb-4">Enable Tawk.to live chat widget on the website. Enter your Property ID and Widget ID from your Tawk.to dashboard.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Property ID</label>
                    <input 
                      type="text" 
                      value={settings.tawkPropertyId || ''} 
                      onChange={(e) => handleSettingsChange('tawkPropertyId', e.target.value)} 
                      placeholder="e.g. 66e1234567890abcdef"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all shadow-sm font-mono" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Widget ID</label>
                    <input 
                      type="text" 
                      value={settings.tawkWidgetId || 'default'} 
                      onChange={(e) => handleSettingsChange('tawkWidgetId', e.target.value)} 
                      placeholder="e.g. 1h2345678 or default"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all shadow-sm font-mono" 
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Direct Chat URL (Optional)</label>
                    <input 
                      type="url" 
                      value={settings.tawkDirectChatUrl || ''} 
                      onChange={(e) => handleSettingsChange('tawkDirectChatUrl', e.target.value)} 
                      placeholder="e.g. https://tawk.to/chat/PROPERTY_ID/WIDGET_ID"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all shadow-sm" 
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t border-gray-100">
                <button onClick={saveSettings} disabled={savingSettings} className="bg-[#8CC63F] hover:bg-[#116631] text-white px-8 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm disabled:opacity-70">
                  {savingSettings ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} strokeWidth={2.5} />} Save Settings
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
                  <button
                    onClick={handleOpenPlanModal}
                    className="bg-white text-emerald-800 font-semibold px-4 py-2.5 rounded-lg text-sm w-full hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
                  >
                    Change Plan
                  </button>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h4 className="text-gray-500 text-sm font-semibold mb-1">Payment Method</h4>
                    <div className="flex items-center gap-3 mt-4">
                      <div className="w-12 h-8 bg-blue-50 border border-blue-100 rounded flex items-center justify-center font-semibold text-blue-700 italic text-xs">{billing.paymentMethodType}</div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">•••• •••• •••• {billing.paymentMethodLast4}</p>
                        <p className="text-xs font-medium text-gray-500">Expires {billing.paymentMethodExpiry}</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleOpenPaymentModal}
                    className="text-emerald-600 font-semibold border border-emerald-100 bg-emerald-50 px-4 py-2.5 rounded-lg text-sm w-full hover:bg-emerald-100 transition-colors mt-6 cursor-pointer"
                  >
                    Update Method
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <h4 className="text-base font-semibold text-gray-900">Billing History</h4>
                <button
                  onClick={handleAddCycleInvoice}
                  disabled={updatingBilling}
                  className="text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  title="Generate Invoice for current cycle"
                >
                  <Plus size={14} /> Generate Next Cycle Invoice
                </button>
              </div>

              <div className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-xs">
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
                    {billing.billingHistory && billing.billingHistory.length > 0 ? (
                      billing.billingHistory.map((history, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-4 py-3 text-sm font-semibold text-gray-800">{new Date(history.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-600">₹{(Number(history.amount) || billing.planPrice).toLocaleString()}</td>
                          <td className="px-4 py-3"><span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/50">{history.status}</span></td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleViewInvoice(history)}
                                className="text-gray-600 hover:text-emerald-700 font-semibold text-xs bg-gray-50 hover:bg-emerald-50 border border-gray-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                                title="View Tax Invoice"
                              >
                                <FileText size={13} /> View
                              </button>
                              <button
                                onClick={() => printInvoice(history)}
                                className="text-emerald-700 hover:text-white bg-emerald-50 hover:bg-emerald-600 border border-emerald-200 font-semibold text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                                title="Download PDF / Print"
                              >
                                <Download size={13} /> Download
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">
                          No billing history found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Change Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-gray-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Change Subscription Plan</h3>
                <p className="text-xs text-gray-500 mt-0.5">Select a plan tier tailored for your EV fleet and charging infrastructure</p>
              </div>
              <button onClick={() => setShowPlanModal(false)} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
              {AVAILABLE_PLANS.map(plan => {
                const isSelected = selectedPlanName === plan.name;
                const isCurrent = billing?.planName === plan.name;
                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanName(plan.name)}
                    className={`border-2 rounded-xl p-4 cursor-pointer transition-all flex flex-col justify-between relative ${
                      isSelected
                        ? 'border-[#8CC63F] bg-emerald-50/20 shadow-md ring-2 ring-[#8CC63F]/20'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    {isCurrent && (
                      <span className="absolute -top-3 right-3 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                        Current
                      </span>
                    )}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          {plan.badge}
                        </span>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-[#8CC63F] bg-[#8CC63F]' : 'border-gray-300'}`}>
                          {isSelected && <Check size={12} className="text-white" />}
                        </div>
                      </div>
                      <h4 className="font-bold text-gray-900 text-base">{plan.name}</h4>
                      <p className="text-xs text-gray-500 mt-1 mb-3">{plan.description}</p>
                      <div className="text-2xl font-extrabold text-gray-900 mb-1">
                        ₹{plan.price.toLocaleString()}
                        <span className="text-xs font-normal text-gray-500">/mo</span>
                      </div>
                      <p className="text-[11px] font-semibold text-emerald-700 mb-3">{plan.stations}</p>

                      <ul className="space-y-2 border-t border-gray-100 pt-3">
                        {plan.features.map((feat, fIdx) => (
                          <li key={fIdx} className="text-[11px] text-gray-600 flex items-start gap-1.5">
                            <CheckCircle2 size={13} className="text-[#8CC63F] shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowPlanModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPlanChange}
                disabled={updatingBilling || selectedPlanName === billing?.planName}
                className="px-6 py-2 text-sm font-semibold text-white bg-[#8CC63F] hover:bg-[#116631] rounded-lg transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {updatingBilling ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                Confirm & Update Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Payment Method Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Update Payment Method</h3>
                <p className="text-xs text-gray-500 mt-0.5">Corporate card details for subscription renewals</p>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Virtual Card Preview */}
            <div className="bg-gradient-to-tr from-slate-900 via-emerald-950 to-slate-900 text-white rounded-xl p-5 mb-5 shadow-md relative overflow-hidden border border-emerald-900/40">
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs tracking-wider uppercase text-emerald-400 font-semibold">Corporate EV Account</span>
                <span className="font-extrabold text-sm italic tracking-widest bg-white/10 px-2 py-0.5 rounded border border-white/20">
                  {paymentForm.cardType}
                </span>
              </div>
              <div className="font-mono text-base tracking-widest mb-4">
                {paymentForm.cardNumber || '•••• •••• •••• 4242'}
              </div>
              <div className="flex justify-between items-end text-xs text-gray-300">
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-gray-400">Card Holder</div>
                  <div className="font-semibold text-white truncate max-w-[170px]">{paymentForm.cardHolder || 'Admin User'}</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-gray-400">Expires</div>
                  <div className="font-semibold text-white">{paymentForm.expiry || '12/26'}</div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSavePaymentMethod} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Card Network / Type</label>
                <select
                  value={paymentForm.cardType}
                  onChange={(e) => setPaymentForm(p => ({ ...p, cardType: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#8CC63F] focus:ring-1 focus:ring-[#8CC63F]"
                >
                  <option value="VISA">VISA</option>
                  <option value="Mastercard">Mastercard</option>
                  <option value="RuPay">RuPay</option>
                  <option value="Amex">American Express</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Cardholder Name</label>
                <input
                  type="text"
                  required
                  value={paymentForm.cardHolder}
                  onChange={(e) => setPaymentForm(p => ({ ...p, cardHolder: e.target.value }))}
                  placeholder="e.g. Bharat EV Prime Admin"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#8CC63F] focus:ring-1 focus:ring-[#8CC63F]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Card Number</label>
                <input
                  type="text"
                  required
                  maxLength={19}
                  value={paymentForm.cardNumber}
                  onChange={(e) => {
                    let v = e.target.value.replace(/\D/g, '').slice(0, 16);
                    let formatted = v.replace(/(.{4})/g, '$1 ').trim();
                    setPaymentForm(p => ({ ...p, cardNumber: formatted || e.target.value }));
                  }}
                  placeholder="4242 4242 4242 4242"
                  className="w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded-lg focus:outline-none focus:border-[#8CC63F] focus:ring-1 focus:ring-[#8CC63F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Expiry Date (MM/YY)</label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    value={paymentForm.expiry}
                    onChange={(e) => {
                      let v = e.target.value.replace(/\D/g, '').slice(0, 4);
                      if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
                      setPaymentForm(p => ({ ...p, expiry: v }));
                    }}
                    placeholder="12/26"
                    className="w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded-lg focus:outline-none focus:border-[#8CC63F] focus:ring-1 focus:ring-[#8CC63F]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Security Code (CVV)</label>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    value={paymentForm.cvv}
                    onChange={(e) => setPaymentForm(p => ({ ...p, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                    placeholder="•••"
                    className="w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded-lg focus:outline-none focus:border-[#8CC63F] focus:ring-1 focus:ring-[#8CC63F]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingBilling}
                  className="px-6 py-2 text-sm font-semibold text-white bg-[#8CC63F] hover:bg-[#116631] rounded-lg transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {updatingBilling ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                  Save Payment Method
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice View Modal */}
      {showInvoiceModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                  <FileText size={20} />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Tax Invoice BEV-INV-2026-{selectedInvoice._id ? selectedInvoice._id.toString().slice(-6).toUpperCase() : '062601'}
                  </h3>
                  <p className="text-xs text-gray-500">Issued on {new Date(selectedInvoice.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  {selectedInvoice.status || 'Paid'}
                </span>
                <button onClick={() => setShowInvoiceModal(false)} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Invoice Summary Box */}
            <div className="bg-gray-50 rounded-xl p-5 mb-5 border border-gray-200/80 text-xs text-gray-600 grid grid-cols-2 gap-4">
              <div>
                <p className="font-bold text-gray-900 uppercase text-[11px] mb-1">Supplier</p>
                <p className="font-semibold text-gray-800">Bharat EV Prime Technologies Pvt. Ltd.</p>
                <p>Tech Park, Sector 62, Noida, UP - 201309</p>
                <p className="text-[11px] font-mono mt-1">GSTIN: 07AAACB2183Q1Z2</p>
              </div>
              <div>
                <p className="font-bold text-gray-900 uppercase text-[11px] mb-1">Customer / Billed To</p>
                <p className="font-semibold text-gray-800">{(profile.firstName + ' ' + profile.lastName).trim() || 'Administrator'}</p>
                <p>{profile.email || 'admin@bharatevprime.com'}</p>
                <p className="text-[11px] mt-1">Payment: {billing?.paymentMethodType || 'VISA'} (•••• {billing?.paymentMethodLast4 || '4242'})</p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-gray-100 rounded-xl overflow-hidden mb-5">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100 text-gray-700 font-semibold">
                  <tr>
                    <th className="p-3">Description</th>
                    <th className="p-3">SAC</th>
                    <th className="p-3 text-right">Taxable</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="p-3">
                      <p className="font-bold text-gray-900">{billing?.planName || 'Enterprise EV'} Cloud Subscription</p>
                      <p className="text-[11px] text-gray-500">1 Month Billing Period</p>
                    </td>
                    <td className="p-3 font-mono">998313</td>
                    <td className="p-3 text-right font-mono">₹{((Number(selectedInvoice.amount) || billing?.planPrice || 45000) / 1.18).toFixed(2)}</td>
                    <td className="p-3 text-right font-mono font-semibold">₹{((Number(selectedInvoice.amount) || billing?.planPrice || 45000) / 1.18).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Tax Breakdown */}
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6 text-xs">
              <div className="text-gray-500">
                <p>CGST @ 9%: <span className="font-semibold text-gray-800 font-mono">₹{(((Number(selectedInvoice.amount) || 45000) - (Number(selectedInvoice.amount) || 45000)/1.18) / 2).toFixed(2)}</span></p>
                <p>SGST @ 9%: <span className="font-semibold text-gray-800 font-mono">₹{(((Number(selectedInvoice.amount) || 45000) - (Number(selectedInvoice.amount) || 45000)/1.18) / 2).toFixed(2)}</span></p>
              </div>
              <div className="text-right">
                <p className="text-gray-500 text-[11px] uppercase tracking-wider">Total Paid Amount</p>
                <p className="text-xl font-extrabold text-[#116631] font-mono">
                  ₹{(Number(selectedInvoice.amount) || billing?.planPrice || 45000).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowInvoiceModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => printInvoice(selectedInvoice)}
                className="px-6 py-2 text-sm font-semibold text-white bg-[#8CC63F] hover:bg-[#116631] rounded-lg transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <Printer size={16} /> Print / Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SettingsView;
