import React, { useEffect, useRef, useState } from 'react';

// Lightweight Leaflet map component loaded from CDN in the browser (ESM)
const LEAFLET_CSS = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_ESM = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet-src.esm.js';

const ensureLeafletCss = () => {
  if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = LEAFLET_CSS;
    document.head.appendChild(link);
  }
};

const RealTimeMap = ({ vehicles = [], geofences = [], center = [40.4168, -3.7038], zoom = 6, editing = false, onSaveGeofence, onTempPointsChange }) => {
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const markersRef = useRef(new Map());
  const polygonsRef = useRef(new Map());
  const tempPointsRef = useRef([]);
  const editLayerRef = useRef(null);
  const editingRef = useRef(editing);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    let mounted = true;
    ensureLeafletCss();
    (async () => {
      if (!mounted) return;
      try {
        const Lmod = await import(LEAFLET_ESM);
        const L = Lmod.default || Lmod;
        leafletRef.current = L;
        if (!mapRef.current) {
          mapRef.current = L.map('realtime-map', { preferCanvas: true }).setView(center, zoom);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
          }).addTo(mapRef.current);

          // attach click handlers for editing; use editingRef to reflect current editing state
          mapRef.current.on('click', (e) => {
            if (!editingRef.current) return;
            const pt = [e.latlng.lat, e.latlng.lng];
            tempPointsRef.current.push(pt);
            // draw/update temp polyline
            if (!editLayerRef.current) {
              editLayerRef.current = L.polyline(tempPointsRef.current, { color: '#f59e0b' }).addTo(mapRef.current);
            } else {
              editLayerRef.current.setLatLngs(tempPointsRef.current);
            }
            onTempPointsChange && onTempPointsChange(tempPointsRef.current.slice());
          });
        }
      } catch (err) {
        // If Leaflet fails to load, fall back to the built-in SVG renderer
        console.warn('Leaflet load failed, switching to fallback renderer:', err);
        setUseFallback(true);
      }
    })();

    return () => { mounted = false; if (mapRef.current) { try { mapRef.current.remove(); } catch(e){} mapRef.current = null; } };
  }, [editing]);

  // keep editingRef in sync and clear temp points when editing is turned off
  useEffect(() => {
    editingRef.current = editing;
    if (!editing) {
      const map = mapRef.current;
      if (editLayerRef.current && map) {
        try { map.removeLayer(editLayerRef.current); } catch(e){}
        editLayerRef.current = null;
      }
      tempPointsRef.current = [];
      onTempPointsChange && onTempPointsChange([]);
    }
  }, [editing, onTempPointsChange]);

  // react to vehicle and geofence updates
  useEffect(() => {
    if (useFallback) return; // fallback renderer uses props directly
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    // update or create markers
    vehicles.forEach(v => {
      if (!v.location || typeof v.location.lat !== 'number' || typeof v.location.lng !== 'number') return;
      const key = v.id;
      const pos = [v.location.lat, v.location.lng];
      if (markersRef.current.has(key)) {
        const marker = markersRef.current.get(key);
        marker.setLatLng(pos);
        marker.setPopupContent(`<strong>${v.make} ${v.model}</strong><br/>${v.licensePlate || ''}`);
      } else {
        const marker = L.marker(pos).addTo(map).bindPopup(`<strong>${v.make} ${v.model}</strong><br/>${v.licensePlate || ''}`);
        markersRef.current.set(key, marker);
      }
    });

    // remove markers for missing vehicles
    Array.from(markersRef.current.keys()).forEach(key => {
      if (!vehicles.find(v => v.id === key)) {
        const m = markersRef.current.get(key);
        try { map.removeLayer(m); } catch(e){}
        markersRef.current.delete(key);
      }
    });

    // draw geofences
    geofences.forEach(g => {
      const key = g.id;
      if (polygonsRef.current.has(key)) {
        const poly = polygonsRef.current.get(key);
        poly.setLatLngs(g.polygon);
      } else {
        const poly = L.polygon(g.polygon, { color: '#06b6d4', fillOpacity: 0.12 }).addTo(map).bindPopup(`<strong>${g.name}</strong>`);
        polygonsRef.current.set(key, poly);
      }
    });

    // remove polygons for missing geofences
    Array.from(polygonsRef.current.keys()).forEach(key => {
      if (!geofences.find(g => g.id === key)) {
        const p = polygonsRef.current.get(key);
        try { map.removeLayer(p); } catch(e){}
        polygonsRef.current.delete(key);
      }
    });

    // adjust viewport to include markers
    const coords = vehicles.filter(v=>v.location).map(v=>[v.location.lat, v.location.lng]);
    if (coords.length) {
      try { map.fitBounds(coords, { padding: [50,50], maxZoom: 14 }); } catch(e){}
    }
  }, [vehicles, geofences, useFallback]);
  // SVG fallback renderer (simple mercator-ish projection based on extents)
  const FallbackSVG = ({ width = '100%', height = 480 }) => {
    // derive bounds from vehicles + geofences
    const pts = [];
    vehicles.forEach(v => { if (v.location) pts.push([v.location.lat, v.location.lng]); });
    geofences.forEach(g => g.polygon.forEach(p => pts.push([p[0], p[1]])));

    // default to center if no points
    let minLat = center[0] - 0.05, maxLat = center[0] + 0.05, minLng = center[1] - 0.05, maxLng = center[1] + 0.05;
    if (pts.length) {
      minLat = Math.min(...pts.map(p => p[0]));
      maxLat = Math.max(...pts.map(p => p[0]));
      minLng = Math.min(...pts.map(p => p[1]));
      maxLng = Math.max(...pts.map(p => p[1]));
      // pad
      const latPad = (maxLat - minLat) * 0.15 || 0.01;
      const lngPad = (maxLng - minLng) * 0.15 || 0.01;
      minLat -= latPad; maxLat += latPad; minLng -= lngPad; maxLng += lngPad;
    }

    const w = 900; const h = 480; // fixed internal viewport
    const project = (lat, lng) => {
      const x = ((lng - minLng) / (maxLng - minLng || 1)) * w;
      const y = ((maxLat - lat) / (maxLat - minLat || 1)) * h;
      return [x, y];
    };

    return (
      <div style={{ width: '100%', height }}>
        <svg width="100%" height={height} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
          <rect x="0" y="0" width={w} height={h} fill="#e6f7ff" />
          {/* grid */}
          {Array.from({ length: 6 }).map((_,i)=> <line key={'g'+i} x1={0} x2={w} y1={(i+1)*(h/7)} y2={(i+1)*(h/7)} strokeOpacity={0.06} stroke="#000" />)}

          {/* geofences */}
          {geofences.map(g => (
            <polygon key={g.id} points={g.polygon.map(p => project(p[0], p[1]).join(',')).join(' ')} fill="#06b6d4" fillOpacity={0.12} stroke="#0891b2" strokeWidth={1} />
          ))}

          {/* vehicle markers */}
          {vehicles.map(v => v.location ? (() => {
            const [x,y] = project(v.location.lat, v.location.lng);
            return (
              <g key={v.id} transform={`translate(${x},${y})`}>
                <circle r={6} cx={0} cy={0} fill="#ef4444" stroke="#fff" strokeWidth={1.5} />
                <text x={10} y={4} fontSize={12} fill="#052f43">{v.licensePlate || (v.make+' '+v.model)}</text>
              </g>
            );
          })() : null)}
        </svg>
      </div>
    );
  };

  // if using fallback, render SVG map
  if (useFallback) return <FallbackSVG />;

  return (
    <div id="realtime-map" style={{ width: '100%', height: '60vh', borderRadius: 8, overflow: 'hidden' }} />
  );
};

export default RealTimeMap;
