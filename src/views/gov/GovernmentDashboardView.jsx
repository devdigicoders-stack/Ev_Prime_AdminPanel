import { useState, useEffect } from 'react';
import { ChevronDown, ArrowUpRight, Map as MapIcon, Bell, ShieldCheck, Loader2 } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell
} from 'recharts';

import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const getCustomIconColor = (status) => {
  return status === 'Active' ? '#8CC63F' : (status === 'Maintenance' ? '#F59E0B' : '#EF4444');
};

const mapLegend = [
  { label: 'Active Station', color: '#8CC63F' },
  { label: 'Maintenance', color: '#F59E0B' },
  { label: 'Offline', color: '#EF4444' }
];

const StatCard = ({ title, value, subValue, growth, icon: Icon, isTextIcon }) => (
  <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-100 transition-all group overflow-hidden relative flex justify-between items-center">
    <div className="flex flex-col z-10 min-w-0">
      <span className="text-gray-500 text-[10px] sm:text-xs font-semibold uppercase tracking-wide mb-1 sm:mb-1.5 truncate block">{title}</span>
      <div className="flex items-baseline gap-1">
        <span className="text-base sm:text-xl font-bold text-gray-900 truncate block">{value}</span>
        {subValue && <span className="text-[10px] sm:text-xs font-semibold text-gray-400">{subValue}</span>}
      </div>
      {growth && (
        <div className="flex items-center text-emerald-600 text-[10px] sm:text-[11px] font-bold mt-1 bg-emerald-50 w-fit px-1 sm:px-1.5 py-0.5 rounded">
          <ArrowUpRight size={10} strokeWidth={3} className="mr-0.5 sm:w-3 sm:h-3" /> {growth}
        </div>
      )}
    </div>
    <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors z-10 shrink-0 ml-2">
      {isTextIcon ? (
        <span className="text-lg sm:text-2xl font-light">{Icon}</span>
      ) : (
        <Icon size={16} strokeWidth={2} className="sm:w-[22px] sm:h-[22px]" />
      )}
    </div>
    <div className="absolute -right-4 -top-4 w-16 h-16 sm:w-20 sm:h-20 bg-emerald-50/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity blur-xl"></div>
  </div>
);

const GovernmentDashboardView = () => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY
  });

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeMarker, setActiveMarker] = useState(null);

  useEffect(() => {
    const fetchGovData = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`${API_BASE_URL}/gov`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch government dashboard data');
        
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGovData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <Loader2 className="animate-spin text-[#8CC63F]" size={48} />
        <p className="text-gray-500 font-medium">Loading Government Dashboards & Map Data...</p>
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

  const { stats, revenueData, mapMarkers, compliances, notifications } = data;

  return (
    <div className="flex flex-col h-full space-y-6 pb-6">
      {/* Header Area */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Government Dashboard</h1>
        <p className="text-gray-500 text-sm font-medium">Overview for government and regulatory bodies</p>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <StatCard title="Total Stations" value={stats.totalStations} growth="+12.5%" icon="+" isTextIcon={true} />
        <StatCard title="Active States" value={stats.activeStates} subValue="/ 28" growth="Active Cov" icon={MapIcon} />
        <StatCard title="Total Revenue" value={stats.totalRevenue} growth="+18.6%" icon="₹" isTextIcon={true} />
        <StatCard title="Gov Revenue (5% GST)" value={stats.govRevenue} growth="+18.6%" icon="₹" isTextIcon={true} />
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        
        {/* State-wise Station Distribution Map */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-5 md:p-6 flex flex-col z-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Interactive India Map View</h3>
          <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-8 min-h-[300px]">
            
            {/* Google Map */}
            <div className="flex-1 flex w-full h-[300px] rounded-2xl border border-gray-200 relative overflow-hidden z-0">
              {isLoaded ? (
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%' }}
                  center={{ lat: 22.5937, lng: 78.9629 }}
                  zoom={4}
                  options={{
                    disableDefaultUI: true,
                    zoomControl: true,
                  }}
                  onClick={() => setActiveMarker(null)}
                >
                  {mapMarkers.map(marker => (
                    <Marker
                      key={marker.id}
                      position={{ lat: marker.lat, lng: marker.lng }}
                      icon={{
                        path: window.google?.maps?.SymbolPath?.CIRCLE,
                        fillColor: getCustomIconColor(marker.status),
                        fillOpacity: 1,
                        strokeWeight: 2,
                        strokeColor: '#FFFFFF',
                        scale: 8,
                      }}
                      onClick={() => setActiveMarker(marker)}
                    />
                  ))}
                  
                  {activeMarker && (
                    <InfoWindow
                      position={{ lat: activeMarker.lat, lng: activeMarker.lng }}
                      onCloseClick={() => setActiveMarker(null)}
                    >
                      <div className="font-sans px-1">
                        <h4 className="font-bold text-gray-900 text-sm m-0 mb-1">{activeMarker.name}</h4>
                        <p className="text-xs text-gray-600 m-0 mb-2">{activeMarker.city}</p>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase ${
                          activeMarker.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                          activeMarker.status === 'Maintenance' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {activeMarker.status}
                        </span>
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-50">
                  <Loader2 className="animate-spin text-gray-400" size={32} />
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="flex flex-col gap-4 w-full sm:w-auto">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Status Legend</div>
              {mapLegend.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm border-2 border-white" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">{item.label}</span>
                </div>
              ))}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <span className="text-xl font-bold text-gray-900">{mapMarkers.length}</span>
                <span className="text-sm font-medium text-gray-500 ml-1">Total Mapped</span>
              </div>
            </div>
          </div>
        </div>

        {/* Government Revenue Bar Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-5 md:p-6 flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Gov. Tax Revenue (Weekly)</h3>
              <div className="text-3xl font-semibold text-gray-900 mb-2">{stats.govRevenue}</div>
              <div className="flex items-center text-emerald-600 text-sm font-semibold">
                <ArrowUpRight size={16} strokeWidth={3} className="mr-1" /> Estimated Target
              </div>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600 font-medium cursor-pointer">
              This Month <ChevronDown size={14} className="text-gray-400" />
            </div>
          </div>
          
          <div className="h-[200px] w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#9ca3af' }} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#9ca3af' }} 
                  tickFormatter={(val) => val === 0 ? '0' : `₹${val / 1000}k`} 
                />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [`₹${value.toLocaleString()}`, 'Gov Revenue']}
                />
                <Bar dataKey="value" fill="#8CC63F" radius={[4, 4, 0, 0]}>
                  {revenueData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#8CC63F" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        
        {/* Policy & Compliance */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-5 md:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Policy & Compliance</h3>
          <div className="space-y-6">
            {compliances.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck size={16} strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-700">{item.name}</span>
                    <span className="text-sm font-semibold text-gray-900">{item.value}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div 
                      className="bg-[#8CC63F] h-1.5 rounded-full" 
                      style={{ width: `${item.value}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Government Notifications */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-5 md:p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Government Notifications</h3>
            <button className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
              View All
            </button>
          </div>
          
          <div className="space-y-5 flex-grow">
            {notifications.map((notif, idx) => (
              <div key={idx} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <Bell size={16} strokeWidth={2.5} />
                </div>
                <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pt-1.5">
                  <span className="text-sm font-semibold text-gray-800">{notif.title}</span>
                  <span className="text-xs text-gray-500 font-medium whitespace-nowrap">{notif.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

export default GovernmentDashboardView;
