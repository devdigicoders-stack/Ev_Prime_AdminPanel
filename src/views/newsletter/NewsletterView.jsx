import React, { useState, useEffect } from 'react';
import { 
 Mail, 
 Trash2, 
 Search 
} from 'lucide-react';
import toast from 'react-hot-toast';

const NewsletterView = () => {
 const [subscribers, setSubscribers] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchTerm, setSearchTerm] = useState('');

 const fetchSubscribers = async () => {
 try {
 const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
 const res = await fetch(`${baseUrl}/newsletter`);
 const data = await res.json();
 if (data.success) {
 setSubscribers(data.data);
 }
 } catch (error) {
 toast.error('Failed to fetch subscribers');
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 fetchSubscribers();
 }, []);

 const handleDelete = async (id) => {
 if (!window.confirm('Are you sure you want to delete this subscriber?')) return;
 try {
 const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
 const res = await fetch(`${baseUrl}/newsletter/${id}`, {
 method: 'DELETE'
 });
 const data = await res.json();
 if (data.success) {
 toast.success('Subscriber deleted successfully');
 fetchSubscribers();
 } else {
 toast.error('Failed to delete subscriber');
 }
 } catch (error) {
 toast.error('Network error');
 }
 };

 const filteredSubscribers = subscribers.filter(sub => 
 sub.email.toLowerCase().includes(searchTerm.toLowerCase())
 );

 return (
 <div className="space-y-6">
 {/* Header */}
 <div className="flex justify-between items-center">
 <div>
 <h1 className="text-2xl font-bold text-gray-900 ">Newsletter Subscribers</h1>
 <p className="text-sm text-gray-500 mt-1">
 Manage your newsletter subscription list
 </p>
 </div>
 <div className="flex gap-3">
 <div className="relative">
 <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
 <input
 type="text"
 placeholder="Search emails..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900 "
 />
 </div>
 </div>
 </div>

 {/* Table */}
 <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full">
 <thead className="bg-gray-50 ">
 <tr>
 <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
 Email
 </th>
 <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
 Subscribed At
 </th>
 <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
 Status
 </th>
 <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
 Actions
 </th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100 ">
 {loading ? (
 <tr>
 <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
 Loading subscribers...
 </td>
 </tr>
 ) : filteredSubscribers.length === 0 ? (
 <tr>
 <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
 No subscribers found
 </td>
 </tr>
 ) : (
 filteredSubscribers.map((subscriber) => (
 <tr key={subscriber._id} className="hover:bg-gray-50 transition-colors">
 <td className="px-6 py-4 whitespace-nowrap">
 <div className="flex items-center">
 <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
 <Mail className="h-5 w-5 text-green-600 " />
 </div>
 <div className="ml-4">
 <div className="text-sm font-medium text-gray-900 ">
 {subscriber.email}
 </div>
 </div>
 </div>
 </td>
 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 ">
 {new Date(subscriber.createdAt).toLocaleDateString()}
 </td>
 <td className="px-6 py-4 whitespace-nowrap">
 <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
 subscriber.status === 'active' 
 ? 'bg-green-100 text-green-800 '
 : 'bg-red-100 text-red-800 '
 }`}>
 {subscriber.status}
 </span>
 </td>
 <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
 <button 
 onClick={() => handleDelete(subscriber._id)}
 className="text-red-600 hover:text-red-900 transition-colors p-2 rounded-lg hover:bg-red-50 "
 title="Delete"
 >
 <Trash2 className="w-5 h-5" />
 </button>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 );
};

export default NewsletterView;
