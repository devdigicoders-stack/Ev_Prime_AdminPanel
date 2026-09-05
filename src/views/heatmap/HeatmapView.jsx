import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, Filter, Loader2, Download, RefreshCw } from 'lucide-react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Circle } from '@react-google-maps/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const getIntensityColor = (intensity) => {
  return intensity === 'high' ? '#EF4444' : (intensity === 'medium' ? '#F59E0B' : '#22C55E');
};

const HeatmapView = () => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY
  });

  const [mapCenter, setMapCenter]         = useState({ lat: 22.5937, lng: 78.9629 });
  const [mapZoom, setMapZoom]             = useState(5);
  const [data, setData]                   = useState(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [activeMarker, setActiveMarker]   = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Filter States
  const [selectedCity,      setSelectedCity]      = useState('all');
  const [selectedIntensity, setSelectedIntensity] = useState('all');
  const [filteredLocations, setFilteredLocations] = useState([]);

  const fetchHeatmapData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/heatmap`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch heatmap data');
      const result = await response.json();
      setData(result);
      setFilteredLocations(result.mapLocations || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHeatmapData(); }, [fetchHeatmapData]);

  // Apply filter whenever dropdowns change & pan map to city
  useEffect(() => {
    if (!data) return;
    let result = [...data.mapLocations];
    if (selectedCity !== 'all')      result = result.filter(loc => loc.city === selectedCity);
    if (selectedIntensity !== 'all') result = result.filter(loc => loc.intensity === selectedIntensity);
    setFilteredLocations(result);
    setActiveMarker(null);

    // Pan map to selected city if stations exist
    if (selectedCity !== 'all' && result.length > 0) {
      const avgLat = result.reduce((sum, r) => sum + r.pos[0], 0) / result.length;
      const avgLng = result.reduce((sum, r) => sum + r.pos[1], 0) / result.length;
      setMapCenter({ lat: avgLat, lng: avgLng });
      setMapZoom(11);
    } else {
      setMapCenter({ lat: 22.5937, lng: 78.9629 });
      setMapZoom(5);
    }
  }, [selectedCity, selectedIntensity, data]);

  // Generate Detailed Report — CSV download with full station data
  const handleGenerateReport = async () => {
    if (!data) return;
    setReportLoading(true);
    try {
      const rows = [
        ['Station Name', 'City', 'Intensity', 'Latitude', 'Longitude', 'Status'],
        ...filteredLocations.map(loc => [
          `"${loc.name}"`,
          loc.city || '',
          loc.intensity,
          loc.pos[0],
          loc.pos[1],
          loc.status || ''
        ])
      ];

      // Summary section
      const summary = [
        [],
        ['=== NETWORK SUMMARY ==='],
        [`Total Stations,${data.stats.total}`],
        [`Active Stations,${data.stats.active}`],
        [`Under Maintenance,${data.stats.maintenance}`],
        [`Inactive Stations,${data.stats.inactive}`],
        [`Report Generated,${new Date().toLocaleString('en-IN')}`],
        [`Filter Applied - City,${selectedCity === 'all' ? 'All Cities' : selectedCity}`],
        [`Filter Applied - Intensity,${selectedIntensity === 'all' ? 'All' : selectedIntensity}`],
      ];

      const csvContent = [
        ...rows.map(r => r.join(',')),
        ...summary.map(r => r.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ev_heatmap_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setReportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <Loader2 className="animate-spin text-[#8CC63F]" size={48} />
        <p className="text-gray-500 font-medium">Scanning Network Activity & Heat Nodes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <p className="text-red-500 font-medium">{error}</p>
        <button onClick={fetchHeatmapData} className="flex items-center gap-2 text-sm text-[#8CC63F] font-semibold">
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { stats } = data;
  const uniqueCities = [...new Set(data.mapLocations.map(loc => loc.city))].filter(Boolean).sort();

  return (
    <div className="flex flex-col h-full space-y-6 pb-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">EV Heat Map</h1>
        <p className="text-gray-500 text-sm font-medium">Real-time EV station and usage heat map</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center w-full">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {/* City Filter */}
          <div className="relative">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full appearance-none bg-white border border-gray-200 rounded-lg pl-4 pr-10 py-2.5 text-sm text-gray-600 font-medium shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#8CC63F] cursor-pointer transition"
            >
              <option value="all">All Cities</option>
              {uniqueCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Intensity Filter */}
          <div className="relative">
            <select
              value={selectedIntensity}
              onChange={(e) => setSelectedIntensity(e.target.value)}
              className="w-full appearance-none bg-white border border-gray-200 rounded-lg pl-4 pr-10 py-2.5 text-sm text-gray-600 font-medium shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#8CC63F] cursor-pointer transition"
            >
              <option value="all">All Usage Intensities</option>
              <option value="high">High Usage</option>
              <option value="medium">Medium Usage</option>
              <option value="low">Low Usage</option>
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Filter Button — resets filters */}
        <button
          onClick={() => { setSelectedCity('all'); setSelectedIntensity('all'); }}
          className="bg-[#8CC63F] hover:bg-[#7ab535] text-white px-8 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm w-full md:w-auto"
        >
          <Filter size={16} strokeWidth={2.5} /> Reset Filter
        </button>
      </div>

      {/* Filtered count badge */}
      <div className="flex items-center gap-2 -mt-2">
        <span className="text-xs font-semibold text-gray-400">
          Showing <span className="text-[#8CC63F]">{filteredLocations.length}</span> of {data.mapLocations.length} stations
          {selectedCity !== 'all' && ` · ${selectedCity}`}
          {selectedIntensity !== 'all' && ` · ${selectedIntensity} intensity`}
        </span>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-6 lg:h-[600px]">

        {/* Map */}
        <div className="flex-1 w-full min-h-[400px] lg:min-h-[600px] bg-white rounded-2xl border border-gray-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden relative z-10">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={mapCenter}
              zoom={mapZoom}
              options={{ disableDefaultUI: true, zoomControl: true }}
              onClick={() => setActiveMarker(null)}
            >
              {filteredLocations.map(loc => (
                <React.Fragment key={loc.id}>
                  <Circle
                    center={{ lat: loc.pos[0], lng: loc.pos[1] }}
                    radius={30000}
                    options={{
                      fillColor: getIntensityColor(loc.intensity),
                      fillOpacity: 0.3,
                      strokeWeight: 0,
                    }}
                  />
                  <Marker
                    position={{ lat: loc.pos[0], lng: loc.pos[1] }}
                    onClick={() => setActiveMarker(loc)}
                  />
                </React.Fragment>
              ))}

              {activeMarker && (
                <InfoWindow
                  position={{ lat: activeMarker.pos[0], lng: activeMarker.pos[1] }}
                  onCloseClick={() => setActiveMarker(null)}
                >
                  <div className="font-sans px-1">
                    <h4 className="font-bold text-gray-900 text-sm m-0 mb-1">{activeMarker.name}</h4>
                    <p className="text-xs text-gray-600 m-0 mb-2">{activeMarker.city}</p>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${activeMarker.intensity === 'high' ? 'bg-red-500' : activeMarker.intensity === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                      <p className="text-xs text-gray-600 m-0 capitalize">{activeMarker.intensity} Usage Node</p>
                    </div>
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

        {/* Right Sidebar */}
        <div className="w-full lg:w-80 flex flex-col gap-6 z-0">

          {/* Legend */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Usage Heat Legend</h3>
            <div className="w-full h-3 rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 mb-2 shadow-inner"></div>
            <div className="flex justify-between items-center text-xs font-bold text-gray-500">
              <span className="text-emerald-600">Low</span>
              <span className="text-amber-500">Medium</span>
              <span className="text-red-500">High Usage</span>
            </div>
          </div>

          {/* Network Overview */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-6 flex flex-col flex-1">
            <h3 className="text-sm font-semibold text-gray-900 mb-6">Network Overview</h3>

            <div className="space-y-5 flex-1">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-600">Total Stations</span>
                <span className="text-base font-bold text-gray-900">{stats.total}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-600">Active Stations</span>
                <span className="text-base font-bold text-emerald-600">{stats.active}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-600">Under Maintenance</span>
                <span className="text-base font-bold text-amber-500">{stats.maintenance}</span>
              </div>
              <div className="flex justify-between items-center pb-4">
                <span className="text-sm font-semibold text-gray-600">Inactive Stations</span>
                <span className="text-base font-bold text-red-500">{stats.inactive}</span>
              </div>
              {/* Filtered count */}
              {(selectedCity !== 'all' || selectedIntensity !== 'all') && (
                <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-200">
                  <span className="text-sm font-semibold text-gray-600">Filtered Result</span>
                  <span className="text-base font-bold text-[#8CC63F]">{filteredLocations.length}</span>
                </div>
              )}
            </div>

            <button
              onClick={handleGenerateReport}
              disabled={reportLoading || filteredLocations.length === 0}
              className="w-full mt-6 bg-[#8CC63F] hover:bg-[#7ab535] disabled:opacity-50 text-white py-3 rounded-xl text-sm font-semibold transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              {reportLoading
                ? <><Loader2 size={16} className="animate-spin" /> Generating...</>
                : <><Download size={16} /> Generate Detailed Report</>
              }
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default HeatmapView;
