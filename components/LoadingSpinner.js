// components/LoadingSpinner.js (Versión corregida usando React.createElement)

import React from 'react';
import PropTypes from 'prop-types';

const LoadingSpinner = ({ message }) => {
  return React.createElement('div', {
    className: "flex flex-col items-center justify-center min-h-screen text-indigo-500 dark:text-indigo-400"
  },
    // SVG Spinner Icon (Reemplaza el JSX del SVG)
    React.createElement('svg', {
      className: "animate-spin h-10 w-10 mb-3",
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      viewBox: "0 0 24 24"
    },
      React.createElement('circle', {
        className: "opacity-25",
        cx: "12",
        cy: "12",
        r: "10",
        stroke: "currentColor",
        strokeWidth: "4"
      }),
      React.createElement('path', {
        className: "opacity-75",
        fill: "currentColor",
        d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      })
    ),

    // Mensaje de Carga
    React.createElement('p', {
      className: "text-lg font-medium"
    }, message || "Cargando aplicación...")
  );
};

LoadingSpinner.propTypes = {
  message: PropTypes.string,
};

export default LoadingSpinner;