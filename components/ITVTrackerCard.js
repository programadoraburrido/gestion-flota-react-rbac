import React from 'react';
import PropTypes from 'prop-types';

const ITVTrackerCard = ({ vehicle }) => {
  const itv = (vehicle.itv && vehicle.itv.nextDate) ? new Date(vehicle.itv.nextDate) : null;
  if (!itv) return <p className="text-sm text-gray-500 dark:text-gray-400">No hay datos de ITV.</p>;

  const days = Math.ceil((itv - new Date()) / (1000 * 60 * 60 * 24));
  const formatted = itv.toLocaleDateString();

  return (
    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
      <div className="text-sm text-gray-500 dark:text-gray-400">Próxima ITV</div>
      <div className="font-medium">{formatted} ({days} días)</div>
    </div>
  );
};

ITVTrackerCard.propTypes = {
  vehicle: PropTypes.object.isRequired,
};

export default ITVTrackerCard;
