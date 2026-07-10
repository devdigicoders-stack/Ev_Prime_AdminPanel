import React, { useState, useEffect } from 'react';
import { ChevronDown, Download, BrainCircuit, Activity, Cpu, AlertTriangle, ArrowUpRight, Loader2, X } from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Map string icon names from API to actual Lucide components
const iconMap = {
  'Activity': Activity,
  'Cpu': Cpu,
  'BrainCircuit': BrainCircuit,
  'AlertTriangle': AlertTriangle
};

const AnalyticsView = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedRec, setSelectedRec] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`${API_BASE_URL}/analytics?range=${timeRange}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch analytics data');
        
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange]);

  const handleExport = () => {
    if (!data || !data.forecastData) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Actual Demand (kWh),AI Predicted Demand (kWh)\n";
    
    data.forecastData.forEach(row => {
      csvContent += `${row.name},${row.actual},${row.predicted}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bharat_ev_analytics_${timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <Loader2 className="animate-spin text-[#8CC63F]" size={48} />
        <p className="text-gray-500 font-medium">Analyzing Data & Generating Insights...</p>
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

  const { stats, forecastData, insights, recommendations } = data;

  return (
    <div className="flex flex-col h-full space-y-6 pb-6">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">AI Analytics</h1>
          <p className="text-gray-500 text-sm font-medium">AI-powered insights and predictions</p>
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
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="text-gray-500 text-[10px] sm:text-xs font-semibold mb-2 sm:mb-3 uppercase tracking-wide truncate">Prediction Accuracy</div>
          <div>
            <div className="text-base sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">{stats.accuracy}</div>
            <div className="flex items-center text-emerald-600 text-[10px] sm:text-[11px] font-bold bg-emerald-50 w-fit px-1.5 py-0.5 rounded">
              <ArrowUpRight size={10} strokeWidth={3} className="mr-0.5 sm:w-3 sm:h-3" /> {stats.accuracyTrend}
            </div>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="text-gray-500 text-[10px] sm:text-xs font-semibold mb-2 sm:mb-3 uppercase tracking-wide truncate">Demand Forecast</div>
          <div>
            <div className="text-base sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 flex items-baseline gap-1 truncate">{stats.demandForecast} <span className="text-[10px] sm:text-sm font-semibold text-gray-500">kWh</span></div>
            <div className="flex items-center text-emerald-600 text-[10px] sm:text-[11px] font-bold bg-emerald-50 w-fit px-1.5 py-0.5 rounded">
              <ArrowUpRight size={10} strokeWidth={3} className="mr-0.5 sm:w-3 sm:h-3" /> {stats.demandTrend}
            </div>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="text-gray-500 text-[10px] sm:text-xs font-semibold mb-2 sm:mb-3 uppercase tracking-wide truncate">Optimal Stations</div>
          <div>
            <div className="text-base sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">{stats.optimalStations}</div>
            <div className="flex items-center text-emerald-600 text-[10px] sm:text-[11px] font-bold bg-emerald-50 w-fit px-1.5 py-0.5 rounded">
              <ArrowUpRight size={10} strokeWidth={3} className="mr-0.5 sm:w-3 sm:h-3" /> {stats.optimalStationsTrend}
            </div>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="text-gray-500 text-[10px] sm:text-xs font-semibold mb-2 sm:mb-3 uppercase tracking-wide truncate">Predicted Revenue</div>
          <div>
            <div className="text-base sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 truncate">{stats.predictedRevenue}</div>
            <div className="flex items-center text-emerald-600 text-[10px] sm:text-[11px] font-bold bg-emerald-50 w-fit px-1.5 py-0.5 rounded">
              <ArrowUpRight size={10} strokeWidth={3} className="mr-0.5 sm:w-3 sm:h-3" /> {stats.revenueTrend}
            </div>
          </div>
        </div>
      </div>

      {/* Charts & Insights Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        
        {/* Demand Forecast Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-5 md:p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">AI Demand Forecast</h3>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-gray-600"><span className="w-2 h-2 rounded-full bg-[#8CC63F]"></span> Actual</div>
              <div className="flex items-center gap-1.5 text-gray-600"><span className="w-2 h-2 rounded-full bg-emerald-300"></span> AI Predicted</div>
            </div>
          </div>
          
          <div className="h-[280px] w-full flex-grow">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecastData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(val) => val === 0 ? '0' : `${val / 1000}K`} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="actual" stroke="#8CC63F" strokeWidth={2.5} dot={{ r: 4, fill: '#8CC63F', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#8CC63F', stroke: '#fff', strokeWidth: 2 }} />
                <Line type="monotone" dataKey="predicted" stroke="#6ee7b7" strokeWidth={2.5} dot={{ r: 4, fill: '#6ee7b7', strokeWidth: 0 }} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-5 md:p-6 flex flex-col">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">AI Insights</h3>
          
          <div className="space-y-6 flex-grow overflow-y-auto pr-2 no-scrollbar">
            {insights.map((insight, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <BrainCircuit size={14} />
                </div>
                <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <span className="text-sm font-semibold text-gray-700 leading-tight pr-2">{insight.text}</span>
                  <span className="text-xs text-gray-400 font-medium whitespace-nowrap">{insight.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Top AI Recommendations */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top AI Recommendations</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {recommendations.map((rec, idx) => {
            const IconComponent = iconMap[rec.icon] || Activity;
            return (
              <div key={idx} className="bg-white rounded-2xl border border-emerald-50 p-5 shadow-[0_4px_20px_-4px_rgba(16,185,129,0.08)] relative overflow-hidden group hover:shadow-[0_4px_20px_-4px_rgba(16,185,129,0.15)] transition-all">
                
                {/* Decorative faint background shape */}
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-50 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500"></div>

                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#8CC63F] flex items-center justify-center mb-4">
                    <IconComponent size={20} />
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">{rec.title}</h4>
                  <p className="text-xs font-medium text-gray-500 mb-4 leading-relaxed h-8 line-clamp-2">
                    {rec.desc}
                  </p>
                  <button 
                    onClick={() => setSelectedRec(rec)}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors mt-auto relative z-20"
                  >
                    View Details <ArrowUpRight size={14} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Details Modal */}
      {selectedRec && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-[#8CC63F] flex items-center justify-center">
                  {React.createElement(iconMap[selectedRec.icon] || Activity, { size: 24 })}
                </div>
                <button 
                  onClick={() => setSelectedRec(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedRec.title}</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                {selectedRec.desc}. This AI recommendation is generated based on recent network data analysis to improve overall efficiency and user satisfaction.
              </p>
              
              <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Expected Impact</h4>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Revenue Growth</span>
                  <span className="text-sm font-bold text-emerald-600">+8.5%</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Operational Cost</span>
                  <span className="text-sm font-bold text-emerald-600">-4.2%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Implementation Time</span>
                  <span className="text-sm font-bold text-gray-900">Immediate</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setSelectedRec(null)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button 
                  onClick={() => {
                    setSelectedRec(null);
                    toast.success('Action applied successfully!');
                  }}
                  className="flex-1 px-4 py-2.5 bg-[#8CC63F] hover:bg-[#7ab036] text-white font-semibold rounded-xl transition-colors shadow-sm"
                >
                  Apply Action
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsView;
