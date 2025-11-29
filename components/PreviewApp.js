import React, { useState, useMemo } from 'react';
import VehicleListView from './VehicleListView.js';
import VehicleDetailsView from './VehicleDetailsView.js';
import AddVehicleView from './AddVehicleView.js';
import LoadingSpinner from './LoadingSpinner.js';
import { palette } from './themePalette.js';
import RealTimeMap from './RealTimeMap.js';
import { useToast } from './ToastProvider.js';
import AlertsPanel from './AlertsPanel.js';

const mockVehicles = [
  {
    id: 'v1', make: 'FORD', model: 'TRANSIT', year: 2020, vin: 'ABC123456', licensePlate: '1234ABC', currentOdometer: 45200,
    maintenanceHistory: [{ title: 'Cambio aceite', date: new Date().toISOString(), km: 35200, cost: 120, type: 'Oil Change' }],
    errors: [{ code: 'P0420', desc: 'Catalyst Efficiency Below Threshold', severity: 2 }],
    lastITVDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString(),
    nextITVDate: new Date(new Date().setMonth(new Date().getMonth() + 2)).toISOString(),
    location: { lat: 40.4168, lng: -3.7038 }
  },
  {
    id: 'v2', make: 'TESLA', model: 'MODEL 3', year: 2022, vin: 'XYZ987654', licensePlate: '5678DEF', currentOdometer: 12000,
    maintenanceHistory: [],
    errors: [],
    lastITVDate: null,
    nextITVDate: null,
    location: { lat: 40.4379, lng: -3.6795 }
  }
];

