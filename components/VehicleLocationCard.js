import React from 'react';
import PropTypes from 'prop-types';

const VehicleLocationCard = ({ vehicle }) => {
  const { gps } = vehicle;
  if (!gps) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Sin datos GPS disponibles.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
        <div className="text-sm text-gray-500 dark:text-gray-400">Última ubicación</div>
        <div className="font-medium">{gps.address || `${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}`}</div>
        <div className="text-xs text-gray-400">Registrado: {new Date(gps.ts).toLocaleString()}</div>
      </div>

      <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
        <div className="text-sm text-gray-500 dark:text-gray-400">Velocidad</div>
        <div className="font-medium">{gps.speed ? `${gps.speed} km/h` : '—'}</div>
      </div>
    </div>
  );
};

VehicleLocationCard.propTypes = {
  vehicle: PropTypes.object.isRequired,
};

export default VehicleLocationCard;
