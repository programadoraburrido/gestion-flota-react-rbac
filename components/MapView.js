// components/MapView.js

import React, { useEffect, useRef, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

// La librería Leaflet no está en importmap, así que la cargamos desde un CDN.
// Esto es para que el componente no falle al cargar sin un bundler.
// Asegúrate de que Leaflet.css también se carga en tu index.html si es necesario.
const L = window.L; 

// Hook simulado para la localización en tiempo real
const useVehicleLocations = (initialVehicles) => {
    const [locations, setLocations] = useState(initialVehicles);

    useEffect(() => {
        // Simulación: Actualiza la posición de los vehículos cada 5 segundos
        const interval = setInterval(() => {
            setLocations(prev => 
                prev.map(v => ({
                    ...v,
                    // Pequeño movimiento aleatorio
                    location: {
                        lat: v.location.lat + (Math.random() - 0.5) * 0.005, 
                        lon: v.location.lon + (Math.random() - 0.5) * 0.005
                    }
                }))
            );
        }, 5000); // Actualización cada 5 segundos

        return () => clearInterval(interval);
    }, [initialVehicles]);

    return locations;
};


const MapView = ({ vehicles, setView }) => {
    const mapRef = useRef(null);
    const tileLayerRef = useRef(null);
    const markersRef = useRef({});

    // Usa el hook de simulación de localización
    const realtimeVehicles = useVehicleLocations(vehicles);

    // Inicializa el mapa solo una vez
    useEffect(() => {
        if (!mapRef.current && L) {
            // Coordenadas medias de Madrid (donde están tus datos simulados)
            const mapInstance = L.map('map-container').setView([40.416775, -3.703790], 12); 
            mapRef.current = mapInstance;

            tileLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(mapInstance);
        }

        // Limpieza: Asegúrate de destruir el mapa cuando el componente se desmonte
        return () => {
             if (mapRef.current) {
                 mapRef.current.remove();
                 mapRef.current = null;
             }
         };
    }, []); 
    
    // ----------------------------------------------------------------------
    // Actualización de marcadores y posiciones en tiempo real
    // ----------------------------------------------------------------------
    useEffect(() => {
        if (!mapRef.current || !L) return;

        // Limpia marcadores obsoletos
        Object.keys(markersRef.current).forEach(id => {
            if (!realtimeVehicles.find(v => v.id === id)) {
                mapRef.current.removeLayer(markersRef.current[id]);
                delete markersRef.current[id];
            }
        });

        realtimeVehicles.forEach(v => {
            const lat = v.location.lat;
            const lon = v.location.lon;

            if (markersRef.current[v.id]) {
                // Actualiza posición del marcador existente
                markersRef.current[v.id].setLatLng([lat, lon]);
            } else {
                // Crea nuevo marcador
                const marker = L.marker([lat, lon]).addTo(mapRef.current);
                marker.bindPopup(`<b>${v.make} ${v.model}</b><br>${v.plate}`).openPopup();
                markersRef.current[v.id] = marker;
            }
        });

    }, [realtimeVehicles]);


    // ⬅️ Corrección de JSX
    return React.createElement('div', { className: "p-4" },
        React.createElement('div', { className: "flex justify-between items-center mb-4" },
            React.createElement('h2', { className: "text-2xl font-bold dark:text-white" }, "Localización en Tiempo Real"),
            React.createElement('button', {
                onClick: () => setView('list'),
                className: "text-blue-500 hover:underline"
            }, "← Volver a la Lista")
        ),
        
        // Contenedor del mapa. Debe tener una altura definida para Leaflet.
        React.createElement('div', { id: "map-container", className: "w-full rounded-lg shadow-xl", style: { height: '600px' } })
    );
};

MapView.propTypes = {
  vehicles: PropTypes.array.isRequired,
  setView: PropTypes.func.isRequired,
};

export default MapView;