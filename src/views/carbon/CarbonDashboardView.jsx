import React, { useState, useEffect } from 'react';
import { ChevronDown, Download, ArrowUpRight, Leaf, TreePine, Droplets, Zap, Loader2 } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const StatCard = ({ title, value, unit, growth, icon: Icon }) => (
  <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-100 transition-all group overflow-hidden relative flex justify-between items-center">
    <div className="flex flex-col z-10 min-w-0">
      <span className="text-gray-500 text-[10px] sm:text-xs font-semibold uppercase tracking-wide mb-1 sm:mb-1.5 truncate block">{title}</span>
      <div className="flex items-baseline gap-1">
        <span className="text-base sm:text-xl font-bold text-gray-900 truncate block">{value}</span>
        {unit && <span className="text-[10px] sm:text-xs font-semibold text-gray-500">{unit}</span>}
      </div>
      {growth && (
        <div className="flex items-center text-emerald-600 text-[10px] sm:text-[11px] font-bold mt-1 bg-emerald-50 w-fit px-1 sm:px-1.5 py-0.5 rounded">
          <ArrowUpRight size={10} strokeWidth={3} className="mr-0.5 sm:w-3 sm:h-3" /> {growth}
        </div>
      )}
    </div>
    <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors z-10 shrink-0 ml-2">
      <Icon size={16} strokeWidth={2} className="sm:w-[22px] sm:h-[22px]" />
    </div>
    <div className="absolute -right-4 -top-4 w-16 h-16 sm:w-20 sm:h-20 bg-emerald-50/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity blur-xl"></div>
  </div>
);

const CarbonDashboardView = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    const fetchCarbonData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`${API_BASE_URL}/carbon?range=${timeRange}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch carbon data');
        
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCarbonData();
  }, [timeRange]);

  const handleExport = () => {
    if (!data || !data.trendData) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,CO2 Saved (kg)\n";
    
    data.trendData.forEach(row => {
      csvContent += `${row.name},${row.value}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bharat_ev_carbon_impact_${timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <Loader2 className="animate-spin text-[#8CC63F]" size={48} />
        <p className="text-gray-500 font-medium">Calculating Environmental Impact...</p>
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

  const { stats, trendData, cityData } = data;

  return (
    <div className="flex flex-col h-full space-y-6 pb-6">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Carbon Dashboard</h1>
          <p className="text-gray-500 text-sm font-medium">Track and monitor carbon impact</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="appearance-none bg-white border border-gray-200 rounded-lg pl-4 pr-10 py-2.5 text-sm text-gray-600 font-medium shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#8CC63F] cursor-pointer transition"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 3 Months</option>
              <option value="all">All Time</option>
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          
          <button 
            onClick={handleExport}
            className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm"
          >
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <StatCard title="Total CO₂ Saved" value={stats.co2Saved} unit="Tons" growth="+16.4%" icon={Leaf} />
        <StatCard title="Trees Equivalent" value={stats.treesEquivalent} growth="+15.2%" icon={TreePine} />
        <StatCard title="Total Fuel Saved" value={stats.fuelSaved} unit="Liters" growth="+14.4%" icon={Droplets} />
        <StatCard title="Emission Avoided" value={stats.co2AvoidedKg} unit="kg" growth="+17.3%" icon={Leaf} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        
        {/* Trend Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-5 md:p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">CO₂ Saved Trend</h3>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600 font-medium">
              Dynamic Projection
            </div>
          </div>
          
          <div className="h-[280px] w-full flex-grow">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
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
                  minTickGap={20}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(val) => val === 0 ? '0' : `${val / 1000}K`} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="value" stroke="#8CC63F" strokeWidth={2.5} fillOpacity={1} fill="url(#colorValue)" dot={{ r: 4, fill: '#8CC63F', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#8CC63F', stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* City Donut Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-5 md:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Carbon Contribution by City</h3>
          <div className="flex flex-col items-center">
            <div className="h-[180px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={cityData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {cityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs text-gray-500 font-semibold mb-0.5">Total</span>
                <span className="text-sm font-semibold text-gray-900">{stats.co2Saved}</span>
                <span className="text-[10px] text-gray-500 font-semibold">Tons</span>
              </div>
            </div>
            
            {/* Custom Legend Layout */}
            <div className="w-full mt-6 grid grid-cols-2 gap-x-2 gap-y-3 px-2">
              {cityData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></div>
                    <span className="text-xs font-semibold text-gray-800 truncate">{item.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-900">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Environmental Impact Row */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Environmental Impact</h3>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-5 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
            
            <div className="flex items-center gap-4 lg:justify-center pt-4 sm:pt-0">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <Leaf size={20} />
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-500 mb-1">CO₂ Saved</div>
                <div className="text-lg font-semibold text-gray-900 flex items-baseline gap-1">{stats.co2Saved} <span className="text-xs font-semibold text-gray-700">Tons</span></div>
              </div>
            </div>

            <div className="flex items-center gap-4 lg:justify-center pt-4 sm:pt-0">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <TreePine size={20} />
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-500 mb-1">Trees Equivalent</div>
                <div className="text-lg font-semibold text-gray-900">{stats.treesEquivalent}</div>
              </div>
            </div>

            <div className="flex items-center gap-4 lg:justify-center pt-4 sm:pt-0">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <Droplets size={20} />
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-500 mb-1">Fuel Saved</div>
                <div className="text-lg font-semibold text-gray-900 flex items-baseline gap-1">{stats.fuelSaved} <span className="text-xs font-semibold text-gray-700">L</span></div>
              </div>
            </div>

            <div className="flex items-center gap-4 lg:justify-center pt-4 sm:pt-0">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <Zap size={20} />
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-500 mb-1">Energy Generated</div>
                <div className="text-lg font-semibold text-gray-900 flex items-baseline gap-1">{stats.energyGenerated} <span className="text-xs font-semibold text-gray-700">kWh</span></div>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
};

export default CarbonDashboardView;
