import React from 'react';
import PropTypes from 'prop-types';

const MaintenanceHistoryView = ({ vehicle }) => {
  const history = vehicle.maintenanceHistory || [];

  if (history.length === 0) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">No hay historial de mantenimiento.</p>;
  }

  return (
    <div>
  <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Historial</h3>
      <ul className="space-y-3">
        {history.map((h, i) => (
          <li key={i} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
            <div className="font-medium">{h.title || 'Mantenimiento'}</div>
            <div className="text-sm text-gray-500 dark:text-gray-300">{new Date(h.date).toLocaleDateString()} - {h.km ? `${h.km.toLocaleString('es-ES')} Km` : ''}</div>
            <div className="text-sm mt-2 text-gray-600 dark:text-gray-300">{h.notes}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

MaintenanceHistoryView.propTypes = {
  vehicle: PropTypes.object.isRequired,
};

export default MaintenanceHistoryView;
