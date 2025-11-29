import React, { useState, useEffect } from 'react';
import LoginPage from './LoginPage.js';
import PreviewAppFull from './PreviewAppFull.js';
import { palette } from './themePalette.js';

const AppWithAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    // Intenta cargar usuario de localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (err) {
        console.error('Error loading user:', err);
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    const tokens = palette['light'];
    return React.createElement(
      'div',
      {
        style: {
          backgroundColor: tokens.background,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }
      },
      React.createElement('div', { style: { fontSize: '18px', color: tokens.textPrimary } }, 'Cargando...')
    );
  }

  if (!user) {
    return React.createElement(LoginPage, { onLogin: handleLogin });
  }

  return React.createElement(PreviewAppFull, {
    user,
    onLogout: handleLogout,
    theme,
    setTheme
  });
};

export default AppWithAuth;
