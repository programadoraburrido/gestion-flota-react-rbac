// components/AddMaintenanceRecordForm.js (Versión corregida usando React.createElement)

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useToast } from './ToastProvider.js';

const AddMaintenanceRecordForm = ({ vehicleId, addMaintenanceRecord, onClose }) => {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().substring(0, 10), // Fecha de hoy en formato YYYY-MM-DD
        type: '',
        cost: '',
        notes: '',
    });
    const [loading, setLoading] = useState(false);
    const { addToast } = useToast();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!formData.type || !formData.date || !formData.cost) {
            addToast({ message: "Por favor, complete todos los campos requeridos.", type: 'warning' });
            setLoading(false);
            return;
        }

        try {
            await addMaintenanceRecord(vehicleId, formData);
            addToast({ message: 'Registro de mantenimiento añadido con éxito.', type: 'success' });
            onClose(); // Cierra el formulario
        } catch (error) {
            addToast({ message: `Error al guardar: ${error.message}`, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // ⬅️ LA LÍNEA 43 es probablemente el inicio del return principal o del formulario.
    // Sustituimos todo el JSX del componente por React.createElement()

    return React.createElement('div', { className: "p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 mb-6" },
        
        React.createElement('h4', { className: "text-xl font-bold mb-4" }, "Nuevo Registro de Mantenimiento"),
        
        // Formulario
        React.createElement('form', { onSubmit: handleSubmit, className: "space-y-3" },
            
            // Input: Fecha
            React.createElement('div', null,
                React.createElement('label', { htmlFor: "date", className: "block text-sm font-medium" }, "Fecha"),
                React.createElement('input', {
                    type: "date", name: "date", value: formData.date, onChange: handleChange, required: true,
                    className: "w-full p-2 border rounded dark:bg-gray-600 dark:border-gray-500"
                })
            ),
            
            // Input: Tipo de Mantenimiento
            React.createElement('div', null,
                React.createElement('label', { htmlFor: "type", className: "block text-sm font-medium" }, "Tipo de Mantenimiento"),
                React.createElement('input', {
                    type: "text", name: "type", value: formData.type, onChange: handleChange, required: true,
                    placeholder: "Ej. Cambio de Aceite, Neumáticos, Reparación",
                    className: "w-full p-2 border rounded dark:bg-gray-600 dark:border-gray-500"
                })
            ),

            // Input: Costo
            React.createElement('div', null,
                React.createElement('label', { htmlFor: "cost", className: "block text-sm font-medium" }, "Costo (€)"),
                React.createElement('input', {
                    type: "number", name: "cost", value: formData.cost, onChange: handleChange, required: true,
                    step: "0.01", min: "0",
                    className: "w-full p-2 border rounded dark:bg-gray-600 dark:border-gray-500"
                })
            ),

            // Input: Notas
            React.createElement('div', null,
                React.createElement('label', { htmlFor: "notes", className: "block text-sm font-medium" }, "Notas"),
                React.createElement('textarea', {
                    name: "notes", value: formData.notes, onChange: handleChange, rows: "3",
                    className: "w-full p-2 border rounded dark:bg-gray-600 dark:border-gray-500"
                })
            ),
            
            // Botones Cancelar/Guardar
            React.createElement('div', { className: "flex justify-end space-x-2" },
                React.createElement('button', {
                    type: "button", onClick: onClose,
                    className: "px-4 py-2 border rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                }, "Cancelar"),
                
                React.createElement('button', {
                    type: "submit", disabled: loading,
                    className: "px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                }, loading ? 'Guardando...' : 'Guardar Registro')
            )
        )
    );
};

AddMaintenanceRecordForm.propTypes = {
  vehicleId: PropTypes.string.isRequired,
  addMaintenanceRecord: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default AddMaintenanceRecordForm;