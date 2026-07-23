import React, { useState, useEffect, useCallback } from 'react';
import { Download, Info, Users, MapPin, CreditCard, DollarSign, Zap, RotateCcw, Users2, Building2, Leaf, Brain, Landmark, FilePlus2, Loader2, Calendar, X, Eye, FileText, TrendingUp, Award, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const reportTypes = [
  { id: 1, type: 'User', title: 'User Report', desc: 'Total users and growth', icon: Users },
  { id: 2, type: 'Station', title: 'Station Report', desc: 'Station performance report', icon: MapPin },
  { id: 3, type: 'Transaction', title: 'Transaction Report', desc: 'All transactions report', icon: CreditCard },
  { id: 4, type: 'Revenue', title: 'Revenue Report', desc: 'Revenue and earnings', icon: DollarSign },
  { id: 5, type: 'Energy', title: 'Energy Report', desc: 'Energy consumption report', icon: Zap },
  { id: 6, type: 'Refund', title: 'Refund Report', desc: 'Refunds and disputes', icon: RotateCcw },
  { id: 7, type: 'Partner', title: 'Partner Report', desc: 'Partner performance', icon: Users2 },
  { id: 8, type: 'City', title: 'City Report', desc: 'City-wise analytics', icon: Building2 },
  { id: 9, type: 'Carbon', title: 'Carbon Report', desc: 'Carbon savings report', icon: Leaf },
  { id: 10, type: 'Ticket', title: 'Support Tickets', desc: 'Help & support tickets', icon: FilePlus2 },
  { id: 11, type: 'Government', title: 'Government Report', desc: 'Government overview', icon: Landmark },
  { id: 12, type: 'AI Insights', title: 'AI Insights Report', desc: 'AI analytics & insights', icon: Brain },
];

const ReportsView = () => {
  const [periodFilter, setPeriodFilter] = useState('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [generatingId, setGeneratingId] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Preview Modal State
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [previewFilename, setPreviewFilename] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  const fetchAnalyticsReport = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      let url = `${API_BASE_URL}/reports/analytics?period=${periodFilter}`;
      if (startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch analytics summary');
      const data = await res.json();
      setAnalyticsData(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [periodFilter, startDate, endDate]);

  useEffect(() => {
    fetchAnalyticsReport();
  }, [fetchAnalyticsReport]);

  const handleGenerateReport = async (reportType, reportId, title) => {
    setGeneratingId(reportId);
    try {
      const token = localStorage.getItem('adminToken');
      let url = `${API_BASE_URL}/reports/generate?type=${reportType}`;
      if (startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const resData = await response.json();
      
      setPreviewData(resData.data);
      setPreviewFilename(resData.filename);
      setPreviewTitle(title);
      setIsPreviewModalOpen(true);

    } catch (error) {
      toast.error("Error generating report: " + error.message);
    } finally {
      setGeneratingId(null);
    }
  };

  const handleDownloadCsv = (dataToExport = previewData, filename = previewFilename || 'report.csv') => {
    if (!dataToExport || dataToExport.length === 0) {
      toast.error("No data available to export");
      return;
    }
    
    const headers = Object.keys(dataToExport[0]);
    const csvRows = [];
    csvRows.push(headers.join(','));
    
    for (const row of dataToExport) {
      const values = headers.map(field => {
        const val = row[field];
        let stringVal = val === null || val === undefined ? '' : String(val);
        stringVal = stringVal.replace(/"/g, '""');
        if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
          stringVal = `"${stringVal}"`;
        }
        return stringVal;
      });
      csvRows.push(values.join(','));
    }
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
    toast.success("Excel / CSV report downloaded!");
  };

  const handleDownloadPdf = (title = previewTitle || 'Analytics Report', dataList = previewData) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to download PDF report');
      return;
    }

    const headers = dataList && dataList.length > 0 ? Object.keys(dataList[0]) : [];

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title} - Bharat EV Prime</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #111; }
          .header { text-align: center; border-bottom: 2px solid #8CC63F; padding-bottom: 10px; margin-bottom: 20px; }
          .header h1 { margin: 0; color: #116631; }
          .header p { margin: 5px 0; color: #666; font-size: 13px; }
          .stats { display: flex; justify-content: space-around; margin-bottom: 20px; background: #f9f9f9; padding: 15px; border-radius: 8px; }
          .stat-box { text-align: center; }
          .stat-box h3 { margin: 0; font-size: 18px; color: #8CC63F; }
          .stat-box p { margin: 2px 0 0 0; font-size: 12px; color: #555; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; color: #333; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #888; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Bharat EV Prime - ${title}</h1>
          <p>Generated on: ${new Date().toLocaleString()} | Period Filter: ${periodFilter.toUpperCase()}</p>
        </div>

        ${analyticsData?.summary ? `
          <div class="stats">
            <div class="stat-box">
              <h3>₹${analyticsData.summary.totalRevenue.toLocaleString('en-IN')}</h3>
              <p>Total Revenue</p>
            </div>
            <div class="stat-box">
              <h3>${analyticsData.summary.totalSessions}</h3>
              <p>Total Sessions</p>
            </div>
            <div class="stat-box">
              <h3>${analyticsData.summary.totalEnergy} kWh</h3>
              <p>Energy Consumed</p>
            </div>
            <div class="stat-box">
              <h3>${analyticsData.summary.carbonSaved} kg</h3>
              <p>CO₂ Saved</p>
            </div>
          </div>
        ` : ''}

        ${dataList && dataList.length > 0 ? `
          <table>
            <thead>
              <tr>${headers.map(h => `<th>${h.replace(/_/g, ' ')}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${dataList.map(row => `
                <tr>${headers.map(h => `<td>${row[h] !== undefined && row[h] !== null ? row[h] : ''}</td>`).join('')}</tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<p style="text-align:center;">No transaction records found for this report.</p>'}

        <div class="footer">
          Confidential - Generated by Bharat EV Prime Management System
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const summary = analyticsData?.summary || {};
  const mostUsedStations = analyticsData?.mostUsedStations || [];

  return (
    <div className="flex flex-col h-full space-y-6 pb-6 relative">
      {/* Header Area */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Reports & Analytics</h1>
          <p className="text-gray-500 text-sm font-medium">Daily, Weekly & Monthly performance reports and top usage stations</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
          
          {/* Period Filter Buttons */}
          <div className="bg-white border border-gray-200 rounded-xl p-1 flex items-center shadow-sm">
            {[
              { id: 'daily', label: 'Daily (Today)' },
              { id: 'weekly', label: 'Weekly' },
              { id: 'monthly', label: 'Monthly' },
              { id: 'all', label: 'All Time' },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => { setPeriodFilter(p.id); setStartDate(''); setEndDate(''); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  periodFilter === p.id ? 'bg-[#8CC63F] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-[#8CC63F] transition-all">
            <Calendar size={16} className="text-gray-400 flex-shrink-0" />
            <input 
              type="date" 
              value={startDate}
              onChange={e => { setStartDate(e.target.value); setPeriodFilter('custom'); }}
              className="text-xs text-gray-600 font-medium focus:outline-none bg-transparent"
            />
            <span className="text-gray-300 font-medium px-1">to</span>
            <input 
              type="date" 
              value={endDate}
              onChange={e => { setEndDate(e.target.value); setPeriodFilter('custom'); }}
              className="text-xs text-gray-600 font-medium focus:outline-none bg-transparent"
            />
          </div>

          <button 
            onClick={() => handleDownloadCsv(analyticsData?.data || [], `Bharat_EV_Report_${periodFilter}.csv`)} 
            className="bg-[#8CC63F] hover:bg-[#7bb532] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-sm"
          >
            <Download size={14} /> Download Excel (CSV)
          </button>

          <button 
            onClick={() => handleDownloadPdf(`Analytics Report (${periodFilter.toUpperCase()})`, analyticsData?.data || [])} 
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-sm"
          >
            <FileText size={14} /> Download PDF
          </button>
        </div>
      </div>

      {/* Summary KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Revenue</p>
            <p className="text-2xl font-black text-gray-900 mt-1">₹{(summary.totalRevenue || 0).toLocaleString('en-IN')}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            ₹
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Sessions</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{summary.totalSessions || 0}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Zap size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Energy Delivered</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{summary.totalEnergy || 0} kWh</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <TrendingUp size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">CO₂ Saved</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{summary.carbonSaved || 0} kg</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Leaf size={22} />
          </div>
        </div>
      </div>

      {/* Most Used Stations Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="text-[#8CC63F]" size={22} />
            <h2 className="text-lg font-bold text-gray-900">Most Used Charging Stations</h2>
          </div>
          <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
            Top Stations by Booking Volume ({periodFilter})
          </span>
        </div>

        {analyticsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-[#8CC63F]" size={32} />
          </div>
        ) : mostUsedStations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-bold text-gray-400 uppercase bg-gray-50/50">
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Station Name</th>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3">Total Sessions</th>
                  <th className="px-4 py-3">Energy Consumed</th>
                  <th className="px-4 py-3 text-right">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {mostUsedStations.map((st, index) => (
                  <tr key={st.id || index} className="hover:bg-gray-50/50 transition">
                    <td className="px-4 py-3 font-bold text-gray-400">#{index + 1}</td>
                    <td className="px-4 py-3 font-bold text-gray-900">{st.name}</td>
                    <td className="px-4 py-3 text-gray-500 font-medium">{st.city}</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full">
                        {st.totalBookings} Bookings
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-amber-600">{Math.round((st.totalEnergy || 0) * 10) / 10} kWh</td>
                    <td className="px-4 py-3 text-right font-black text-gray-900">₹{(st.totalRevenue || 0).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400 text-sm font-medium">
            No station usage recorded for the selected period.
          </div>
        )}
      </div>

      {/* Report Types Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {reportTypes.map((report) => (
          <div key={report.id} className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-6 flex flex-col items-center text-center group hover:border-[#8CC63F]/30 transition-all hover:shadow-lg cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:bg-[#8CC63F] group-hover:text-white transition-colors">
              <report.icon size={24} strokeWidth={2} />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">{report.title}</h3>
            <p className="text-xs font-medium text-gray-500 mb-6">{report.desc}</p>
            
            <button 
              onClick={() => handleGenerateReport(report.type, report.id, report.title)}
              disabled={generatingId === report.id}
              className="text-emerald-600 font-semibold text-sm bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 disabled:hover:bg-emerald-50 flex items-center justify-center gap-2 py-2 px-6 rounded-lg w-full transition-colors mt-auto cursor-pointer"
            >
              {generatingId === report.id ? <><Loader2 size={16} className="animate-spin" /> Fetching...</> : <><Eye size={16}/> Preview</>}
            </button>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0 bg-gray-50">
              <div>
                 <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                   <Eye size={20} className="text-emerald-600"/> {previewTitle} Preview
                 </h2>
                 <p className="text-sm text-gray-500 font-medium mt-1">
                   {previewData.length} records found {startDate ? `between ${startDate} and ${endDate}` : `(${periodFilter})`}
                 </p>
              </div>
              <button type="button" onClick={() => setIsPreviewModalOpen(false)} className="text-gray-400 hover:bg-gray-200 hover:text-gray-600 p-1.5 rounded-lg transition-colors cursor-pointer"><X size={20} /></button>
            </div>

            {/* Table Area */}
            <div className="p-0 flex-1 overflow-auto bg-white">
               {previewData.length > 0 ? (
                 <table className="w-full text-left border-collapse min-w-max">
                   <thead className="bg-white sticky top-0 shadow-sm z-10">
                     <tr className="border-b border-gray-100 bg-gray-50/80 backdrop-blur-sm">
                       {Object.keys(previewData[0]).map((key, idx) => (
                         <th key={idx} className="px-6 py-4 text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">{key.replace(/_/g, ' ')}</th>
                       ))}
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                     {previewData.map((row, rowIdx) => (
                       <tr key={rowIdx} className="hover:bg-gray-50/50 transition-colors">
                         {Object.values(row).map((val, colIdx) => (
                           <td key={colIdx} className="px-6 py-3 text-sm font-medium text-gray-600 whitespace-nowrap">
                             {val !== undefined && val !== null ? String(val) : ''}
                           </td>
                         ))}
                       </tr>
                     ))}
                   </tbody>
                 </table>
               ) : (
                 <div className="text-center text-gray-400 text-sm py-12 flex flex-col items-center">
                    <Info size={32} className="mb-3 text-gray-300" />
                    No data available for the selected dates.
                 </div>
               )}
            </div>

            {/* Footer Action Area */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3 flex-shrink-0">
               <button type="button" onClick={() => setIsPreviewModalOpen(false)} className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-200 bg-white border border-gray-200 rounded-lg transition-colors shadow-sm cursor-pointer">
                 Close
               </button>
               <button type="button" onClick={() => handleDownloadCsv(previewData, previewFilename)} disabled={previewData.length === 0} className="bg-[#8CC63F] hover:bg-[#7bb532] text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50 shadow-sm cursor-pointer">
                 <Download size={16} /> Export Excel (CSV)
               </button>
               <button type="button" onClick={() => handleDownloadPdf(previewTitle, previewData)} disabled={previewData.length === 0} className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50 shadow-sm cursor-pointer">
                 <FileText size={16} /> Export PDF
               </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ReportsView;
