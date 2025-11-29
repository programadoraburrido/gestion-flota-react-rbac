// components/AddVehicleView.js (Versión corregida usando React.createElement)

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useToast } from './ToastProvider.js';

const AddVehicleView = ({ setView, userId, vehicles }) => {
  // Nota: Asumimos que la función para añadir el vehículo (addVehicle) 
  // se pasa a través de props o se importa si existe en useFirebaseApp.js.
  // Como no fue pasada a AddVehicleView en appCoche.js, la simulamos.
  const addVehicle = ({ make, model, plate }) => {
      // Simulación de añadir vehículo al estado local (deberías tener esta función en useFirebaseApp.js)
      console.log(`Simulando añadir: ${make} ${model}`);
      // Aquí iría la lógica real si la tuvieras
  };

  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    plate: '',
    year: new Date().getFullYear().toString(),
    km: '0'
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.make || !formData.model || !formData.plate) {
      addToast({ message: "Por favor, complete al menos Marca, Modelo y Matrícula.", type: 'warning' });
      setLoading(false);
      return;
    }

    try {
      await addVehicle(formData);
      addToast({ message: `Vehículo ${formData.plate} añadido con éxito.`, type: 'success' });
      setView('list'); // Volver a la lista
    } catch (error) {
      addToast({ message: `Error al añadir: ${error.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // ⬅️ La línea 97 es probablemente el inicio del return o el formulario.
  // Sustituimos todo el JSX del componente por React.createElement()

  return React.createElement('div', { className: "p-4 max-w-lg mx-auto" },
    
    // Título y Botón de Volver
    React.createElement('div', { className: "flex justify-between items-center mb-6" },
        React.createElement('h2', { className: "text-2xl font-bold" }, "Añadir Nuevo Vehículo"),
        React.createElement('button', {
            onClick: () => setView('list'), 
            className: "text-blue-500 hover:underline" 
        }, "← Volver a la Lista")
    ),

    // Formulario
    React.createElement('form', { 
        onSubmit: handleSubmit, 
        className: "bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg space-y-4" 
    },
      
      // Input: Marca
      React.createElement('div', null,
        React.createElement('label', { htmlFor: "make", className: "block text-sm font-medium mb-1" }, "Marca *"),
        React.createElement('input', {
          type: "text", name: "make", value: formData.make, onChange: handleChange, required: true,
          className: "w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
        })
      ),

      // Input: Modelo
      React.createElement('div', null,
        React.createElement('label', { htmlFor: "model", className: "block text-sm font-medium mb-1" }, "Modelo *"),
        React.createElement('input', {
          type: "text", name: "model", value: formData.model, onChange: handleChange, required: true,
          className: "w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
        })
      ),
      
      // Input: Matrícula
      React.createElement('div', null,
        React.createElement('label', { htmlFor: "plate", className: "block text-sm font-medium mb-1" }, "Matrícula *"),
        React.createElement('input', {
          type: "text", name: "plate", value: formData.plate, onChange: handleChange, required: true,
          className: "w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
        })
      ),
      
      // Input: Año
      React.createElement('div', null,
        React.createElement('label', { htmlFor: "year", className: "block text-sm font-medium mb-1" }, "Año"),
        React.createElement('input', {
          type: "number", name: "year", value: formData.year, onChange: handleChange,
          className: "w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
        })
      ),
      
      // Input: Kilometraje (KM)
      React.createElement('div', null,
        React.createElement('label', { htmlFor: "km", className: "block text-sm font-medium mb-1" }, "Kilometraje (KM)"),
        React.createElement('input', {
          type: "number", name: "km", value: formData.km, onChange: handleChange, min: "0",
          className: "w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
        })
      ),

      // Botón de Envío
      React.createElement('button', {
        type: "submit",
        disabled: loading,
        className: "w-full mt-4 p-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-50"
      }, loading ? 'Añadiendo...' : 'Añadir Vehículo a la Flota')
    )
  );
};

AddVehicleView.propTypes = {
  vehicles: PropTypes.array.isRequired,
  setView: PropTypes.func.isRequired,
  userId: PropTypes.string.isRequired,
};

export default AddVehicleView;