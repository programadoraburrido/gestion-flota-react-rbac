import React, { useState, useMemo, useRef, useEffect } from 'react';
import { palette } from './themePalette.js';
import EnhancedMap from './EnhancedMap.js';
import { downloadReport } from './ReportGenerator.js';

const PreviewAppFull = ({ user, onLogout, theme: initialTheme = 'light', setTheme: setInitialTheme }) => {
  const [theme, setTheme] = useState(initialTheme);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [geofences, setGeofences] = useState([]);
  const [editingGeofence, setEditingGeofence] = useState(false);
  const [tempPolygonPoints, setTempPolygonPoints] = useState([]);
  const [geofenceName, setGeofenceName] = useState('');
  const [alerts, setAlerts] = useState([]);
  const [showAddVehicleForm, setShowAddVehicleForm] = useState(false);
  const [newVehicleForm, setNewVehicleForm] = useState({ make: '', model: '', year: 2024, vin: '', licensePlate: '' });
  const [locationHistory, setLocationHistory] = useState({}); // { vehicleId: [{ lat, lng, timestamp }, ...] }
  const [playingHistory, setPlayingHistory] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [showReports, setShowReports] = useState(false);
  const [advancedAlerts, setAdvancedAlerts] = useState([]); // DTC + geofence + speed + inactivity
  const mapRef = useRef(null);
  const prevInsideRef = useRef({});
  const historyIntervalRef = useRef(null);
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
      status: 'En ruta',
      maintenanceHistory: [{ title: 'Cambio aceite', date: new Date().toISOString(), km: 35200, cost: 120 }],
      errors: [{ code: 'P0420', desc: 'Catalyst Efficiency', severity: 2 }]
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
      status: 'Parado',
      maintenanceHistory: [],
      errors: []
    }
  ]);

  const tokens = palette[theme] || palette.light;
  const selectedVehicle = useMemo(() => vehicles.find(v => v.id === selectedVehicleId), [vehicles, selectedVehicleId]);

  // Helper: Check permissions
  const hasPermission = (permission) => {
    return user && user.permissions && user.permissions.includes(permission);
  };

  const canCreateVehicle = hasPermission('create_vehicle');
  const canEditVehicle = hasPermission('edit_vehicle');
  const canCreateGeofence = hasPermission('create_geofence');
  const canViewReports = hasPermission('view_reports');

  // Simulate vehicle movement
  useEffect(() => {
    const interval = setInterval(() => {
      setVehicles(prev => prev.map(v => {
        if (!v.location) return v;
        const variance = 0.0005;
        const newLocation = {
          lat: v.location.lat + (Math.random() - 0.5) * variance,
          lng: v.location.lng + (Math.random() - 0.5) * variance
        };
        
        // Store in history
        setLocationHistory(prev => ({
          ...prev,
          [v.id]: [...(prev[v.id] || []), { ...newLocation, timestamp: Date.now() }].slice(-100) // Keep last 100
        }));

        return {
          ...v,
          location: newLocation
        };
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Point-in-polygon algorithm
  const pointInPolygon = (point, vs) => {
    const x = point[0], y = point[1];
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
      const xi = vs[i][0], yi = vs[i][1];
      const xj = vs[j][0], yj = vs[j][1];
      const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi + 0.0000001) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  // Generate alerts for geofence and DTC
  useEffect(() => {
    const newAlerts = [];
    const now = Date.now();

    vehicles.forEach(v => {
      if (v.errors && v.errors.some(e => e.severity >= 2)) {
        const existing = alerts.find(a => a.type === 'DTC' && a.vehicleId === v.id && !a.acknowledged);
        if (!existing) {
          newAlerts.push({
            id: 'a' + Math.random().toFixed(6),
            vehicleId: v.id,
            type: 'DTC',
            severity: 3,
            message: `⚠️ ${v.make} ${v.model}: ${v.errors[0].desc}`,
            timestamp: now,
            acknowledged: false
          });
        }
      }

      geofences.forEach(g => {
        if (!v.location) return;
        const inside = pointInPolygon([v.location.lat, v.location.lng], g.polygon);
        const key = `${v.id}::${g.id}`;
        const prev = !!prevInsideRef.current[key];

        if (inside && !prev) {
          newAlerts.push({
            id: 'a' + Math.random().toFixed(6),
            vehicleId: v.id,
            type: 'geofence-enter',
            severity: 2,
            message: `✓ ${v.make} entró en ${g.name}`,
            timestamp: now,
            acknowledged: false
          });
        }
        if (!inside && prev) {
          newAlerts.push({
            id: 'a' + Math.random().toFixed(6),
            vehicleId: v.id,
            type: 'geofence-exit',
            severity: 1,
            message: `✗ ${v.make} salió de ${g.name}`,
            timestamp: now,
            acknowledged: false
          });
        }
        prevInsideRef.current[key] = inside;
      });
    });

    if (newAlerts.length > 0) {
      setAlerts(prev => [...prev, ...newAlerts].slice(-10));
    }
  }, [vehicles, geofences, alerts]);

  const handleSaveGeofence = () => {
    if (tempPolygonPoints.length < 3 || !geofenceName.trim()) {
      alert('Ingresa al menos 3 puntos y un nombre para la geocerca');
      return;
    }
    const newGeofence = {
      id: 'g' + Date.now(),
      name: geofenceName,
      polygon: tempPolygonPoints
    };
    setGeofences(prev => [...prev, newGeofence]);
    setTempPolygonPoints([]);
    setGeofenceName('');
    setEditingGeofence(false);
  };

  const handleAddVehicle = () => {
    if (!newVehicleForm.make || !newVehicleForm.licensePlate) {
      alert('Marca y Placa son obligatorios');
      return;
    }
    const newVehicle = {
      id: 'v' + Date.now(),
      make: newVehicleForm.make,
      model: newVehicleForm.model || 'N/A',
      year: newVehicleForm.year,
      vin: newVehicleForm.vin || 'VIN-' + Date.now(),
      licensePlate: newVehicleForm.licensePlate,
      currentOdometer: Math.floor(Math.random() * 100000),
      location: { lat: 40.4168 + Math.random() * 0.05, lng: -3.7038 + Math.random() * 0.05 },
      status: 'Parado',
      maintenanceHistory: [],
      errors: Math.random() > 0.7 ? [{ code: 'P0' + Math.floor(Math.random() * 100), desc: 'Error simulado', severity: Math.floor(Math.random() * 3) + 1 }] : []
    };
    setVehicles(prev => [...prev, newVehicle]);
    setNewVehicleForm({ make: '', model: '', year: 2024, vin: '', licensePlate: '' });
    setShowAddVehicleForm(false);
  };

  // Render Leaflet map
  const renderMap = () => {
    return React.createElement(
      'div',
      { style: { width: '100%', height: '500px' } },
      React.createElement(EnhancedMap, {
        vehicles,
        geofences,
        selectedVehicleId,
        onVehicleSelect: setSelectedVehicleId,
        editing: editingGeofence,
        onAddPoint: (point) => setTempPolygonPoints(prev => [...prev, point]),
        tempPoints: tempPolygonPoints
      })
    );
  };

  const renderVehicleList = () => {
    return React.createElement(
      'div',
      { style: { display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '600px', overflowY: 'auto', paddingRight: '10px' } },
      React.createElement(
        'button',
        {
          onClick: () => setShowAddVehicleForm(!showAddVehicleForm),
          disabled: !canCreateVehicle,
          style: {
            backgroundColor: !canCreateVehicle ? '#d1d5db' : tokens.primary,
            color: tokens.primaryContrast,
            border: 'none',
            padding: '10px 12px',
            borderRadius: '4px',
            cursor: !canCreateVehicle ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: '12px',
            width: '100%',
            opacity: !canCreateVehicle ? 0.6 : 1
          }
        },
        showAddVehicleForm ? '✕ Cancelar' : '+ Añadir Vehículo'
      ),
      showAddVehicleForm && React.createElement(
        'div',
        { style: { backgroundColor: tokens.surface, padding: '12px', borderRadius: '4px', border: `1px solid ${tokens.inputBorder}`, fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '8px' } },
        React.createElement('input', {
          placeholder: 'Marca',
          value: newVehicleForm.make,
          onChange: (e) => setNewVehicleForm({...newVehicleForm, make: e.target.value}),
          style: { padding: '6px', border: `1px solid ${tokens.inputBorder}`, borderRadius: '3px', backgroundColor: tokens.inputBg, color: tokens.textPrimary }
        }),
        React.createElement('input', {
          placeholder: 'Modelo',
          value: newVehicleForm.model,
          onChange: (e) => setNewVehicleForm({...newVehicleForm, model: e.target.value}),
          style: { padding: '6px', border: `1px solid ${tokens.inputBorder}`, borderRadius: '3px', backgroundColor: tokens.inputBg, color: tokens.textPrimary }
        }),
        React.createElement('input', {
          placeholder: 'VIN',
          value: newVehicleForm.vin,
          onChange: (e) => setNewVehicleForm({...newVehicleForm, vin: e.target.value}),
          style: { padding: '6px', border: `1px solid ${tokens.inputBorder}`, borderRadius: '3px', backgroundColor: tokens.inputBg, color: tokens.textPrimary }
        }),
        React.createElement('input', {
          placeholder: 'Placa',
          value: newVehicleForm.licensePlate,
          onChange: (e) => setNewVehicleForm({...newVehicleForm, licensePlate: e.target.value}),
          style: { padding: '6px', border: `1px solid ${tokens.inputBorder}`, borderRadius: '3px', backgroundColor: tokens.inputBg, color: tokens.textPrimary }
        }),
        React.createElement(
          'button',
          {
            onClick: handleAddVehicle,
            style: { backgroundColor: '#10b981', color: 'white', border: 'none', padding: '8px', borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold' }
          },
          '✓ Guardar'
        )
      ),
      vehicles.map(v =>
        React.createElement(
          'div',
          {
            key: v.id,
            onClick: () => setSelectedVehicleId(v.id),
            style: {
              backgroundColor: selectedVehicleId === v.id ? tokens.primary : tokens.surface,
              color: selectedVehicleId === v.id ? tokens.primaryContrast : tokens.textPrimary,
              padding: '10px',
              borderRadius: '4px',
              border: `1px solid ${tokens.inputBorder}`,
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontSize: '12px'
            }
          },
          React.createElement('div', { style: { fontWeight: 'bold', marginBottom: '4px' } }, `${v.make} ${v.model}`),
          React.createElement('div', { style: { fontSize: '11px', opacity: 0.7, marginBottom: '4px' } }, v.licensePlate),
          React.createElement('div', { style: { display: 'inline-block', backgroundColor: v.status === 'En ruta' ? '#10b981' : '#6b7280', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' } }, v.status)
        )
      )
    );
  };

  return React.createElement(
    'div',
    { style: { backgroundColor: tokens.background, color: tokens.textPrimary, minHeight: '100vh', display: 'flex', flexDirection: 'column', transition: 'all 0.3s' } },
    // Header
    React.createElement(
      'header',
      { style: { backgroundColor: tokens.surface, padding: '15px 20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${tokens.inputBorder}` } },
      React.createElement('div', null,
        React.createElement('h1', { style: { margin: 0, fontSize: '20px', fontWeight: 'bold', display: 'inline' } }, '🚚 Gestión de Flotas'),
        React.createElement('span', { style: { marginLeft: '15px', fontSize: '12px', color: tokens.textSecondary } }, 
          user && `[${user.role.toUpperCase()}] ${user.name}`
        )
      ),
      React.createElement('div', { style: { display: 'flex', gap: '10px', alignItems: 'center' } },
        React.createElement(
          'button',
          {
            onClick: () => setTheme(theme === 'light' ? 'dark' : 'light'),
            style: { backgroundColor: tokens.primary, color: tokens.primaryContrast, border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }
          },
          theme === 'light' ? '🌙 Dark' : '☀️ Light'
        ),
        React.createElement(
          'button',
          {
            onClick: onLogout,
            style: { backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }
          },
          '🚪 Salir'
        )
      )
    ),
    // Main dashboard grid
    React.createElement(
      'main',
      { style: { display: 'grid', gridTemplateColumns: '250px 1fr 300px', gap: '15px', padding: '15px', flex: 1, overflowY: 'auto' } },
      // LEFT: Vehicle List
      React.createElement(
        'div',
        { style: { backgroundColor: tokens.surface, padding: '15px', borderRadius: '8px', border: `1px solid ${tokens.inputBorder}`, display: 'flex', flexDirection: 'column' } },
        React.createElement('h2', { style: { margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold' } }, `📋 Vehículos (${vehicles.length})`),
        renderVehicleList()
      ),
      // CENTER: Map
      React.createElement(
        'div',
        { style: { backgroundColor: tokens.surface, padding: '15px', borderRadius: '8px', border: `1px solid ${tokens.inputBorder}`, display: 'flex', flexDirection: 'column' } },
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' } },
          React.createElement('h2', { style: { margin: 0, fontSize: '14px', fontWeight: 'bold' } }, '🗺️ Mapa en Tiempo Real'),
          React.createElement(
            'button',
            {
              onClick: () => {
                setEditingGeofence(!editingGeofence);
                if (!editingGeofence) setTempPolygonPoints([]);
              },
              disabled: !canCreateGeofence,
              style: {
                backgroundColor: !canCreateGeofence ? '#d1d5db' : (editingGeofence ? '#ef4444' : '#f59e0b'),
                color: 'white',
                border: 'none',
                padding: '4px 12px',
                borderRadius: '3px',
                cursor: !canCreateGeofence ? 'not-allowed' : 'pointer',
                fontSize: '11px',
                fontWeight: 'bold',
                opacity: !canCreateGeofence ? 0.6 : 1
              }
            },
            !canCreateGeofence ? '🔒 No permitido' : (editingGeofence ? '✕ Cancelar' : '+ Geocerca')
          )
        ),
        editingGeofence && React.createElement(
          'div',
          { style: { display: 'flex', gap: '8px', marginBottom: '10px', fontSize: '11px' } },
          React.createElement('input', {
            type: 'text',
            placeholder: 'Nombre geocerca',
            value: geofenceName,
            onChange: (e) => setGeofenceName(e.target.value),
            style: { flex: 1, padding: '6px', border: `1px solid ${tokens.inputBorder}`, borderRadius: '3px', backgroundColor: tokens.inputBg, color: tokens.textPrimary, fontSize: '11px' }
          }),
          tempPolygonPoints.length > 2 && React.createElement(
            'button',
            {
              onClick: handleSaveGeofence,
              style: { backgroundColor: '#10b981', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }
            },
            '✓ Guardar'
          )
        ),
        editingGeofence && React.createElement('div', { style: { fontSize: '10px', color: tokens.textSecondary, marginBottom: '8px' } }, `📍 Puntos: ${tempPolygonPoints.length} (haz clic en mapa)`),
        renderMap(),
        geofences.length > 0 && React.createElement(
          'div',
          { style: { marginTop: '10px', fontSize: '11px' } },
          React.createElement('strong', null, 'Geocercas:'),
          React.createElement('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' } },
            geofences.map(g =>
              React.createElement('div', { key: g.id, style: { backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '4px 8px', borderRadius: '3px', border: '1px solid #3b82f6', fontSize: '10px' } }, `${g.name}`)
            )
          )
        )
      ),
      // RIGHT: Vehicle Details & Alerts
      React.createElement(
        'div',
        { style: { display: 'flex', flexDirection: 'column', gap: '15px' } },
        // Vehicle Details
        selectedVehicle && React.createElement(
          'div',
          { style: { backgroundColor: tokens.surface, padding: '15px', borderRadius: '8px', border: `1px solid ${tokens.inputBorder}` } },
          React.createElement('h3', { style: { margin: '0 0 10px 0', fontSize: '12px', fontWeight: 'bold' } }, `${selectedVehicle.make} ${selectedVehicle.model}`),
          React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px', marginBottom: '10px' } },
            React.createElement('div', null, React.createElement('strong', null, 'Placa:'), ` ${selectedVehicle.licensePlate}`),
            React.createElement('div', null, React.createElement('strong', null, 'Año:'), ` ${selectedVehicle.year}`),
            React.createElement('div', null, React.createElement('strong', null, 'Odóm:'), ` ${selectedVehicle.currentOdometer} km`),
            React.createElement('div', null, React.createElement('strong', null, 'Estado:'), ` ${selectedVehicle.status}`)
          ),
          React.createElement('div', { style: { fontSize: '10px', color: tokens.textSecondary, wordBreak: 'break-all' } },
            React.createElement('strong', null, 'VIN:'), ` ${selectedVehicle.vin}`
          ),
          selectedVehicle.errors && selectedVehicle.errors.length > 0 && React.createElement(
            'div',
            { style: { marginTop: '10px', padding: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '3px', borderLeft: '3px solid #ef4444' } },
            React.createElement('div', { style: { fontSize: '10px', fontWeight: 'bold', color: '#dc2626', marginBottom: '4px' } }, `⚠️ ${selectedVehicle.errors.length} DTCs`),
            React.createElement('div', { style: { fontSize: '9px' } },
              selectedVehicle.errors.map((e, i) =>
                React.createElement('div', { key: i }, `${e.code}: ${e.desc}`)
              )
            )
          )
        ),
        // Alerts Panel
        React.createElement(
          'div',
          { style: { backgroundColor: tokens.surface, padding: '15px', borderRadius: '8px', border: `1px solid ${tokens.inputBorder}`, flex: 1, overflow: 'auto', minHeight: '200px' } },
          React.createElement('h3', { style: { margin: '0 0 10px 0', fontSize: '12px', fontWeight: 'bold' } }, `🔔 Alertas (${alerts.length})`),
          alerts.length === 0 ? React.createElement('div', { style: { color: tokens.textSecondary, fontSize: '11px' } }, 'Sin alertas') :
          React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '6px' } },
            alerts.slice().reverse().map(a =>
              React.createElement(
                'div',
                { key: a.id, style: { padding: '6px', borderRadius: '3px', fontSize: '10px', backgroundColor: a.severity >= 3 ? 'rgba(239, 68, 68, 0.1)' : a.severity >= 2 ? 'rgba(251, 146, 60, 0.1)' : 'rgba(34, 197, 94, 0.1)', borderLeft: `2px solid ${a.severity >= 3 ? '#ef4444' : a.severity >= 2 ? '#fb923c' : '#22c55e'}` } },
                React.createElement('div', { style: { fontWeight: 'bold' } }, a.message),
                React.createElement('div', { style: { color: tokens.textSecondary, fontSize: '9px', marginTop: '2px' } }, new Date(a.timestamp).toLocaleTimeString())
              )
            )
          )
        )
      )
    )
  );
};

export default PreviewAppFull;
