import React, { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState(localStorage.getItem('themeMode') || 'system');
  const [fontFamily, setFontFamily] = useState(localStorage.getItem('fontFamily') || 'Outfit');
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  useEffect(() => {
    // Fetch user settings on load
    const token = localStorage.getItem('adminToken');
    if (token) {
      fetch(`${API_BASE_URL}/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.settings) {
          if (data.settings.themeMode) updateThemeMode(data.settings.themeMode);
          if (data.settings.fontFamily) updateFontFamily(data.settings.fontFamily);
        }
      })
      .catch(err => console.error('Error fetching theme settings:', err));
    }
  }, []);

  const updateThemeMode = (mode) => {
    setThemeMode(mode);
    localStorage.setItem('themeMode', mode);
  };

  const updateFontFamily = (font) => {
    setFontFamily(font);
    localStorage.setItem('fontFamily', font);
  };

  // Apply Theme Mode
  useEffect(() => {
    const root = document.documentElement;
    if (themeMode === 'dark') {
      root.classList.add('dark');
    } else if (themeMode === 'light') {
      root.classList.remove('dark');
    } else if (themeMode === 'system') {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [themeMode]);

  // Listen for system theme changes if set to system
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (themeMode === 'system') {
        const root = document.documentElement;
        if (e.matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeMode]);

  // Apply Font Family
  useEffect(() => {
    const fontValue = `'${fontFamily}', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
    document.body.style.fontFamily = fontValue;
    document.documentElement.style.setProperty('--font-sans', fontValue);
    
    // Check if we need to load google fonts dynamically
    const linkId = 'dynamic-font';
    let link = document.getElementById(linkId);
    if (!link) {
      link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(' ', '+')}:wght@300;400;500;600;700;800&display=swap`;
  }, [fontFamily]);

  return (
    <ThemeContext.Provider value={{ themeMode, updateThemeMode, fontFamily, updateFontFamily }}>
      {children}
    </ThemeContext.Provider>
  );
};
