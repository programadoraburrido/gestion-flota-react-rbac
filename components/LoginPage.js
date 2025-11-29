import React, { useState } from 'react';
import { palette } from './themePalette.js';

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const theme = 'light';
  const tokens = palette[theme];

  const handleLogin = async () => {
    setError('');
    if (!email || !password) {
      setError('Email y contraseña requeridos');
      return;
    }

    setLoading(true);
    
    // Simular login con roles
    setTimeout(() => {
      // Demo: diferentes roles según el email
      let role = 'operator';
      if (email.includes('admin')) role = 'admin';
      if (email.includes('viewer')) role = 'viewer';

      const user = {
        id: 'user_' + Date.now(),
        email,
        name: email.split('@')[0],
        role, // 'admin', 'operator', 'viewer'
        permissions: getRolePermissions(role),
        token: 'token_' + Math.random().toString(36).substring(7)
      };

      localStorage.setItem('user', JSON.stringify(user));
      onLogin(user);
      setLoading(false);
    }, 500);
  };

  const getRolePermissions = (role) => {
    const permissionsMap = {
      admin: ['create_vehicle', 'edit_vehicle', 'delete_vehicle', 'create_geofence', 'edit_geofence', 'delete_geofence', 'view_alerts', 'view_reports', 'manage_users'],
      operator: ['create_vehicle', 'edit_vehicle', 'create_geofence', 'edit_geofence', 'view_alerts', 'view_reports'],
      viewer: ['view_alerts', 'view_reports']
    };
    return permissionsMap[role] || [];
  };

  const handleDemoLogin = (role) => {
    const demoEmail = role === 'admin' ? 'admin@fleet.com' : role === 'operator' ? 'operator@fleet.com' : 'viewer@fleet.com';
    setEmail(demoEmail);
    setPassword('demo123');
    setTimeout(() => {
      const user = {
        id: 'user_' + Date.now(),
        email: demoEmail,
        name: role.charAt(0).toUpperCase() + role.slice(1),
        role,
        permissions: getRolePermissions(role),
        token: 'token_' + Math.random().toString(36).substring(7)
      };
      localStorage.setItem('user', JSON.stringify(user));
      onLogin(user);
    }, 300);
  };

  return React.createElement(
    'div',
    {
      style: {
        backgroundColor: tokens.background,
        color: tokens.textPrimary,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui'
      }
    },
    React.createElement(
      'div',
      {
        style: {
          backgroundColor: tokens.surface,
          padding: '40px',
          borderRadius: '12px',
          border: `1px solid ${tokens.inputBorder}`,
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
        }
      },
      React.createElement('h1', { style: { margin: '0 0 30px 0', textAlign: 'center', fontSize: '28px' } }, '🚚 Gestión de Flotas'),
      React.createElement('div', { style: { marginBottom: '20px', display: 'flex', gap: '10px' } },
        React.createElement(
          'button',
          {
            onClick: () => setMode('login'),
            style: {
              flex: 1,
              padding: '10px',
              backgroundColor: mode === 'login' ? tokens.primary : 'transparent',
              color: mode === 'login' ? tokens.primaryContrast : tokens.textPrimary,
              border: `1px solid ${tokens.inputBorder}`,
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }
          },
          'Iniciar Sesión'
        ),
        React.createElement(
          'button',
          {
            onClick: () => setMode('register'),
            style: {
              flex: 1,
              padding: '10px',
              backgroundColor: mode === 'register' ? tokens.primary : 'transparent',
              color: mode === 'register' ? tokens.primaryContrast : tokens.textPrimary,
              border: `1px solid ${tokens.inputBorder}`,
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }
          },
          'Registrarse'
        )
      ),
      React.createElement('div', { style: { marginBottom: '15px' } },
        React.createElement('label', { style: { display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' } }, 'Email'),
        React.createElement('input', {
          type: 'email',
          placeholder: 'tu@email.com',
          value: email,
          onChange: (e) => setEmail(e.target.value),
          style: {
            width: '100%',
            padding: '10px',
            border: `1px solid ${tokens.inputBorder}`,
            borderRadius: '4px',
            backgroundColor: tokens.inputBg,
            color: tokens.textPrimary,
            boxSizing: 'border-box',
            fontSize: '14px'
          }
        })
      ),
      React.createElement('div', { style: { marginBottom: '20px' } },
        React.createElement('label', { style: { display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' } }, 'Contraseña'),
        React.createElement('input', {
          type: 'password',
          placeholder: '••••••••',
          value: password,
          onChange: (e) => setPassword(e.target.value),
          style: {
            width: '100%',
            padding: '10px',
            border: `1px solid ${tokens.inputBorder}`,
            borderRadius: '4px',
            backgroundColor: tokens.inputBg,
            color: tokens.textPrimary,
            boxSizing: 'border-box',
            fontSize: '14px'
          }
        })
      ),
      error && React.createElement('div', { style: { backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '12px', border: '1px solid #fecaca' } }, error),
      React.createElement(
        'button',
        {
          onClick: handleLogin,
          disabled: loading,
          style: {
            width: '100%',
            padding: '12px',
            backgroundColor: loading ? '#9ca3af' : tokens.primary,
            color: tokens.primaryContrast,
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
            marginBottom: '15px'
          }
        },
        loading ? 'Cargando...' : (mode === 'login' ? 'Iniciar Sesión' : 'Registrarse')
      ),
      React.createElement('div', { style: { marginBottom: '20px', paddingBottom: '20px', borderBottom: `1px solid ${tokens.inputBorder}`, textAlign: 'center', fontSize: '12px', color: tokens.textSecondary } }, 'o usa una cuenta demo'),
      React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' } },
        React.createElement(
          'button',
          {
            onClick: () => handleDemoLogin('admin'),
            style: {
              padding: '10px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#dc2626',
              border: '1px solid #fecaca',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold'
            }
          },
          '👑 Admin'
        ),
        React.createElement(
          'button',
          {
            onClick: () => handleDemoLogin('operator'),
            style: {
              padding: '10px',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              color: '#1e40af',
              border: '1px solid #bfdbfe',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold'
            }
          },
          '⚙️ Operador'
        ),
        React.createElement(
          'button',
          {
            onClick: () => handleDemoLogin('viewer'),
            style: {
              padding: '10px',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              color: '#166534',
              border: '1px solid #bbf7d0',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold'
            }
          },
          '👁️ Visor'
        )
      ),
      React.createElement('div', { style: { marginTop: '20px', fontSize: '11px', color: tokens.textSecondary, textAlign: 'center', lineHeight: '1.5' } },
        React.createElement('strong', null, 'Roles:'),
        React.createElement('br'),
        '👑 Admin: Control total',
        React.createElement('br'),
        '⚙️ Operador: Crear/editar vehículos',
        React.createElement('br'),
        '👁️ Visor: Solo lectura'
      )
    )
  );
};

export default LoginPage;
