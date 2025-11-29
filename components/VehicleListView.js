// components/VehicleListView.js (Versión Final con RBAC, Costo y Responsividad)

import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useVehicleAlerts } from '../controllers/vehicleController.js'; 
import { useAuth } from './AuthContext.js'; // ⬅️ IMPORTADO PARA RBAC

const VehicleListView = ({ vehicles, setView, setSelectedVehicleId }) => {
  const [query, setQuery] = useState('');
  const [yearFilter, setYearFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('km');

  const { checkPermission } = useAuth(); // Hook de autenticación
  const canCreate = checkPermission('create'); // Verifica permiso para crear

  // Cálculo de años disponibles
  const years = useMemo(() => {
    const s = new Set();
    vehicles.forEach(v => { if (v.year) s.add(v.year); });
    return Array.from(s).sort((a,b)=>b-a);
  }, [vehicles]);

  // Enriquecer vehículos con datos de alerta y costo
  const vehiclesWithAlerts = useMemo(() => {
      return vehicles.map(v => ({
          ...v,
          // totalMaintenanceCost ahora viene adjunto desde useFirebaseApp
          // useVehicleAlerts devuelve solo { generalSeverity }
          ...useVehicleAlerts(v) 
      }));
  }, [vehicles]); 

  // Filtrado y Ordenación
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    
    let list = vehiclesWithAlerts.filter(v => {
      if (q) {
        const haystack = `${v.vin || ''} ${v.licensePlate || ''} ${v.make || ''} ${v.model || ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      
      if (yearFilter !== 'all' && String(v.year) !== String(yearFilter)) return false;
      
      if (severityFilter !== 'all') {
        const sev = v.generalSeverity || 0;
        if (severityFilter === 'low' && sev > 0) return false;
        if (severityFilter === 'medium' && (sev < 2 || sev > 3)) return false;
        if (severityFilter === 'high' && sev < 4) return false;
      }
      return true;
    });

    // Ordenación
    if (sortBy === 'km') {
      list.sort((a,b) => (b.currentOdometer || 0) - (a.currentOdometer || 0));
    } else if (sortBy === 'cost') {
      list.sort((a,b) => (b.totalMaintenanceCost || 0) - (a.totalMaintenanceCost || 0)); 
    }

    return list;
  }, [vehiclesWithAlerts, query, yearFilter, severityFilter, sortBy]);


  // Renderizado principal (Todo convertido a React.createElement)
  return React.createElement('div', { className: "p-4 sm:p-6" },
    
    // Contenedor principal de filtros y botón Añadir (Responsivo)
    React.createElement('div', { className: "flex flex-wrap justify-between items-start mb-6 gap-4" },
      
      // Contenedor de Título y Filtros
      React.createElement('div', { className: "flex flex-col w-full" }, 
        // Título
        React.createElement('h2', { className: "text-2xl font-bold text-gray-800 dark:text-gray-100" }, `Mi Flota (${vehicles.length})`),
        
        // Contenedor de Filtros (Responsivo)
        React.createElement('div', { className: "mt-2 flex flex-wrap gap-2 w-full" },
          // Input Buscar
          React.createElement('input', {
            value: query,
            onChange: (e) => setQuery(e.target.value),
            placeholder: "Buscar por VIN, matrícula, marca o modelo",
            className: "p-2 rounded border border-gray-300 dark:bg-gray-700 dark:border-gray-600 w-full sm:w-auto"
          }),
          // Select Año
          React.createElement('select', {
            value: yearFilter,
            onChange: (e) => setYearFilter(e.target.value),
            className: "p-2 rounded border border-gray-300 dark:bg-gray-700 dark:border-gray-600"
          }, 
            React.createElement('option', { value: "all" }, "Todos los años"),
            years.map(y => React.createElement('option', { key: y, value: y }, y))
          ),
          // Select Severidad
          React.createElement('select', {
            value: severityFilter,
            onChange: (e) => setSeverityFilter(e.target.value),
            className: "p-2 rounded border border-gray-300 dark:bg-gray-700 dark:border-gray-600"
          }, 
            React.createElement('option', { value: "all" }, "Cualquier severidad"),
            React.createElement('option', { value: "low" }, "Baja (OK)"),
            React.createElement('option', { value: "medium" }, "Media (Atención)"),
            React.createElement('option', { value: "high" }, "Alta (Crítica)")
          ),
          // Select Ordenar Por
          React.createElement('select', {
            value: sortBy,
            onChange: (e) => setSortBy(e.target.value),
            className: "p-2 rounded border border-gray-300 dark:bg-gray-700 dark:border-gray-600"
          }, 
            React.createElement('option', { value: "km" }, "Ordenar por Km (desc)"),
            React.createElement('option', { value: "cost" }, "Ordenar por coste mantenimiento (desc)")
          )
        )
      ),

      // Botón Añadir Vehículo (RESTRINGIDO POR RBAC)
      canCreate && React.createElement('button', { // ⬅️ Solo se muestra si checkPermission('create') es true
        onClick: () => setView('add'),
        className: "px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors self-start" 
      }, "+ Añadir Vehículo")
    ),

    // Contenido de la Lista
    filtered.length === 0 
      ? React.createElement('div', { className: "text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-xl shadow-inner border border-dashed border-gray-300 dark:border-gray-700" },
          React.createElement('p', { className: "text-xl font-medium text-gray-500 dark:text-gray-400" }, "No hay vehículos que coincidan con los filtros.")
        )
      : React.createElement('div', { className: "space-y-4" },
        filtered.map(vehicle => {
          // totalMaintenanceCost ahora es leído directamente del objeto 'vehicle'
          const { generalSeverity, totalMaintenanceCost } = vehicle;
          
          let alertClass = 'border-gray-300 dark:border-gray-700';
          if (generalSeverity >= 4) {
             alertClass = 'border-red-600 dark:border-red-500 ring-2 ring-red-300';
          } else if (generalSeverity >= 2) {
             alertClass = 'border-yellow-500 dark:border-yellow-400 ring-2 ring-yellow-200';
          }

          return React.createElement('div', {
            key: vehicle.id,
            onClick: () => { setSelectedVehicleId(vehicle.id); setView('details'); },
            className: `flex justify-between items-center p-4 bg-white dark:bg-gray-700 rounded-xl shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300 border-l-8 ${alertClass}`
          },
            // Datos del vehículo
            React.createElement('div', null,
              React.createElement('p', { className: "text-xl font-bold text-gray-900 dark:text-white" }, `${vehicle.make} ${vehicle.model} (${vehicle.year || 'N/A'})`),
              React.createElement('p', { className: "text-sm text-gray-500 dark:text-gray-300" }, `VIN: ${vehicle.vin || 'N/A'} | Matrícula: ${vehicle.licensePlate || vehicle.plate || 'N/A'}`),
              
              // Renderizado del Costo Total
              React.createElement('p', { className: "text-sm font-semibold mt-1 text-indigo-600 dark:text-indigo-400" },
                  `Costo Total Mantenimiento: ${
                      (typeof totalMaintenanceCost === 'number') 
                      ? totalMaintenanceCost.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }) 
                      : 'N/A'
                  }`
              )
            ),
            // Alerta y Botón
            React.createElement('div', { className: "text-right" },
              React.createElement('span', { className: `px-3 py-1 text-xs font-semibold rounded-full ${generalSeverity > 0 ? 'bg-red-500 text-white animate-pulse' : 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100'}` },
                generalSeverity > 0 ? `ALERTA CRÍTICA (${generalSeverity})` : 'OK'
              ),
              React.createElement('p', { className: "text-sm text-gray-500 dark:text-gray-300 mt-1" }, "Ver Detalles →")
            )
          );
        })
      )
  );
};

VehicleListView.propTypes = {
  vehicles: PropTypes.array.isRequired,
  setView: PropTypes.func.isRequired,
  setSelectedVehicleId: PropTypes.func.isRequired,
};

export default VehicleListView;