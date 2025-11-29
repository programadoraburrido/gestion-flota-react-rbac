import React, { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(null);

export const useToast = () => {
  return useContext(ToastContext);
};

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, opts = {}) => {
    const id = Date.now() + Math.random();
    const toast = { id, message, type: opts.type || 'info', timeout: opts.timeout || 4000 };
    setToasts((t) => [...t, toast]);
    if (toast.timeout > 0) {
      setTimeout(() => setToasts((t) => t.filter(x => x.id !== id)), toast.timeout);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => setToasts((t) => t.filter(x => x.id !== id)), []);

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      ToastContext.Provider,
      { value: { showToast, removeToast } },
      children,
      React.createElement(
        'div',
        {
          style: {
            position: 'fixed',
            right: '16px',
            bottom: '16px',
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }
        },
        toasts.map((t) => {
          let bgColor = '#4f46e5'; // indigo
          let textColor = 'white';
          if (t.type === 'error') {
            bgColor = '#dc2626'; // red
          } else if (t.type === 'warn') {
            bgColor = '#ca8a04'; // yellow
            textColor = 'black';
          }

          return React.createElement(
            'div',
            {
              key: t.id,
              style: {
                maxWidth: '320px',
                padding: '8px 16px',
                borderRadius: '4px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                fontSize: '14px',
                color: textColor,
                backgroundColor: bgColor,
                animation: 'fadeIn 0.3s ease-in'
              }
            },
            t.message
          );
        })
      )
    )
  );
};

export default ToastProvider;
