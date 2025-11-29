// components/ToastProvider.js (Versión corregida usando React.createElement)

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

// Componente para una sola notificación (Toast)
const Toast = ({ toast, removeToast }) => {
    // Definición de estilos
    const typeStyles = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500',
    };
    
    // El elemento visual de la notificación (sin JSX)
    return React.createElement('div', {
        className: `p-3 rounded-lg shadow-xl text-white ${typeStyles[toast.type] || typeStyles.info} flex justify-between items-center`,
        role: "alert"
    },
        React.createElement('p', { className: "text-white" }, toast.message),
        React.createElement('button', {
            onClick: () => removeToast(toast.id),
            className: "ml-4 text-white hover:text-gray-100 font-bold"
        }, '×')
    );
};

// Componente Proveedor principal
const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const [idCounter, setIdCounter] = useState(0);

    const addToast = useCallback(({ message, type = 'info', duration = 4000 }) => {
        setIdCounter(prev => prev + 1);
        const newToast = { id: idCounter, message, type, duration };
        setToasts(prev => [...prev, newToast]);
    }, [idCounter]);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    useEffect(() => {
        if (toasts.length > 0) {
            const timer = setTimeout(() => {
                const toastToRemove = toasts[0];
                if (toastToRemove) {
                    removeToast(toastToRemove.id);
                }
            }, toasts[0].duration);

            return () => clearTimeout(timer);
        }
    }, [toasts, removeToast]);

    // Renderizado del proveedor y el contenedor de toasts (sin JSX)
    return React.createElement(ToastContext.Provider, { value: { addToast, removeToast } },
        children,
        
        // Contenedor de Toasts (la parte que causaba el error en línea 25)
        React.createElement('div', {
            className: "fixed bottom-4 right-4 z-50 space-y-2"
        },
            toasts.map(toast => React.createElement(Toast, {
                key: toast.id,
                toast: toast,
                removeToast: removeToast
            }))
        )
    );
};

ToastProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ToastProvider;