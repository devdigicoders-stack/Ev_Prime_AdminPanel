import React, { useState, useEffect, useRef } from 'react';
import { Mail, Phone, MapPin, Building, Calendar, Edit, Shield, Activity, Clock, CheckCircle2, Loader2, X, Camera, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const ProfileView = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  
  // Form states
  const [editForm, setEditForm] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  
  const navigate = useNavigate();
  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    if (!token) {
      navigate('/login');
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setProfile(data);
      } else {
        setErrorMsg(data.message || 'Failed to fetch profile');
        if (response.status === 401) {
          localStorage.removeItem('adminToken');
          navigate('/login');
        }
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = () => {
    setEditForm({
      name: profile.name || '',
      email: profile.email || '',
      role: profile.role || '',
      phone: profile.phone || '',
      location: profile.location || '',
      office: profile.office || '',
      description: profile.description || ''
    });
    setPreviewImage(profile.profileImage ? `${import.meta.env.VITE_API_BASE_URL.replace('/api', '')}${profile.profileImage}` : null);
    setSelectedImage(null);
    setIsEditModalOpen(true);
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const formData = new FormData();
      Object.keys(editForm).forEach(key => {
        formData.append(key, editForm[key]);
      });
      
      if (selectedImage) {
        formData.append('profileImage', selectedImage);
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setProfile(data);
        setIsEditModalOpen(false);
        toast.success('Profile updated successfully');
      } else {
        toast.error(data.message || 'Failed to update profile');
      }
    } catch (err) {
      toast.error(err.message || 'Error updating profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords don't match");
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success('Password changed successfully');
        setIsPasswordModalOpen(false);
        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setPasswordError(data.message || 'Failed to change password');
      }
    } catch (err) {
      setPasswordError(err.message || 'Error changing password');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>;
  }

  if (errorMsg) {
    return <div className="text-red-500 text-center p-6">{errorMsg}</div>;
  }

  if (!profile) return null;

  const joinDate = new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  const avatarUrl = profile.profileImage ? `${import.meta.env.VITE_API_BASE_URL.replace('/api', '')}${profile.profileImage}` : null;
  const initials = profile.name ? profile.name.substring(0, 2).toUpperCase() : 'AD';

  return (
    <div className="flex flex-col h-full space-y-6 pb-6 max-w-6xl mx-auto w-full relative">
      
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">My Profile</h1>
          <p className="text-gray-500 text-sm font-medium">Manage your personal information and activities</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button 
            onClick={() => setIsPasswordModalOpen(true)}
            className="w-full sm:w-auto bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Lock size={16} /> Password
          </button>
          <button 
            onClick={openEditModal}
            className="w-full sm:w-auto bg-[#8CC63F] hover:bg-[#116631] text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Edit size={16} /> Edit Profile
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: User Info Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
            {/* Cover Image */}
            <div className="h-32 bg-gradient-to-r from-emerald-800 to-[#8CC63F] relative">
              <div className="absolute inset-0 bg-white/10" style={{ backgroundImage: 'radial-gradient(circle, transparent 20%, #fff 20%, transparent 80%, transparent)', backgroundSize: '20px 20px', opacity: 0.1 }}></div>
            </div>
            
            {/* Avatar & Basic Info */}
            <div className="px-6 pb-6 relative">
              <div className="w-24 h-24 rounded-full bg-white p-1.5 absolute -top-12 left-6 shadow-md border border-gray-100">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={profile.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full bg-emerald-100 flex items-center justify-center text-3xl font-semibold text-emerald-700">
                    {initials}
                  </div>
                )}
                <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              
              <div className="pt-14">
                <h2 className="text-xl font-semibold text-gray-900">{profile.name}</h2>
                <p className="text-sm font-semibold text-emerald-600 mb-4">{profile.role || 'Administrator'}</p>
                
                <p className="text-sm font-medium text-gray-500 mb-6 leading-relaxed">
                  {profile.description || 'No description provided.'}
                </p>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Mail size={16} className="text-gray-400" />
                    <span className="font-semibold">{profile.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Phone size={16} className="text-gray-400" />
                    <span className="font-semibold">{profile.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <MapPin size={16} className="text-gray-400" />
                    <span className="font-semibold">{profile.location || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Building size={16} className="text-gray-400" />
                    <span className="font-semibold">{profile.office || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Calendar size={16} className="text-gray-400" />
                    <span className="font-semibold">Joined {joinDate}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Admin Privileges</h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Shield size={16} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Full Access Level</p>
                <p className="text-xs text-gray-500 font-medium">All modules unlocked</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
                <Activity size={16} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Active Status</p>
                <p className="text-xs text-gray-500 font-medium">Account verified</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Activity Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
            
            <div className="relative border-l border-gray-200 ml-4 space-y-8 pb-4">
              <div className="relative pl-6">
                <div className="absolute w-4 h-4 rounded-full bg-white border-2 border-gray-400 -left-[9px] top-1"></div>
                <p className="text-sm font-semibold text-gray-900 mb-1">Logged In successfully</p>
                <p className="text-sm font-medium text-gray-600 mb-2">Logged in to the admin panel.</p>
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
                  <Clock size={12} /> Just now
                </div>
              </div>
            </div>

            <button className="w-full mt-2 py-3 text-sm font-semibold text-gray-600 hover:text-emerald-700 bg-gray-50 hover:bg-emerald-50 rounded-xl transition-colors border border-gray-100 hover:border-emerald-100">
              Load More Activity
            </button>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Edit Profile</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto">
              <form onSubmit={handleEditSubmit} className="space-y-5">
                
                <div className="flex justify-center mb-6">
                  <div className="relative w-24 h-24">
                    <div className="w-24 h-24 rounded-full border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
                      {previewImage ? (
                        <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-gray-400 font-semibold text-2xl">{initials}</span>
                      )}
                    </div>
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 bg-[#8CC63F] text-white p-1.5 rounded-full shadow-md hover:bg-[#116631] transition-colors"
                    >
                      <Camera size={14} />
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleImageChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Name</label>
                    <input name="name" value={editForm.name} onChange={handleEditChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#8CC63F] outline-none text-sm" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Email</label>
                    <input type="email" name="email" value={editForm.email} onChange={handleEditChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#8CC63F] outline-none text-sm" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Role</label>
                    <input name="role" value={editForm.role} onChange={handleEditChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#8CC63F] outline-none text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Phone</label>
                    <input name="phone" value={editForm.phone} onChange={handleEditChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#8CC63F] outline-none text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Location</label>
                    <input name="location" value={editForm.location} onChange={handleEditChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#8CC63F] outline-none text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Office</label>
                    <input name="office" value={editForm.office} onChange={handleEditChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#8CC63F] outline-none text-sm" />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-semibold text-gray-700">Description</label>
                    <textarea name="description" value={editForm.description} onChange={handleEditChange} rows="3" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#8CC63F] outline-none text-sm"></textarea>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#8CC63F] hover:bg-[#116631] disabled:opacity-70 flex items-center gap-2">
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : null} Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
              <button onClick={() => setIsPasswordModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <div className="p-5">
              {passwordError && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg font-medium">
                  {passwordError}
                </div>
              )}
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Current Password</label>
                  <input type="password" name="oldPassword" value={passwordForm.oldPassword} onChange={handlePasswordChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#8CC63F] outline-none text-sm" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">New Password</label>
                  <input type="password" name="newPassword" value={passwordForm.newPassword} onChange={handlePasswordChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#8CC63F] outline-none text-sm" required minLength="6" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Confirm New Password</label>
                  <input type="password" name="confirmPassword" value={passwordForm.confirmPassword} onChange={handlePasswordChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#8CC63F] outline-none text-sm" required minLength="6" />
                </div>
                
                <div className="flex justify-end gap-3 pt-4 mt-2">
                  <button type="button" onClick={() => setIsPasswordModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#8CC63F] hover:bg-[#116631] disabled:opacity-70 flex items-center gap-2">
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : null} Update Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProfileView;
