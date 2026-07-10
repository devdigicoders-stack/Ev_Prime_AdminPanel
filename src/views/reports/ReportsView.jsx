import React, { useState } from 'react';
import { Download, Info, Users, MapPin, CreditCard, DollarSign, Zap, RotateCcw, Users2, Building2, Leaf, Brain, Landmark, FilePlus2, Loader2, Calendar, X, Eye } from 'lucide-react';

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
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [generatingId, setGeneratingId] = useState(null);

  // Preview Modal State
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [previewFilename, setPreviewFilename] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

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
      alert("Error generating report: " + error.message);
    } finally {
      setGeneratingId(null);
    }
  };

  const handleDownloadCsv = () => {
    if (previewData.length === 0) return;
    
    const headers = Object.keys(previewData[0]);
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.join(','));
    
    // Add rows
    for (const row of previewData) {
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
    link.setAttribute('download', previewFilename);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  };

  const handleExportAll = async () => {
    alert("Please generate reports individually using the cards below.");
  };

  return (
    <div className="flex flex-col h-full space-y-6 pb-6 relative">
      {/* Header Area */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Reports</h1>
          <p className="text-gray-500 text-sm font-medium">Preview and download data reports</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto justify-end">
          
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-[#8CC63F] focus-within:border-transparent transition-all w-full sm:w-auto">
            <Calendar size={16} className="text-gray-400 flex-shrink-0" />
            <input 
              type="date" 
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="text-sm text-gray-600 font-medium focus:outline-none w-full bg-transparent"
            />
            <span className="text-gray-300 font-medium px-1">to</span>
            <input 
              type="date" 
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="text-sm text-gray-600 font-medium focus:outline-none w-full bg-transparent"
            />
          </div>

          <button onClick={handleExportAll} className="w-full sm:w-auto bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm">
            <Download size={16} /> Export All
          </button>
        </div>
      </div>

      {/* Reports Grid */}
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
              className="text-emerald-600 font-semibold text-sm bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 disabled:hover:bg-emerald-50 flex items-center justify-center gap-2 py-2 px-6 rounded-lg w-full transition-colors mt-auto"
            >
              {generatingId === report.id ? <><Loader2 size={16} className="animate-spin" /> Fetching...</> : <><Eye size={16}/> Preview</>}
            </button>
          </div>
        ))}
      </div>

      {/* Bottom Info Note */}
      <div className="bg-emerald-50 rounded-xl p-4 flex items-start sm:items-center gap-3 border border-emerald-100 mt-2">
        <div className="text-emerald-600 mt-0.5 sm:mt-0 flex-shrink-0">
          <Info size={20} strokeWidth={2.5} />
        </div>
        <p className="text-sm font-medium text-emerald-800">
          <span className="font-semibold">Note:</span> You can now preview all reports in table format before downloading them as CSV.
        </p>
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
                   {previewData.length} records found {startDate ? `between ${startDate} and ${endDate}` : 'all-time'}
                 </p>
              </div>
              <button type="button" onClick={() => setIsPreviewModalOpen(false)} className="text-gray-400 hover:bg-gray-200 hover:text-gray-600 p-1.5 rounded-lg transition-colors"><X size={20} /></button>
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
                             {val}
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
               <button type="button" onClick={() => setIsPreviewModalOpen(false)} className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-200 bg-white border border-gray-200 rounded-lg transition-colors shadow-sm">
                 Close Preview
               </button>
               <button type="button" onClick={handleDownloadCsv} disabled={previewData.length === 0} className="bg-[#8CC63F] hover:bg-[#116631] text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 shadow-sm">
                 <Download size={16} /> Download CSV
               </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ReportsView;
