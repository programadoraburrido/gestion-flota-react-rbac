import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useToast } from './ToastProvider.js';
import { doc, updateDoc, arrayUnion } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';

const VehicleMaintenanceCard = ({ vehicle, db, userId, addMaintenanceEntry }) => {
  const nextOilKm = vehicle.nextOilKm || 0;
  const kmRemaining = Math.max(0, nextOilKm - (vehicle.odometer || 0));
  const [adding, setAdding] = useState(false);
  const [entry, setEntry] = useState({ title: '', date: new Date().toISOString().slice(0,10), km: vehicle.currentOdometer || 0, notes: '', cost: 0 });
  const toast = useToast();

  const submitEntry = async () => {
    const newEntry = { ...entry, date: new Date(entry.date).toISOString(), km: parseInt(entry.km || 0), cost: parseFloat(entry.cost || 0) };

    if (db && userId) {
      try {
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const ref = doc(db, `artifacts/${appId}/users/${userId}/vehicles`, vehicle.id);
        await updateDoc(ref, { maintenanceHistory: arrayUnion(newEntry) });
        toast && toast.showToast && toast.showToast('Entrada de mantenimiento añadida.', { type: 'info' });
        setAdding(false);
        setEntry({ title: '', date: new Date().toISOString().slice(0,10), km: vehicle.currentOdometer || 0, notes: '', cost: 0 });
      } catch (err) {
        toast && toast.showToast && toast.showToast('Error al añadir entrada: ' + (err.message || ''), { type: 'error' });
      }
      return;
    }

    // preview / in-memory fallback
    if (typeof addMaintenanceEntry === 'function') {
      try {
        addMaintenanceEntry(vehicle.id, newEntry);
        toast && toast.showToast && toast.showToast('Entrada de mantenimiento añadida (preview).', { type: 'info' });
        setAdding(false);
        setEntry({ title: '', date: new Date().toISOString().slice(0,10), km: vehicle.currentOdometer || 0, notes: '', cost: 0 });
      } catch (err) {
        toast && toast.showToast && toast.showToast('Error al añadir entrada (preview): ' + (err.message || ''), { type: 'error' });
      }
      return;
    }

    toast && toast.showToast && toast.showToast('No conectado a la base de datos.', { type: 'warn' });
  };

  return (
    <div>
      <h3 className="text-xl font-semibold mb-3">Mantenimiento Preventivo</h3>
      <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900 mb-4">
        <div className="text-sm text-gray-500 dark:text-gray-400">Cambio de Aceite</div>
        <div className="font-medium">Quedan {kmRemaining.toLocaleString('es-ES')} Km</div>
      </div>

      <div className="mb-4">
        {!adding ? (
          <button onClick={() => setAdding(true)} className="px-3 py-2 bg-indigo-600 text-white rounded">Registrar Mantenimiento</button>
        ) : (
          <div className="p-4 border rounded space-y-2 bg-white dark:bg-gray-800">
            <input value={entry.title} onChange={(e) => setEntry(s => ({ ...s, title: e.target.value }))} placeholder="Título" className="w-full p-2 border rounded" />
            <div className="grid grid-cols-3 gap-2">
              <input type="date" value={entry.date} onChange={(e) => setEntry(s => ({ ...s, date: e.target.value }))} className="p-2 border rounded" />
              <input type="number" value={entry.km} onChange={(e) => setEntry(s => ({ ...s, km: e.target.value }))} className="p-2 border rounded" placeholder="Km" />
              <input type="number" value={entry.cost} onChange={(e) => setEntry(s => ({ ...s, cost: e.target.value }))} className="p-2 border rounded" placeholder="Coste" />
            </div>
            <textarea value={entry.notes} onChange={(e) => setEntry(s => ({ ...s, notes: e.target.value }))} placeholder="Notas" className="w-full p-2 border rounded" />
            <div className="flex gap-2">
              <button onClick={submitEntry} className="px-3 py-2 bg-green-600 text-white rounded">Guardar</button>
              <button onClick={() => setAdding(false)} className="px-3 py-2 bg-gray-300 rounded">Cancelar</button>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
        <div className="text-sm text-gray-500 dark:text-gray-400">Intervalos de servicio</div>
        <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-300">
          <li>Cambio de aceite: cada 10,000 Km</li>
          <li>Revisión general: cada 20,000 Km</li>
          <li>Correa distribución: cada 120,000 Km</li>
        </ul>
      </div>
    </div>
  );
};

VehicleMaintenanceCard.propTypes = {
  vehicle: PropTypes.object.isRequired,
  db: PropTypes.object,
  userId: PropTypes.string,
  addMaintenanceEntry: PropTypes.func,
};

export default VehicleMaintenanceCard;
