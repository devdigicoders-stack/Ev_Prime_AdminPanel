import React, { useState, useEffect } from 'react';
import { ChevronDown, Download, ArrowUpRight, Loader2 } from 'lucide-react';
import { 
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const CityAnalyticsView = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCity, setSelectedCity] = useState('All');
  const [dateRange, setDateRange] = useState('30d');

  const handleExport = () => {
    if (!data || !data.topStations) return;
    const headers = ['Station Name', 'Location', 'Sessions', 'Energy (kWh)', 'Revenue (INR)'];
    const csvContent = [
      headers.join(','),
      ...data.topStations.map(station => [
        `"${station.name}"`,
        `"${station.location}"`,
        `"${station.sessions}"`,
        `"${station.energy}"`,
        `"${station.revenue.replace('₹', '')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `City_Analytics_${selectedCity}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  useEffect(() => {
    const fetchCityData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('adminToken');
        const url = selectedCity !== 'All' 
            ? `${API_BASE_URL}/analytics/city?city=${selectedCity}`
            : `${API_BASE_URL}/analytics/city`;

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch city analytics');
        const result = await response.json();
        
        setData(result);
        if (selectedCity === 'All') {
            setSelectedCity(result.selectedCity);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCityData();
  }, [selectedCity]);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <Loader2 className="animate-spin text-[#8CC63F]" size={48} />
        <p className="text-gray-500 font-medium">Aggregating City Metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-500 font-medium">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const { stats, availableCities, energyData, revenueData, topStations, connectorData } = data;

  return (
    <div className="flex flex-col h-full space-y-6 pb-6 relative">
      {loading && (
        <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center rounded-2xl">
          <Loader2 className="animate-spin text-[#8CC63F]" size={48} />
        </div>
      )}
      
      {/* Header Area */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">City Analytics</h1>
          <p className="text-gray-500 text-sm font-medium">City-wise analytics and insights</p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full xl:w-auto mt-4 xl:mt-0">
          <div className="flex gap-3">
            <div className="relative flex-1 sm:flex-none">
              <select className="w-full sm:w-40 appearance-none bg-white border border-gray-200 rounded-lg pl-4 pr-10 py-2.5 text-sm text-gray-600 font-medium shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#8CC63F] cursor-pointer transition">
                <option value="All States">All States</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Delhi">Delhi NCR</option>
                <option value="Karnataka">Karnataka</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            
            <div className="relative flex-1 sm:flex-none">
              <select 
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full sm:w-40 appearance-none bg-white border border-gray-200 rounded-lg pl-4 pr-10 py-2.5 text-sm text-gray-600 font-medium shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#8CC63F] cursor-pointer transition"
              >
                <option value="All">All Cities</option>
                {availableCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
          
          <div className="relative flex-1 sm:flex-none">
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full sm:w-56 appearance-none bg-white border border-gray-200 rounded-lg pl-4 pr-10 py-2.5 text-sm text-gray-600 font-medium shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#8CC63F] cursor-pointer transition"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="all">All Time</option>
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          
          <button 
            onClick={handleExport}
            className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm w-full sm:w-auto"
          >
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="text-gray-500 text-[10px] sm:text-xs font-semibold mb-2 sm:mb-3 uppercase tracking-wide truncate">Total Users</div>
          <div>
            <div className="text-base sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 truncate">{stats.users.value.toLocaleString()}</div>
            <div className="flex items-center text-emerald-600 text-[10px] sm:text-[11px] font-bold bg-emerald-50 w-fit px-1.5 py-0.5 rounded">
              <ArrowUpRight size={10} strokeWidth={3} className="mr-0.5 sm:w-3 sm:h-3" /> {stats.users.change}
            </div>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="text-gray-500 text-[10px] sm:text-xs font-semibold mb-2 sm:mb-3 uppercase tracking-wide truncate">Total Energy</div>
          <div>
            <div className="text-base sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 flex items-baseline gap-1 truncate">{stats.energy.value.toLocaleString()} <span className="text-[10px] sm:text-sm font-semibold text-gray-500">kWh</span></div>
            <div className="flex items-center text-emerald-600 text-[10px] sm:text-[11px] font-bold bg-emerald-50 w-fit px-1.5 py-0.5 rounded">
              <ArrowUpRight size={10} strokeWidth={3} className="mr-0.5 sm:w-3 sm:h-3" /> {stats.energy.change}
            </div>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="text-gray-500 text-[10px] sm:text-xs font-semibold mb-2 sm:mb-3 uppercase tracking-wide truncate">Total Revenue</div>
          <div>
            <div className="text-base sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 truncate">₹{(stats.revenue.value / 100000).toFixed(2)}L</div>
            <div className="flex items-center text-emerald-600 text-[10px] sm:text-[11px] font-bold bg-emerald-50 w-fit px-1.5 py-0.5 rounded">
              <ArrowUpRight size={10} strokeWidth={3} className="mr-0.5 sm:w-3 sm:h-3" /> {stats.revenue.change}
            </div>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="text-gray-500 text-[10px] sm:text-xs font-semibold mb-2 sm:mb-3 uppercase tracking-wide truncate">Total Sessions</div>
          <div>
            <div className="text-base sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 truncate">{stats.sessions.value.toLocaleString()}</div>
            <div className="flex items-center text-emerald-600 text-[10px] sm:text-[11px] font-bold bg-emerald-50 w-fit px-1.5 py-0.5 rounded">
              <ArrowUpRight size={10} strokeWidth={3} className="mr-0.5 sm:w-3 sm:h-3" /> {stats.sessions.change}
            </div>
          </div>
        </div>
      </div>

      {/* Middle Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        
        {/* Energy Consumption Bar Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-5 md:p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Energy Consumption (kWh)</h3>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600 font-medium cursor-pointer">
              This Month <ChevronDown size={14} className="text-gray-400" />
            </div>
          </div>
          
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={energyData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }} barSize={10}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#9ca3af' }} 
                  dy={10} 
                  interval="preserveStartEnd"
                  minTickGap={20}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(val) => val === 0 ? '0' : `${(val / 1000).toFixed(1)}K`} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="value" fill="#8CC63F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Trend Line Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-5 md:p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Trend (₹)</h3>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600 font-medium cursor-pointer">
              This Month <ChevronDown size={14} className="text-gray-400" />
            </div>
          </div>
          
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8CC63F" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#8CC63F" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#9ca3af' }} 
                  dy={10} 
                  interval="preserveStartEnd"
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(val) => val === 0 ? '0' : `${(val / 1000).toFixed(1)}K`} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="value" stroke="#8CC63F" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" dot={{ r: 4, fill: '#8CC63F', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#8CC63F', stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Bottom Row */}
      <div className="flex flex-col gap-4 md:gap-6">
        
        {/* Top Performing Stations Table */}
        <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col">
          <div className="p-5 md:p-6 border-b border-gray-50 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Top Performing Stations</h3>
            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">{selectedCity}</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Station Name</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sessions</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Energy (kWh)</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Revenue (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {topStations.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-sm font-medium text-gray-500">
                      No stations found in {selectedCity}.
                    </td>
                  </tr>
                ) : (
                  topStations.map((station, idx) => (
                    <tr key={station.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <span className="text-sm font-semibold text-emerald-600">{idx + 1}</span>
                        <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">{station.name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-600 whitespace-nowrap">{station.location}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-gray-700">{station.sessions}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-gray-700">{station.energy}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-gray-900">{station.revenue}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Connector Types Donut Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-5 md:p-6 flex flex-col">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Connector Types</h3>
          
          <div className="flex-1 flex flex-col items-center justify-center">
            
            <div className="flex flex-col sm:flex-row items-center w-full justify-center gap-8">
              
              <div className="h-[140px] w-[140px] relative flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={connectorData}
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {connectorData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend side by side */}
              <div className="flex flex-col gap-4 w-full sm:w-auto">
                {connectorData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 ml-auto pl-4">{item.value}%</span>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default CityAnalyticsView;
