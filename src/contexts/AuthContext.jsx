import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const stored = localStorage.getItem('adminData');
      const token = localStorage.getItem('adminToken');
      
      if (stored) {
        try {
          setAdmin(JSON.parse(stored));
        } catch {
          localStorage.removeItem('adminData');
        }
      }

      if (token) {
        try {
          const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
          const res = await fetch(`${baseUrl}/admin/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (res.ok) {
            const profileData = await res.json();
            setAdmin(profileData);
            localStorage.setItem('adminData', JSON.stringify(profileData));
          }
        } catch (err) {
          console.error('Failed to sync admin profile:', err);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = (adminData) => {
    setAdmin(adminData);
    localStorage.setItem('adminData', JSON.stringify(adminData));
  };

  const logout = () => {
    setAdmin(null);
    localStorage.removeItem('adminData');
    localStorage.removeItem('adminToken');
  };

  // true if superadmin (or old admin without adminType field)
  const isSuperAdmin = !admin?.adminType || admin?.adminType === 'superadmin';

  // check if admin has access to a module and action
  const hasPermission = (module, action = 'view') => {
    if (!admin) return false;
    if (!admin.adminType || admin.adminType === 'superadmin') return true;
    if (!Array.isArray(admin.permissions)) return false;
    
    // Check for legacy full module access or specific action access
    return admin.permissions.includes(module) || admin.permissions.includes(`${module}.${action}`);
  };

  return (
    <AuthContext.Provider value={{ admin, login, logout, isSuperAdmin, hasPermission, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
