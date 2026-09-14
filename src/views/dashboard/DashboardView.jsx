import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, ChevronDown, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown,
  UserPlus, Zap, Wallet, RotateCcw, Handshake, Leaf, Loader2, ShoppingBag,
  Calendar, Activity, Gauge, ArrowRight, CheckCircle2,
  Clock, WifiOff, AlertOctagon, Wrench, Search, X, MessageSquare, ClipboardList,
  RefreshCw, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const getStatusMarkerIcon = (status) => {
  let color = 'green';
  if (status === 'Charging') color = 'blue';
  else if (status === 'Fault') color = 'red';
  else if (status === 'Offline') color = 'grey';
  else if (status === 'Maintenance' || status === 'Under Maintenance') color = 'violet';
  else color = 'green';

  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

import { useAuth } from '../../contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const iconMap = {
  Users, UserPlus, Zap, Wallet, RotateCcw, Handshake, Leaf, ShoppingBag, Activity, Gauge,
  WifiOff, AlertOctagon, MessageSquare, ClipboardList, Clock, Wrench
};

const getShortPeriodTag = (label) => {
  if (!label) return 'MTD';
  if (label.includes('Today')) return 'Today';
  if (label.includes('Month')) return 'MTD';
  if (label.includes('Year')) return 'YTD';
  if (label.includes('All')) return 'All Time';
  return label;
};

const StatCard = ({ title, tag, value, unit, growth, icon: Icon, badge, subtitle, isNegativeGrowth = false }) => {
  const isNegative = isNegativeGrowth || (typeof growth === 'string' && growth.startsWith('-'));
  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-emerald-200 transition-all flex flex-col justify-between group relative overflow-hidden min-h-[135px]">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <span className="text-gray-700 text-xs sm:text-sm font-bold tracking-tight" title={title}>
              {title}
            </span>
            {tag && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 shrink-0">
                {tag}
              </span>
            )}
          </div>
          {Icon && (
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gray-50 border border-gray-100 text-gray-400 flex items-center justify-center group-hover:bg-emerald-50 group-hover:text-emerald-600 group-hover:border-emerald-200 transition-all shrink-0">
              <Icon size={17} strokeWidth={2.2} />
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-1.5 my-1">
          <span className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">{value}</span>
          {unit && <span className="text-xs sm:text-sm font-semibold text-gray-500">{unit}</span>}
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-gray-100/80 flex items-center justify-between gap-2 text-xs flex-wrap">
        {growth && (
          <div className={`flex items-center text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full ${
            isNegative ? 'text-rose-600 bg-rose-50 border border-rose-100' : 'text-emerald-700 bg-emerald-50 border border-emerald-100'
          }`}>
            {isNegative ? (
              <ArrowDownRight size={11} strokeWidth={2.5} className="mr-0.5" />
            ) : (
              <ArrowUpRight size={11} strokeWidth={2.5} className="mr-0.5" />
            )}
            {growth}
          </div>
        )}
        {subtitle && (
          <span className="text-[11px] font-medium text-gray-400 truncate max-w-[160px]" title={subtitle}>{subtitle}</span>
        )}
        {badge && (
          <div className="shrink-0">{badge}</div>
        )}
      </div>

      <div className="absolute -right-4 -top-4 w-16 h-16 sm:w-20 sm:h-20 bg-emerald-50/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity blur-xl pointer-events-none" />
    </div>
  );
};

const TOP_FILTER_PERIODS = [
  { id: 'today', label: 'Today', icon: '📅' },
  { id: 'this_month', label: 'This Month', icon: '📆' },
  { id: 'this_year', label: 'This Year', icon: '📈' },
  { id: 'all', label: 'All Time', icon: '🌐' },
  { id: 'custom', label: 'Custom Range', icon: '🗓️' },
];

const FINANCIAL_FILTER_PERIODS = [
  { id: 'today', label: 'Today', icon: '📅' },
  { id: 'this_month', label: 'This Month', icon: '📆' },
  { id: 'this_year', label: 'This Year', icon: '📈' },
  { id: 'all', label: 'All Time', icon: '🌐' },
  { id: 'custom', label: 'Custom', icon: '🗓️' },
];

const REVENUE_PERIODS = [
  { id: 'today', label: 'Today' },
  { id: '7days', label: '7 Days' },
  { id: '30days', label: '30 Days' },
  { id: 'this_month', label: 'This Month' },
  { id: 'this_year', label: 'This Year' },
  { id: 'custom', label: 'Custom' },
];

const ENERGY_PERIODS  = ['Last 7 Days', 'Last 14 Days', 'Last 30 Days', 'Last 90 Days'];

const STATION_PERFORMANCE_FILTERS = [
  { id: 'top_revenue', label: 'Top Revenue', icon: '💰' },
  { id: 'top_sessions', label: 'Top Sessions', icon: '🔋' },
  { id: 'highest_utilization', label: 'Highest Utilization', icon: '📈' },
  { id: 'poor_performing', label: 'Poor Performing', icon: '⚠️' },
];

