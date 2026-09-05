import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronDown, Download, ArrowUpRight, ArrowDownRight, Loader2, RefreshCw } from 'lucide-react';
import { 
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const STATE_CITY_MAP = {
  'Maharashtra': ['Mumbai', 'Pune'],
  'Delhi NCR': ['New Delhi', 'Gurugram', 'Grater Noida'],
  'Karnataka': ['Bengaluru'],
  'Telangana': ['Hyderabad'],
  'Uttar Pradesh': ['Lucknow', 'Grater Noida'],
  'Tamil Nadu': ['Chennai'],
  'West Bengal': ['Kolkata'],
  'Rajasthan': ['Jaipur'],
  'Jammu & Kashmir': ['Kashmir']
};

const CityAnalyticsView = () => {
  const [data, setData]                   = useState(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [selectedState, setSelectedState] = useState('All States');
  const [selectedCity, setSelectedCity]   = useState('All');
  const [dateRange, setDateRange]         = useState('30d');

  // Filter available cities based on selected state
  const filteredAvailableCities = useMemo(() => {
    if (!data || !data.availableCities) return [];
    if (selectedState === 'All States' || !STATE_CITY_MAP[selectedState]) {
      return data.availableCities;
    }
    const stateCities = STATE_CITY_MAP[selectedState].map(c => c.toLowerCase());
    return data.availableCities.filter(c => stateCities.includes(c.toLowerCase()));
  }, [data, selectedState]);

  // Handle State Change
  const handleStateChange = (e) => {
    const newState = e.target.value;
    setSelectedState(newState);
    // Reset city selection to 'All' when changing state
    setSelectedCity('All');
  };

  // Handle City Change
  const handleCityChange = (e) => {
    setSelectedCity(e.target.value);
  };

  // Handle Date Range Change
  const handleDateRangeChange = (e) => {
    setDateRange(e.target.value);
  };

  const fetchCityData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams();

      if (selectedCity && selectedCity !== 'All') {
        params.append('city', selectedCity);
      }
      if (selectedState && selectedState !== 'All States') {
        params.append('state', selectedState);
      }
      if (dateRange) {
        params.append('range', dateRange);
      }

      const queryString = params.toString();
      const url = `${API_BASE_URL}/analytics/city${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch city analytics');
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedCity, selectedState, dateRange]);

  useEffect(() => {
    fetchCityData();
  }, [fetchCityData]);

  const handleExport = () => {
    if (!data || !data.topStations) return;
    const headers = ['Station Name', 'Location', 'City', 'Sessions', 'Energy (kWh)', 'Revenue (INR)'];
    const rows = data.topStations.map(st => [
      `"${st.name}"`,
      `"${st.location}"`,
      `"${st.city || ''}"`,
      `"${st.sessions}"`,
      `"${st.energy}"`,
      `"${st.revenue}"`
    ]);

    const summary = [
      [],
      ['=== CITY ANALYTICS REPORT SUMMARY ==='],
      [`State Filter,${selectedState}`],
      [`City Filter,${selectedCity === 'All' ? 'All Cities' : selectedCity}`],
      [`Date Range,${dateRange === '7d' ? 'Last 7 Days' : dateRange === '30d' ? 'Last 30 Days' : dateRange === '90d' ? 'Last 90 Days' : 'All Time'}`],
      [`Total Users,${data.stats.users.value}`],
      [`Total Energy (kWh),${data.stats.energy.value}`],
      [`Total Revenue (INR),${data.stats.revenue.value}`],
      [`Total Sessions,${data.stats.sessions.value}`],
      [`Exported On,${new Date().toLocaleString('en-IN')}`]
    ];

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(',')),
      ...summary.map(s => s.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `City_Analytics_${selectedState}_${selectedCity}_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 min-h-[400px]">
        <Loader2 className="animate-spin text-[#8CC63F]" size={48} />
        <p className="text-gray-500 font-medium">Aggregating City Metrics...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 min-h-[400px]">
        <p className="text-red-500 font-medium">{error}</p>
        <button 
          onClick={fetchCityData}
          className="flex items-center gap-2 bg-[#8CC63F] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#7ab535] transition"
        >
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { stats, availableStates = [], energyData = [], revenueData = [], topStations = [], connectorData = [] } = data;

  const stateOptions = availableStates.length > 0 
    ? availableStates 
    : ['All States', 'Delhi NCR', 'Karnataka', 'Maharashtra', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal', 'Jammu & Kashmir'];

  // Currency Formatter
  const formatCurrency = (val) => {
    if (val === undefined || val === null) return '₹0';
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)}L`;
    }
    return `₹${val.toLocaleString()}`;
  };

  // Date range label
  const rangeLabelMap = {
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days',
    '90d': 'Last 90 Days',
    'all': 'All Time'
  };

  return (
    <div className="flex flex-col h-full space-y-6 pb-6 relative">
      {loading && (
        <div className="absolute inset-0 bg-white/60 z-50 flex items-center justify-center rounded-2xl backdrop-blur-[1px]">
          <div className="flex flex-col items-center gap-2 bg-white px-5 py-3 rounded-xl shadow-lg border border-gray-100">
            <Loader2 className="animate-spin text-[#8CC63F]" size={28} />
            <span className="text-xs font-semibold text-gray-600">Updating metrics...</span>
          </div>
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
            {/* State Filter */}
            <div className="relative flex-1 sm:flex-none">
              <select 
                value={selectedState}
                onChange={handleStateChange}
                className="w-full sm:w-44 appearance-none bg-white border border-gray-200 rounded-lg pl-4 pr-10 py-2.5 text-sm text-gray-700 font-medium shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#8CC63F] cursor-pointer transition"
              >
                {stateOptions.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            
            {/* City Filter */}
            <div className="relative flex-1 sm:flex-none">
              <select 
                value={selectedCity}
                onChange={handleCityChange}
                className="w-full sm:w-44 appearance-none bg-white border border-gray-200 rounded-lg pl-4 pr-10 py-2.5 text-sm text-gray-700 font-medium shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#8CC63F] cursor-pointer transition"
              >
                <option value="All">All Cities</option>
                {filteredAvailableCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
          
          {/* Date Range Filter */}
          <div className="relative flex-1 sm:flex-none">
            <select 
              value={dateRange}
              onChange={handleDateRangeChange}
              className="w-full sm:w-44 appearance-none bg-white border border-gray-200 rounded-lg pl-4 pr-10 py-2.5 text-sm text-gray-700 font-medium shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#8CC63F] cursor-pointer transition"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="all">All Time</option>
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          
          {/* Export Button */}
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
        {/* Total Users */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="text-gray-500 text-[10px] sm:text-xs font-semibold mb-2 sm:mb-3 uppercase tracking-wide truncate">Total Users</div>
          <div>
            <div className="text-base sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 truncate">{stats.users.value.toLocaleString()}</div>
            <div className={`flex items-center text-[10px] sm:text-[11px] font-bold w-fit px-1.5 py-0.5 rounded ${stats.users.change.startsWith('-') ? 'text-amber-700 bg-amber-50' : 'text-emerald-600 bg-emerald-50'}`}>
              {stats.users.change.startsWith('-') ? (
                <ArrowDownRight size={10} strokeWidth={3} className="mr-0.5 sm:w-3 sm:h-3" />
              ) : (
                <ArrowUpRight size={10} strokeWidth={3} className="mr-0.5 sm:w-3 sm:h-3" />
              )}
              {stats.users.change}
            </div>
          </div>
        </div>

        {/* Total Energy */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="text-gray-500 text-[10px] sm:text-xs font-semibold mb-2 sm:mb-3 uppercase tracking-wide truncate">Total Energy</div>
          <div>
            <div className="text-base sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 flex items-baseline gap-1 truncate">
              {stats.energy.value.toLocaleString()} <span className="text-[10px] sm:text-sm font-semibold text-gray-500">kWh</span>
            </div>
            <div className={`flex items-center text-[10px] sm:text-[11px] font-bold w-fit px-1.5 py-0.5 rounded ${stats.energy.change.startsWith('-') ? 'text-amber-700 bg-amber-50' : 'text-emerald-600 bg-emerald-50'}`}>
              {stats.energy.change.startsWith('-') ? (
                <ArrowDownRight size={10} strokeWidth={3} className="mr-0.5 sm:w-3 sm:h-3" />
              ) : (
                <ArrowUpRight size={10} strokeWidth={3} className="mr-0.5 sm:w-3 sm:h-3" />
              )}
              {stats.energy.change}
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="text-gray-500 text-[10px] sm:text-xs font-semibold mb-2 sm:mb-3 uppercase tracking-wide truncate">Total Revenue</div>
          <div>
            <div className="text-base sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 truncate">
              {formatCurrency(stats.revenue.value)}
            </div>
            <div className={`flex items-center text-[10px] sm:text-[11px] font-bold w-fit px-1.5 py-0.5 rounded ${stats.revenue.change.startsWith('-') ? 'text-amber-700 bg-amber-50' : 'text-emerald-600 bg-emerald-50'}`}>
              {stats.revenue.change.startsWith('-') ? (
                <ArrowDownRight size={10} strokeWidth={3} className="mr-0.5 sm:w-3 sm:h-3" />
              ) : (
                <ArrowUpRight size={10} strokeWidth={3} className="mr-0.5 sm:w-3 sm:h-3" />
              )}
              {stats.revenue.change}
            </div>
          </div>
        </div>

        {/* Total Sessions */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="text-gray-500 text-[10px] sm:text-xs font-semibold mb-2 sm:mb-3 uppercase tracking-wide truncate">Total Sessions</div>
          <div>
            <div className="text-base sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 truncate">{stats.sessions.value.toLocaleString()}</div>
            <div className={`flex items-center text-[10px] sm:text-[11px] font-bold w-fit px-1.5 py-0.5 rounded ${stats.sessions.change.startsWith('-') ? 'text-amber-700 bg-amber-50' : 'text-emerald-600 bg-emerald-50'}`}>
              {stats.sessions.change.startsWith('-') ? (
                <ArrowDownRight size={10} strokeWidth={3} className="mr-0.5 sm:w-3 sm:h-3" />
              ) : (
                <ArrowUpRight size={10} strokeWidth={3} className="mr-0.5 sm:w-3 sm:h-3" />
              )}
              {stats.sessions.change}
            </div>
          </div>
        </div>
      </div>

      {/* Middle Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        
        {/* Energy Consumption Bar Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-5 md:p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Energy Consumption (kWh)</h3>
              <p className="text-xs text-gray-400 mt-0.5">Energy dispensed across sessions</p>
            </div>
            <span className="text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
              {rangeLabelMap[dateRange] || 'Last 30 Days'}
            </span>
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
                  minTickGap={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#9ca3af' }} 
                  tickFormatter={(val) => val === 0 ? '0' : val >= 1000 ? `${(val / 1000).toFixed(1)}K` : val} 
                />
                <Tooltip 
                  cursor={{ fill: '#f3f4f6' }} 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(val) => [`${val.toLocaleString()} kWh`, 'Energy']}
                />
                <Bar dataKey="value" fill="#8CC63F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Trend Line Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-5 md:p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Revenue Trend (₹)</h3>
              <p className="text-xs text-gray-400 mt-0.5">Booking charging revenue</p>
            </div>
            <span className="text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
              {rangeLabelMap[dateRange] || 'Last 30 Days'}
            </span>
          </div>
          
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8CC63F" stopOpacity={0.2}/>
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
                  minTickGap={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#9ca3af' }} 
                  tickFormatter={(val) => val === 0 ? '0' : val >= 100000 ? `${(val / 100000).toFixed(1)}L` : val >= 1000 ? `${(val / 1000).toFixed(0)}K` : val} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                  formatter={(val) => [`₹${val.toLocaleString()}`, 'Revenue']}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8CC63F" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  dot={{ r: 3, fill: '#8CC63F', strokeWidth: 0 }} 
                  activeDot={{ r: 5, fill: '#8CC63F', stroke: '#fff', strokeWidth: 2 }} 
                />
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
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Top Performing Stations</h3>
              <p className="text-xs text-gray-400 mt-0.5">Ranked by revenue and session volume</p>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
              {selectedCity === 'All' ? (selectedState === 'All States' ? 'All Locations' : selectedState) : selectedCity}
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Station Name</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">City</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sessions</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Energy (kWh)</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Revenue (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {topStations.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-sm font-medium text-gray-500">
                      No charging activity found for {selectedCity === 'All' ? selectedState : selectedCity} in {rangeLabelMap[dateRange]}.
                    </td>
                  </tr>
                ) : (
                  topStations.map((station, idx) => (
                    <tr key={station.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-emerald-600">
                        {idx + 1}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-800 text-sm whitespace-nowrap">
                        {station.name}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-600 whitespace-nowrap">
                        {station.location}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-500 whitespace-nowrap">
                        {station.city}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-700">
                        {station.sessions.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-700">
                        {station.energy.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">
                        ₹{station.revenue.toLocaleString()}
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
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Top Connector Types</h3>
            <p className="text-xs text-gray-400 mt-0.5">Market share by connector utilization</p>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="flex flex-col sm:flex-row items-center w-full justify-center gap-8">
              
              <div className="h-[160px] w-[160px] relative flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={connectorData}
                      innerRadius={48}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {connectorData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      formatter={(val) => [`${val}%`, 'Share']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend side by side */}
              <div className="flex flex-col gap-3 w-full sm:w-auto min-w-[200px]">
                {connectorData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">{item.name}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900 ml-auto pl-4">{item.value}%</span>
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
