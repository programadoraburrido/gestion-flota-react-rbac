// components/AuthContext.js (Versión con Login/Registro por Credenciales)

import React, { createContext, useContext, useState, useMemo } from 'react';
import PropTypes from 'prop-types';

const AuthContext = createContext();

const USER_ROLES = {
    ADMIN: 'admin',
    MANAGER: 'manager', 
    DRIVER: 'driver',   
    GUEST: 'guest',
};

const ROLES_PERMISSIONS = {
    [USER_ROLES.ADMIN]: ['read', 'create', 'update', 'delete', 'map', 'manage_users'],
    [USER_ROLES.MANAGER]: ['read', 'create', 'update', 'map'], 
    [USER_ROLES.DRIVER]: ['read', 'update', 'map'],            
    [USER_ROLES.GUEST]: ['read', 'map'],
};

// ⬇️ Base de Datos de Usuarios Simulada (Username, Password, Role, ID) ⬇️
const MOCK_USER_DB = [
    { username: 'admin', password: '123', role: USER_ROLES.ADMIN, id: 'user_123' },
    { username: 'manager', password: '123', role: USER_ROLES.MANAGER, id: 'user_456' }, // Conductor A
    { username: 'driver', password: '123', role: USER_ROLES.DRIVER, id: 'user_777' },   // Conductor B
    { username: 'guest', password: '123', role: USER_ROLES.GUEST, id: 'user_999' },
];

const AuthProvider = ({ children }) => {
    
    // Usamos el estado local para simular la DB y permitir registrar nuevos usuarios
    const [userDB, setUserDB] = useState(MOCK_USER_DB);

    // Estado de sesión
    const [user, setUser] = useState(null); // Empezamos sin usuario logueado
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const checkPermission = (action) => {
        if (!user || !user.role) return false;
        const permissions = ROLES_PERMISSIONS[user.role] || [];
        return permissions.includes(action);
    };

    // ⬇️ NUEVA FUNCIÓN: Registro de Usuario Simulado ⬇️
    const register = (username, password) => {
        if (userDB.some(u => u.username === username)) {
            return { success: false, message: 'El usuario ya existe.' };
        }
        
        // Asignamos un nuevo ID y el rol por defecto (DRIVER, con permisos de lectura y mapa)
        const newUser = {
            username,
            password, 
            role: USER_ROLES.DRIVER, 
            id: 'user_' + Date.now() 
        };
        
        setUserDB(prev => [...prev, newUser]);
        
        // Logueamos al usuario automáticamente
        setUser(newUser);
        setIsAuthenticated(true);
        
        return { success: true, message: `Usuario ${username} registrado como ${USER_ROLES.DRIVER}.` };
    };

    // ⬇️ FUNCIÓN MODIFICADA: Login por Credenciales ⬇️
    const login = (username, password) => {
        const foundUser = userDB.find(u => u.username === username && u.password === password);

        if (foundUser) {
            setUser(foundUser);
            setIsAuthenticated(true);
            return { success: true, message: `Bienvenido, ${foundUser.username}.` };
        }
        
        return { success: false, message: 'Credenciales inválidas.' };
    };

    const logout = () => {
        setUser(null);
        setIsAuthenticated(false);
    };

    const value = useMemo(() => ({
        user,
        isAuthenticated,
        checkPermission,
        login, // Modificada
        register, // Nueva
        logout,
        USER_ROLES
    }), [user, isAuthenticated, userDB]);

    // Renderizado del proveedor
    return React.createElement(AuthContext.Provider, { value: value }, children);
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => useContext(AuthContext);

export default AuthProvider;