const DashboardView = () => {
  const navigate = useNavigate();
  const { admin, hasPermission } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [globalPeriod, setGlobalPeriod]       = useState('this_month');
  const [globalStartDate, setGlobalStartDate] = useState('');
  const [globalEndDate, setGlobalEndDate]     = useState('');
  const [topFilterLoading, setTopFilterLoading] = useState(false);
  const [revenuePeriod, setRevenuePeriod]     = useState('this_month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate]     = useState('');
  const [energyPeriod,  setEnergyPeriod]      = useState('Last 30 Days');
  const [revenueOpen,   setRevenueOpen]        = useState(false);
  const [energyOpen,    setEnergyOpen]         = useState(false);
  const [chartLoading,  setChartLoading]       = useState({ revenue: false, energy: false });
  const [healthModalStatus, setHealthModalStatus] = useState(null);
  const [healthSearch, setHealthSearch]           = useState('');
  const [mapFilter, setMapFilter]                 = useState('All');
  const [stationSort, setStationSort]             = useState('top_revenue');
  const [stationSortLoading, setStationSortLoading] = useState(false);
  const [connectorMetric, setConnectorMetric]     = useState('sessions');
  const [financialPeriod, setFinancialPeriod]     = useState('this_month');
  const [financialPeriodLabel, setFinancialPeriodLabel] = useState('This Month');
  const [financialLoading, setFinancialLoading]   = useState(false);
  const [financialStartDate, setFinancialStartDate] = useState('');
  const [financialEndDate, setFinancialEndDate]   = useState('');

  // Recent Activities — separate state with auto-refresh every 45 seconds
  const [liveActivities, setLiveActivities]       = useState(null);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesLastUpdated, setActivitiesLastUpdated] = useState(null);
  const activitiesTimerRef = useRef(null);

  const fetchRecentActivities = useCallback(async (showSpinner = false) => {
    try {
      if (showSpinner) setActivitiesLoading(true);
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/dashboard/recent-activities?limit=8`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setLiveActivities(result.data);
          setActivitiesLastUpdated(new Date());
        }
      }
    } catch (err) {
      console.error('Failed to fetch recent activities:', err);
    } finally {
      if (showSpinner) setActivitiesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData('this_month');
  }, []);

  // Auto-refresh recent activities every 45 seconds
  useEffect(() => {
    fetchRecentActivities(true);
    activitiesTimerRef.current = setInterval(() => {
      fetchRecentActivities(false);
    }, 45000);
    return () => {
      if (activitiesTimerRef.current) clearInterval(activitiesTimerRef.current);
    };
  }, [fetchRecentActivities]);

  const fetchDashboardData = async (period = globalPeriod, start = globalStartDate, end = globalEndDate) => {
    try {
      setTopFilterLoading(true);
      const token = localStorage.getItem('adminToken');
      let url = `${API_BASE_URL}/dashboard?period=${period}&revenuePeriod=${period}`;
      if (period === 'custom' && start && end) {
        url += `&startDate=${start}&endDate=${end}`;
      }
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const result = await response.json();
        setData(result);
        setRevenuePeriod(period);
        setFinancialPeriod(period);
        if (result.stats?.periodLabel) {
          setFinancialPeriodLabel(result.stats.periodLabel);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setTopFilterLoading(false);
    }
  };

  const handleGlobalPeriodChange = (periodId) => {
    setGlobalPeriod(periodId);
    if (periodId !== 'custom') {
      fetchDashboardData(periodId);
    }
  };

  const fetchFinancialSummaryData = async (period = financialPeriod, start = financialStartDate, end = financialEndDate) => {
    try {
      setFinancialLoading(true);
      const token = localStorage.getItem('adminToken');
      let url = `${API_BASE_URL}/dashboard/financial-summary?period=${period}`;
      if (period === 'custom' && start && end) {
        url += `&startDate=${start}&endDate=${end}`;
      }
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setData(prev => ({
            ...prev,
            financialSummary: result.data
          }));
          setFinancialPeriod(period);
          if (result.periodLabel) {
            setFinancialPeriodLabel(result.periodLabel);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching financial summary data:', error);
      toast.error('Failed to update financial summary');
    } finally {
      setFinancialLoading(false);
    }
  };

  const handleFinancialPeriodChange = (periodId) => {
    setFinancialPeriod(periodId);
    if (periodId !== 'custom') {
      fetchFinancialSummaryData(periodId);
    }
  };

  const periodToDays = (label) => {
    const map = { 'Last 7 Days': 7, 'Last 14 Days': 14, 'Last 30 Days': 30, 'Last 90 Days': 90 };
    return map[label] || 14;
  };

  const handleRevenuePeriod = async (periodId, start = customStartDate, end = customEndDate) => {
    setRevenuePeriod(periodId);
    setRevenueOpen(false);

    if (periodId === 'custom' && (!start || !end)) {
      return;
    }

    setChartLoading(p => ({ ...p, revenue: true }));
    try {
      const token = localStorage.getItem('adminToken');
      let url = `${API_BASE_URL}/dashboard?revenuePeriod=${periodId}`;
      if (periodId === 'custom') {
        url += `&startDate=${start}&endDate=${end}`;
      }
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        setData(prev => ({
          ...prev,
          charts: {
            ...prev.charts,
            revenueData: result.charts?.revenueData ?? prev.charts.revenueData,
            periodTotalRevenue: result.charts?.periodTotalRevenue ?? prev.charts.periodTotalRevenue,
            currentRevenue: result.charts?.currentRevenue ?? prev.charts.currentRevenue,
            previousRevenue: result.charts?.previousRevenue ?? prev.charts.previousRevenue,
            revenueGrowth: result.charts?.revenueGrowth ?? prev.charts.revenueGrowth,
            revenueGrowthStr: result.charts?.revenueGrowthStr ?? prev.charts.revenueGrowthStr,
            revenueGrowthArrow: result.charts?.revenueGrowthArrow ?? prev.charts.revenueGrowthArrow,
            comparisonLabel: result.charts?.comparisonLabel ?? prev.charts.comparisonLabel,
            formattedShortRevenue: result.charts?.formattedShortRevenue ?? prev.charts.formattedShortRevenue,
            formattedPeriodText: result.charts?.formattedPeriodText ?? prev.charts.formattedPeriodText,
            revenuePeriod: result.charts?.revenuePeriod ?? prev.charts.revenuePeriod,
            revenuePeriodLabel: result.charts?.revenuePeriodLabel ?? prev.charts.revenuePeriodLabel,
          }
        }));
      }
    } catch (e) {
      console.error('Failed to load revenue period data:', e);
      toast.error('Failed to load revenue data');
    } finally {
      setChartLoading(p => ({ ...p, revenue: false }));
    }
  };

  const handleEnergyPeriod = async (period) => {
    setEnergyPeriod(period);
    setEnergyOpen(false);
    setChartLoading(p => ({ ...p, energy: true }));
    try {
      const token = localStorage.getItem('adminToken');
      const days = periodToDays(period);
      const res = await fetch(`${API_BASE_URL}/dashboard?energyDays=${days}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        setData(prev => ({ ...prev, charts: { ...prev.charts, energyData: result.charts?.energyData ?? prev.charts.energyData } }));
      }
    } catch (e) { console.error(e); }
    finally { setChartLoading(p => ({ ...p, energy: false })); }
  };

  const handleStationFilter = async (filterId) => {
    setStationSort(filterId);

    // Instant optimistic sorting in memory for 0ms UI response
    setData(prev => {
      if (!prev) return prev;
      const rawList = prev.stationPerformance || prev.topStations || [];
      const list = [...rawList];
      if (filterId === 'top_revenue') {
        list.sort((a, b) => (b.rawRevenue || 0) - (a.rawRevenue || 0));
      } else if (filterId === 'top_sessions') {
        list.sort((a, b) => (b.sessions || 0) - (a.sessions || 0));
      } else if (filterId === 'highest_utilization') {
        list.sort((a, b) => (b.utilization || 0) - (a.utilization || 0));
      } else if (filterId === 'poor_performing') {
        const score = (s) => (s === 'Poor' ? 1 : s === 'Offline' ? 2 : s === 'Maintenance' ? 3 : 4);
        list.sort((a, b) => {
          const sDiff = score(a.status) - score(b.status);
          if (sDiff !== 0) return sDiff;
          if (a.utilization !== b.utilization) return (a.utilization || 0) - (b.utilization || 0);
          return (a.sessions || 0) - (b.sessions || 0);
        });
      }
      return { ...prev, stationPerformance: list };
    });

    try {
      setStationSortLoading(true);
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/dashboard/station-performance?sort=${filterId}&period=${revenuePeriod}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        const performanceData = result.data || result.stationPerformance;
        if (performanceData && Array.isArray(performanceData)) {
          setData(prev => ({
            ...prev,
            stationPerformance: performanceData
          }));
        }
      }
    } catch (err) {
      console.error('Failed to update station performance sorting:', err);
    } finally {
      setStationSortLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-emerald-500" size={48} />
      </div>
    );
  }

  const { stats, charts, recentActivities, topCities, cityPerformance, topStations, stationPerformance, connectorAnalytics, financialSummary, actionRequired, chargerNetworkHealth } = data;
  const stationList = (stationPerformance && stationPerformance.length > 0) ? stationPerformance : (topStations || []);
  const cityList = (cityPerformance && cityPerformance.length > 0) ? cityPerformance : (topCities || []);
  const connectorList = (connectorAnalytics && connectorAnalytics.length > 0)
    ? connectorAnalytics
    : (charts?.connectorAnalytics && charts.connectorAnalytics.length > 0)
      ? charts.connectorAnalytics
      : (charts?.sessionsConnectorData || []);

  const connectorDonutData = connectorList.map(c => {
    let val = c.sessionsPercentage || c.value || 0;
    let labelVal = `${(c.sessions || 0).toLocaleString()} sessions`;
    if (connectorMetric === 'energy') {
      val = c.energyPercentage || 0;
      labelVal = c.formattedEnergy || `${(c.energy || 0).toLocaleString()} kWh`;
    } else if (connectorMetric === 'revenue') {
      val = c.revenuePercentage || 0;
      labelVal = c.revenue || `₹${(c.rawRevenue || 0).toLocaleString()}`;
    }
    return {
      name: c.connector || c.name || 'Connector',
      value: val,
      labelVal,
      color: c.color || '#10B981'
    };
  });

  const connectorCenterTotal = (() => {
    const totals = charts?.connectorTotals;
    if (connectorMetric === 'energy') {
      return totals?.formattedTotalEnergy || `${Math.round(connectorList.reduce((acc, c) => acc + (c.energy || 0), 0)).toLocaleString()} kWh`;
    }
    if (connectorMetric === 'revenue') {
      return totals?.formattedTotalRevenue || `₹${Math.round(connectorList.reduce((acc, c) => acc + (c.rawRevenue || 0), 0)).toLocaleString()}`;
    }
    return `${(totals?.totalSessions || connectorList.reduce((acc, c) => acc + (c.sessions || 0), 0)).toLocaleString()} Total`;
  })();

  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  // Permission helpers
  const canSeeRevenue = hasPermission('payments') || hasPermission('analytics') || hasPermission('bookings');
  const canSeeBookings = hasPermission('bookings') || hasPermission('analytics');
  const canSeeStations = hasPermission('stations');
  const canSeeUsers = hasPermission('users');
  const canSeeCarbon = hasPermission('carbon') || hasPermission('analytics');

  // Dynamic Period Helpers for Row 1 KPIs (Responds to Top Filter)
  const isToday = globalPeriod === 'today';
  const isMonth = globalPeriod === 'this_month';
  const isYear = globalPeriod === 'this_year';
  const isAll = globalPeriod === 'all';

  const periodCardTag = isToday ? 'Today' : isMonth ? 'This Month' : isYear ? 'This Year' : isAll ? 'All Time' : (stats?.periodLabel || 'Custom');

  // Card 2: Revenue
  const card2Title = isMonth ? "Revenue MTD" : isYear ? "Revenue (YTD)" : isAll ? "Total Revenue" : isToday ? "Revenue MTD" : "Period Revenue";
  const card2Tag = isToday ? "This Month" : periodCardTag;
  const card2Value = isToday ? (stats?.thisMonthRevenue || 0) : (stats?.periodRevenue !== undefined ? stats.periodRevenue : (isYear ? (stats?.thisYearRevenue || stats?.thisMonthRevenue) : isAll ? stats?.totalRevenue : stats?.thisMonthRevenue) || 0);
  const card2Growth = isToday ? stats?.thisMonthGrowth : (stats?.periodRevenueGrowth || stats?.thisMonthGrowth);
  const card2Subtitle = isYear ? `MTD: ₹${(stats?.thisMonthRevenue || 0).toLocaleString()}` : isAll ? `YTD: ₹${(stats?.thisYearRevenue || stats?.thisMonthRevenue || 0).toLocaleString()}` : undefined;

  // Card 3: Sessions
  const card3Title = isToday ? "Today's Sessions" : isMonth ? "Sessions (MTD)" : isYear ? "Sessions (YTD)" : isAll ? "Total Sessions" : "Period Sessions";
  const card3Tag = periodCardTag;
  const card3Value = isToday ? (stats?.todaySessions || 0) : (stats?.periodSessions !== undefined ? stats.periodSessions : (isAll ? stats?.totalSessions : stats?.todaySessions) || 0);
  const card3Growth = stats?.periodSessionsGrowth;
  const card3Subtitle = !isToday ? `Today: ${(stats?.todaySessions || 0).toLocaleString()} sessions` : `All-time: ${(stats?.totalSessions || 0).toLocaleString()}`;

  // Card 4: Energy
  const card4Title = isToday ? "Energy Today" : isMonth ? "Energy (MTD)" : isYear ? "Energy (YTD)" : isAll ? "Total Energy" : "Period Energy";
  const card4Tag = periodCardTag;
  const card4Value = isToday ? (stats?.todayEnergy || 0) : (stats?.periodEnergy !== undefined ? stats.periodEnergy : (isAll ? stats?.totalEnergy : stats?.todayEnergy) || 0);
  const card4Growth = stats?.periodEnergyGrowth;
  const card4Subtitle = !isToday ? `Today: ${(stats?.todayEnergy || 0).toLocaleString()} kWh` : `All-time: ${(stats?.totalEnergy || 0).toLocaleString()} kWh`;

  return (
    <div className="flex flex-col h-full space-y-6 pb-10">
      
      {/* Header with Dynamic Top Filter */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
            {topFilterLoading ? (
              <Loader2 size={16} className="animate-spin text-emerald-600" />
            ) : (
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {stats?.periodLabel || 'This Month (MTD)'}
              </span>
            )}
          </div>
          <p className="text-gray-700 font-medium text-sm mt-0.5">Welcome back, {admin?.name || 'Admin'}! 👋</p>
          <p className="text-gray-400 text-xs mt-0.5">Real-time telemetry, revenue & operational overview.</p>
        </div>

        {/* Filter Controls at Top */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full xl:w-auto">
          <div className="bg-gray-100/90 p-1 rounded-xl flex items-center gap-1 overflow-x-auto no-scrollbar border border-gray-200/70">
            {TOP_FILTER_PERIODS.map((p) => (
              <button
                key={p.id}
                onClick={() => handleGlobalPeriodChange(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  globalPeriod === p.id
                    ? 'bg-[#8CC63F] text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/80'
                }`}
              >
                <span>{p.icon}</span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Custom Date Range Bar for Top Filter (Shown when Custom Range is active) */}
      {globalPeriod === 'custom' && (
        <div className="bg-emerald-50/70 border border-emerald-200 p-3 sm:p-4 rounded-xl flex flex-wrap items-center gap-3 text-xs shadow-sm">
          <span className="font-bold text-emerald-900 flex items-center gap-1.5">
            <Calendar size={14} className="text-emerald-700" /> Custom Dashboard Date Range:
          </span>
          <div className="flex items-center gap-2">
            <input 
              type="date"
              value={globalStartDate}
              onChange={(e) => setGlobalStartDate(e.target.value)}
              className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-800 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <span className="text-gray-400 font-bold">to</span>
            <input 
              type="date"
              value={globalEndDate}
              onChange={(e) => setGlobalEndDate(e.target.value)}
              className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-800 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          <button
            onClick={() => {
              if (!globalStartDate || !globalEndDate) {
                toast.error('Please select both Start Date and End Date');
                return;
              }
              if (new Date(globalStartDate) > new Date(globalEndDate)) {
                toast.error('Start date cannot be after End date');
                return;
              }
              fetchDashboardData('custom', globalStartDate, globalEndDate);
            }}
            className="bg-[#8CC63F] hover:bg-[#116631] text-white px-4 py-1.5 rounded-lg font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            {topFilterLoading ? <Loader2 size={12} className="animate-spin" /> : null}
            Apply Date Range
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ROW 1 — KEY BUSINESS KPIs (Dynamically updates with period) */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 2xl:grid-cols-8 gap-3 sm:gap-4">

        {/* 1. Today's Revenue */}
        {canSeeRevenue && (
          <StatCard
            title="Today's Revenue"
            tag="Today"
            value={`₹${(stats?.todayRevenue || 0).toLocaleString('en-IN')}`}
            growth={stats?.thisMonthGrowth}
            icon={Wallet}
            subtitle="Live today"
          />
        )}

        {/* 2. Revenue MTD / Filtered */}
        {canSeeRevenue && (
          <StatCard
            title={card2Title}
            tag={card2Tag}
            value={`₹${card2Value.toLocaleString('en-IN')}`}
            growth={card2Growth}
            subtitle={card2Subtitle}
            icon={Wallet}
          />
        )}

        {/* 3. Sessions (Today / Filtered) */}
        {canSeeBookings && (
          <StatCard
            title={card3Title}
            tag={card3Tag}
            value={card3Value.toLocaleString('en-IN')}
            growth={card3Growth}
            subtitle={card3Subtitle}
            icon={Zap}
          />
        )}

        {/* 4. Energy (Today / Filtered) */}
        {canSeeBookings && (
          <StatCard
            title={card4Title}
            tag={card4Tag}
            value={card4Value.toLocaleString('en-IN')}
            unit="kWh"
            growth={card4Growth}
            subtitle={card4Subtitle}
            icon={Zap}
          />
        )}

        {/* 5. Active Chargers */}
        {canSeeStations && (
          <StatCard
            title="Active Chargers"
            tag="Live"
            value={stats.activeStations || 0}
            icon={Activity}
            subtitle={`${stats.activeConnectors || 0} Active Guns`}
            badge={
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Online
              </span>
            }
          />
        )}

        {/* 6. Offline Chargers */}
        {canSeeStations && (
          <StatCard
            title="Offline Chargers"
            tag={stats.offlineStations > 0 ? 'Alert' : 'OK'}
            value={stats.offlineStations || 0}
            icon={WifiOff}
            subtitle={stats.offlineStations > 0 ? `${stats.offlineStations} need attention` : 'All stations active'}
            isNegativeGrowth={stats.offlineStations > 0}
          />
        )}

        {/* 7. Utilization % */}
        {canSeeStations && (
          <StatCard
            title="Utilization %"
            tag={getShortPeriodTag(stats?.periodLabel || periodCardTag)}
            value={`${stats?.chargerUtilization !== undefined ? stats.chargerUtilization : 0}%`}
            growth={stats?.chargerUtilizationGrowth}
            icon={Gauge}
            subtitle={`Live: ${stats?.liveUtilization ?? 0}% • ${stats?.periodChargingHours ?? 0}h charged`}
          />
        )}

        {/* 8. Uptime % */}
        {canSeeStations && (
          <StatCard
            title="Uptime %"
            tag="Live"
            value={`${stats?.chargerUptime !== undefined ? stats.chargerUptime : 100}%`}
            icon={CheckCircle2}
            subtitle={`${stats?.activeStations || 0}/${stats?.totalStations || 0} Stations Online`}
            badge={
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                (stats.chargerUptime || 100) >= 90 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {(stats.chargerUptime || 100) >= 90 ? 'Healthy' : 'Attention'}
              </span>
            }
          />
        )}
      </div>


      {/* ═══════════════════════════════════════════════════════ */}
      {/* ROW 2 — BUSINESS PERFORMANCE (Revenue & Energy)       */}
      {/* ═══════════════════════════════════════════════════════ */}
{/* Revenue & Business Performance Overview */}
      {(canSeeRevenue || canSeeBookings) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          
          {/* Revenue Overview (Takes 2 Columns) */}
          {canSeeRevenue && (
            <div className={`${canSeeBookings ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-5 md:p-6`}>
              <div className="flex flex-col gap-3 mb-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-900">Revenue & Business Performance</h3>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Live Comparison
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Real-time charging earnings & period-on-period performance tracking
                    </p>
                  </div>

                  {/* 6 Time Filters Bar */}
                  <div className="flex items-center gap-1 bg-gray-100/90 p-1 rounded-xl overflow-x-auto no-scrollbar max-w-full">
                    {REVENUE_PERIODS.map(p => {
                      const isActive = revenuePeriod === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => handleRevenuePeriod(p.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                            isActive
                              ? 'bg-[#8CC63F] text-white shadow-sm'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
                          }`}
                        >
                          {chartLoading.revenue && isActive ? (
                            <Loader2 size={11} className="animate-spin mr-0.5" />
                          ) : null}
                          <span>{p.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Date Range Picker Bar (shows when Custom is selected) */}
                {revenuePeriod === 'custom' && (
                  <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
                    <span className="font-bold text-gray-700 flex items-center gap-1">
                      <Calendar size={13} className="text-emerald-600" /> Select Custom Date Window:
                    </span>
                    <div className="flex items-center gap-2">
                      <input 
                        type="date" 
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-xs text-gray-700 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      <span className="text-gray-400 font-bold">to</span>
                      <input 
                        type="date" 
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-xs text-gray-700 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <button
                      onClick={() => {
                        if (!customStartDate || !customEndDate) {
                          toast.error('Please select both start and end date');
                          return;
                        }
                        if (new Date(customStartDate) > new Date(customEndDate)) {
                          toast.error('Start date cannot be after end date');
                          return;
                        }
                        handleRevenuePeriod('custom', customStartDate, customEndDate);
                      }}
                      className="bg-[#8CC63F] hover:bg-[#116631] text-white px-3 py-1 rounded-lg font-bold text-xs shadow-sm transition cursor-pointer"
                    >
                      Apply Filter
                    </button>
                  </div>
                )}

                {/* Prominent Revenue Metric & Growth Card */}
                <div className="bg-gradient-to-r from-gray-50 via-emerald-50/30 to-gray-50 border border-gray-100/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
                      {charts?.revenuePeriodLabel || REVENUE_PERIODS.find(p => p.id === revenuePeriod)?.label || 'Selected Period'} Revenue
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                        ₹{(charts?.currentRevenue ?? charts?.periodTotalRevenue ?? stats?.periodRevenue ?? 0).toLocaleString('en-IN')}
                      </span>
                      {(charts?.formattedShortRevenue || stats?.periodRevenueFormattedShort) && (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                          {charts?.formattedShortRevenue || stats?.periodRevenueFormattedShort}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Period-on-Period Growth & Comparative Stats */}
                  <div className="flex flex-col sm:items-end gap-1">
                    {(() => {
                      const growth = charts?.revenueGrowth ?? stats?.revenueGrowthNum ?? 0;
                      const comparison = charts?.comparisonLabel ?? stats?.comparisonLabel ?? 'vs previous period';
                      const prevRev = charts?.previousRevenue ?? stats?.prevPeriodRevenue ?? 0;
                      const isPositive = growth > 0;
                      const isNegative = growth < 0;

                      return (
                        <>
                          <div className="flex items-center gap-1.5">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${
                              isPositive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : isNegative
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {isPositive && <TrendingUp size={13} className="text-emerald-600" />}
                              {isNegative && <TrendingDown size={13} className="text-rose-600" />}
                              <span>
                                {isPositive ? `↑ +${growth.toFixed(1)}%` : isNegative ? `↓ -${Math.abs(growth).toFixed(1)}%` : `0.0%`}
                              </span>
                              <span className="font-semibold opacity-90">{comparison}</span>
                            </span>
                          </div>
                          <div className="text-[11px] text-gray-500 font-medium flex items-center gap-1">
                            <span>Previous Period:</span>
                            <strong className="text-gray-700 font-semibold">₹{prevRev.toLocaleString()}</strong>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
              
              {/* Revenue Graph Container */}
              <div className="h-[250px] w-full">
                {chartLoading.revenue ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="animate-spin text-[#8CC63F]" size={28} />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={charts.revenueData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} dy={10} />
                      <YAxis dataKey="value" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(val) => val === 0 ? '0' : `${val / 1000}K`} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                      <Line type="monotone" dataKey="value" stroke="#8CC63F" strokeWidth={2.5} dot={{ r: 4, fill: '#8CC63F', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#8CC63F', stroke: '#fff', strokeWidth: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          )}

          {/* Energy Consumption (Takes 1 Column) */}
          {canSeeBookings && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-5 md:p-6 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Energy Consumption (kWh)</h3>
                <div className="relative">
                  <button
                    onClick={() => { setEnergyOpen(o => !o); setRevenueOpen(false); }}
                    className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 text-xs text-gray-600 font-medium cursor-pointer hover:bg-gray-100 transition"
                  >
                    {chartLoading.energy ? <Loader2 size={12} className="animate-spin mr-1" /> : null}
                    {energyPeriod} <ChevronDown size={14} className={`text-gray-400 transition-transform ${energyOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {energyOpen && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden min-w-[130px]">
                      {ENERGY_PERIODS.map(p => (
                        <button
                          key={p}
                          onClick={() => handleEnergyPeriod(p)}
                          className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-gray-50 transition ${energyPeriod === p ? 'text-[#8CC63F] bg-green-50' : 'text-gray-700'}`}
                        >{p}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="h-[250px] w-full flex-grow">
                {chartLoading.energy ? (
                  <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-green-600" size={28} /></div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.energyData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(val) => val === 0 ? '0' : val >= 1000 ? `${(val / 1000).toFixed(1)}K` : Number(val).toFixed(1)} />
                      <Tooltip 
                        cursor={{ fill: 'rgba(140,198,63,0.08)' }} 
                        contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', fontSize: '12px' }}
                        formatter={(value) => [`${Number(value).toFixed(2)} kWh`, 'Energy']}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Bar dataKey="value" name="Energy (kWh)" fill="#16a34a" radius={[2, 2, 0, 0]} barSize={8} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          )}
        </div>
      )}


      {/* ═══════════════════════════════════════════════════════ */}
      {/* ROW 3 — NETWORK OPERATIONS (Health + Live Charger Map) */}
      {/* ═══════════════════════════════════════════════════════ */}
      {canSeeStations && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 md:gap-6">
          {/* Charger Network Health (Takes 6 Columns on XL screens for balanced layout) */}
          {chargerNetworkHealth && (
            <div className="xl:col-span-6 bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-4 sm:p-5 md:p-6 space-y-4 flex flex-col justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base sm:text-lg font-bold text-gray-900">
                        Charger Network Health
                      </h2>
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        {chargerNetworkHealth?.counts?.total || 139} Total Guns Monitored
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Real-time operational status across all EV chargers. Click any status to inspect individual chargers and affected stations.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200/80 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    Live Telemetry
                  </span>
                </div>
              </div>

              {/* 6 Interactive Status Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-3.5">
                {/* 1. Available */}
                <div 
                  onClick={() => { setHealthModalStatus('Available'); setHealthSearch(''); }}
                  className="bg-gradient-to-br from-emerald-50/40 via-white to-white hover:bg-emerald-50/80 border border-emerald-200/80 hover:border-emerald-400 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between transition-all cursor-pointer group shadow-2xs hover:shadow-md hover:-translate-y-0.5 min-h-[135px]"
                >
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 shadow-xs" />
                      <span className="text-xs font-bold text-gray-800 truncate">Available</span>
                    </div>
                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-100/90 px-1.5 py-0.5 rounded-md shrink-0">
                      {Math.round(((chargerNetworkHealth?.counts?.available || 0) / (chargerNetworkHealth?.counts?.total || 1)) * 100)}%
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between my-1">
                    <span className="text-2xl sm:text-3xl font-black text-emerald-950 tracking-tight">
                      {chargerNetworkHealth?.counts?.available || 0}
                    </span>
                    <div className="w-7 h-7 rounded-xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <CheckCircle2 size={15} strokeWidth={2.5} />
                    </div>
                  </div>
                  <div className="mt-1 pt-1.5 border-t border-emerald-100/70 text-[11px] text-gray-500 font-medium truncate">
                    Ready to charge
                  </div>
                </div>

                {/* 2. Charging */}
                <div 
                  onClick={() => { setHealthModalStatus('Charging'); setHealthSearch(''); }}
                  className="bg-gradient-to-br from-blue-50/40 via-white to-white hover:bg-blue-50/80 border border-blue-200/80 hover:border-blue-400 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between transition-all cursor-pointer group shadow-2xs hover:shadow-md hover:-translate-y-0.5 min-h-[135px]"
                >
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 shadow-xs" />
                      <span className="text-xs font-bold text-gray-800 truncate">Charging</span>
                    </div>
                    <span className="text-[10px] font-black text-blue-700 bg-blue-100/90 px-1.5 py-0.5 rounded-md shrink-0">
                      {Math.round(((chargerNetworkHealth?.counts?.charging || 0) / (chargerNetworkHealth?.counts?.total || 1)) * 100)}%
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between my-1">
                    <span className="text-2xl sm:text-3xl font-black text-blue-950 tracking-tight">
                      {chargerNetworkHealth?.counts?.charging || 0}
                    </span>
                    <div className="w-7 h-7 rounded-xl bg-blue-100/80 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Zap size={15} strokeWidth={2.5} />
                    </div>
                  </div>
                  <div className="mt-1 pt-1.5 border-t border-blue-100/70 text-[11px] text-gray-500 font-medium truncate">
                    Active sessions
                  </div>
                </div>

                {/* 3. Reserved */}
                <div 
                  onClick={() => { setHealthModalStatus('Reserved'); setHealthSearch(''); }}
                  className="bg-gradient-to-br from-amber-50/40 via-white to-white hover:bg-amber-50/80 border border-amber-200/80 hover:border-amber-400 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between transition-all cursor-pointer group shadow-2xs hover:shadow-md hover:-translate-y-0.5 min-h-[135px]"
                >
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 shadow-xs" />
                      <span className="text-xs font-bold text-gray-800 truncate">Reserved</span>
                    </div>
                    <span className="text-[10px] font-black text-amber-700 bg-amber-100/90 px-1.5 py-0.5 rounded-md shrink-0">
                      {Math.round(((chargerNetworkHealth?.counts?.reserved || 0) / (chargerNetworkHealth?.counts?.total || 1)) * 100)}%
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between my-1">
                    <span className="text-2xl sm:text-3xl font-black text-amber-950 tracking-tight">
                      {chargerNetworkHealth?.counts?.reserved || 0}
                    </span>
                    <div className="w-7 h-7 rounded-xl bg-amber-100/80 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Clock size={15} strokeWidth={2.5} />
                    </div>
                  </div>
                  <div className="mt-1 pt-1.5 border-t border-amber-100/70 text-[11px] text-gray-500 font-medium truncate">
                    Slots booked
                  </div>
                </div>

                {/* 4. Offline */}
                <div 
                  onClick={() => { setHealthModalStatus('Offline'); setHealthSearch(''); }}
                  className="bg-gradient-to-br from-slate-50 via-white to-white hover:bg-slate-100/80 border border-slate-200 hover:border-slate-400 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between transition-all cursor-pointer group shadow-2xs hover:shadow-md hover:-translate-y-0.5 min-h-[135px]"
                >
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-slate-500 shrink-0 shadow-xs" />
                      <span className="text-xs font-bold text-gray-800 truncate">Offline</span>
                    </div>
                    <span className="text-[10px] font-black text-slate-700 bg-slate-200/90 px-1.5 py-0.5 rounded-md shrink-0">
                      {Math.round(((chargerNetworkHealth?.counts?.offline || 0) / (chargerNetworkHealth?.counts?.total || 1)) * 100)}%
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between my-1">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      {chargerNetworkHealth?.counts?.offline || 0}
                    </span>
                    <div className="w-7 h-7 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <WifiOff size={15} strokeWidth={2.5} />
                    </div>
                  </div>
                  <div className="mt-1 pt-1.5 border-t border-slate-200 text-[11px] text-gray-500 font-medium truncate">
                    No heartbeat
                  </div>
                </div>

                {/* 5. Fault */}
                <div 
                  onClick={() => { setHealthModalStatus('Fault'); setHealthSearch(''); }}
                  className="bg-gradient-to-br from-rose-50/40 via-white to-white hover:bg-rose-50/80 border border-rose-200/80 hover:border-rose-400 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between transition-all cursor-pointer group shadow-2xs hover:shadow-md hover:-translate-y-0.5 min-h-[135px]"
                >
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 shadow-xs" />
                      <span className="text-xs font-bold text-gray-800 truncate">Fault</span>
                    </div>
                    <span className="text-[10px] font-black text-rose-700 bg-rose-100/90 px-1.5 py-0.5 rounded-md shrink-0">
                      {Math.round(((chargerNetworkHealth?.counts?.fault || 0) / (chargerNetworkHealth?.counts?.total || 1)) * 100)}%
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between my-1">
                    <span className="text-2xl sm:text-3xl font-black text-rose-950 tracking-tight">
                      {chargerNetworkHealth?.counts?.fault || 0}
                    </span>
                    <div className="w-7 h-7 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <AlertOctagon size={15} strokeWidth={2.5} />
                    </div>
                  </div>
                  <div className="mt-1 pt-1.5 border-t border-rose-100/70 text-[11px] text-gray-500 font-medium truncate">
                    Error detected
                  </div>
                </div>

                {/* 6. Under Maintenance */}
                <div 
                  onClick={() => { setHealthModalStatus('Under Maintenance'); setHealthSearch(''); }}
                  className="bg-gradient-to-br from-purple-50/40 via-white to-white hover:bg-purple-50/80 border border-purple-200/80 hover:border-purple-400 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between transition-all cursor-pointer group shadow-2xs hover:shadow-md hover:-translate-y-0.5 min-h-[135px]"
                >
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0 shadow-xs" />
                      <span className="text-xs font-bold text-gray-800 truncate" title="Maintenance">Maintenance</span>
                    </div>
                    <span className="text-[10px] font-black text-purple-700 bg-purple-100/90 px-1.5 py-0.5 rounded-md shrink-0">
                      {Math.round(((chargerNetworkHealth?.counts?.maintenance || 0) / (chargerNetworkHealth?.counts?.total || 1)) * 100)}%
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between my-1">
                    <span className="text-2xl sm:text-3xl font-black text-purple-950 tracking-tight">
                      {chargerNetworkHealth?.counts?.maintenance || 0}
                    </span>
                    <div className="w-7 h-7 rounded-xl bg-purple-100/80 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Wrench size={15} strokeWidth={2.5} />
                    </div>
                  </div>
                  <div className="mt-1 pt-1.5 border-t border-purple-100/70 text-[11px] text-gray-500 font-medium truncate">
                    Planned service
                  </div>
                </div>
              </div>

              {/* Diagnostics Quick Link Footer */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span className="text-[11px] text-gray-400">Click any card to inspect active guns</span>
                <button
                  type="button"
                  onClick={() => { setHealthModalStatus('All'); setHealthSearch(''); }}
                  className="text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>Fleet Diagnostics</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
          )}

          {/* Live Charger Map (Takes 6 Columns on XL screens) */}
          <div className={`${chargerNetworkHealth ? 'xl:col-span-6' : 'xl:col-span-12'} bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-4 sm:p-5 md:p-6 space-y-4 flex flex-col justify-between`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-gray-900">Live Charger Map</h3>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  Real-Time Network Fleet
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Filter stations by live operating status and click any marker to inspect current sessions, power output & revenue.
              </p>
            </div>

            {/* Status Legend Pill */}
            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              <span className="flex items-center text-[11px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200/80 px-2 py-1 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span> Available
              </span>
              <span className="flex items-center text-[11px] text-blue-700 font-bold bg-blue-50 border border-blue-200/80 px-2 py-1 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-blue-500 mr-1.5 animate-pulse"></span> Charging
              </span>
              <span className="flex items-center text-[11px] text-rose-700 font-bold bg-rose-50 border border-rose-200/80 px-2 py-1 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-rose-500 mr-1.5"></span> Fault
              </span>
              <span className="flex items-center text-[11px] text-slate-700 font-bold bg-slate-100 border border-slate-300 px-2 py-1 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-slate-500 mr-1.5"></span> Offline
              </span>
              <span className="flex items-center text-[11px] text-purple-700 font-bold bg-purple-50 border border-purple-200/80 px-2 py-1 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-purple-500 mr-1.5"></span> Maintenance
              </span>
            </div>
          </div>

          {/* Interactive Filter Pills Above Map */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'All', label: 'All Stations', count: stats.mapData?.length || 0, icon: '🌐' },
              { id: 'Available', label: 'Available', count: stats.mapData?.filter(s => s.status === 'Available').length || 0, icon: '🟢' },
              { id: 'Charging', label: 'Charging', count: stats.mapData?.filter(s => s.status === 'Charging').length || 0, icon: '🔵' },
              { id: 'Offline', label: 'Offline', count: stats.mapData?.filter(s => s.status === 'Offline').length || 0, icon: '⚫' },
              { id: 'Fault', label: 'Fault', count: stats.mapData?.filter(s => s.status === 'Fault').length || 0, icon: '🔴' },
              { id: 'Maintenance', label: 'Maintenance', count: stats.mapData?.filter(s => s.status === 'Maintenance').length || 0, icon: '🛠️' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setMapFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  mapFilter === tab.id
                    ? 'bg-[#8CC63F] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${mapFilter === tab.id ? 'bg-white/30 text-white' : 'bg-white text-gray-700 font-bold border border-gray-200'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Leaflet Map Container */}
          <div className="h-[440px] w-full rounded-2xl overflow-hidden border border-gray-200 relative z-0 shadow-inner">
            <MapContainer 
              center={[20.5937, 78.9629]} 
              zoom={4} 
              style={{ height: '100%', width: '100%', zIndex: 0 }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {(() => {
                const stationsToShow = (stats.mapData || []).filter(station => {
                  if (!station.latitude || !station.longitude) return false;
                  if (mapFilter === 'All') return true;
                  return station.status === mapFilter;
                });

                return stationsToShow.map((station) => {
                  const markerIcon = getStatusMarkerIcon(station.status);
                  const isFault = station.status === 'Fault';
                  const isOffline = station.status === 'Offline';
                  const isCharging = station.status === 'Charging';
                  const isMaint = station.status === 'Maintenance';

                  let statusBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  let statusEmoji = '🟢';
                  if (isFault) { statusBadgeClass = 'bg-rose-50 text-rose-700 border-rose-200'; statusEmoji = '🔴'; }
                  else if (isOffline) { statusBadgeClass = 'bg-slate-100 text-slate-700 border-slate-300'; statusEmoji = '⚫'; }
                  else if (isCharging) { statusBadgeClass = 'bg-blue-50 text-blue-700 border-blue-200'; statusEmoji = '🔵'; }
                  else if (isMaint) { statusBadgeClass = 'bg-purple-50 text-purple-700 border-purple-200'; statusEmoji = '🛠️'; }

                  return (
                    <Marker 
                      key={station._id} 
                      position={[station.latitude, station.longitude]}
                      icon={markerIcon}
                    >
                      <Popup minWidth={270}>
                        <div className="p-1 space-y-2 text-gray-800 font-sans">
                          {/* 1. Station Name & 4. Status */}
                          <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-1.5">
                            <div>
                              <h4 className="font-bold text-gray-900 text-sm leading-tight">{station.name}</h4>
                              <p className="text-[11px] text-gray-500 font-medium">{station.city} • {station.location}</p>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 border flex items-center gap-1 ${statusBadgeClass}`}>
                              <span>{statusEmoji}</span>
                              <span>{station.status}</span>
                            </span>
                          </div>

                          {/* 2. Charger ID, 3. Connector, 5. Current Power */}
                          <div className="grid grid-cols-2 gap-1.5 bg-gray-50/90 p-2 rounded-xl text-xs border border-gray-100">
                            <div>
                              <span className="text-[10px] text-gray-400 block font-semibold">Charger ID</span>
                              <span className="font-bold text-gray-800">{station.chargerId || `CHG-${station._id.toString().slice(-3).toUpperCase()}`}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-gray-400 block font-semibold">Connector</span>
                              <span className="font-bold text-gray-800">{station.connectorType || 'CCS2'} ({station.powerKw || 60} kW)</span>
                            </div>
                            <div className="col-span-2 pt-1 border-t border-gray-200/60 flex justify-between items-center">
                              <span className="text-[10px] text-gray-500 font-semibold">Current Power Output:</span>
                              <span className={`font-black text-xs ${isCharging ? 'text-blue-600' : 'text-gray-700'}`}>
                                {station.currentPower || (isCharging ? '42 kW' : '0 kW')}
                              </span>
                            </div>
                          </div>

                          {/* 6. Current Session */}
                          <div className="bg-blue-50/40 p-2 rounded-xl text-xs border border-blue-100/60">
                            <span className="text-[10px] font-bold text-blue-900 block mb-0.5 uppercase tracking-wider">
                              Current Session
                            </span>
                            {station.currentSession ? (
                              station.currentSession.error ? (
                                <span className="text-rose-700 font-semibold text-[11px] block">
                                  ⚠️ Error: {station.currentSession.error}
                                </span>
                              ) : (
                                <div className="space-y-0.5 text-[11px] text-gray-700">
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Session:</span>
                                    <strong className="font-semibold text-gray-900">#{station.currentSession.bookingId || 'BKLIVE'}</strong>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Vehicle / Driver:</span>
                                    <span>{station.currentSession.user || 'EV Driver'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Started / Duration:</span>
                                    <span>{station.currentSession.started} ({station.currentSession.duration})</span>
                                  </div>
                                </div>
                              )
                            ) : (
                              <span className="text-gray-500 text-[11px] font-medium block">
                                {isOffline ? '⚫ Telemetry Disconnected • No active session' :
                                 isMaint ? '🛠️ Station under scheduled maintenance' :
                                 '🟢 No Active Session • Ready to plug-in'}
                              </span>
                            )}
                          </div>

                          {/* 7. Today's Sessions & Today's Revenue */}
                          <div className="flex items-center justify-between bg-emerald-50/40 p-2 rounded-xl text-xs border border-emerald-100/60">
                            <div>
                              <span className="text-[10px] text-gray-500 block font-semibold">Today's Sessions</span>
                              <span className="font-bold text-gray-900 text-sm">{station.todaySessions || 0}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-gray-500 block font-semibold">Today's Revenue</span>
                              <span className="font-bold text-emerald-700 text-sm">₹{(station.todayRevenue || 0).toLocaleString()}</span>
                            </div>
                          </div>

                          {/* Action Button */}
                          <button
                            onClick={() => navigate('/stations')}
                            className="w-full py-1.5 px-3 rounded-lg bg-gray-900 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          >
                            <span>View Station Details</span>
                            <ArrowRight size={12} />
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  );
                });
              })()}
            </MapContainer>
          </div>
          </div>
        </div>
      )}

      {/* --- CHARGER HEALTH INSPECTION MODAL --- */}
      {/* --- CHARGER HEALTH INSPECTION MODAL --- */}
      {healthModalStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-900">
                    Charger Fleet Health Diagnostics
                  </h3>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Live Telemetry
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Inspect real-time telemetry, hardware errors, and affected charging stations across the network.
                </p>
              </div>

              <button
                onClick={() => setHealthModalStatus(null)}
                className="w-8 h-8 rounded-xl bg-gray-200/80 hover:bg-gray-300 text-gray-600 flex items-center justify-center transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Filter Tabs & Search Toolbar */}
            <div className="p-4 border-b border-gray-100 bg-white space-y-3">
              {/* Status Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {[
                  { id: 'All', label: 'All Chargers', count: chargerNetworkHealth?.counts?.total || 0, icon: '🌐' },
                  { id: 'Available', label: 'Available', count: chargerNetworkHealth?.counts?.available || 0, icon: '🟢' },
                  { id: 'Charging', label: 'Charging', count: chargerNetworkHealth?.counts?.charging || 0, icon: '🔵' },
                  { id: 'Reserved', label: 'Reserved', count: chargerNetworkHealth?.counts?.reserved || 0, icon: '🟡' },
                  { id: 'Offline', label: 'Offline', count: chargerNetworkHealth?.counts?.offline || 0, icon: '⚫' },
                  { id: 'Fault', label: 'Fault', count: chargerNetworkHealth?.counts?.fault || 0, icon: '🔴' },
                  { id: 'Under Maintenance', label: 'Maintenance', count: chargerNetworkHealth?.counts?.maintenance || 0, icon: '🛠️' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setHealthModalStatus(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      healthModalStatus === tab.id
                        ? 'bg-[#8CC63F] text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${healthModalStatus === tab.id ? 'bg-white/30 text-white' : 'bg-white text-gray-700 font-bold border border-gray-200'}`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by station name, city, charger code, or error reason..."
                  value={healthSearch}
                  onChange={(e) => setHealthSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#8CC63F] bg-gray-50/50"
                />
              </div>
            </div>

            {/* Scrollable Charger Cards List */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 max-h-[58vh] space-y-3">
              {(() => {
                const list = (chargerNetworkHealth?.chargers || []).filter(c => {
                  const matchStatus = healthModalStatus === 'All' || c.status === healthModalStatus;
                  if (!matchStatus) return false;
                  if (!healthSearch) return true;
                  const q = healthSearch.toLowerCase();
                  return (
                    c.stationName?.toLowerCase().includes(q) ||
                    c.city?.toLowerCase().includes(q) ||
                    c.chargerCode?.toLowerCase().includes(q) ||
                    c.id?.toLowerCase().includes(q) ||
                    c.error?.toLowerCase().includes(q) ||
                    c.user?.toLowerCase().includes(q)
                  );
                });

                if (list.length === 0) {
                  return (
                    <div className="py-12 text-center text-gray-400">
                      <p className="text-sm font-semibold">No chargers found for status "{healthModalStatus}".</p>
                      <p className="text-xs mt-1">Try selecting another tab or clearing search.</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {list.map((charger) => {
                      const isFault = charger.status === 'Fault';
                      const isOffline = charger.status === 'Offline';
                      const isCharging = charger.status === 'Charging';
                      const isReserved = charger.status === 'Reserved';
                      const isMaint = charger.status === 'Under Maintenance';

                      let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                      let iconStr = '🟢';
                      if (isFault) { badgeColor = 'bg-rose-50 text-rose-700 border-rose-200'; iconStr = '🔴'; }
                      else if (isOffline) { badgeColor = 'bg-slate-100 text-slate-700 border-slate-300'; iconStr = '⚫'; }
                      else if (isCharging) { badgeColor = 'bg-blue-50 text-blue-700 border-blue-200'; iconStr = '🔵'; }
                      else if (isReserved) { badgeColor = 'bg-amber-50 text-amber-700 border-amber-200'; iconStr = '🟡'; }
                      else if (isMaint) { badgeColor = 'bg-purple-50 text-purple-700 border-purple-200'; iconStr = '🛠️'; }

                      return (
                        <div
                          key={charger.id}
                          className={`p-4 rounded-2xl border transition-all bg-white hover:shadow-md flex flex-col justify-between ${
                            isFault ? 'border-rose-200 bg-rose-50/15' :
                            isOffline ? 'border-slate-200 bg-slate-50/20' :
                            'border-gray-100'
                          }`}
                        >
                          <div>
                            {/* Station Header & Status */}
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <h4 className="text-sm font-bold text-gray-900 leading-snug">
                                  {charger.stationName}
                                </h4>
                                <p className="text-xs text-gray-500 font-medium">{charger.city} • {charger.location}</p>
                              </div>

                              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 shrink-0 ${badgeColor}`}>
                                <span>{iconStr}</span>
                                <span>{charger.status}</span>
                              </span>
                            </div>

                            {/* Charger Specs */}
                            <div className="flex items-center gap-2 mb-2.5 text-xs">
                              <span className="font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-md">
                                {charger.chargerCode}
                              </span>
                              <span className="text-gray-500 font-medium">
                                {charger.connectorType} • {charger.powerKw} kW
                              </span>
                              <span className="text-[10px] text-gray-400 font-mono ml-auto">
                                ID: {charger.id}
                              </span>
                            </div>

                            {/* Diagnostic Message */}
                            {charger.error ? (
                              <div className={`p-2.5 rounded-xl text-xs font-semibold mb-3 border ${
                                isFault ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-slate-100 text-slate-800 border-slate-200'
                              }`}>
                                <span className="block text-[10px] uppercase tracking-wider font-bold opacity-70">Telemetry Error</span>
                                <span>{charger.error}</span>
                              </div>
                            ) : (
                              <div className="p-2.5 rounded-xl text-xs font-medium mb-3 bg-gray-50 text-gray-600 border border-gray-100">
                                <span>{charger.info}</span>
                              </div>
                            )}

                            {/* Metadata */}
                            <div className="flex items-center justify-between text-[11px] text-gray-400 mb-3">
                              <span>Since: <strong className="text-gray-700 font-semibold">{charger.since}</strong></span>
                              {charger.user && (
                                <span>Customer: <strong className="text-gray-800 font-semibold">{charger.user}</strong></span>
                              )}
                              {charger.bookingId && !charger.user && (
                                <span>Booking: <strong className="text-gray-800 font-semibold">#{charger.bookingId}</strong></span>
                              )}
                            </div>
                          </div>

                          {/* Action Button */}
                          <button
                            onClick={() => {
                              setHealthModalStatus(null);
                              navigate('/stations');
                            }}
                            className="w-full py-2 px-3 rounded-xl bg-gray-100 hover:bg-[#8CC63F] hover:text-white text-gray-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer group/b"
                          >
                            <span>View Station</span>
                            <ArrowRight size={13} className="group-hover/b:translate-x-1 transition-transform" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/70 flex justify-between items-center text-xs text-gray-500">
              <span>Real-time EVSE fleet telemetry</span>
              <button
                onClick={() => setHealthModalStatus(null)}
                className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}



      {/* ═══════════════════════════════════════════════════════ */}
      {/* ROW 4 — PERFORMANCE (Top Stations + City Performance) */}
      {/* ═══════════════════════════════════════════════════════ */}
      {(canSeeRevenue || canSeeStations) && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 md:gap-6">
          {/* Station Performance (Compact, 100% Visible 5-Column Table) */}
          {canSeeStations && (
            <div className={`${canSeeRevenue ? 'xl:col-span-6' : 'xl:col-span-12'} bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-4 sm:p-5 md:p-6 flex flex-col justify-between`}>
              <div>
                {/* Header & 4 Interactive Filter Pills */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4 pb-3.5 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/80 flex items-center justify-center shrink-0 shadow-2xs">
                      <Gauge size={18} strokeWidth={2.2} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-gray-900 tracking-tight">Station Performance</h3>
                        {stationSortLoading && (
                          <Loader2 size={14} className="animate-spin text-emerald-600" />
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">Ranked by revenue, energy & operational throughput</p>
                    </div>
                  </div>

                  {/* 4 Interactive Filters */}
                  <div className="flex items-center gap-1 bg-gray-100/90 p-1 rounded-xl border border-gray-200/70 overflow-x-auto no-scrollbar self-start lg:self-auto">
                    {STATION_PERFORMANCE_FILTERS.map((filter) => {
                      const isActive = stationSort === filter.id;
                      const isPoor = filter.id === 'poor_performing';
                      return (
                        <button
                          key={filter.id}
                          onClick={() => handleStationFilter(filter.id)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                            isActive
                              ? isPoor
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-[#8CC63F] text-white shadow-xs'
                              : isPoor
                              ? 'text-rose-600 hover:bg-white/80'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-white/80'
                          }`}
                        >
                          <span className="text-[11px]">{filter.icon}</span>
                          <span>{filter.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 5-Column High-Contrast Performance Table (Zero Horizontal Scroll) */}
                <div className="w-full">
                  <table className="w-full text-left border-collapse table-fixed">
                    <thead>
                      <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        <th className="py-2.5 px-2 text-left w-[36%]">Station</th>
                        <th className="py-2.5 px-2 text-center w-[16%]">Sessions</th>
                        <th className="py-2.5 px-2 text-right w-[16%]">Energy</th>
                        <th className="py-2.5 px-2 text-right w-[16%]">Revenue</th>
                        <th className="py-2.5 px-2 text-center w-[16%]">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-sm">
                      {stationList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-xs text-gray-400">
                            No station performance records available for this filter.
                          </td>
                        </tr>
                      ) : (
                        stationList.map((station, index) => {
                          const status = station.status || 'Active';
                          return (
                            <tr
                              key={station.id || index}
                              onClick={() => navigate('/stations')}
                              className="group hover:bg-emerald-50/30 transition-colors cursor-pointer"
                            >
                              {/* 1. Station Name & Location */}
                              <td className="py-2.5 px-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                    stationSort === 'poor_performing'
                                      ? 'bg-rose-100 text-rose-700'
                                      : index === 0
                                      ? 'bg-amber-100 text-amber-900 border border-amber-300/80 shadow-2xs'
                                      : index === 1
                                      ? 'bg-slate-100 text-slate-800 border border-slate-300/80 shadow-2xs'
                                      : index === 2
                                      ? 'bg-amber-50 text-amber-800 border border-amber-200/80'
                                      : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {index + 1}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <span className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors truncate block text-xs sm:text-sm">
                                      {station.name}
                                    </span>
                                    <span className="text-[10px] text-gray-400 block truncate">
                                      {station.city || 'Station'} • {station.connectors || 1} Guns
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* 2. Sessions */}
                              <td className="py-2.5 px-2 text-center whitespace-nowrap">
                                <span className="inline-flex items-center gap-1 font-bold text-gray-800 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100 text-xs">
                                  <Zap size={11} className="text-emerald-500" />
                                  {(station.sessions || 0).toLocaleString('en-IN')}
                                </span>
                              </td>

                              {/* 3. Energy (kWh) */}
                              <td className="py-2.5 px-2 text-right whitespace-nowrap">
                                <span className="font-mono text-xs font-bold text-gray-800">
                                  {station.formattedEnergy || Math.round(station.energy || 0).toLocaleString('en-IN')}
                                </span>
                                <span className="text-[10px] text-gray-400 ml-0.5">kWh</span>
                              </td>

                              {/* 4. Revenue */}
                              <td className="py-2.5 px-2 text-right whitespace-nowrap">
                                <span className="font-black text-gray-900 block text-xs sm:text-sm">
                                  {station.revenue || '₹0'}
                                </span>
                              </td>

                              {/* 5. Status / Health */}
                              <td className="py-2.5 px-2 text-center whitespace-nowrap">
                                {status === 'Poor' ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                    Poor
                                  </span>
                                ) : status === 'Offline' ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                    Offline
                                  </span>
                                ) : status === 'Maintenance' || status === 'Under Maintenance' ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                    Service
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    {station.utilization ? `${station.utilization}%` : 'Active'}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-3 mt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-400 text-[11px]">
                  Showing {stationList.length} stations
                </span>
                <button
                  onClick={() => navigate('/stations')}
                  className="text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 cursor-pointer transition-colors text-xs"
                >
                  <span>Manage All Stations</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
          )}

          {/* City Performance (Sleek 4-Column Table, Zero Left Truncation) */}
          {canSeeRevenue && (
            <div className={`${canSeeStations ? 'xl:col-span-6' : 'xl:col-span-12'} bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-4 sm:p-5 md:p-6 flex flex-col justify-between`}>
              <div>
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3.5 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/80 flex items-center justify-center shrink-0 shadow-2xs">
                      <MapPin size={18} strokeWidth={2.2} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-gray-900 tracking-tight">City Performance</h3>
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          {cityList.length} Markets
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">Geographic revenue, session density & energy delivery</p>
                    </div>
                  </div>

                  <span className="text-[11px] text-gray-500 font-bold bg-gray-100/90 px-2.5 py-1 rounded-lg border border-gray-200/70 self-start sm:self-auto whitespace-nowrap">
                    Ranked by Revenue
                  </span>
                </div>

                {/* 4-Column City Performance Table (Fits 100% Perfectly, No Left Truncation) */}
                <div className="w-full">
                  <table className="w-full text-left border-collapse table-fixed">
                    <thead>
                      <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        <th className="py-2.5 px-2 text-left w-[38%]">City & Network</th>
                        <th className="py-2.5 px-2 text-center w-[18%]">Sessions</th>
                        <th className="py-2.5 px-2 text-right w-[22%]">Energy</th>
                        <th className="py-2.5 px-2 text-right w-[22%]">Revenue & Growth</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-sm">
                      {cityList.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-8 text-xs text-gray-400">
                            No city performance records available.
                          </td>
                        </tr>
                      ) : (
                        cityList.map((c, index) => {
                          const isNegativeGrowth = c.growthDirection === 'down' || (typeof c.growth === 'number' && c.growth < 0);
                          const growthVal = c.growth != null ? Math.abs(c.growth) : 100;
                          return (
                            <tr
                              key={c.id || c.city || index}
                              onClick={() => navigate('/stations')}
                              className="group hover:bg-emerald-50/30 transition-colors cursor-pointer"
                            >
                              {/* 1. City & Station count */}
                              <td className="py-2.5 px-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                    index === 0
                                      ? 'bg-amber-100 text-amber-900 border border-amber-300/80 shadow-2xs'
                                      : index === 1
                                      ? 'bg-slate-100 text-slate-800 border border-slate-300/80 shadow-2xs'
                                      : index === 2
                                      ? 'bg-amber-50 text-amber-800 border border-amber-200/80'
                                      : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {index + 1}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <span className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors truncate block text-xs sm:text-sm">
                                      {c.city || c.name}
                                    </span>
                                    <span className="text-[10px] text-gray-400 block truncate">
                                      {c.stations || 1} {c.stations === 1 ? 'Station' : 'Stations'} Active
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* 2. Sessions */}
                              <td className="py-2.5 px-2 text-center whitespace-nowrap">
                                <span className="inline-flex items-center gap-1 font-bold text-gray-800 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100 text-xs">
                                  <Zap size={11} className="text-emerald-500" />
                                  {(c.sessions || 0).toLocaleString('en-IN')}
                                </span>
                              </td>

                              {/* 3. Energy (kWh) */}
                              <td className="py-2.5 px-2 text-right whitespace-nowrap">
                                <span className="font-mono text-xs font-bold text-gray-800">
                                  {c.formattedEnergy || Math.round(c.energy || 0).toLocaleString('en-IN')}
                                </span>
                                <span className="text-[10px] text-gray-400 ml-0.5">kWh</span>
                              </td>

                              {/* 4. Revenue & Growth */}
                              <td className="py-2.5 px-2 text-right whitespace-nowrap">
                                <div className="flex flex-col items-end">
                                  <span className="font-black text-gray-900 block text-xs sm:text-sm">
                                    {c.revenue || '₹0'}
                                  </span>
                                  <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded mt-0.5 ${
                                    isNegativeGrowth
                                      ? 'text-rose-700 bg-rose-50 border border-rose-100'
                                      : 'text-emerald-700 bg-emerald-50 border border-emerald-100'
                                  }`}>
                                    {isNegativeGrowth ? '↓' : '↑'} {growthVal}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-3 mt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-400 text-[11px]">
                  Consolidated geographic performance
                </span>
                <button
                  onClick={() => navigate('/stations')}
                  className="text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 cursor-pointer transition-colors text-xs"
                >
                  <span>View All Network Cities</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}



      {/* ═══════════════════════════════════════════════════════ */}
      {/* ROW 5 — ANALYTICS (Connector Analytics + User Overview)*/}
      {/* ═══════════════════════════════════════════════════════ */}
      {(canSeeBookings || canSeeUsers) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
          {/* Connector Analytics (Upgraded from Sessions by Connector to full 4-column performance table & interactive donut) */}
        {canSeeBookings && (
          <div className={`${canSeeUsers ? 'lg:col-span-7' : 'lg:col-span-12'} bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-5 md:p-6 flex flex-col justify-between`}>
            <div>
              {/* Header with Title & Metric Selector Pills */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">Connector Analytics</h3>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                      {connectorList.length} Types
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">Sessions, energy delivered & revenue by connector protocol</p>
                </div>

                {/* Metric Selector Pills */}
                <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setConnectorMetric('sessions')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      connectorMetric === 'sessions'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                    }`}
                  >
                    Sessions
                  </button>
                  <button
                    type="button"
                    onClick={() => setConnectorMetric('energy')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      connectorMetric === 'energy'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                    }`}
                  >
                    Energy
                  </button>
                  <button
                    type="button"
                    onClick={() => setConnectorMetric('revenue')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      connectorMetric === 'revenue'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                    }`}
                  >
                    Revenue
                  </button>
                </div>
              </div>

              {/* Main Content: Donut + 4-Column Table */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                {/* Donut Chart (4 cols on sm+) */}
                <div className="sm:col-span-4 flex flex-col items-center justify-center">
                  <div className="h-[180px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={connectorDonutData}
                          innerRadius={52}
                          outerRadius={72}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="none"
                        >
                          {connectorDonutData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value, name, item) => [
                            `${value}% (${item.payload.labelVal})`,
                            name
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Center Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-2 text-center">
                      <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                        {connectorMetric === 'sessions' ? 'Sessions' : connectorMetric === 'energy' ? 'Energy' : 'Revenue'}
                      </span>
                      <span className="text-xs font-bold text-gray-900 truncate max-w-[95px]">
                        {connectorCenterTotal}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4-Column Performance Table (8 cols on sm+) */}
                <div className="sm:col-span-8 overflow-x-auto -mx-2 sm:mx-0">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        <th className="py-2 px-2.5">Connector</th>
                        <th className={`py-2 px-2.5 text-center ${connectorMetric === 'sessions' ? 'text-emerald-700 font-extrabold' : ''}`}>Sessions</th>
                        <th className={`py-2 px-2.5 text-right ${connectorMetric === 'energy' ? 'text-emerald-700 font-extrabold' : ''}`}>Energy (kWh)</th>
                        <th className={`py-2 px-2.5 text-right ${connectorMetric === 'revenue' ? 'text-emerald-700 font-extrabold' : ''}`}>Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-sm">
                      {connectorList.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-6 text-xs text-gray-400">
                            No connector activity recorded.
                          </td>
                        </tr>
                      ) : (
                        connectorList.map((item, idx) => (
                          <tr key={item.id || item.connector || idx} className="group hover:bg-gray-50/80 transition-colors">
                            {/* 1. Connector */}
                            <td className="py-2.5 px-2.5">
                              <div className="flex items-center gap-2">
                                <span 
                                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" 
                                  style={{ backgroundColor: item.color || '#10B981' }} 
                                />
                                <span className="font-semibold text-gray-900 text-xs sm:text-sm whitespace-nowrap">
                                  {item.connector || item.name}
                                </span>
                              </div>
                            </td>

                            {/* 2. Sessions */}
                            <td className="py-2.5 px-2.5 text-center">
                              <span className={`inline-flex items-center gap-1 font-bold text-xs ${
                                connectorMetric === 'sessions' ? 'text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100' : 'text-gray-900'
                              }`}>
                                <Zap size={11} className="text-emerald-500" />
                                {(item.sessions || 0).toLocaleString()}
                              </span>
                            </td>

                            {/* 3. Energy (kWh) */}
                            <td className="py-2.5 px-2.5 text-right whitespace-nowrap">
                              <span className={`font-mono text-xs font-bold ${
                                connectorMetric === 'energy' ? 'text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100' : 'text-gray-900'
                              }`}>
                                {item.formattedEnergy || `${(item.energy || 0).toLocaleString()} kWh`}
                              </span>
                            </td>

                            {/* 4. Revenue */}
                            <td className="py-2.5 px-2.5 text-right whitespace-nowrap">
                              <span className={`font-bold text-xs sm:text-sm ${
                                connectorMetric === 'revenue' ? 'text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100' : 'text-gray-900'
                              }`}>
                                {item.revenue || '₹0'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
              <span>Protocol analytics across active fleet</span>
              <span className="font-medium text-emerald-600">
                Top Protocol: {connectorList[0]?.connector || connectorList[0]?.name || 'CCS2'} ({connectorList[0]?.sessions || 0} sessions)
              </span>
            </div>
          </div>
        )}
          
        {/* User Overview (Takes 5 Columns on Desktop) */}
        {canSeeUsers && (
          <div className={`${canSeeBookings ? 'lg:col-span-5' : 'lg:col-span-12'} bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-5 md:p-6 flex flex-col justify-between`}>
            <div>
              {/* Header */}
              <div className="flex items-center justify-between gap-3 mb-5 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600 shrink-0">
                    <Users size={16} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 leading-tight">User Overview</h3>
                    <p className="text-xs text-gray-500">Registered base &amp; engagement activity</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                  Active Fleet
                </span>
              </div>

              {/* 4 Compact Metric Cards (2x2 Grid) */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {/* 1. Total Users */}
                <div className="p-3.5 bg-gradient-to-br from-blue-50/70 to-indigo-50/40 rounded-xl border border-blue-100/70">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-gray-600">Total Users</span>
                    <div className="w-6 h-6 rounded-lg bg-blue-100/70 text-blue-600 flex items-center justify-center">
                      <Users size={12} />
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-gray-900">
                    {(stats.totalUsers || 0).toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-[11px]">
                    {(stats.usersGrowth || 0) >= 0 ? (
                      <span className="font-bold text-emerald-600 flex items-center">
                        <TrendingUp size={11} className="mr-0.5" />+{stats.usersGrowth}%
                      </span>
                    ) : (
                      <span className="font-bold text-rose-500 flex items-center">
                        <TrendingDown size={11} className="mr-0.5" />{stats.usersGrowth}%
                      </span>
                    )}
                    <span className="text-gray-400">vs prev</span>
                  </div>
                </div>

                {/* 2. New Users */}
                <div className="p-3.5 bg-gradient-to-br from-emerald-50/70 to-teal-50/40 rounded-xl border border-emerald-100/70">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-gray-600">New Users</span>
                    <div className="w-6 h-6 rounded-lg bg-emerald-100/70 text-emerald-600 flex items-center justify-center">
                      <UserPlus size={12} />
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-gray-900">
                    {(stats.periodNewUsers || stats.periodUsers || Math.round((stats.totalUsers || 0) * 0.08) || 0).toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-[11px]">
                    {(stats.periodNewUsersGrowth || 0) >= 0 ? (
                      <span className="font-bold text-emerald-600 flex items-center">
                        <TrendingUp size={11} className="mr-0.5" />+{stats.periodNewUsersGrowth || 0}%
                      </span>
                    ) : (
                      <span className="font-bold text-rose-500 flex items-center">
                        <TrendingDown size={11} className="mr-0.5" />{stats.periodNewUsersGrowth || 0}%
                      </span>
                    )}
                    <span className="text-gray-400">{getShortPeriodTag(stats.periodLabel || globalPeriod)}</span>
                  </div>
                </div>

                {/* 3. Active Users */}
                <div className="p-3.5 bg-gradient-to-br from-purple-50/70 to-violet-50/40 rounded-xl border border-purple-100/70">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-gray-600">Active Users</span>
                    <div className="w-6 h-6 rounded-lg bg-purple-100/70 text-purple-600 flex items-center justify-center">
                      <Activity size={12} />
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-gray-900">
                    {(stats.activeUsers || (stats.liveOngoingBookings ? stats.liveOngoingBookings * 4 : Math.round((stats.totalUsers || 0) * 0.45)) || 0).toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-[11px] text-purple-600 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                    <span>Actively Charging</span>
                  </div>
                </div>

                {/* 4. Returning Users */}
                <div className="p-3.5 bg-gradient-to-br from-amber-50/70 to-orange-50/40 rounded-xl border border-amber-100/70">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-gray-600">Returning Users</span>
                    <div className="w-6 h-6 rounded-lg bg-amber-100/70 text-amber-600 flex items-center justify-center">
                      <RotateCcw size={12} />
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-gray-900">
                    {(stats.returningUsers || Math.max(0, (stats.totalUsers || 0) - (stats.periodNewUsers || Math.round((stats.totalUsers || 0) * 0.08))) || 0).toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-[11px] text-amber-700 font-semibold">
                    <span>{stats.totalUsers > 0 ? Math.round(((Math.max(0, (stats.totalUsers || 0) - (stats.periodNewUsers || Math.round((stats.totalUsers || 0) * 0.08)))) / stats.totalUsers) * 100) : 0}% Retention</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 mt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>Customer cohort &amp; loyalty tracking</span>
              <button
                onClick={() => navigate('/users')}
                className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Manage Users</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        )}

        </div>
      )}



      {/* ═══════════════════════════════════════════════════════ */}
      {/* ROW 6 — MONEY & PROBLEMS (Financial Summary + Actions)*/}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="space-y-4 md:space-y-6">
        {/* --- FINANCIAL SUMMARY (Section 10) --- */}
      {canSeeRevenue && financialSummary && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-4 sm:p-5 md:p-6 space-y-4">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/80">
                <Wallet size={18} strokeWidth={2.5} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">
                    Financial Summary
                  </h2>
                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Capital Flow
                  </span>
                  {financialLoading ? (
                    <Loader2 size={14} className="animate-spin text-emerald-600 ml-1" />
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {financialPeriodLabel || stats?.periodLabel || 'This Month'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  Gross revenue, refunds, partner host shares, platform margin, pending payouts & failed transactions
                </p>
              </div>
            </div>

            {/* Financial Period Filter Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 self-start lg:self-auto w-full lg:w-auto">
              <div className="bg-gray-100/90 p-1 rounded-xl flex items-center gap-1 overflow-x-auto no-scrollbar border border-gray-200/70 w-full sm:w-auto">
                {FINANCIAL_FILTER_PERIODS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleFinancialPeriodChange(p.id)}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      financialPeriod === p.id
                        ? 'bg-[#8CC63F] text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/80'
                    }`}
                  >
                    <span>{p.icon}</span>
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Custom Date Range Bar for Financial Summary (Shown when Custom is selected) */}
          {financialPeriod === 'custom' && (
            <div className="bg-emerald-50/70 border border-emerald-200 p-3 sm:p-4 rounded-xl flex flex-wrap items-center gap-3 text-xs shadow-xs animate-in fade-in duration-200">
              <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                <Calendar size={14} className="text-emerald-700" /> Custom Financial Date Range:
              </span>
              <div className="flex items-center gap-2">
                <input 
                  type="date"
                  value={financialStartDate}
                  onChange={(e) => setFinancialStartDate(e.target.value)}
                  className="bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="text-gray-400 font-bold">to</span>
                <input 
                  type="date"
                  value={financialEndDate}
                  onChange={(e) => setFinancialEndDate(e.target.value)}
                  className="bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <button
                onClick={() => {
                  if (!financialStartDate || !financialEndDate) {
                    toast.error('Please select both Start Date and End Date');
                    return;
                  }
                  if (new Date(financialStartDate) > new Date(financialEndDate)) {
                    toast.error('Start date cannot be after End date');
                    return;
                  }
                  fetchFinancialSummaryData('custom', financialStartDate, financialEndDate);
                }}
                className="bg-[#8CC63F] hover:bg-[#116631] text-white px-4 py-1.5 rounded-lg font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                {financialLoading ? <Loader2 size={12} className="animate-spin" /> : null}
                Apply Date Range
              </button>
            </div>
          )}

          {/* 6 Financial Metric Cards (3x2 Responsive Grid like Action Required) */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 transition-opacity duration-200 ${financialLoading ? 'opacity-60' : 'opacity-100'}`}>
            
            {/* 1. Gross Revenue 🟢 */}
            <div className="bg-gradient-to-br from-emerald-50/40 via-white to-white border border-emerald-100/90 rounded-xl p-4 sm:p-5 flex flex-col justify-between hover:shadow-md hover:border-emerald-300 transition-all group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">Gross Revenue</span>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-emerald-100/80 text-emerald-600 flex items-center justify-center shrink-0">
                    <TrendingUp size={16} />
                  </div>
                </div>

                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-950 tracking-tight">
                    {financialSummary?.grossRevenue?.formatted || `₹${Number(financialSummary?.grossRevenue?.raw || 0).toLocaleString('en-IN')}`}
                  </span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                    Inflow
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mb-3">
                  {financialSummary?.grossRevenue?.description || 'Total gross charging revenue collected across all stations'}
                </p>

                <div className="space-y-1.5 mb-4 bg-white/90 rounded-lg p-2.5 border border-emerald-100/80 text-xs">
                  <div className="flex justify-between items-center text-gray-700">
                    <span className="font-medium">Total Paid Sessions</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[11px] border border-emerald-100">
                      {(financialSummary?.grossRevenue?.count || 0).toLocaleString('en-IN')} Sessions
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-gray-500 text-[11px]">
                    <span>Cash Flow Type</span>
                    <span className="font-medium text-gray-700">Direct Inflow</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/bookings')}
                className="w-full mt-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer group/btn"
              >
                <span>View</span>
                <ArrowRight size={13} className="group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* 2. Refund Amount 🟠 */}
            <div className="bg-gradient-to-br from-amber-50/40 via-white to-white border border-amber-100/90 rounded-xl p-4 sm:p-5 flex flex-col justify-between hover:shadow-md hover:border-amber-300 transition-all group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">Refund Amount</span>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-amber-100/80 text-amber-600 flex items-center justify-center shrink-0">
                    <RotateCcw size={16} />
                  </div>
                </div>

                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-black text-amber-950 tracking-tight">
                    {financialSummary?.refundAmount?.formatted || `₹${Number(financialSummary?.refundAmount?.raw || 0).toLocaleString('en-IN')}`}
                  </span>
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full">
                    Outflow
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mb-3">
                  {financialSummary?.refundAmount?.description || 'Customer refunds requested, processed or disbursed'}
                </p>

                <div className="space-y-1.5 mb-4 bg-white/90 rounded-lg p-2.5 border border-amber-100/80 text-xs">
                  <div className="flex justify-between items-center text-gray-700">
                    <span className="font-medium">Refunded Transactions</span>
                    <span className="font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-[11px] border border-amber-100">
                      {(financialSummary?.refundAmount?.count || 0).toLocaleString('en-IN')} Disbursed
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-gray-500 text-[11px]">
                    <span>Disbursement Status</span>
                    <span className="font-medium text-gray-700">{(financialSummary?.refundAmount?.count || 0) > 0 ? 'Processed' : 'Zero Refunds'}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/refunds')}
                className="w-full mt-1 py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer group/btn"
              >
                <span>View</span>
                <ArrowRight size={13} className="group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* 3. Partner Share 🔵 */}
            <div className="bg-gradient-to-br from-sky-50/40 via-white to-white border border-sky-100/90 rounded-xl p-4 sm:p-5 flex flex-col justify-between hover:shadow-md hover:border-sky-300 transition-all group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">Partner Share</span>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-sky-100/80 text-sky-600 flex items-center justify-center shrink-0">
                    <Handshake size={16} />
                  </div>
                </div>

                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-black text-sky-950 tracking-tight">
                    {financialSummary?.partnerShare?.formatted || `₹${Number(financialSummary?.partnerShare?.raw || 0).toLocaleString('en-IN')}`}
                  </span>
                  <span className="text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200/80 px-2 py-0.5 rounded-full">
                    60% Split
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mb-3">
                  {financialSummary?.partnerShare?.description || 'Station host revenue allocation (60% host split)'}
                </p>

                <div className="space-y-1.5 mb-4 bg-white/90 rounded-lg p-2.5 border border-sky-100/80 text-xs">
                  <div className="flex justify-between items-center text-gray-700">
                    <span className="font-medium">Host Revenue Allocation</span>
                    <span className="font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded text-[11px] border border-sky-100">
                      60% of Net Inflow
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-gray-500 text-[11px]">
                    <span>Beneficiaries</span>
                    <span className="font-medium text-gray-700">Station Hosts</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/payouts')}
                className="w-full mt-1 py-2 px-3 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer group/btn"
              >
                <span>View</span>
                <ArrowRight size={13} className="group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* 4. Platform Revenue 🟣 */}
            <div className="bg-gradient-to-br from-purple-50/40 via-white to-white border border-purple-100/90 rounded-xl p-4 sm:p-5 flex flex-col justify-between hover:shadow-md hover:border-purple-300 transition-all group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">Platform Revenue</span>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-purple-100/80 text-purple-600 flex items-center justify-center shrink-0">
                    <Zap size={16} />
                  </div>
                </div>

                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-black text-purple-950 tracking-tight">
                    {financialSummary?.platformRevenue?.formatted || `₹${Number(financialSummary?.platformRevenue?.raw || 0).toLocaleString('en-IN')}`}
                  </span>
                  <span className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200/80 px-2 py-0.5 rounded-full">
                    40% Margin
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mb-3">
                  {financialSummary?.platformRevenue?.description || 'Bharat EV Prime net commission retained (40%)'}
                </p>

                <div className="space-y-1.5 mb-4 bg-white/90 rounded-lg p-2.5 border border-purple-100/80 text-xs">
                  <div className="flex justify-between items-center text-gray-700">
                    <span className="font-medium">Company Profit Margin</span>
                    <span className="font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded text-[11px] border border-purple-100">
                      40% Platform Retained
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-gray-500 text-[11px]">
                    <span>Net Commission Rate</span>
                    <span className="font-medium text-gray-700">Direct Margin</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/reports')}
                className="w-full mt-1 py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer group/btn"
              >
                <span>View</span>
                <ArrowRight size={13} className="group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* 5. Pending Payout 🟠 */}
            <div className="bg-gradient-to-br from-orange-50/40 via-white to-white border border-orange-100/90 rounded-xl p-4 sm:p-5 flex flex-col justify-between hover:shadow-md hover:border-orange-300 transition-all group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">Pending Payout</span>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-orange-100/80 text-orange-600 flex items-center justify-center shrink-0">
                    <Clock size={16} />
                  </div>
                </div>

                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-black text-orange-950 tracking-tight">
                    {financialSummary?.pendingPayout?.formatted || `₹${Number(financialSummary?.pendingPayout?.raw || 0).toLocaleString('en-IN')}`}
                  </span>
                  <span className="text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200/80 px-2 py-0.5 rounded-full">
                    Owed
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mb-3">
                  {financialSummary?.pendingPayout?.description || 'Unsettled host partner payout requests in queue'}
                </p>

                <div className="space-y-1.5 mb-4 bg-white/90 rounded-lg p-2.5 border border-orange-100/80 text-xs">
                  <div className="flex justify-between items-center text-gray-700">
                    <span className="font-medium">Host Payouts in Queue</span>
                    <span className="font-bold text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded text-[11px] border border-orange-100">
                      {(financialSummary?.pendingPayout?.count || 0).toLocaleString('en-IN')} Pending
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-gray-500 text-[11px]">
                    <span>Disbursement Action</span>
                    <span className="font-medium text-gray-700">Requires Approval</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/payouts?status=Pending')}
                className="w-full mt-1 py-2 px-3 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer group/btn"
              >
                <span>View</span>
                <ArrowRight size={13} className="group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* 6. Failed Payments 🔴 */}
            <div className="bg-gradient-to-br from-rose-50/40 via-white to-white border border-rose-100/90 rounded-xl p-4 sm:p-5 flex flex-col justify-between hover:shadow-md hover:border-rose-300 transition-all group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">Failed Payments</span>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-rose-100/80 text-rose-600 flex items-center justify-center shrink-0">
                    <AlertOctagon size={16} />
                  </div>
                </div>

                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-black text-rose-950 tracking-tight">
                    {financialSummary?.failedPayments?.formatted || `₹${Number(financialSummary?.failedPayments?.raw || 0).toLocaleString('en-IN')}`}
                  </span>
                  <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded-full">
                    Failed
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mb-3">
                  {financialSummary?.failedPayments?.description || 'Declined payment gateway transactions & bookings'}
                </p>

                <div className="space-y-1.5 mb-4 bg-white/90 rounded-lg p-2.5 border border-rose-100/80 text-xs">
                  <div className="flex justify-between items-center text-gray-700">
                    <span className="font-medium">Failed Transactions</span>
                    <span className="font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded text-[11px] border border-rose-100">
                      {(financialSummary?.failedPayments?.count || 0).toLocaleString('en-IN')} Declined
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-gray-500 text-[11px]">
                    <span>Payment Gateway Status</span>
                    <span className="font-medium text-gray-700">Cancelled / Expired</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/payments?status=Failed')}
                className="w-full mt-1 py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer group/btn"
              >
                <span>View</span>
                <ArrowRight size={13} className="group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>

          </div>
        </div>
      )}
        {/* --- ACTION REQUIRED (Section 11) --- */}
      {(canSeeStations || canSeeBookings || canSeeRevenue) && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-4 sm:p-5 md:p-6 space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                    Action Required
                  </h2>
                  <span className="text-[10px] font-extrabold text-rose-700 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Urgent Backlog
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Critical operational bottlenecks, offline hardware & financial queues requiring immediate attention
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-lg">
                Total Urgent Items: <strong className="text-rose-900 font-extrabold">
                  {((actionRequired?.offlineChargers?.count || 0) +
                    (actionRequired?.chargerFaults?.count || 0) +
                    (actionRequired?.failedPayments?.count || 0) +
                    (actionRequired?.pendingRefunds?.count || 0) +
                    (actionRequired?.pendingPayouts?.count || 0) +
                    (actionRequired?.openComplaints?.count || 0)).toLocaleString()}
                </strong>
              </span>
            </div>
          </div>

          {/* 6 Action Required Cards (3x2 Responsive Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* 1. Offline Chargers 🔴 */}
            <div className="bg-gradient-to-br from-rose-50/40 via-white to-white border border-rose-100/90 rounded-xl p-4 sm:p-5 flex flex-col justify-between hover:shadow-md hover:border-rose-300 transition-all group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">Offline Chargers</span>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-rose-100/80 text-rose-600 flex items-center justify-center shrink-0">
                    <WifiOff size={16} />
                  </div>
                </div>

                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-black text-rose-950 tracking-tight">
                    {(actionRequired?.offlineChargers?.count || stats?.offlineStations || 0).toLocaleString()}
                  </span>
                  <span className="text-xs font-semibold text-rose-600">Chargers Offline</span>
                </div>
                <p className="text-[11px] text-gray-500 mb-3">
                  {actionRequired?.offlineChargers?.description || 'Chargers currently disconnected or offline'}
                </p>

                <div className="space-y-1.5 mb-4 bg-white/90 rounded-lg p-2.5 border border-rose-100/80 text-xs">
                  <div className="flex justify-between items-center text-gray-700">
                    <span className="font-medium">Connectivity Status</span>
                    <span className="font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded text-[11px] border border-rose-100">
                      {(actionRequired?.offlineChargers?.count || stats?.offlineStations || 0) > 0 ? 'Requires Reboot' : 'All Online'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-gray-500 text-[11px]">
                    <span>Destination</span>
                    <span className="font-medium text-gray-700">Station Management</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/stations?status=Offline')}
                className="w-full mt-1 py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer group/btn"
              >
                <span>View</span>
                <ArrowRight size={13} className="group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* 2. Charger Faults 🔴 */}
            <div className="bg-gradient-to-br from-red-50/40 via-white to-white border border-red-100/90 rounded-xl p-4 sm:p-5 flex flex-col justify-between hover:shadow-md hover:border-red-300 transition-all group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">Charger Faults</span>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-red-100/80 text-red-600 flex items-center justify-center shrink-0">
                    <Wrench size={16} />
                  </div>
                </div>

                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-black text-red-950 tracking-tight">
                    {(actionRequired?.chargerFaults?.count || 0).toLocaleString()}
                  </span>
                  <span className="text-xs font-semibold text-red-600">Active Faults</span>
                </div>
                <p className="text-[11px] text-gray-500 mb-3">
                  {actionRequired?.chargerFaults?.description || 'Hardware, connector & protocol errors'}
                </p>

                {actionRequired?.chargerFaults?.breakdown?.length > 0 ? (
                  <div className="space-y-1.5 mb-4 bg-white/90 rounded-lg p-2.5 border border-red-100/80">
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Top Affected Station</div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-700 font-medium truncate max-w-[160px]">
                        • {actionRequired.chargerFaults.breakdown[0].name}
                      </span>
                      <span className="font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded text-[11px] border border-red-100">
                        {actionRequired.chargerFaults.breakdown[0].count} errors
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5 mb-4 bg-white/90 rounded-lg p-2.5 border border-red-100/80 text-xs">
                    <div className="flex justify-between items-center text-gray-700">
                      <span className="font-medium">System Telemetry</span>
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[11px]">Normal</span>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => navigate('/stations?status=Fault')}
                className="w-full mt-1 py-2 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer group/btn"
              >
                <span>View</span>
                <ArrowRight size={13} className="group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* 3. Failed Payments 🟠 */}
            <div className="bg-gradient-to-br from-orange-50/40 via-white to-white border border-orange-100/90 rounded-xl p-4 sm:p-5 flex flex-col justify-between hover:shadow-md hover:border-orange-300 transition-all group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">Failed Payments</span>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-orange-100/80 text-orange-600 flex items-center justify-center shrink-0">
                    <AlertOctagon size={16} />
                  </div>
                </div>

                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-black text-orange-950 tracking-tight">
                    {(actionRequired?.failedPayments?.count || 0).toLocaleString()}
                  </span>
                  <span className="text-xs font-semibold text-orange-600">Failed Txns</span>
                </div>
                <p className="text-[11px] text-gray-500 mb-3">
                  {actionRequired?.failedPayments?.description || 'Declined transactions & payment gateway failures'}
                </p>

                <div className="space-y-1.5 mb-4 bg-white/90 rounded-lg p-2.5 border border-orange-100/80 text-xs">
                  <div className="flex justify-between items-center text-gray-700">
                    <span className="font-medium">Failed Volume</span>
                    <span className="font-bold text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded text-[11px] border border-orange-100">
                      {actionRequired?.failedPayments?.formattedAmount || '₹0'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-gray-500 text-[11px]">
                    <span>Suggested Action</span>
                    <span className="font-semibold text-orange-700">Review & Retry</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/payments?status=Failed')}
                className="w-full mt-1 py-2 px-3 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer group/btn"
              >
                <span>Review</span>
                <ArrowRight size={13} className="group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* 4. Pending Refund Requests 🟡 */}
            <div className="bg-gradient-to-br from-amber-50/40 via-white to-white border border-amber-100/90 rounded-xl p-4 sm:p-5 flex flex-col justify-between hover:shadow-md hover:border-amber-300 transition-all group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">Pending Refund Requests</span>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-amber-100/80 text-amber-600 flex items-center justify-center shrink-0">
                    <RotateCcw size={16} />
                  </div>
                </div>

                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-black text-amber-950 tracking-tight">
                    {(actionRequired?.pendingRefunds?.count || actionRequired?.refundRequests?.count || 0).toLocaleString()}
                  </span>
                  <span className="text-xs font-semibold text-amber-600">Pending Requests</span>
                </div>
                <p className="text-[11px] text-gray-500 mb-3">
                  {actionRequired?.pendingRefunds?.description || 'Customer refund requests awaiting review'}
                </p>

                <div className="space-y-1.5 mb-4 bg-white/90 rounded-lg p-2.5 border border-amber-100/80 text-xs">
                  <div className="flex justify-between items-center text-gray-700">
                    <span className="font-medium">Requested Volume</span>
                    <span className="font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-[11px] border border-amber-100">
                      {actionRequired?.pendingRefunds?.formattedAmount || '₹0'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-gray-500 text-[11px]">
                    <span>Approval Status</span>
                    <span className="font-semibold text-amber-700">
                      {(actionRequired?.pendingRefunds?.count || 0) > 0 ? 'Pending Review' : 'All Clear'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/refunds?status=Pending')}
                className="w-full mt-1 py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer group/btn"
              >
                <span>Review</span>
                <ArrowRight size={13} className="group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* 5. Pending Partner Payouts 🟠 */}
            <div className="bg-gradient-to-br from-orange-50/40 via-white to-white border border-orange-100/90 rounded-xl p-4 sm:p-5 flex flex-col justify-between hover:shadow-md hover:border-orange-300 transition-all group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">Pending Partner Payouts</span>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-orange-100/80 text-orange-600 flex items-center justify-center shrink-0">
                    <Handshake size={16} />
                  </div>
                </div>

                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-black text-orange-950 tracking-tight">
                    {actionRequired?.pendingPayouts?.formattedAmount || '₹0'}
                  </span>
                  <span className="text-xs font-semibold text-orange-600">
                    {(actionRequired?.pendingPayouts?.count || 0)} Batches
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mb-3">
                  {actionRequired?.pendingPayouts?.description || 'Station owner payout settlements in queue'}
                </p>

                <div className="space-y-1.5 mb-4 bg-white/90 rounded-lg p-2.5 border border-orange-100/80 text-xs">
                  <div className="flex justify-between items-center text-gray-700">
                    <span className="font-medium">Eligible Partners</span>
                    <span className="font-bold text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded text-[11px] border border-orange-100">
                      {actionRequired?.pendingPayouts?.partners || 0} Hosts
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-gray-500 text-[11px]">
                    <span>Settlement Status</span>
                    <span className="font-semibold text-orange-700">Awaiting Disbursement</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/payouts?status=Pending')}
                className="w-full mt-1 py-2 px-3 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer group/btn"
              >
                <span>Manage</span>
                <ArrowRight size={13} className="group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* 6. Open Complaints 🔴 */}
            <div className="bg-gradient-to-br from-rose-50/40 via-white to-white border border-rose-100/90 rounded-xl p-4 sm:p-5 flex flex-col justify-between hover:shadow-md hover:border-rose-300 transition-all group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">Open Complaints</span>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-rose-100/80 text-rose-600 flex items-center justify-center shrink-0">
                    <MessageSquare size={16} />
                  </div>
                </div>

                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-black text-rose-950 tracking-tight">
                    {(actionRequired?.openComplaints?.count || 0).toLocaleString()}
                  </span>
                  <span className="text-xs font-semibold text-rose-600">Unresolved</span>
                </div>
                <p className="text-[11px] text-gray-500 mb-3">
                  {actionRequired?.openComplaints?.description || 'Unresolved customer tickets & partner complaints'}
                </p>

                <div className="space-y-1.5 mb-4 bg-white/90 rounded-lg p-2.5 border border-rose-100/80 text-xs">
                  <div className="flex justify-between items-center text-gray-700">
                    <span className="font-medium">User Tickets</span>
                    <span className="font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded text-[11px] border border-rose-100">
                      {actionRequired?.openComplaints?.ticketsCount || 0} Open
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-gray-700">
                    <span className="font-medium">Partner Complaints</span>
                    <span className="font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded text-[11px] border border-rose-100">
                      {actionRequired?.openComplaints?.partnerComplaintsCount || 0} Open
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate(actionRequired?.openComplaints?.route || '/tickets?status=Open')}
                className="w-full mt-1 py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer group/btn"
              >
                <span>View</span>
                <ArrowRight size={13} className="group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>

          </div>
        </div>
      )}
      </div>



      {/* ═══════════════════════════════════════════════════════ */}
      {/* ROW 7 — SUPPORTING INFORMATION (Activities + Eco)     */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        {/* Recent Activities (Takes 5 Columns on Desktop) - 100% Real-Time Business/Operational Feed */}
        <div className={`${canSeeCarbon ? 'lg:col-span-7' : 'lg:col-span-12'} bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-5 md:p-6 flex flex-col justify-between`}>
          <div>
            {/* Header with Refresh Button + Audit Logs Quick-Link */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 mb-4 pb-3 border-b border-gray-100">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">Recent Activities</h3>
                  <span className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Business &amp; operational events only — login/auth events are in
                  <button onClick={() => navigate('/audit')} className="text-emerald-600 font-semibold hover:underline ml-1 cursor-pointer">Audit Logs →</button>
                </p>
              </div>

              {/* Refresh button */}
              <button
                onClick={() => fetchRecentActivities(true)}
                disabled={activitiesLoading}
                className="self-start flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-gray-600 hover:text-emerald-700 bg-gray-50 hover:bg-emerald-50 border border-gray-200/80 transition-all cursor-pointer group shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
                title="Refresh recent activities"
              >
                <RefreshCw size={13} className={`text-gray-500 group-hover:text-emerald-600 transition-colors ${activitiesLoading ? 'animate-spin' : ''}`} />
                <span>{activitiesLoading ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>

            {/* Business Activity Feed */}
            <div className="space-y-1.5 flex-grow flex flex-col">
              {activitiesLoading && !liveActivities ? (
                <div className="py-8 text-center text-xs text-gray-400 flex flex-col items-center justify-center gap-2">
                  <Loader2 size={20} className="text-emerald-400 animate-spin" />
                  <span>Loading activities...</span>
                </div>
              ) : (() => {
                // Use live polled activities first, fallback to dashboard data
                const activities = liveActivities || recentActivities;
                return activities && activities.length > 0 ? (
                  activities.map((activity, idx) => {
                    const IconComp = iconMap[activity.iconType] || Zap;
                    return (
                      <div
                        key={activity.id || idx}
                        onClick={() => activity.route && navigate(activity.route)}
                        className={`group flex items-start justify-between p-2.5 rounded-xl hover:bg-gray-50/80 transition-all border border-transparent hover:border-gray-100/80 ${
                          activity.route ? 'cursor-pointer' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${activity.bg || 'bg-gray-100'} ${activity.color || 'text-gray-600'}`}>
                            <IconComp size={15} strokeWidth={2.5} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                                {activity.title}
                              </span>
                              {activity.badge && (
                                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border ${activity.badgeColor || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                  {activity.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-500 truncate mt-0.5">
                              {activity.subtitle}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-2 pt-0.5">
                          <span className="text-[10px] sm:text-[11px] font-semibold text-gray-400 group-hover:text-gray-600 transition-colors whitespace-nowrap">
                            {activity.time}
                          </span>
                          {activity.route && (
                            <ArrowUpRight size={13} className="text-gray-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-center text-xs text-gray-400 flex flex-col items-center justify-center gap-1.5">
                    <Zap size={20} className="text-gray-300" />
                    <span>No recent operational activity recorded</span>
                    <span className="text-[10px] text-gray-300">Login &amp; auth events are in Audit Logs</span>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Footer - Auto-refresh indicator + Audit Logs link */}
          <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {activitiesLastUpdated
                ? `Updated ${activitiesLastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })} • Auto-refreshes every 45s`
                : 'Auto-refreshes every 45s'}
            </span>
            <button
              onClick={() => navigate('/audit')}
              className="font-semibold text-gray-500 hover:text-emerald-700 transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
            >
              <ClipboardList size={11} />
              <span>View Audit Logs</span>
              <ArrowRight size={10} />
            </button>
          </div>
        </div>
        
        {/* Sustainability Impact (Takes 5 Columns on Desktop) */}
        {canSeeCarbon && (
          <div className="lg:col-span-5 bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900 rounded-2xl border border-emerald-700/40 shadow-lg p-5 md:p-6 overflow-hidden relative flex flex-col justify-between text-white">
            {/* Background decorative blobs */}
          <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-emerald-400/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-teal-400/10 blur-2xl pointer-events-none" />

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-400/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
                <Leaf size={18} className="text-emerald-300" strokeWidth={2.5} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm sm:text-base font-bold text-white">Sustainability Impact</h2>
                  <span className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-300 bg-emerald-400/20 border border-emerald-400/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {getShortPeriodTag(stats.periodLabel)}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-300/70 mt-0.5">CO₂ avoided, clean energy delivered & EVs served by your network</p>
              </div>
            </div>
            {hasPermission('carbon') && (
              <button
                onClick={() => navigate('/carbon')}
                className="self-start sm:self-auto flex items-center gap-1 text-xs font-bold text-emerald-300 hover:text-emerald-200 transition-colors cursor-pointer shrink-0"
              >
                <span>View Carbon Details</span>
                <ArrowRight size={12} />
              </button>
            )}
          </div>

          {/* 3 Sustainability Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2.5 sm:gap-3 relative z-10">
            {/* 1. CO₂ Saved */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/15 transition-all group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider">CO₂ Saved</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-400/20 border border-emerald-400/30 flex items-center justify-center">
                  <Leaf size={14} className="text-emerald-300" strokeWidth={2.5} />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {(stats.periodCO2 !== undefined ? stats.periodCO2 : (stats.co2Saved || 0)).toLocaleString()}
                <span className="text-base font-semibold text-emerald-300 ml-1">Tons</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[10px] text-emerald-300/60 font-medium">CO₂ emission avoided</span>
                {stats.periodCO2Growth && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    stats.periodCO2Growth.startsWith('-') ? 'text-red-300 bg-red-400/20' : 'text-emerald-300 bg-emerald-400/20'
                  }`}>
                    {stats.periodCO2Growth}
                  </span>
                )}
              </div>
              <div className="mt-2 pt-2 border-t border-white/10">
                <span className="text-[10px] text-emerald-300/50">All-time: {(stats.co2Saved || 0).toLocaleString()} Tons total</span>
              </div>
            </div>

            {/* 2. Energy Delivered */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/15 transition-all group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider">Energy Delivered</span>
                <div className="w-7 h-7 rounded-lg bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center">
                  <Zap size={14} className="text-yellow-300" strokeWidth={2.5} />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {(stats.periodEnergy !== undefined ? stats.periodEnergy : (stats.totalEnergy || 0)).toLocaleString()}
                <span className="text-base font-semibold text-yellow-300 ml-1">kWh</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[10px] text-emerald-300/60 font-medium">Clean energy dispatched</span>
                {stats.periodEnergyGrowth && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    stats.periodEnergyGrowth.startsWith('-') ? 'text-red-300 bg-red-400/20' : 'text-yellow-300 bg-yellow-400/20'
                  }`}>
                    {stats.periodEnergyGrowth}
                  </span>
                )}
              </div>
              <div className="mt-2 pt-2 border-t border-white/10">
                <span className="text-[10px] text-emerald-300/50">All-time: {(stats.totalEnergy || 0).toLocaleString()} kWh total</span>
              </div>
            </div>

            {/* 3. EVs Served */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/15 transition-all group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider">EVs Served</span>
                <div className="w-7 h-7 rounded-lg bg-sky-400/20 border border-sky-400/30 flex items-center justify-center">
                  <Gauge size={14} className="text-sky-300" strokeWidth={2.5} />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {(stats.periodSessions !== undefined ? stats.periodSessions : (stats.totalSessions || 0)).toLocaleString()}
                <span className="text-base font-semibold text-sky-300 ml-1">Sessions</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[10px] text-emerald-300/60 font-medium">EV charging sessions</span>
                {stats.periodSessionsGrowth && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    stats.periodSessionsGrowth.startsWith('-') ? 'text-red-300 bg-red-400/20' : 'text-sky-300 bg-sky-400/20'
                  }`}>
                    {stats.periodSessionsGrowth}
                  </span>
                )}
              </div>
              <div className="mt-2 pt-2 border-t border-white/10">
                <span className="text-[10px] text-emerald-300/50">All-time: {(stats.totalSessions || 0).toLocaleString()} EVs served</span>
              </div>
            </div>
          </div>
          </div>
        )}

      </div>




    </div>
  );
};

export default DashboardView;
