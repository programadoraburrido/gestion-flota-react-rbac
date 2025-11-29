import React from 'react';
import { vinData } from '../models/vehicleData.js';
import { useVehicleAlerts } from '../controllers/vehicleController.js';
import { palette } from './themePalette.js';

// Non-JSX preview mount that mirrors the real components behavior (search, filters, DTC, GPS, add with VIN lookup)
function formatCurrency(n) {
  return n.toLocaleString ? n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }) : `${n} €`;
}

function PreviewMount() {
  const [vehicles, setVehicles] = React.useState([
    { id: 'v1', make: 'FORD', model: 'TRANSIT', year: 2020, vin: 'ABC123456', licensePlate: '1234ABC', currentOdometer: 45200, maintenanceHistory: [{ title: 'Cambio aceite', date: new Date().toISOString(), km: 35200, cost: 120, type: 'Oil Change' }], errors: [{ code: 'P0420', desc: 'Catalyst Efficiency Below Threshold', severity: 2 }], gps: { lat: 40.4168, lng: -3.7038, ts: Date.now(), speed: 65, address: 'Madrid, Calle Falsa 123' }, lastITVDate: new Date().toISOString(), nextITVDate: new Date(new Date().setMonth(new Date().getMonth()+2)).toISOString() },
    { id: 'v2', make: 'TESLA', model: 'MODEL 3', year: 2022, vin: 'XYZ987654', licensePlate: '5678DEF', currentOdometer: 12000, maintenanceHistory: [], errors: [], gps: null, lastITVDate: null, nextITVDate: null }
  ]);

  const [theme, setTheme] = React.useState('light');
  const [view, setView] = React.useState('list');
  const [selected, setSelected] = React.useState(null);

  // search & filters
  const [query, setQuery] = React.useState('');
  const [yearFilter, setYearFilter] = React.useState('all');
  const [severityFilter, setSeverityFilter] = React.useState('all');
  const [sortBy, setSortBy] = React.useState('km');

  const years = React.useMemo(() => {
    const s = new Set();
    vehicles.forEach(v => { if (v.year) s.add(v.year); });
    return Array.from(s).sort((a,b)=>b-a);
  }, [vehicles]);

  const filtered = React.useMemo(() => {
    const q = (query || '').trim().toLowerCase();
    let list = vehicles.filter(v => {
      if (q) {
        const haystack = `${v.vin || ''} ${v.licensePlate || ''} ${v.make || ''} ${v.model || ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (yearFilter !== 'all' && String(v.year) !== String(yearFilter)) return false;
      if (severityFilter !== 'all') {
        const sev = useVehicleAlerts(v).generalSeverity;
        if (severityFilter === 'low' && sev > 0) return false;
        if (severityFilter === 'medium' && (sev < 2 || sev > 3)) return false;
        if (severityFilter === 'high' && sev < 4) return false;
      }
      return true;
    });

    if (sortBy === 'km') {
      list.sort((a,b) => (b.currentOdometer || 0) - (a.currentOdometer || 0));
    } else if (sortBy === 'cost') {
      list.sort((a,b) => {
        const aCost = (a.maintenanceHistory || []).reduce((s,x)=>s+(x.cost||0),0);
        const bCost = (b.maintenanceHistory || []).reduce((s,x)=>s+(x.cost||0),0);
        return bCost - aCost;
      });
    }

    return list;
  }, [vehicles, query, yearFilter, severityFilter, sortBy]);

  // theme-aware styles for preview inputs/labels
  // Improved theme-aware styles with better contrast in dark mode
  const token = palette[theme] || palette.light;
  const labelStyle = { color: token.textPrimary, fontSize: 14, marginBottom: 4, fontWeight: 500 };
  const inputStyle = {
    padding: 8,
    borderRadius: 6,
    border: `1px solid ${token.inputBorder}`,
    minWidth: 240,
    color: token.textPrimary,
    background: token.inputBg
  };
  const selectStyle = {
    padding: 8,
    borderRadius: 6,
    color: token.textPrimary,
    background: token.inputBg,
    border: `1px solid ${token.inputBorder}`
  };

  // Add vehicle with VIN lookup (local vinData)
  const addVehicleFromForm = (payload) => {
    const id = 'v' + Math.floor(Math.random()*1000000);
    const newV = { id, ...payload };
    setVehicles(prev => [newV, ...prev]);
    setView('list');
  };

  const onShow = (id) => {
    const v = vehicles.find(x=>x.id===id);
    setSelected(v);
    setView('details');
  };

  // helper for opening the Add view (ensure stable reference for handlers)
  const openAddView = () => {
    // guard and set
    try {
      setView('add');
    } catch (e) {
      // fallback: log to console so we can debug if setView isn't available
      // eslint-disable-next-line no-console
      console.error('openAddView failed', e);
      alert('No se puede abrir el formulario de añadir (ver consola)');
    }
  };

  // UI pieces using createElement
  const Header = React.createElement('header', { style: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:16, background: token.surface, color: token.textPrimary } },
    React.createElement('h1', { style: { margin:0 } }, 'Preview - Gestión de Flota'),
    React.createElement('div', null,
    React.createElement('button', { onClick: () => setTheme(t=> t==='light'?'dark':'light'), style: { marginRight:8, padding:6, borderRadius:8, background: token.surface, border:'1px solid transparent' }, 'aria-label': 'Alternar tema' },
        // Sun / Moon SVG silhouette (larger)
        theme === 'light'
          ? React.createElement('svg', { width:28, height:28, viewBox:'0 0 24 24', fill:'currentColor', xmlns:'http://www.w3.org/2000/svg' },
              React.createElement('circle', { cx:12, cy:12, r:5 }),
              React.createElement('g', null,
                React.createElement('rect', { x:11.5, y:1, width:1, height:3 }),
                React.createElement('rect', { x:11.5, y:20, width:1, height:3 }),
                React.createElement('rect', { x:1, y:11.5, width:3, height:1 }),
                React.createElement('rect', { x:20, y:11.5, width:3, height:1 }),
                React.createElement('rect', { x:4.2, y:4.2, width:1, height:3, transform:'rotate(-45 4.7 5.7)' }),
                React.createElement('rect', { x:18.8, y:17.8, width:1, height:3, transform:'rotate(-45 19.3 19.3)' }),
                React.createElement('rect', { x:4.2, y:16.8, width:1, height:3, transform:'rotate(45 4.7 18.3)' }),
                React.createElement('rect', { x:18.8, y:6.2, width:1, height:3, transform:'rotate(45 19.3 7.7)' })
              )
            )
          : React.createElement('svg', { width:28, height:28, viewBox:'0 0 24 24', fill:'currentColor', xmlns:'http://www.w3.org/2000/svg' },
              React.createElement('path', { d:'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z' })
            )
      ),
      React.createElement('button', { onClick: openAddView, type: 'button', style: { background: token.primary, color: token.primaryContrast, padding:'8px 10px', borderRadius:8, border:'none', cursor: 'pointer', zIndex: 20, position: 'relative' } }, '+ Añadir')
    )
  );

  // Inject theme-specific CSS to control placeholder and form contrast (works around inline style limits)
  const themeCSS = `
    .preview-root input::placeholder { color: ${theme === 'light' ? '#6b7280' : '#94a3b8'}; }
    .preview-root select { color: ${token.textPrimary}; }
    .preview-root input, .preview-root select, .preview-root textarea { box-shadow: none; }
  `;

  const ListFilters = React.createElement('div', { style: { display:'flex', gap:8, alignItems:'center', marginBottom:12 } },
    React.createElement('input', { value: query, onChange: (e)=>setQuery(e.target.value), placeholder: 'Buscar por VIN, matrícula, marca o modelo', style: inputStyle }),
    React.createElement('select', { value: yearFilter, onChange: (e)=>setYearFilter(e.target.value), style: selectStyle },
      React.createElement('option', { value: 'all' }, 'Todos los años'),
      years.map(y => React.createElement('option', { key: y, value: y }, y))
    ),
    React.createElement('select', { value: severityFilter, onChange: (e)=>setSeverityFilter(e.target.value), style: selectStyle },
      React.createElement('option', { value: 'all' }, 'Cualquier severidad'),
      React.createElement('option', { value: 'low' }, 'Baja (OK)'),
      React.createElement('option', { value: 'medium' }, 'Media (Atención)'),
      React.createElement('option', { value: 'high' }, 'Alta (Crítica)')
    ),
    React.createElement('select', { value: sortBy, onChange: (e)=>setSortBy(e.target.value), style: selectStyle },
      React.createElement('option', { value: 'km' }, 'Ordenar por Km (desc)'),
      React.createElement('option', { value: 'cost' }, 'Ordenar por coste mantenimiento (desc)')
    )
  );

  const ListView = React.createElement('div', { style: { padding:16 } },
    ListFilters,
    filtered.length === 0 ? React.createElement('div', { style: { padding:20, textAlign:'center' } }, 'No hay vehículos que coincidan con los filtros.') :
    filtered.map(v => {
      const alerts = useVehicleAlerts(v);
      const totalMaintenanceCost = (v.maintenanceHistory || []).reduce((s,x)=>s+(x.cost||0),0);
      const severity = alerts.generalSeverity;
      const bg = severity >= 4 ? (theme === 'light' ? '#fff1f2' : '#3b0b0f') : severity >= 2 ? (theme === 'light' ? '#fff7ed' : '#422913') : (theme === 'light' ? '#ecfeff' : token.surface);
  return React.createElement('div', { key: v.id, onClick: () => onShow(v.id), style: { padding:12, marginBottom:8, borderRadius:10, background: bg, display:'flex', justifyContent:'space-between', cursor:'pointer' } },
        React.createElement('div', null,
          React.createElement('div', { style: { fontWeight:700, color: token.textPrimary } }, `${v.make} ${v.model} (${v.year})`),
          React.createElement('div', { style: { fontSize:12, color: token.textSecondary } }, `VIN: ${v.vin} | Matrícula: ${v.licensePlate}`),
          React.createElement('div', { style: { marginTop:6, color: token.textPrimary, fontWeight:600 } }, `Costo mantenimiento: ${formatCurrency(totalMaintenanceCost)}`)
        ),
        React.createElement('div', { style: { textAlign:'right' } },
            React.createElement('div', { style: { padding:'4px 8px', borderRadius:20, background: severity>0 ? '#ef4444' : '#10b981', color:'#fff', display:'inline-block', fontSize:12 } }, severity>0 ? `ALERTA (${severity})` : 'OK'),
            React.createElement('div', { style: { fontSize:12, color: token.textSecondary, marginTop:6 } }, 'Ver Detalles →')
          )
      );
    })
  );

  const DetailsView = selected ? React.createElement('div', { style: { padding:16 } },
    React.createElement('button', { onClick: ()=> setView('list'), style: { marginBottom:12 } }, '← Volver'),
    React.createElement('h2', null, `${selected.make} ${selected.model} (${selected.year})`),
    React.createElement('p', null, `Matrícula: ${selected.licensePlate}`),
    React.createElement('p', null, `VIN: ${selected.vin}`),
    React.createElement('div', { style: { marginTop:12 } },
      React.createElement('strong', null, 'Historial de Mantenimiento'),
      (selected.maintenanceHistory || []).length === 0 ? React.createElement('p', null, 'No hay historial') : React.createElement('ul', null, (selected.maintenanceHistory || []).map((h,i)=> React.createElement('li',{key:i}, `${h.title} - ${new Date(h.date).toLocaleDateString()} - ${h.km ? h.km + ' Km' : ''} - ${h.cost ? formatCurrency(h.cost) : ''}`)))
    ),
    React.createElement('div', { style: { marginTop:12 } },
      React.createElement('strong', null, 'Códigos DTC'),
      (selected.errors || []).length === 0 ? React.createElement('p', null, 'No hay códigos DTC registrados.') : React.createElement('ul', null, (selected.errors || []).map((d,i)=> React.createElement('li',{key:i}, `${d.code} - ${d.desc} (sev:${d.severity})`)))
    ),
    React.createElement('div', { style: { marginTop:12 } },
      React.createElement('strong', null, 'Última Ubicación'),
  selected.gps ? React.createElement('div', null, React.createElement('div', null, selected.gps.address || `${selected.gps.lat.toFixed(4)}, ${selected.gps.lng.toFixed(4)}`), React.createElement('div', { style: { fontSize:12, color: token.textSecondary } }, `Registrado: ${new Date(selected.gps.ts).toLocaleString()}`)) : React.createElement('p', null, 'Sin datos GPS')
    )
  ) : React.createElement('div', null, 'No seleccionado');

  // Add view with VIN lookup or manual
  const AddView = React.createElement('div', { style: { padding:16 } },
    React.createElement(AddForm, { onAdd: addVehicleFromForm, vehicles })
  );

  return React.createElement('div', { className: 'preview-root', style: { minHeight:'100vh', background: token.background, color: token.textPrimary } },
    Header,
    React.createElement('style', null, themeCSS),
    React.createElement('main', { style: { maxWidth: 980, margin:'20px auto' } }, view === 'list' ? ListView : view === 'details' ? DetailsView : AddView)
  );
}

// Small add form implemented without JSX
function AddForm({ onAdd, vehicles }) {
  const [vin, setVin] = React.useState('');
  const [license, setLicense] = React.useState('');
  const [form, setForm] = React.useState({ make:'', model:'', year:'', currentOdometer:0 });
  const [isManual, setIsManual] = React.useState(false);

  const lookupVin = () => {
    const v = vinData[vin.toUpperCase()];
    if (v) {
      setForm(prev => ({ ...prev, ...v }));
      setIsManual(false);
      return;
    }
    const found = vehicles.find(x => x.vin && x.vin.toUpperCase() === vin.toUpperCase());
    if (found) {
      setForm(prev => ({ ...prev, make: found.make, model: found.model, year: found.year }));
      setLicense(found.licensePlate || '');
      setIsManual(false);
      return;
    }
    setIsManual(true);
  };

  const submit = (e) => {
    e && e.preventDefault && e.preventDefault();
    const payload = { vin: vin || form.vin, licensePlate: license || form.licensePlate, make: form.make, model: form.model, year: form.year, currentOdometer: Number(form.currentOdometer || 0) };
    onAdd(payload);
  };

  return React.createElement('form', { onSubmit: submit, style: { display:'flex', flexDirection:'column', gap:8 } },
    React.createElement('div', null, React.createElement('label', { style: labelStyle }, 'VIN'), React.createElement('div', { style: { display:'flex', gap:8 } }, React.createElement('input', { value: vin, onChange: (e)=>setVin(e.target.value), placeholder:'VIN', style: { ...inputStyle, minWidth:160 } }), React.createElement('button', { type:'button', onClick: lookupVin, style: { padding:'6px 10px' } }, 'Buscar VIN'))),
    React.createElement('div', null, React.createElement('label', { style: labelStyle }, 'Matrícula'), React.createElement('input', { value: license, onChange: (e)=>setLicense(e.target.value), placeholder:'Matrícula', style: { ...inputStyle, minWidth:240 } })),
    React.createElement('div', null, React.createElement('label', { style: labelStyle }, 'Marca'), React.createElement('input', { value: form.make, onChange: (e)=>setForm({...form, make: e.target.value}), placeholder:'Marca', disabled: !isManual && !!form.make, style: { ...inputStyle, minWidth:240 } })),
    React.createElement('div', null, React.createElement('label', { style: labelStyle }, 'Modelo'), React.createElement('input', { value: form.model, onChange: (e)=>setForm({...form, model: e.target.value}), placeholder:'Modelo', disabled: !isManual && !!form.model, style: { ...inputStyle, minWidth:240 } })),
    React.createElement('div', null, React.createElement('label', { style: labelStyle }, 'Año'), React.createElement('input', { value: form.year, onChange: (e)=>setForm({...form, year: e.target.value}), placeholder:'Año', type:'number', style: { ...inputStyle, minWidth:120 } })),
    React.createElement('div', null, React.createElement('label', { style: labelStyle }, 'Km actual'), React.createElement('input', { value: form.currentOdometer, onChange: (e)=>setForm({...form, currentOdometer: e.target.value}), type:'number', style: { ...inputStyle, minWidth:160 } })),
    React.createElement('div', null, React.createElement('button', { type:'submit', style: { background: token.primary, color: token.primaryContrast, padding:'8px 10px', borderRadius:6, border:'none' } }, 'Guardar'))
  );
}

export default PreviewMount;
