// components/VehicleDetailsView.js (Versión Final con FIX para TypeError en length)

import React, { useState, useMemo } from 'react';
import { useToast } from './ToastProvider.js'; 
import AddMaintenanceRecordForm from './AddMaintenanceRecordForm.js'; 
import { useAuth } from './AuthContext.js';

const VehicleDetailsView = ({ 
    vehicle, setView, 
    getVehicleMaintenanceRecords, 
    addMaintenanceRecord, 
    deleteMaintenanceRecord,
    updateVehicleItvDate,
    getRecommendedMaintenance
}) => { 
    
    const { addToast } = useToast();
    const { checkPermission } = useAuth();
    
    const canUpdate = checkPermission('update');
    const canDelete = checkPermission('delete');
    
    const [isAddingMaintenance, setIsAddingMaintenance] = useState(false);
    
    // Obtener recomendaciones del manual
    const recommendedMaintenance = useMemo(() => {
        return getRecommendedMaintenance(vehicle.make, vehicle.model, vehicle.year);
    }, [vehicle, getRecommendedMaintenance]);
    
    // Lógica de Fechas y Alertas para ITV
    const checkItvStatus = useMemo(() => {
        if (!vehicle.nextItvDate) {
            return { status: 'none', message: 'Fecha de próxima ITV no registrada.', color: 'gray', alertColor: 'bg-gray-100 border-gray-500' };
        }
        
        const nextDate = new Date(vehicle.nextItvDate);
        const today = new Date();
        const diffDays = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
            return { status: 'overdue', message: `¡ITV Vencida! Hace ${Math.abs(diffDays)} días.`, color: 'red', alertColor: 'bg-red-100 border-red-500' };
        } else if (diffDays <= 90) { 
            return { status: 'warning', message: `La ITV vence en ${diffDays} días (${new Date(vehicle.nextItvDate).toLocaleDateString()}).`, color: 'yellow', alertColor: 'bg-yellow-100 border-yellow-500' };
        } else {
            return { status: 'ok', message: `Próxima ITV: ${new Date(vehicle.nextItvDate).toLocaleDateString()}.`, color: 'green', alertColor: 'bg-green-100 border-green-500' };
        }
    }, [vehicle.nextItvDate]);
    
    // ⬇️ FIX CRÍTICO: Aseguramos que sea un array vacío si es undefined ⬇️
    const maintenanceHistory = getVehicleMaintenanceRecords(vehicle.id) || []; 
    
    const dtcList = vehicle.realtimeDTCs || []; 

    // Simulación de OCR/IA para la ITV
    const handleItvScanSimulation = () => {
        if (!canUpdate) {
            addToast({ message: "Permiso denegado. Se requiere el permiso 'update'.", type: 'warning' });
            return;
        }
        
        const newDate = prompt("SIMULACIÓN OCR/IA: Introduce la fecha de próxima ITV (YYYY-MM-DD):");
        if (newDate && /^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
            updateVehicleItvDate(vehicle.id, newDate)
                .then(() => {
                    addToast({ message: `Fecha de ITV actualizada a ${newDate}.`, type: 'success' });
                })
                .catch(error => {
                    addToast({ message: `Error al actualizar ITV: ${error.message}`, type: 'error' });
                });
        } else if (newDate) {
             addToast({ message: "Formato de fecha inválido. Use YYYY-MM-DD.", type: 'error' });
        }
    };
    
    const handleDeleteRecord = (recordId) => {
        if (!canDelete) {
            addToast({ message: "Permiso denegado. Se requiere el permiso 'delete'.", type: 'warning' });
            return;
        }

        if (window.confirm('¿Estás seguro de que quieres eliminar este registro de mantenimiento?')) {
            deleteMaintenanceRecord(recordId)
                .then(() => {
                    addToast({ message: 'Registro eliminado con éxito.', type: 'success' });
                })
                .catch(error => {
                    addToast({ message: `Error al eliminar: ${error.message}`, type: 'error' });
                });
        }
    };

    // Estilo para DTC
    const getColorClass = (severity) => {
        switch (severity) {
            case 'CRITICAL': return 'border-red-500 bg-red-100 text-red-800';
            case 'WARNING': return 'border-yellow-500 bg-yellow-100 text-yellow-800';
            default: return 'border-gray-500 bg-gray-100 text-gray-800';
        }
    };

    // ------------------------- Renderizado -------------------------
    
    return React.createElement('div', { className: "p-4" },
        
        // Título y Botón Volver
        React.createElement('h2', { className: "text-3xl font-bold mb-4" }, `${vehicle.make} ${vehicle.model} (${vehicle.plate})`),
        React.createElement('button', { onClick: () => setView('list'), className: "text-blue-500 mb-4" }, "← Volver a la Flota"),

        // SECCIÓN 1: Alerta ITV
        React.createElement('div', { className: `p-4 rounded-lg mb-6 shadow-md border-l-4 ${checkItvStatus.alertColor}` },
            React.createElement('p', { className: `font-semibold text-lg text-${checkItvStatus.color}-700 dark:text-${checkItvStatus.color}-300` }, 
                `Estado ITV: ${checkItvStatus.message}`
            ),
            React.createElement('button', {
                onClick: handleItvScanSimulation,
                disabled: !canUpdate,
                className: "mt-3 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            }, "Simular Escaneo Ficha (OCR/IA)")
        ),

        // SECCIÓN 2: Recomendaciones del Manual 
        React.createElement('h3', { className: "text-2xl font-semibold mt-8 mb-4 border-b pb-2" }, "Recomendaciones del Manual"),
        
        recommendedMaintenance.length === 0 ? (
            React.createElement('p', { className: "text-gray-500 italic" }, "No se encontraron datos de mantenimiento recomendados para este modelo."),
             React.createElement('p', { className: "text-xs text-gray-400 mt-1" }, "Nota: La recomendación se busca por Modelo y Año, ej: Ford Transit 2020.")
        ) : (
            React.createElement('ul', { className: "space-y-3" },
                recommendedMaintenance.map((item, index) => React.createElement('li', {
                    key: index,
                    className: "p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border-l-4 border-purple-500"
                },
                    React.createElement('p', { className: "font-bold" }, item.task),
                    React.createElement('p', { className: "text-sm text-gray-600 dark:text-gray-400" }, 
                        `Rango recomendado: ${item.km_range} ó ${item.time_range} (${item.severity})`
                    )
                ))
            )
        ),

        // SECCIÓN 3: DTC (Códigos de Diagnóstico)
        React.createElement('h3', { className: "text-2xl font-semibold mt-8 mb-4 border-b pb-2" }, "DTC (Códigos de Diagnóstico)"),

        dtcList.length === 0 ? (
            React.createElement('p', { className: "text-gray-500 italic" }, "No se detectaron códigos de falla activos.")
        ) : (
            React.createElement('ul', { className: "space-y-4" },
                dtcList.map(dtc => React.createElement('li', { 
                    key: dtc.id, 
                    className: `p-4 shadow-sm rounded-lg border-l-4 font-semibold ${getColorClass(dtc.severity)}`
                },
                    React.createElement('p', { className: "font-bold" }, `${dtc.code}: ${dtc.description}`),
                    React.createElement('p', { className: "text-sm font-normal opacity-80" }, 
                        `Detectado el: ${new Date(dtc.timestamp).toLocaleString()}`
                    )
                ))
            )
        ),
        
        // SECCIÓN 4: Historial de Mantenimiento
        React.createElement('h3', { className: "text-2xl font-semibold mt-8 mb-4 border-b pb-2" }, "Historial de Mantenimiento"),
        
        canUpdate && React.createElement('button', {
            onClick: () => setIsAddingMaintenance(true),
            className: "bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition mb-4"
        }, "+ Añadir Registro"),
        
        isAddingMaintenance && canUpdate && (
            React.createElement(AddMaintenanceRecordForm, { 
                vehicleId: vehicle.id, 
                addMaintenanceRecord: addMaintenanceRecord, 
                onClose: () => setIsAddingMaintenance(false) 
            })
        ),
        
        // Lista de Registros
        maintenanceHistory.length === 0 ? (
            React.createElement('p', { className: "text-gray-500 italic" }, "No hay registros de mantenimiento para este vehículo.")
        ) : (
            React.createElement('ul', { className: "space-y-4" },
                maintenanceHistory.map(record => (
                    React.createElement('li', { 
                        key: record.id, 
                        className: "p-4 bg-white dark:bg-gray-700 shadow-sm rounded-lg border-l-4 border-blue-500 flex justify-between items-start" 
                    },
                        React.createElement('div', null,
                            React.createElement('p', { className: "font-bold text-lg" }, 
                                `${record.type} - `, 
                                React.createElement('span', { className: "text-sm font-normal text-gray-500 dark:text-gray-300" }, record.date.toLocaleDateString())
                            ),
                            React.createElement('p', { className: "text-sm text-gray-600 dark:text-gray-300 italic" }, record.notes),
                            React.createElement('p', { className: "text-md font-semibold mt-1" }, `Costo: $${record.cost.toFixed(2)}`)
                        ),
                        canDelete && React.createElement('button', {
                            onClick: () => handleDeleteRecord(record.id),
                            className: "text-red-500 hover:text-red-700 text-sm p-1",
                            title: "Eliminar registro"
                        }, "[X]")
                    )
                ))
            )
        )
    );
};

export default VehicleDetailsView;