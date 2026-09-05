import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, ArrowUpRight, 
  UserPlus, Zap, Wallet, RotateCcw, Handshake, Leaf, Loader2, ShoppingBag
} from 'lucide-react';
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

import { useAuth } from '../../contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const iconMap = {
  UserPlus, Zap, Wallet, RotateCcw, Handshake, Leaf, ShoppingBag
};

const StatCard = ({ title, value, growth, icon: Icon }) => (
  <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md hover:border-emerald-100 transition-all group overflow-hidden relative">
    <div className="flex flex-col z-10 min-w-0">
      <span className="text-gray-500 text-[10px] sm:text-xs font-semibold uppercase tracking-wide mb-1 sm:mb-1.5 truncate block">{title}</span>
      <div className="flex items-baseline gap-2">
        <span className="text-base sm:text-xl font-bold text-gray-900 truncate block">{value}</span>
      </div>
      {growth && (
        <div className="flex items-center text-emerald-600 text-[10px] sm:text-[11px] font-bold mt-1 bg-emerald-50 w-fit px-1 sm:px-1.5 py-0.5 rounded">
          <ArrowUpRight size={10} strokeWidth={3} className="mr-0.5 sm:w-3 sm:h-3" />
          {growth}
        </div>
      )}
    </div>
    {Icon ? (
      <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors z-10 shrink-0 ml-2">
        <Icon size={16} strokeWidth={2} className="sm:w-[22px] sm:h-[22px]" />
      </div>
    ) : (
      <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors z-10 shrink-0 ml-2">
        <span className="text-lg sm:text-2xl font-light">+</span>
      </div>
    )}
    <div className="absolute -right-4 -top-4 w-16 h-16 sm:w-20 sm:h-20 bg-emerald-50/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity blur-xl"></div>
  </div>
);

const REVENUE_PERIODS = ['Last 7 Days', 'Last 14 Days', 'Last 30 Days', 'Last 90 Days'];
const ENERGY_PERIODS  = ['Last 7 Days', 'Last 14 Days', 'Last 30 Days', 'Last 90 Days'];

