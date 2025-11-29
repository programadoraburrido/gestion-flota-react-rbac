// models/useFirebaseApp.js (Versión con Simulación de DTCs, Mantenimiento Recomendado y Datos RESTAURADOS)

import { useState, useEffect, useMemo, useCallback } from 'react';

// ------------------------- DATOS SIMULADOS INICIALES -------------------------

const MOCK_VEHICLES_DATA = [
    // Ford Transit (v_101): Asignado a user_456 (MANAGER). Tiene 2 registros de mantenimiento.
    { id: 'v_101', make: 'Ford', model: 'Transit', year: 2020, plate: '9876-ABC', vin: 'FORD9876ABC', km: 125000, nextItvDate: '2025-10-20', status: 'Active', location: { lat: 40.45, lon: -3.70 }, assignedToUserId: 'user_456' }, 
    // Mercedes Sprinter (v_102): SIN ASIGNAR. Tiene 1 registro de mantenimiento.
    { id: 'v_102', make: 'Mercedes', model: 'Sprinter', year: 2018, plate: '1234-XYZ', vin: 'MERCEDES1234XYZ', km: 89000, nextItvDate: '2024-03-15', status: 'Maintenance', location: { lat: 40.40, lon: -3.65 } }, 
    // Renault Kangoo (v_103): Asignado a user_456. Sin mantenimiento.
    { id: 'v_103', make: 'Renault', model: 'Kangoo', year: 2022, plate: '5678-DEF', vin: 'RENAULT5678DEF', km: 21000, nextItvDate: '2026-12-01', status: 'Active', location: { lat: 40.42, lon: -3.75 }, assignedToUserId: 'user_456' },
    // Toyota Corolla (v_104): Asignado a user_777 (DRIVER). Tiene 2 DTCs.
    { id: 'v_104', make: 'Toyota', model: 'Corolla', year: 2023, plate: '2345-GHI', vin: 'TOYOTA2345GHI', km: 15000, nextItvDate: '2024-12-10', status: 'Active', location: { lat: 40.48, lon: -3.68 }, assignedToUserId: 'user_777' },
    // Nissan NV200 (v_105): Asignado a user_777. Tiene 1 registro de mantenimiento.
    { id: 'v_105', make: 'Nissan', model: 'NV200', year: 2019, plate: '6789-JKL', vin: 'NISSAN6789JKL', km: 95000, nextItvDate: '2025-03-25', status: 'Maintenance', location: { lat: 40.35, lon: -3.73 }, assignedToUserId: 'user_777' },
    // Volvo FH (v_106): SIN ASIGNAR. Tiene 1 DTC.
    { id: 'v_106', make: 'Volvo', model: 'FH', year: 2017, plate: '1111-VLV', vin: 'VOLVO1111VLV', km: 350000, nextItvDate: '2026-05-01', status: 'Active', location: { lat: 40.30, lon: -3.78 } }, 
];

// ⬇️ REGISTROS DE MANTENIMIENTO (Verificados contra MOCK_VEHICLES_DATA) ⬇️
const MOCK_MAINTENANCE_RECORDS = [
    // Ford Transit (v_101): Costo 150 + 80 = 230€
    { id: 'm_001', vehicleId: 'v_101', date: new Date('2024-04-10'), type: 'Cambio de Aceite', cost: 150.00, notes: 'Mantenimiento estándar A.' },
    { id: 'm_003', vehicleId: 'v_101', date: new Date('2023-11-20'), type: 'ITV Revisada', cost: 80.00, notes: 'Inspección técnica satisfactoria.' },
    // Mercedes Sprinter (v_102): Costo 450€
    { id: 'm_002', vehicleId: 'v_102', date: new Date('2024-02-01'), type: 'Reparación de Freno', cost: 450.00, notes: 'Pastillas y discos delanteros reemplazados.' },
    // Nissan NV200 (v_105): Costo 600€
    { id: 'm_004', vehicleId: 'v_105', date: new Date('2024-10-15'), type: 'Neumáticos', cost: 600.00, notes: 'Cambio de 4 neumáticos de invierno.' },
];

const MOCK_DTC_RECORDS = [
    { id: 'dtc_001', vehicleId: 'v_104', code: 'P0171', description: 'Sistema demasiado pobre (Banco 1)', timestamp: Date.now() - 3600000, severity: 'CRITICAL' },
    { id: 'dtc_002', vehicleId: 'v_104', code: 'C1201', description: 'Fallo de circuito sensor ABS', timestamp: Date.now() - 86400000, severity: 'WARNING' },
    { id: 'dtc_003', vehicleId: 'v_106', code: 'U0100', description: 'Pérdida de comunicación con ECM/PCM', timestamp: Date.now() - 300000, severity: 'CRITICAL' },
];

