import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('adminData');
    if (stored) {
      try {
        setAdmin(JSON.parse(stored));
      } catch {
        localStorage.removeItem('adminData');
      }
    }
    setLoading(false);
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

  // true if superadmin
  const isSuperAdmin = admin?.adminType === 'superadmin';

  // check if admin has access to a module
  const hasPermission = (module) => {
    if (!admin) return false;
    if (admin.adminType === 'superadmin') return true;
    return Array.isArray(admin.permissions) && admin.permissions.includes(module);
  };

  return (
    <AuthContext.Provider value={{ admin, login, logout, isSuperAdmin, hasPermission, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
