import { useState, useEffect } from 'react';
import { Search, HelpCircle, BookOpen, Wrench, MessageSquare, Mail, Phone, Plus, Edit2, Trash2, X, Settings, Loader2, CreditCard, Layers } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Mapping icons for categories
const iconMap = {
  'FAQs': HelpCircle,
  'User Guides': BookOpen,
  'Technical Support': Wrench,
  'Billing': CreditCard,
  'Other': Layers
};

const defaultCategories = [
  { id: 1, title: 'FAQs', desc: 'Frequently asked questions', iconName: 'FAQs' },
  { id: 2, title: 'User Guides', desc: 'Manuals and documentation', iconName: 'User Guides' },
  { id: 3, title: 'Technical Support', desc: 'Hardware & software issues', iconName: 'Technical Support' },
  { id: 4, title: 'Billing', desc: 'Payments and invoices', iconName: 'Billing' },
];

const SupportCenterView = () => {
  const [articles, setArticles] = useState([]);
  const [settings, setSettings] = useState({
    email: 'support@bharatev.com',
    phone: '1800-123-4567',
    liveChatUrl: '#',
    timing: 'Mon-Fri from 9am to 6pm'
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  // Form State - Article
  const [editingArticleId, setEditingArticleId] = useState(null);
  const [articleForm, setArticleForm] = useState({ title: '', category: 'FAQs', content: '', status: 'Published', isPopular: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State - Settings
  const [settingsForm, setSettingsForm] = useState({});

  useEffect(() => {
    fetchSupportData();
  }, []);

  const fetchSupportData = async () => {
    setLoading(true);
    try {
      const [articlesRes, settingsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/support/articles`),
        fetch(`${API_BASE_URL}/support/settings`)
      ]);
      
      if (articlesRes.ok) {
        const data = await articlesRes.json();
        setArticles(data);
      }
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setSettings(data);
        setSettingsForm(data);
      }
    } catch (error) {
      console.error("Error fetching support data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleArticleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const token = localStorage.getItem('adminToken');
    const endpoint = editingArticleId ? `${API_BASE_URL}/support/articles/${editingArticleId}` : `${API_BASE_URL}/support/articles`;
    const method = editingArticleId ? 'PUT' : 'POST';

    try {
      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(articleForm)
      });
      if (!res.ok) throw new Error('Failed to save article');
      toast.success(editingArticleId ? 'Article updated successfully' : 'Article created successfully');
      setIsArticleModalOpen(false);
      fetchSupportData();
    } catch (err) {
      toast.error(err.message || 'Failed to save article');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteArticle = async (id) => {
    if (!window.confirm("Are you sure you want to delete this article?")) return;
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`${API_BASE_URL}/support/articles/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete article');
      toast.success('Article deleted successfully');
      fetchSupportData();
    } catch (err) {
      toast.error(err.message || "Failed to delete");
    }
  };

  const openAddArticle = () => {
    setEditingArticleId(null);
    setArticleForm({ title: '', category: 'FAQs', content: '', status: 'Published', isPopular: false });
    setIsArticleModalOpen(true);
  };

  const openEditArticle = (article) => {
    setEditingArticleId(article._id);
    setArticleForm({
      title: article.title,
      category: article.category,
      content: article.content,
      status: article.status,
      isPopular: article.isPopular
    });
    setIsArticleModalOpen(true);
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`${API_BASE_URL}/support/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settingsForm)
      });
      if (!res.ok) throw new Error('Failed to update settings');
      toast.success('Support settings updated');
      setIsSettingsModalOpen(false);
      fetchSupportData();
    } catch (err) {
      toast.error(err.message || 'Failed to update settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredArticles = articles.filter(a => a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.category.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex flex-col h-full space-y-6 pb-6 relative">
      {loading && (
        <div className="absolute inset-0 bg-white/50 z-40 flex items-center justify-center rounded-2xl">
          <Loader2 className="animate-spin text-[#8CC63F]" size={48} />
        </div>
      )}

      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Support Center</h1>
          <p className="text-gray-500 text-sm font-medium">Manage help resources and contact details</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsSettingsModalOpen(true)} className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm whitespace-nowrap">
            <Settings size={18} /> Settings
          </button>
          <button onClick={openAddArticle} className="bg-[#8CC63F] hover:bg-[#116631] text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm whitespace-nowrap">
            <Plus size={18} strokeWidth={2.5} /> Add Article
          </button>
        </div>
      </div>

      {/* Search Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-[#8CC63F] rounded-2xl p-8 md:p-12 text-center shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>
        
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">How can we help you today?</h2>
          <p className="text-emerald-100 text-lg mb-8">Search for articles, tutorials, and troubleshooting guides.</p>
          
          <div className="relative">
            <Search size={24} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search for answers..." 
              className="w-full pl-12 pr-4 py-4 rounded-xl text-lg focus:outline-none focus:ring-4 focus:ring-emerald-500/30 transition-shadow shadow-xl border-0 text-gray-800"
            />
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {defaultCategories.map((category) => {
          const Icon = iconMap[category.iconName] || HelpCircle;
          return (
            <div key={category.id} onClick={() => setSearchQuery(category.title)} className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-6 hover:border-emerald-500/30 transition-all cursor-pointer group hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5 group-hover:bg-[#8CC63F] group-hover:text-white transition-colors shadow-sm">
                <Icon size={28} strokeWidth={2} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{category.title}</h3>
              <p className="text-sm font-medium text-gray-500">{category.desc}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Articles List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">{searchQuery ? 'Search Results' : 'All Articles'}</h3>
            <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">{filteredArticles.length}</span>
          </div>
          <div className="space-y-4">
            {filteredArticles.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">No articles found.</p>
            ) : (
              filteredArticles.map((article) => (
                <div key={article._id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-emerald-50/30 hover:border-emerald-200 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                      <BookOpen size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800 group-hover:text-emerald-700 transition-colors flex items-center gap-2">
                        {article.title}
                        {article.isPopular && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded uppercase font-bold tracking-wider">Popular</span>}
                        {article.status === 'Draft' && <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded uppercase font-bold tracking-wider">Draft</span>}
                      </h4>
                      <p className="text-xs text-gray-500 font-medium mt-1">{article.category} • Updated {new Date(article.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditArticle(article)} className="p-2 text-gray-400 hover:text-emerald-600 transition-colors rounded-lg hover:bg-emerald-50"><Edit2 size={16}/></button>
                    <button onClick={() => handleDeleteArticle(article._id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"><Trash2 size={16}/></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-6 flex flex-col h-fit">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-lg font-semibold text-gray-900">Contact Methods</h3>
             <button onClick={() => setIsSettingsModalOpen(true)} className="text-emerald-600 hover:text-emerald-700 text-sm font-semibold flex items-center gap-1">Edit</button>
          </div>
          
          <div className="space-y-6 flex-1">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                <MessageSquare size={20} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-1">Live Chat</h4>
                <p className="text-xs text-gray-500 font-medium mb-2">Chat with our support team</p>
                <a href={settings.liveChatUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">Start Chat →</a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <Mail size={20} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-1">Email Support</h4>
                <p className="text-xs text-gray-500 font-medium mb-2">Get response within 24 hours</p>
                <a href={`mailto:${settings.email}`} className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">{settings.email}</a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0">
                <Phone size={20} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-1">Phone Support</h4>
                <p className="text-xs text-gray-500 font-medium mb-2">{settings.timing}</p>
                <a href={`tel:${settings.phone}`} className="text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors">{settings.phone}</a>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Article Modal */}
      {isArticleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <form onSubmit={handleArticleSubmit}>
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">{editingArticleId ? 'Edit Article' : 'Add New Article'}</h2>
                <button type="button" onClick={() => setIsArticleModalOpen(false)} className="text-gray-400 hover:bg-gray-100 hover:text-gray-600 p-1.5 rounded-lg transition-colors"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Article Title</label>
                  <input type="text" required value={articleForm.title} onChange={e => setArticleForm({...articleForm, title: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all shadow-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Category</label>
                    <select value={articleForm.category} onChange={e => setArticleForm({...articleForm, category: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] bg-white transition-all shadow-sm">
                      <option>FAQs</option>
                      <option>User Guides</option>
                      <option>Technical Support</option>
                      <option>Billing</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Status</label>
                    <select value={articleForm.status} onChange={e => setArticleForm({...articleForm, status: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] bg-white transition-all shadow-sm">
                      <option>Published</option>
                      <option>Draft</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Content</label>
                  <textarea required rows="6" value={articleForm.content} onChange={e => setArticleForm({...articleForm, content: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all shadow-sm resize-none"></textarea>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={articleForm.isPopular} onChange={e => setArticleForm({...articleForm, isPopular: e.target.checked})} className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500" />
                  <span className="text-sm font-semibold text-gray-700">Mark as Popular Article</span>
                </label>
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setIsArticleModalOpen(false)} className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-200 bg-white border border-gray-200 rounded-lg transition-colors shadow-sm">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 text-sm font-semibold text-white bg-[#8CC63F] hover:bg-[#116631] disabled:bg-opacity-50 rounded-lg transition-colors shadow-sm flex items-center gap-2">
                  {isSubmitting ? <><Loader2 size={16} className="animate-spin"/> Saving...</> : 'Save Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <form onSubmit={handleSettingsSubmit}>
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Support Settings</h2>
                <button type="button" onClick={() => setIsSettingsModalOpen(false)} className="text-gray-400 hover:bg-gray-100 hover:text-gray-600 p-1.5 rounded-lg transition-colors"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Support Email</label>
                  <input type="email" required value={settingsForm.email} onChange={e => setSettingsForm({...settingsForm, email: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all shadow-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Support Phone Number</label>
                  <input type="text" required value={settingsForm.phone} onChange={e => setSettingsForm({...settingsForm, phone: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all shadow-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Live Chat URL</label>
                  <input type="text" value={settingsForm.liveChatUrl} onChange={e => setSettingsForm({...settingsForm, liveChatUrl: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all shadow-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Support Timings</label>
                  <input type="text" required value={settingsForm.timing} onChange={e => setSettingsForm({...settingsForm, timing: e.target.value})} placeholder="e.g. Mon-Fri from 9am to 6pm" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8CC63F] focus:border-transparent transition-all shadow-sm" />
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setIsSettingsModalOpen(false)} className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-200 bg-white border border-gray-200 rounded-lg transition-colors shadow-sm">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 text-sm font-semibold text-white bg-[#8CC63F] hover:bg-[#116631] disabled:bg-opacity-50 rounded-lg transition-colors shadow-sm flex items-center gap-2">
                  {isSubmitting ? <><Loader2 size={16} className="animate-spin"/> Saving...</> : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default SupportCenterView;