const PreviewApp = () => {
  const [currentView, setView] = useState('list');
  const [vehicles, setVehicles] = useState(mockVehicles);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [theme, setTheme] = useState('light');
  const [geofences, setGeofences] = useState([]);
  const [editingGeofence, setEditingGeofence] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const prevInsideRef = React.useRef({});
  const [tempPolygonPoints, setTempPolygonPoints] = useState([]);
  const [geofenceName, setGeofenceName] = useState('');
  const toast = useToast();

  const tokens = palette[theme] || palette.light;

  const selectedVehicle = useMemo(() => vehicles.find(v => v.id === selectedVehicleId), [vehicles, selectedVehicleId]);

  // simulation: move vehicles slightly to demonstrate realtime tracking in preview
  React.useEffect(() => {
    const t = setInterval(() => {
      setVehicles(prev => prev.map(v => {
        if (!v.location) return v;
        const variance = 0.0005; // small movement
        const lat = v.location.lat + (Math.random() - 0.5) * variance;
        const lng = v.location.lng + (Math.random() - 0.5) * variance;
        return { ...v, location: { lat, lng } };
      }));
    }, 2000);
    return () => clearInterval(t);
  }, []);

  // helper: point-in-polygon (ray-casting)
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

  // generate alerts for geofence enter/exit and critical DTCs
  React.useEffect(() => {
    const newAlerts = [];
    const now = Date.now();

    // DTC criticals
    vehicles.forEach(v => {
      if (v.errors && v.errors.some(e => e.severity >= 3)) {
        const existing = alerts.find(a => a.type === 'DTC' && a.vehicleId === v.id && !a.acknowledged);
        if (!existing) {
          newAlerts.push({ id: 'a' + (Math.random()*100000).toFixed(0), vehicleId: v.id, type: 'DTC', severity: 3, message: `Códigos DTC críticos en ${v.make} ${v.model}`, timestamp: now, acknowledged: false });
        }
      }
    });

    // geofence enter/exit
    vehicles.forEach(v => {
      if (!v.location) return;
      geofences.forEach(g => {
        const inside = pointInPolygon([v.location.lat, v.location.lng], g.polygon);
        const key = `${v.id}::${g.id}`;
        const prev = !!prevInsideRef.current[key];
        if (inside && !prev) {
          newAlerts.push({ id: 'a' + (Math.random()*100000).toFixed(0), vehicleId: v.id, type: 'geofence-enter', severity: 2, message: `${v.make} ${v.model} ha entrado en ${g.name}`, timestamp: now, acknowledged: false });
        }
        if (!inside && prev) {
          newAlerts.push({ id: 'a' + (Math.random()*100000).toFixed(0), vehicleId: v.id, type: 'geofence-exit', severity: 1, message: `${v.make} ${v.model} ha salido de ${g.name}`, timestamp: now, acknowledged: false });
        }
        prevInsideRef.current[key] = inside;
      });
    });

    if (newAlerts.length) {
      setAlerts(prev => {
        const merged = [...newAlerts, ...prev].slice(0, 200);
        // show toasts for new alerts
        if (toast && toast.showToast) {
          newAlerts.forEach(a => toast.showToast(a.message, { type: a.severity >= 3 ? 'error' : a.severity === 2 ? 'warn' : 'info', timeout: 5000 }));
        }
        return merged;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicles, geofences]);

  const onAdd = (v) => {
    const newV = { id: 'v' + (Math.random() * 10000).toFixed(0), ...v };
    setVehicles(prev => [newV, ...prev]);
    setView('list');
  };

  const openAddView = () => setView('add');

  const updateVehicle = (id, patch) => {
    setVehicles(prev => prev.map(x => x.id === id ? { ...x, ...patch } : x));
  };

  const addMaintenanceEntry = (id, entry) => {
    setVehicles(prev => prev.map(x => x.id === id ? { ...x, maintenanceHistory: [...(x.maintenanceHistory||[]), entry] } : x));
  };

  const renderContent = () => {
  if (currentView === 'map') return <RealTimeMap vehicles={vehicles} geofences={geofences} editing={editingGeofence} onSaveGeofence={(g) => { setGeofences(prev => [g, ...prev]); setEditingGeofence(false); }} onTempPointsChange={(pts) => setTempPolygonPoints(pts)} />;
    if (currentView === 'add') return <AddVehicleView setView={setView} userId={null} db={null} vehicles={vehicles} onAdd={onAdd} />;
    if (currentView === 'details' && selectedVehicle) return <VehicleDetailsView vehicle={selectedVehicle} setView={setView} vehicles={vehicles} db={null} userId={null} />;
    return <VehicleListView vehicles={vehicles} setView={setView} setSelectedVehicleId={(id) => { setSelectedVehicleId(id); setView('details'); }} />;
  };

  return (
    <div className={`${theme} min-h-screen font-sans transition-colors duration-300`} style={{ background: tokens.background, color: tokens.textPrimary }}>
      <header className="flex justify-between items-center p-4 shadow-md" style={{ background: tokens.surface }}>
        <h1 className="text-xl font-bold" style={{ color: tokens.textPrimary }}>Preview - Gestión de Flota</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')} className="px-3 py-1 rounded" aria-label="Alternar tema" style={{ background: tokens.surface }}>
            {theme === 'light' ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="5" />
                <g>
                  <rect x="11.5" y="1" width="1" height="3" />
                  <rect x="11.5" y="20" width="1" height="3" />
                  <rect x="1" y="11.5" width="3" height="1" />
                  <rect x="20" y="11.5" width="3" height="1" />
                  <rect x="4.2" y="4.2" width="1" height="3" transform="rotate(-45 4.7 5.7)" />
                  <rect x="18.8" y="17.8" width="1" height="3" transform="rotate(-45 19.3 19.3)" />
                  <rect x="4.2" y="16.8" width="1" height="3" transform="rotate(45 4.7 18.3)" />
                  <rect x="18.8" y="6.2" width="1" height="3" transform="rotate(45 19.3 7.7)" />
                </g>
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            )}
          </button>
          <button onClick={() => setView('map')} className="px-3 py-1 rounded" style={{ background: tokens.surface, color: tokens.textPrimary }}>Mapa</button>
          <button onClick={() => { setEditingGeofence(e => !e); setView('map'); }} className="px-3 py-1 rounded" style={{ background: editingGeofence ? '#ef4444' : tokens.surface, color: tokens.textPrimary }}>{editingGeofence ? 'Cancel Geofence' : 'Crear Geocerca'}</button>
          <button onClick={openAddView} className="px-3 py-1 rounded" style={{ background: tokens.primary, color: tokens.primaryContrast }}>+ Añadir</button>
        </div>
      </header>

      <main className="container mx-auto p-4">
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            {currentView === 'details' && selectedVehicleId && (
              <VehicleDetailsView vehicle={vehicles.find(v=>v.id===selectedVehicleId)} setView={setView} vehicles={vehicles} db={null} userId={null} updateVehicle={updateVehicle} addMaintenanceEntry={addMaintenanceEntry} />
            )}
            {currentView !== 'details' && renderContent()}
            {editingGeofence && (
              <div style={{ position: 'absolute', left: 12, top: 12, zIndex: 60, background: '#111827', color: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 4px 18px rgba(0,0,0,0.2)' }}>
                <div style={{ marginBottom: 8 }}>Modo crear geocerca — puntos actuales: {tempPolygonPoints.length}</div>
                <input placeholder="Nombre geocerca" value={geofenceName} onChange={(e) => setGeofenceName(e.target.value)} style={{ padding:6, borderRadius:6, marginBottom:8, width:220 }} />
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => {
                    if (!tempPolygonPoints || tempPolygonPoints.length < 3) { alert('Añade al menos 3 puntos'); return; }
                    const g = { id: 'g' + (Math.random()*10000).toFixed(0), name: geofenceName || 'Geocerca', polygon: tempPolygonPoints };
                    setGeofences(prev => [g, ...prev]);
                    setEditingGeofence(false);
                    setTempPolygonPoints([]);
                    setGeofenceName('');
                    toast && toast.showToast && toast.showToast('Geocerca creada', { type: 'info' });
                  }} style={{ padding:6, background:'#10b981', color:'#fff', border:'none', borderRadius:6 }}>Guardar</button>
                  <button onClick={() => { setEditingGeofence(false); setTempPolygonPoints([]); setGeofenceName(''); }} style={{ padding:6, background:'#ef4444', color:'#fff', border:'none', borderRadius:6 }}>Cancelar</button>
                </div>
              </div>
            )}
          </div>
          <AlertsPanel alerts={alerts} onAcknowledge={(id) => setAlerts(prev => prev.map(a=>a.id===id?{...a,acknowledged:true}:a))} />
        </div>
      </main>
    </div>
  );
};

export default PreviewApp;
