import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Users, XCircle, RefreshCw, Image as ImageIcon } from 'lucide-react';
import Swal from 'sweetalert2';

const TeamManagementView = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    linkedin: '',
    twitter: '',
    email: '',
    order: 0
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const serverUrl = import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace('/api', '') : 'http://localhost:5000';

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${baseUrl}/cms/team`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setTeamMembers(data);
      } else {
        Swal.fire({ icon: 'error', title: 'Oops...', text: 'Failed to load team members' });
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
      Swal.fire({ icon: 'error', title: 'Network Error', text: 'Failed to fetch team members' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const openModal = (member = null) => {
    if (member) {
      setEditingMember(member);
      setFormData({
        name: member.name,
        role: member.role,
        linkedin: member.socials?.linkedin || '',
        twitter: member.socials?.twitter || '',
        email: member.socials?.email || '',
        order: member.order || 0
      });
      setImagePreview(`${serverUrl}${member.image}`);
      setImageFile(null);
    } else {
      setEditingMember(null);
      setFormData({
        name: '',
        role: '',
        linkedin: '',
        twitter: '',
        email: '',
        order: 0
      });
      setImagePreview(null);
      setImageFile(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMember(null);
    setImagePreview(null);
    setImageFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!editingMember && !imageFile) {
      return Swal.fire({ icon: 'warning', title: 'Image Required', text: 'Please upload a photo for the team member.' });
    }

    try {
      const url = editingMember ? `${baseUrl}/cms/team/${editingMember._id}` : `${baseUrl}/cms/team`;
      const method = editingMember ? 'PUT' : 'POST';
      
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('role', formData.role);
      formDataToSend.append('linkedin', formData.linkedin);
      formDataToSend.append('twitter', formData.twitter);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('order', formData.order);
      
      if (imageFile) {
        formDataToSend.append('teamImage', imageFile); // Matches upload.single('teamImage')
      }
      
      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: formDataToSend
      });
      
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'Success!', text: `Team member ${editingMember ? 'updated' : 'added'} successfully!`, timer: 2000, showConfirmButton: false });
        closeModal();
        fetchTeamMembers();
      } else {
        const errorData = await res.json();
        Swal.fire({ icon: 'error', title: 'Error', text: errorData.message || `Failed to ${editingMember ? 'update' : 'add'} team member` });
      }
    } catch (error) {
      console.error('Error saving team member:', error);
      Swal.fire({ icon: 'error', title: 'Network Error', text: 'Error saving team member' });
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`${baseUrl}/cms/team/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        });
        
        if (res.ok) {
          Swal.fire({ icon: 'success', title: 'Deleted!', text: 'Team member has been deleted.', timer: 2000, showConfirmButton: false });
          fetchTeamMembers();
        } else {
          const errorData = await res.json();
          Swal.fire({ icon: 'error', title: 'Failed', text: errorData.message || 'Failed to delete team member' });
        }
      } catch (error) {
        console.error('Error deleting team member:', error);
        Swal.fire({ icon: 'error', title: 'Network Error', text: 'Error deleting team member' });
      }
    }
  };

  const filteredMembers = teamMembers.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-green-600" />
            Our Team Management
          </h1>
          <p className="text-gray-500 mt-1">Manage team members displayed on the website</p>
        </div>
        
        <button 
          onClick={() => openModal()}
          className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm shadow-green-600/20 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Member
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search team members..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <button 
            onClick={fetchTeamMembers}
            className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-600 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-green-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Team Members List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading && teamMembers.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <RefreshCw className="w-10 h-10 text-green-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading team members...</p>
          </div>
        ) : filteredMembers.length > 0 ? (
          filteredMembers.map((member) => (
            <div key={member._id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-2 border-green-100 shadow-sm relative">
                <img 
                  src={`${serverUrl}${member.image}`} 
                  alt={member.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(member.name) + '&background=random' }}
                />
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-1">{member.name}</h3>
              <p className="text-green-600 font-medium text-sm mb-4">{member.role}</p>
              
              <div className="flex items-center gap-2 mb-4 opacity-70">
                <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  Order: {member.order}
                </span>
              </div>
              
              <div className="flex items-center gap-2 w-full justify-center mt-auto border-t border-gray-50 pt-4">
                <button 
                  onClick={() => openModal(member)}
                  className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex-1 flex justify-center items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" /> Edit
                </button>
                <button 
                  onClick={() => handleDelete(member._id)}
                  className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex-1 flex justify-center items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Team Members Found</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              There are no team members matching your search criteria. Click "Add Member" to create one.
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
              <h2 className="text-xl font-bold text-gray-800">
                {editingMember ? 'Edit Team Member' : 'Add New Team Member'}
              </h2>
              <button 
                onClick={closeModal}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="flex flex-col items-center justify-center mb-6">
                  <div className="w-28 h-28 rounded-full border-2 border-dashed border-gray-300 overflow-hidden bg-gray-50 flex items-center justify-center relative group cursor-pointer">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <ImageIcon className="w-8 h-8 text-gray-400 mx-auto" />
                        <span className="text-xs text-gray-500 mt-1 block">Upload Photo</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-xs font-semibold">Change</span>
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="e.g. Rajeev Sharma"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Role / Position</label>
                    <input
                      type="text"
                      name="role"
                      required
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="e.g. Founder & CEO"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">LinkedIn URL (Optional)</label>
                    <input
                      type="url"
                      name="linkedin"
                      value={formData.linkedin}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Twitter URL (Optional)</label>
                    <input
                      type="url"
                      name="twitter"
                      value={formData.twitter}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="https://twitter.com/..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address (Optional)</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="email@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Display Order</label>
                    <input
                      type="number"
                      name="order"
                      min="0"
                      value={formData.order}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
                
                <div className="mt-8 flex gap-3 justify-end shrink-0 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-5 py-2.5 rounded-xl font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl font-medium text-white bg-green-600 hover:bg-green-700 transition-colors shadow-sm shadow-green-600/20"
                  >
                    {editingMember ? 'Save Changes' : 'Add Member'}
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

export default TeamManagementView;
