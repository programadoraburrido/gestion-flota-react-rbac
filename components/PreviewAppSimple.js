import React, { useState, useMemo } from 'react';
import { palette } from './themePalette.js';

const PreviewAppSimple = () => {
  const [theme, setTheme] = useState('light');
  const [vehicles, setVehicles] = useState([
    {
      id: 'v1',
      make: 'FORD',
      model: 'TRANSIT',
      year: 2020,
      vin: 'ABC123456',
      licensePlate: '1234ABC',
      currentOdometer: 45200,
      location: { lat: 40.4168, lng: -3.7038 },
      status: 'En ruta'
    },
    {
      id: 'v2',
      make: 'TESLA',
      model: 'MODEL 3',
      year: 2022,
      vin: 'XYZ987654',
      licensePlate: '5678DEF',
      currentOdometer: 12000,
      location: { lat: 40.4379, lng: -3.6795 },
      status: 'Parado'
    }
  ]);

  const tokens = palette[theme] || palette.light;

  return React.createElement(
    'div',
    {
      style: {
        backgroundColor: tokens.background,
        color: tokens.textPrimary,
        minHeight: '100vh',
        padding: '20px',
        fontFamily: 'system-ui'
      }
    },
    React.createElement(
      'div',
      { style: { maxWidth: '1200px', margin: '0 auto' } },
      React.createElement(
        'header',
        {
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            paddingBottom: '20px',
            borderBottom: `1px solid ${tokens.inputBorder}`
          }
        },
        React.createElement(
          'h1',
          { style: { margin: 0 } },
          'Gestión de Flotas - Preview'
        ),
        React.createElement(
          'button',
          {
            onClick: () => setTheme(theme === 'light' ? 'dark' : 'light'),
            style: {
              padding: '8px 16px',
              backgroundColor: tokens.primary,
              color: tokens.primaryContrast,
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }
          },
          theme === 'light' ? '🌙 Dark' : '☀️ Light'
        )
      ),
      React.createElement(
        'div',
        { style: { marginTop: '20px' } },
        React.createElement(
          'h2',
          { style: { marginBottom: '15px' } },
          'Vehículos'
        ),
        React.createElement(
          'div',
          {
            style: {
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '15px'
            }
          },
          vehicles.map(v =>
            React.createElement(
              'div',
              {
                key: v.id,
                style: {
                  backgroundColor: tokens.surface,
                  padding: '15px',
                  borderRadius: '8px',
                  border: `1px solid ${tokens.inputBorder}`,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }
              },
              React.createElement(
                'div',
                { style: { fontWeight: 'bold', marginBottom: '8px', fontSize: '16px' } },
                `${v.make} ${v.model}`
              ),
              React.createElement(
                'div',
                { style: { fontSize: '12px', color: tokens.textSecondary, marginBottom: '8px' } },
                React.createElement('div', null, `Placa: ${v.licensePlate}`),
                React.createElement('div', null, `Odómetro: ${v.currentOdometer} km`),
                React.createElement('div', null, `Lat: ${v.location.lat.toFixed(4)}, Lng: ${v.location.lng.toFixed(4)}`)
              ),
              React.createElement(
                'div',
                {
                  style: {
                    display: 'inline-block',
                    backgroundColor: v.status === 'En ruta' ? '#10b981' : '#6b7280',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }
                },
                v.status
              )
            )
          )
        )
      ),
      React.createElement(
        'div',
        { style: { marginTop: '40px', padding: '20px', backgroundColor: tokens.surface, borderRadius: '8px' } },
        React.createElement(
          'h3',
          { style: { marginTop: 0 } },
          'ℹ️ Información'
        ),
        React.createElement(
          'p',
          { style: { color: tokens.textSecondary, lineHeight: '1.6' } },
          'Esta es una vista previa simple de la aplicación de Gestión de Flotas. Los componentes completos (mapa en tiempo real, geocercas, alertas) están disponibles en el código fuente.'
        )
      )
    )
  );
};

export default PreviewAppSimple;
