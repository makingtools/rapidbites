import React, { useState, useEffect } from 'react';
import { PublicApp } from './PublicApp';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminLayout } from './components/admin/AdminLayout';

function App() {
  const [route, setRoute] = useState(window.location.hash || '#/');
  const [isAuthenticated, setIsAuthenticated] = useState(!!sessionStorage.getItem('isAdminAuthenticated'));

  // Effect for handling URL hash changes
  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash || '#/');
    };
    window.addEventListener('hashchange', handleHashChange);
    
    if (!window.location.hash) {
      window.location.hash = '#/';
    }

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Effect for syncing auth state across browser tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'isAdminAuthenticated') {
            setIsAuthenticated(!!e.newValue);
        }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  // Effect for handling redirects for unauthenticated users
  useEffect(() => {
    const isTryingAdminRoute = route.startsWith('#/admin');
    if (isTryingAdminRoute && !isAuthenticated && route !== '#/admin') {
        window.location.hash = '#/admin';
    }
  }, [route, isAuthenticated]);


  const handleLogin = () => {
    sessionStorage.setItem('isAdminAuthenticated', 'true');
    setIsAuthenticated(true);
    window.location.hash = '#/admin/dashboard';
  };

  const handleLogout = () => {
    sessionStorage.removeItem('isAdminAuthenticated');
    setIsAuthenticated(false);
    window.location.hash = '#/';
  };

  const isTryingAdminRoute = route.startsWith('#/admin');

  if (isTryingAdminRoute) {
    if (isAuthenticated) {
        return <AdminLayout onLogout={handleLogout} />;
    }
    return <AdminLogin onLogin={handleLogin} />;
  }
  
  return <PublicApp />;
}

export default App;