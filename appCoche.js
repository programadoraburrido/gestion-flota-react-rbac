// appCoche.js (Versión Final y Funcional con Formulario de Login/Registro)

import React, { useState, useMemo, useEffect } from 'react';
import useFirebaseApp from './models/useFirebaseApp.js';
import { palette } from './components/themePalette.js';
import LoadingSpinner from './components/LoadingSpinner.js';
import VehicleListView from './components/VehicleListView.js';
import AddVehicleView from './components/AddVehicleView.js';
import VehicleDetailsView from './components/VehicleDetailsView.js';
import ToastProvider, { useToast } from './components/ToastProvider.js'; 
import MapView from './components/MapView.js'; 
import AuthProvider, { useAuth } from './components/AuthContext.js';

// ⬇️ COMPONENTE RESTAURADO: Formulario de Login/Registro ⬇️
const LoginRegisterForm = () => {
    const { login, register, USER_ROLES } = useAuth();
    const { addToast } = useToast();
    const [isRegister, setIsRegister] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        let result;

        if (isRegister) {
            result = register(username, password);
        } else {
            result = login(username, password);
        }

        addToast({ message: result.message, type: result.success ? 'success' : 'error' });
        setLoading(false);
    };
    
    // UI del Formulario (Convertido a React.createElement para el entorno)
    return React.createElement('div', { className: "flex flex-col items-center justify-center min-h-screen" },
        React.createElement('div', { className: "w-full max-w-sm p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl" },
            React.createElement('h2', { className: "text-2xl font-bold mb-6 text-center" }, isRegister ? "Registrarse" : "Iniciar Sesión"),

            React.createElement('form', { onSubmit: handleSubmit, className: "space-y-4" },
                // Input Usuario
                React.createElement('input', {
                    type: "text",
                    placeholder: "Usuario (Ej: admin, manager, driver)",
                    value: username,
                    onChange: (e) => setUsername(e.target.value),
                    className: "w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600",
                    required: true
                }),
                // Input Contraseña
                React.createElement('input', {
                    type: "password",
                    placeholder: "Contraseña (Ej: 123)",
                    value: password,
                    onChange: (e) => setPassword(e.target.value),
                    className: "w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600",
                    required: true
                }),
                
                // Botón Principal
                React.createElement('button', {
                    type: "submit",
                    disabled: loading,
                    className: "w-full p-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                }, loading ? 'Cargando...' : (isRegister ? 'Registrar y Entrar' : 'Entrar'))
            ),

            // Alternar Login/Registro
            React.createElement('p', { className: "mt-4 text-center text-sm" },
                isRegister ? "¿Ya tienes cuenta? " : "¿No tienes cuenta? ",
                React.createElement('button', {
                    type: "button",
                    onClick: () => setIsRegister(prev => !prev),
                    className: "text-blue-500 hover:underline font-semibold"
                }, isRegister ? "Iniciar Sesión" : "Registrarse")
            )
        )
    );
};
// ⬆️ FIN COMPONENTE RESTAURADO ⬆️


const App = () => {
  const { 
    isReady, initError, vehicles, loading, 
    addMaintenanceRecord, getVehicleMaintenanceRecords, deleteMaintenanceRecord, updateVehicleItvDate,
    getRecommendedMaintenance // FUNCIÓN NECESARIA PARA LA VISTA DE DETALLES
  } = useFirebaseApp();
  
  const { checkPermission, user, logout, USER_ROLES, isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const [currentView, setView] = useState('list');
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [theme, setTheme] = useState('light');
  const [alertsShown, setAlertsShown] = useState(false);

  // Lógica de Filtrado de Vehículos
  const filteredVehicles = useMemo(() => {
    if (!user || !user.role || !user.id) return [];

    if (user.role === USER_ROLES.ADMIN) {
        return vehicles;
    }
    
    return vehicles.filter(v => v.assignedToUserId === user.id);
    
  }, [vehicles, user, USER_ROLES.ADMIN]);

  const selectedVehicle = useMemo(() => filteredVehicles.find(v => v.id === selectedVehicleId), [filteredVehicles, selectedVehicleId]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const handleLogout = () => {
      logout();
      addToast({ message: 'Sesión cerrada.', type: 'info' });
      setAlertsShown(false); 
  };

  // LÓGICA DE ALERTA DE ITV
  useEffect(() => {
      if (!user || alertsShown || !isReady || filteredVehicles.length === 0) {
          return;
      }
      
      let overdueCount = 0;
      let warningCount = 0;

      filteredVehicles.forEach(v => {
          if (!v.nextItvDate) return;
          
          const nextDate = new Date(v.nextItvDate);
          const today = new Date();
          const diffDays = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));

          if (diffDays < 0) {
              overdueCount++;
          } else if (diffDays <= 90) { 
              warningCount++;
          }
      });

      if (overdueCount > 0) {
          addToast({ message: `¡ATENCIÓN! ${overdueCount} vehículo(s) tienen la ITV VENCIDA.`, type: 'error', duration: 8000 });
      }
      if (warningCount > 0) {
          addToast({ message: `${warningCount} vehículo(s) tienen la ITV próxima a vencer (en menos de 90 días).`, type: 'warning', duration: 6000 });
      }
      
      setAlertsShown(true); 

  }, [isReady, filteredVehicles, addToast, alertsShown, user]); 

  const renderContent = () => {
    // ⬇️ PANTALLA DE LOGIN/REGISTRO ⬇️
    if (!isAuthenticated) {
        return React.createElement(LoginRegisterForm, null); // ⬅️ Usa el componente restaurado
    }
    
    // Resto del renderizado (solo si hay usuario logueado)
    if (initError) { /* ... */ }
    if (loading || !isReady) { 
        return React.createElement(LoadingSpinner, { message: "Inicializando la aplicación y cargando datos simulados..." });
    }

    if (currentView === 'add' && checkPermission('create')) {
      return React.createElement(AddVehicleView, { setView, userId: user.id, vehicles: filteredVehicles }); 
    }
    
    if (currentView === 'details' && selectedVehicle) {
      return React.createElement(VehicleDetailsView, { 
        vehicle: selectedVehicle, 
        setView, 
        userId: user.id,
        getVehicleMaintenanceRecords, 
        addMaintenanceRecord, 
        deleteMaintenanceRecord,
        updateVehicleItvDate,
        getRecommendedMaintenance, // Función esencial para la vista de detalles
      });
    }
    
    if (currentView === 'map' && checkPermission('map')) {
        return React.createElement(MapView, { vehicles: filteredVehicles, setView });
    }

    if (!checkPermission('read')) {
        return React.createElement('div', { className: "text-center p-8 min-h-screen text-red-500" }, 
            React.createElement('h2', { className: "text-2xl font-bold" }, "Acceso Denegado"),
            React.createElement('p', null, `Tu rol (${user.role.toUpperCase()}) no tiene permiso para ver la lista de flota.`)
        );
    }
    
    return React.createElement(VehicleListView, { vehicles: filteredVehicles, setView, setSelectedVehicleId });
  };

  const tokens = palette[theme] || palette.light;

  return React.createElement('div', { 
    className: `${theme} min-h-screen font-sans transition-colors duration-300`,
    style: { background: tokens.background, color: tokens.textPrimary }
  },
    // Header
    React.createElement('header', {
      className: "flex justify-between items-center p-4 shadow-md",
      style: { background: tokens.surface }
    },
      
      // Título y Botón de Mapa
      React.createElement('div', { className: "flex items-center gap-4" },
        React.createElement('h1', {
          className: "text-xl font-bold",
          style: { color: tokens.textPrimary }
        }, "Gestión de Flota"),
        
        // BOTÓN MAPA (Restringido por Auth)
        isAuthenticated && checkPermission('map') && React.createElement('button', {
            onClick: () => setView('map'), 
            className: "px-3 py-1 rounded transition", 
            style: { 
                background: tokens.primary, 
                color: tokens.primaryContrast, 
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }
        }, "Ver Mapa 📍")
      ),
      
      // Controles de Usuario y Tema
      React.createElement('div', { className: "flex items-center gap-3" },
        user && React.createElement('span', { className: "text-sm hidden sm:inline" }, `Rol: ${user.role.toUpperCase()}`),
        
        // Botón Cerrar Sesión
        isAuthenticated && React.createElement('button', {
            onClick: handleLogout, 
            className: "px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition"
        }, "Cerrar Sesión"),
        
        // Botón Tema
        React.createElement('button', {
          onClick: toggleTheme,
          className: "p-2 rounded-full transition-colors",
          'aria-label': "Alternar tema", 
          title: "Alternar tema",
          style: { background: tokens.primary, color: tokens.primaryContrast }
        },
          React.createElement('span', null, theme === 'light' ? '☀️' : '🌙')
        )
      )
    ),
    
    // Main Content
    React.createElement('main', {
      className: "container mx-auto pb-8"
    }, renderContent())
  );
};

export default function RootApp() {
  return React.createElement(AuthProvider, null, 
    React.createElement(ToastProvider, null, 
      React.createElement(App, null)
    )
  );
}