// ⬇️ BASE DE DATOS SIMULADA DE REGLAS DE MANTENIMIENTO ⬇️
const MAINTENANCE_RULES = {
    'Ford_Transit_2020': [
        { task: 'Cambio de Aceite y Filtros', km_range: '15.000 km', time_range: '1 año', severity: 'MANDATORY' },
        { task: 'Inspección de Frenos', km_range: '30.000 km', time_range: '2 años', severity: 'RECOMMENDED' },
        { task: 'Cambio de Correa de Distribución', km_range: '200.000 km', time_range: '10 años', severity: 'MANDATORY' },
    ],
    'Mercedes_Sprinter_2018': [
        { task: 'Servicio B Mayor', km_range: '60.000 km', time_range: '3 años', severity: 'MANDATORY' },
        { task: 'Inspección de Tren de Rodaje', km_range: '20.000 km', time_range: '1 año', severity: 'RECOMMENDED' },
    ],
    'Toyota_Corolla_2023': [
        { task: 'Rotación de Neumáticos', km_range: '10.000 km', time_range: '6 meses', severity: 'RECOMMENDED' },
        { task: 'Cambio de Bujías', km_range: '90.000 km', time_range: 'N/A', severity: 'MANDATORY' },
    ],
};

// ----------------------------------------------------------------------

const useFirebaseApp = () => {
    const [isReady, setIsReady] = useState(false);
    const [loading, setLoading] = useState(true);
    const [initError, setInitError] = useState(null); 

    const [vehiclesData, setVehiclesData] = useState(MOCK_VEHICLES_DATA); 
    const [maintenanceRecords, setMaintenanceRecords] = useState(MOCK_MAINTENANCE_RECORDS);
    const [dtcRecords, setDtcRecords] = useState(MOCK_DTC_RECORDS);

    useEffect(() => {
        setTimeout(() => {
            setIsReady(true);
            setLoading(false);
        }, 500);
    }, []);

    // UNE VEHÍCULOS CON SUS REGISTROS Y CALCULA EL COSTO
    const vehicles = useMemo(() => {
        return vehiclesData.map(v => {
            const records = maintenanceRecords.filter(r => r.vehicleId === v.id);
            const dtcs = dtcRecords.filter(d => d.vehicleId === v.id);
            
            const totalMaintenanceCost = records.reduce((sum, record) => {
                return sum + (record.cost || 0);
            }, 0);
            
            return {
                ...v,
                maintenanceHistory: records,
                totalMaintenanceCost: totalMaintenanceCost, 
                realtimeDTCs: dtcs, 
            };
        });
    }, [vehiclesData, maintenanceRecords, dtcRecords]);

    // FUNCIÓN PARA OBTENER RECOMENDACIONES POR MODELO
    const getRecommendedMaintenance = useCallback((make, model, year) => {
        const key = `${make}_${model}_${year}`.replace(/\s+/g, '_');
        return MAINTENANCE_RULES[key] || [];
    }, []);

    // --- (El resto de las funciones CRUD) ---
    const addMaintenanceRecord = useCallback(async (vehicleId, recordData) => {
        const newRecordId = 'm_' + Date.now(); 
        const newRecord = {
            id: newRecordId,
            vehicleId,
            date: new Date(recordData.date), 
            type: recordData.type,
            cost: Number(recordData.cost),
            notes: recordData.notes || '',
        };
        setMaintenanceRecords(prev => [...prev, newRecord]);
        return newRecordId;
    }, []);

    const getVehicleMaintenanceRecords = useMemo(() => (id) => {
        const vehicle = vehicles.find(v => v.id === id);
        return (vehicle?.maintenanceHistory || [])
            .sort((a, b) => b.date.getTime() - a.date.getTime()); 
    }, [vehicles]);

    const deleteMaintenanceRecord = useCallback(async (recordId) => {
        setMaintenanceRecords(prev => prev.filter(record => record.id !== recordId));
    }, []);

    const updateVehicleItvDate = useCallback(async (vehicleId, nextItvDate) => {
        setVehiclesData(prevVehicles => prevVehicles.map(v => 
            v.id === vehicleId ? { ...v, nextItvDate: nextItvDate } : v
        ));
        return nextItvDate; 
    }, []);

    const addVehicle = useCallback(async (vehicleData) => {
        const newVehicleId = 'v_' + Date.now();
        const lat = 40.42 + (Math.random() - 0.5) * 0.05;
        const lon = -3.70 + (Math.random() - 0.5) * 0.05;

        const newVehicle = { 
            id: newVehicleId, 
            ...vehicleData, 
            location: { lat, lon },
            plate: vehicleData.plate || `TEMP-${newVehicleId.substring(4)}`,
            assignedToUserId: 'user_123', 
        }; 
        setVehiclesData(prev => [...prev, newVehicle]);
        return newVehicleId;
    }, []);

    return {
        isReady,
        initError,
        vehicles, 
        loading,
        
        addVehicle, 
        
        getRecommendedMaintenance,
        addMaintenanceRecord,
        getVehicleMaintenanceRecords,
        deleteMaintenanceRecord,
        updateVehicleItvDate, 
    };
};

export default useFirebaseApp;