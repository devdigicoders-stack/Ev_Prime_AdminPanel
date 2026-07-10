import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, ArrowUpRight, 
  UserPlus, Zap, Wallet, RotateCcw, Handshake, Leaf, Loader2
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const iconMap = {
  UserPlus, Zap, Wallet, RotateCcw, Handshake, Leaf
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

const DashboardView = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-emerald-500" size={48} />
      </div>
    );
  }

  const { stats, charts, recentActivities, topCities, topStations } = data;
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="flex flex-col h-full space-y-6 pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="w-full">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Dashboard</h1>
          <p className="text-gray-800 font-medium text-sm sm:text-base">Welcome back, Super Admin! 👋</p>
          <p className="text-gray-400 text-xs sm:text-sm mt-0.5">Here's what's happening today.</p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto pb-1 md:pb-0">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm text-gray-600 font-medium shadow-sm cursor-pointer hover:bg-gray-50 transition whitespace-nowrap">
            {today} <ChevronDown size={14} className="text-gray-400 sm:w-4 sm:h-4" />
          </div>
        </div>
      </div>

      {/* --- STATS GRID --- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <StatCard title="Total Users" value={stats.totalUsers.toLocaleString()} growth="12.5%" />
        <StatCard title="Total Stations" value={stats.totalStations.toLocaleString()} growth="8.2%" />
        <StatCard title="Total Partners" value={stats.totalPartners.toLocaleString()} growth="15.3%" />
        <StatCard title="Total Sessions" value={stats.totalSessions.toLocaleString()} growth="14.6%" icon={Zap} />
        <StatCard title="Total Energy (kWh)" value={stats.totalEnergy.toLocaleString()} growth="16.8%" icon={Zap} />
        <StatCard title="CO₂ Saved (Tons)" value={stats.co2Saved.toLocaleString()} growth="18.3%" icon={Leaf} />
        <StatCard title="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} growth="19.2%" />
      </div>

      {/* --- CHARTS ROW 1 --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        
        {/* Revenue Overview (Takes 2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-5 md:p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Overview</h3>
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 text-xs text-gray-600 font-medium cursor-pointer">
              Last 14 Days <ChevronDown size={14} className="text-gray-400" />
            </div>
          </div>
          
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.revenueData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(val) => val === 0 ? '0' : `${val / 1000}K`} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                <Line type="monotone" dataKey="value" stroke="#8CC63F" strokeWidth={2.5} dot={{ r: 4, fill: '#8CC63F', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#8CC63F', stroke: '#fff', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Energy Consumption (Takes 1 Column) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-5 md:p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Energy Consumption (kWh)</h3>
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 text-xs text-gray-600 font-medium cursor-pointer">
              Last 30 Days <ChevronDown size={14} className="text-gray-400" />
            </div>
          </div>
          <div className="h-[250px] w-full flex-grow">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.energyData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(val) => val === 0 ? '0' : `${val / 1000}K`} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="value" fill="#16a34a" radius={[2, 2, 0, 0]} barSize={8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* --- CHARTS ROW 2 --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        
        {/* Revenue by City Donut (Takes 1 Column) */}
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

        {/* Sessions by Connector Donut (Takes 1 Column) */}
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

        {/* Recent Activities (Takes 1 Column) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-5 md:p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
            <span className="text-xs text-gray-400 font-medium cursor-pointer hover:text-gray-600">View All</span>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        
        {/* Top Performing Cities */}
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

        {/* Top Stations */}
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

      </div>

    </div>
  );
};

export default DashboardView;
