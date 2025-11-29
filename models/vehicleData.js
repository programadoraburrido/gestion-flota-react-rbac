// Datos y utilidades compartidas (modelo ligero)
export const SERVICE_TYPES = [
  'Oil Change', 'Timing Belt', 'Brakes', 'Tires Rotation', 'Battery Replacement', 'Other'
];

// Datos simulados para decodificación de VIN
export const vinData = {
  'ABC123456': { make: 'FORD', model: 'TRANSIT', year: 2020 },
  'XYZ987654': { make: 'TESLA', model: 'MODEL 3', year: 2022 },
};

// Intervalos de mantenimiento simulados basados en el modelo
export const maintenanceIntervals = {
  'FORD/TRANSIT': { oilChange: 20000, timingBelt: 150000 },
  'TESLA/MODEL 3': { oilChange: 40000, timingBelt: 500000 },
};

/**
 * Simula la respuesta de un modelo de IA para extraer datos de una imagen (ITV/Ficha Técnica).
 */
export const extractITVDateFromImage = async (base64Image) => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  if (base64Image && base64Image.includes('iVBORw0KGgo')) {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 1); // Simula que la última ITV fue hace 1 año
    return date.toISOString().split('T')[0];
  } else {
    throw new Error("No se pudo extraer la fecha de ITV de la imagen.");
  }
};
