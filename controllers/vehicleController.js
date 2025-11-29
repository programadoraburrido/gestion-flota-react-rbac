import { maintenanceIntervals } from '../models/vehicleData.js';

export const useVehicleAlerts = (vehicle) => {
  const intervals = maintenanceIntervals[`${vehicle.make}/${vehicle.model}`] || {};
  const today = new Date();

  const criticalDTC = (vehicle.errors || []).filter(e => e.severity === 3).length > 0;

  let itvDue = false;
  let daysUntilNextITV = null;
  if (vehicle.nextITVDate) {
    const nextITV = new Date(vehicle.nextITVDate);
    const diffTime = nextITV.getTime() - today.getTime();
    daysUntilNextITV = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    itvDue = daysUntilNextITV <= 60;
  }

  let oilDue = false;
  let kmRemainingOil = null;
  const lastOilService = (vehicle.maintenanceHistory || []).filter(s => s.type === 'Oil Change').sort((a, b) => b.km - a.km)[0];
  
  if (lastOilService && intervals.oilChange) {
    kmRemainingOil = (lastOilService.km + intervals.oilChange) - vehicle.currentOdometer;
    oilDue = kmRemainingOil <= 3000;
  }

  const totalMaintenanceCost = (vehicle.maintenanceHistory || []).reduce((sum, service) => sum + (service.cost || 0), 0);
  const highCostAlert = totalMaintenanceCost >= 5000;

  const generalSeverity = (criticalDTC ? 3 : 0) + (itvDue ? 2 : 0) + (oilDue ? 1 : 0) + (highCostAlert ? 1 : 0);
  
  return {
    criticalDTC,
    itvDue,
    oilDue,
    highCostAlert,
    kmRemainingOil: kmRemainingOil !== null ? Math.max(0, kmRemainingOil) : null,
    totalMaintenanceCost: totalMaintenanceCost,
    generalSeverity,
    daysUntilNextITV: daysUntilNextITV
  };
};
