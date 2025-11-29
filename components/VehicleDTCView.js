import React from 'react';
import PropTypes from 'prop-types';

const VehicleDTCView = ({ vehicle, db, userId }) => {
  // Render diagnostic trouble codes and controls to clear them (placeholder)
  const dtcs = vehicle.dtcs || [];

  return (
    <div>
      <h3 className="text-xl font-semibold mb-3">Códigos DTC ({dtcs.length})</h3>
      {dtcs.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No hay códigos DTC registrados.</p>
      ) : (
        <ul className="space-y-2">
          {dtcs.map((code, idx) => (
            <li key={idx} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg flex justify-between items-center">
              <div>
                <div className="font-medium">{code.code} - {code.desc}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Severidad: {code.severity}</div>
              </div>
              <div>
                <button className="ml-2 bg-red-600 text-white px-3 py-1 rounded text-sm">Quitar</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

VehicleDTCView.propTypes = {
  vehicle: PropTypes.object.isRequired,
  db: PropTypes.object,
  userId: PropTypes.string,
};

export default VehicleDTCView;
