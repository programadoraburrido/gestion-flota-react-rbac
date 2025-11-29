import React, { useEffect, useRef, useState } from 'react';

const EnhancedMap = ({ vehicles = [], geofences = [], selectedVehicleId, onVehicleSelect, editing = false, onAddPoint, tempPoints = [], mapProvider = 'satellite' }) => {
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const markersRef = useRef(new Map());
  const polygonsRef = useRef(new Map());
  const [mapReady, setMapReady] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  // Load Leaflet dynamically
  useEffect(() => {
    const loadLeaflet = async () => {
      try {
        // Add Leaflet CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
        document.head.appendChild(link);

        // Add Leaflet JS
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
        script.onload = () => {
          const L = window.L;
          if (L && mapRef.current) {
            const map = L.map(mapRef.current).setView([40.4168, -3.7038], 13);
            
            // Satellite tiles (Esri)
            L.tileLayer(
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
              {
                attribution: '© Esri',
                maxZoom: 18
              }
            ).addTo(map);

            leafletRef.current = { L, map };
            setMapReady(true);
          }
        };
        document.head.appendChild(script);
      } catch (err) {
        console.error('Leaflet load error:', err);
        setUseFallback(true);
      }
    };

    if (!mapReady && mapRef.current && !leafletRef.current) {
      loadLeaflet();
    }
  }, [mapReady]);

  // Update vehicle markers
  useEffect(() => {
    if (!mapReady || !leafletRef.current) return;

    const { L, map } = leafletRef.current;

    vehicles.forEach(v => {
      if (!v.location) return;

      const id = v.id;
      const isSelected = id === selectedVehicleId;
      const color = isSelected ? '#ef4444' : '#10b981';

      if (markersRef.current.has(id)) {
        const marker = markersRef.current.get(id);
        marker.setLatLng([v.location.lat, v.location.lng]);
      } else {
        const marker = L.circleMarker([v.location.lat, v.location.lng], {
          radius: isSelected ? 12 : 8,
          fillColor: color,
          color: 'white',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
        })
          .bindPopup(`<strong>${v.licensePlate}</strong><br>${v.make} ${v.model}`)
          .addTo(map)
          .on('click', () => onVehicleSelect(id));

        markersRef.current.set(id, marker);
      }

      // Update color if selection changed
      if (markersRef.current.has(id)) {
        markersRef.current.get(id).setStyle({ fillColor: color, radius: isSelected ? 12 : 8 });
      }
    });
  }, [vehicles, selectedVehicleId, mapReady]);

  // Update geofences
  useEffect(() => {
    if (!mapReady || !leafletRef.current) return;

    const { L, map } = leafletRef.current;

    geofences.forEach(g => {
      if (!polygonsRef.current.has(g.id)) {
        const polygon = L.polygon(g.polygon, {
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.1,
          weight: 2
        })
          .bindPopup(`<strong>${g.name}</strong>`)
          .addTo(map);

        polygonsRef.current.set(g.id, polygon);
      }
    });
  }, [geofences, mapReady]);

  // Handle map clicks for drawing geofences
  useEffect(() => {
    if (!mapReady || !leafletRef.current || !editing) return;

    const { map } = leafletRef.current;

    const handleClick = (e) => {
      if (editing) {
        onAddPoint([e.latlng.lat, e.latlng.lng]);
      }
    };

    map.on('click', handleClick);
    return () => map.off('click', handleClick);
  }, [editing, mapReady]);

  // Render temp points
  useEffect(() => {
    if (!mapReady || !leafletRef.current) return;

    const { L, map } = leafletRef.current;

    // Clear temp polyline
    if (markersRef.current.has('_tempLine')) {
      map.removeLayer(markersRef.current.get('_tempLine'));
      markersRef.current.delete('_tempLine');
    }

    if (tempPoints.length > 0) {
      const polyline = L.polyline(tempPoints, { color: '#f59e0b', dashArray: '5,5', weight: 2 }).addTo(map);
      markersRef.current.set('_tempLine', polyline);

      tempPoints.forEach((p, i) => {
        const key = `_temp_${i}`;
        if (markersRef.current.has(key)) {
          markersRef.current.get(key).setLatLng(p);
        } else {
          const marker = L.circleMarker(p, { radius: 5, fillColor: '#f59e0b', color: 'white', weight: 1, fillOpacity: 1 }).addTo(map);
          markersRef.current.set(key, marker);
        }
      });
    }
  }, [tempPoints, mapReady]);

  if (useFallback) {
    return React.createElement(
      'div',
      { style: { width: '100%', height: '100%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' } },
      React.createElement('div', { style: { textAlign: 'center', color: '#666' } },
        React.createElement('div', null, '🗺️ Mapa Leaflet no disponible'),
        React.createElement('div', { style: { fontSize: '12px', marginTop: '10px' } }, 'Intenta recargar la página')
      )
    );
  }

  return React.createElement(
    'div',
    {
      ref: mapRef,
      style: {
        width: '100%',
        height: '100%',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        cursor: editing ? 'crosshair' : 'grab'
      }
    }
  );
};

export default EnhancedMap;