const DashboardView = () => {
  const { admin, hasPermission } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [revenuePeriod, setRevenuePeriod]     = useState('Last 14 Days');
  const [energyPeriod,  setEnergyPeriod]      = useState('Last 30 Days');
  const [revenueOpen,   setRevenueOpen]        = useState(false);
  const [energyOpen,    setEnergyOpen]         = useState(false);
  const [chartLoading,  setChartLoading]       = useState({ revenue: false, energy: false });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const periodToDays = (label) => {
    const map = { 'Last 7 Days': 7, 'Last 14 Days': 14, 'Last 30 Days': 30, 'Last 90 Days': 90 };
    return map[label] || 14;
  };

  const handleRevenuePeriod = async (period) => {
    setRevenuePeriod(period);
    setRevenueOpen(false);
    setChartLoading(p => ({ ...p, revenue: true }));
    try {
      const token = localStorage.getItem('adminToken');
      const days = periodToDays(period);
      const res = await fetch(`${API_BASE_URL}/dashboard?revenueDays=${days}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        setData(prev => ({ ...prev, charts: { ...prev.charts, revenueData: result.charts?.revenueData ?? prev.charts.revenueData } }));
      }
    } catch (e) { console.error(e); }
    finally { setChartLoading(p => ({ ...p, revenue: false })); }
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

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-emerald-500" size={48} />
      </div>
    );
  }

  const { stats, charts, recentActivities, topCities, topStations } = data;
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  // Permission helpers
  const canSeeRevenue = hasPermission('payments') || hasPermission('analytics') || hasPermission('bookings');
  const canSeeBookings = hasPermission('bookings') || hasPermission('analytics');
  const canSeeStations = hasPermission('stations');
  const canSeeUsers = hasPermission('users');
  const canSeeCarbon = hasPermission('carbon') || hasPermission('analytics');

  return (
    <div className="flex flex-col h-full space-y-6 pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="w-full">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Dashboard</h1>
          <p className="text-gray-800 font-medium text-sm sm:text-base">Welcome back, {admin?.name || 'Admin'}! 👋</p>
          <p className="text-gray-400 text-xs sm:text-sm mt-0.5">Here's what's happening today.</p>
        </div>


      </div>

      {/* --- STATS GRID --- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {canSeeRevenue && <StatCard title="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} growth={stats.revenueGrowth} />}
        {canSeeRevenue && <StatCard title="Today's Revenue" value={`₹${(stats.todayRevenue || 0).toLocaleString()}`} />}
        {canSeeStations && <StatCard title="Active Chargers" value={stats.activeStations} icon={Zap} />}
        {canSeeStations && <StatCard title="Offline Chargers" value={stats.offlineStations} />}
        
        {canSeeBookings && <StatCard title="Today's Sessions" value={stats.todaySessions} icon={Zap} />}
        {canSeeBookings && <StatCard title="Today's Energy (kWh)" value={stats.todayEnergy} icon={Zap} />}
        {canSeeUsers && <StatCard title="Total Users" value={stats.totalUsers.toLocaleString()} growth={stats.usersGrowth} />}
        {canSeeCarbon && <StatCard title="CO₂ Saved (Tons)" value={stats.co2Saved.toLocaleString()} growth={stats.co2Growth} icon={Leaf} />}
      </div>

      {/* --- CHARTS ROW 1 --- */}
      {(canSeeRevenue || canSeeBookings) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          
          {/* Revenue Overview (Takes 2 Columns) */}
          {canSeeRevenue && (
            <div className={`${canSeeBookings ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-5 md:p-6`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Revenue Overview</h3>
                <div className="relative">
                  <button
                    onClick={() => { setRevenueOpen(o => !o); setEnergyOpen(false); }}
                    className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 text-xs text-gray-600 font-medium cursor-pointer hover:bg-gray-100 transition"
                  >
                    {chartLoading.revenue ? <Loader2 size={12} className="animate-spin mr-1" /> : null}
                    {revenuePeriod} <ChevronDown size={14} className={`text-gray-400 transition-transform ${revenueOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {revenueOpen && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden min-w-[130px]">
                      {REVENUE_PERIODS.map(p => (
                        <button
                          key={p}
                          onClick={() => handleRevenuePeriod(p)}
                          className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-gray-50 transition ${revenuePeriod === p ? 'text-[#8CC63F] bg-green-50' : 'text-gray-700'}`}
                        >{p}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="h-[250px] w-full">
                {chartLoading.revenue ? (
                  <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-[#8CC63F]" size={28} /></div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={charts.revenueData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(val) => val === 0 ? '0' : `${val / 1000}K`} />
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
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(val) => val === 0 ? '0' : `${val / 1000}K`} />
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

      {/* --- REAL-TIME MAP VIEW --- */}
      {canSeeStations && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-5 md:p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Real-Time Chargers Map</h3>
            <div className="flex items-center gap-2">
              <span className="flex items-center text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span> Online
              </span>
              <span className="flex items-center text-xs text-red-600 font-medium bg-red-50 px-2 py-1 rounded">
                <span className="w-2 h-2 rounded-full bg-red-500 mr-1.5"></span> Offline
              </span>
            </div>
          </div>
          
          <div className="h-[400px] w-full rounded-xl overflow-hidden border border-gray-200 relative z-0">
            <MapContainer 
              center={[20.5937, 78.9629]} 
              zoom={4} 
              style={{ height: '100%', width: '100%', zIndex: 0 }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {stats.mapData && stats.mapData.map((station) => {
                if (!station.latitude || !station.longitude) return null;
                
                // Determine if we should use a custom red icon for offline
                const isOffline = station.status === 'Offline' || station.status === 'Maintenance';
                const markerIcon = isOffline ? new L.Icon({
                  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                  popupAnchor: [1, -34],
                  shadowSize: [41, 41]
                }) : DefaultIcon;

                return (
                  <Marker 
                    key={station._id} 
                    position={[station.latitude, station.longitude]}
                    icon={markerIcon}
                  >
                    <Popup>
                      <div className="p-1">
                        <h4 className="font-bold text-gray-900">{station.name}</h4>
                        <p className="text-xs text-gray-600 mt-1">{station.location || station.city}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isOffline ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {station.status}
                          </span>
                          {station.connectorTypes && station.connectorTypes.length > 0 && (
                            <span className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                              {station.connectorTypes[0].type}
                            </span>
                          )}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </div>
      )}

      {/* --- CHARTS ROW 2 --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        
        {/* Revenue by City Donut (Takes 1 Column) */}
        {canSeeRevenue && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-5 md:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Revenue by City</h3>
            <div className="flex flex-col items-center">
              <div className="h-[200px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.revenueCityData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {charts.revenueCityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs text-gray-500 font-semibold">Total</span>
                  <span className="text-sm font-semibold text-gray-900">100%</span>
                </div>
              </div>
              {/* Legend */}
              <div className="w-full mt-6 px-2 space-y-3">
                {charts.revenueCityData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm font-semibold text-gray-800">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Sessions by Connector Donut (Takes 1 Column) */}
        {canSeeBookings && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-5 md:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Sessions by Connector</h3>
            <div className="flex flex-col items-center">
              <div className="h-[200px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.sessionsConnectorData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {charts.sessionsConnectorData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs text-gray-500 font-semibold">Total</span>
                  <span className="text-sm font-semibold text-gray-900">100%</span>
                </div>
              </div>
              {/* Legend */}
              <div className="w-full mt-6 px-2 space-y-3">
                {charts.sessionsConnectorData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm font-semibold text-gray-800">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent Activities (Takes 1 Column) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-5 md:p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
            {/* <span className="text-xs text-gray-400 font-medium cursor-pointer hover:text-gray-600">View All</span> */}
          </div>
          
          <div className="space-y-6 flex-grow flex flex-col pt-2">
            {recentActivities.map((activity) => {
              const IconComp = iconMap[activity.iconType] || UserPlus;
              return (
                <div key={activity.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${activity.bg} ${activity.color}`}>
                      <IconComp size={16} strokeWidth={2.5} />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{activity.title}</span>
                  </div>
                  <span className="text-xs text-gray-400 font-medium">{activity.time}</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* --- LISTS ROW 3 --- */}
      {(canSeeRevenue || canSeeStations) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          
          {/* Top Performing Cities */}
          {canSeeRevenue && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-5 md:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Performing Cities</h3>
              <div className="flex justify-end text-xs text-gray-400 font-semibold mb-3 pr-20">Revenue</div>
              <div className="space-y-4">
                {topCities.map((city, index) => (
                  <div key={city.id} className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded-lg transition">
                    <div className="flex items-center gap-4">
                      <span className={`text-lg font-semibold ${index === 0 ? 'text-emerald-500' : index === 1 ? 'text-emerald-400' : 'text-emerald-300'}`}>
                        {index + 1}
                      </span>
                      <span className="text-sm font-semibold text-gray-800">{city.name}</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-sm font-semibold text-gray-900">{city.revenue}</span>
                      <div className="flex items-center text-emerald-600 text-xs font-semibold w-16 justify-end">
                        <ArrowUpRight size={14} strokeWidth={3} className="mr-0.5" />
                        {city.growth}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Stations */}
          {canSeeStations && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-5 md:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Stations</h3>
              <div className="flex justify-end text-xs text-gray-400 font-semibold mb-3 pr-20">Revenue</div>
              <div className="space-y-4">
                {topStations.map((station, index) => (
                  <div key={station.id} className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded-lg transition">
                    <div className="flex items-center gap-4">
                      <span className={`text-lg font-semibold ${index === 0 ? 'text-emerald-500' : index === 1 ? 'text-emerald-400' : 'text-emerald-300'}`}>
                        {index + 1}
                      </span>
                      <span className="text-sm font-semibold text-gray-800">{station.name}</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-sm font-semibold text-gray-900">{station.revenue}</span>
                      <div className="flex items-center text-emerald-600 text-xs font-semibold w-16 justify-end">
                        <ArrowUpRight size={14} strokeWidth={3} className="mr-0.5" />
                        {station.growth}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default DashboardView;
