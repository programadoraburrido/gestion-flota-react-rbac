// Simple PDF-like report generator (usando text/html para simplicidad sin dependencias)

const generateFleetReport = (vehicles, alerts, locationHistory, dateRange = 'today') => {
  const now = new Date();
  const reportDate = now.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  
  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter(v => v.status === 'En ruta').length;
  const totalAlerts = alerts.length;
  const criticalAlerts = alerts.filter(a => a.severity >= 3).length;
  
  // Calculate total distance
  let totalDistance = 0;
  Object.keys(locationHistory).forEach(vId => {
    const history = locationHistory[vId] || [];
    for (let i = 1; i < history.length; i++) {
      const prev = history[i - 1];
      const curr = history[i];
      const dist = Math.sqrt(
        Math.pow(curr.lat - prev.lat, 2) + Math.pow(curr.lng - prev.lng, 2)
      ) * 111; // Approx km per degree
      totalDistance += dist;
    }
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Reporte de Flota</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); max-width: 900px; margin: 0 auto; }
        h1 { color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
        .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
        .stat { background: #f3f4f6; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6; }
        .stat-label { font-size: 12px; color: #6b7280; font-weight: bold; }
        .stat-value { font-size: 24px; color: #1f2937; font-weight: bold; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #3b82f6; color: white; padding: 10px; text-align: left; font-weight: bold; }
        td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
        tr:nth-child(even) { background: #f9fafb; }
        .critical { color: #dc2626; font-weight: bold; }
        .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>📊 Reporte de Gestión de Flotas</h1>
        <p>Fecha: ${reportDate}</p>
        
        <div class="summary">
          <div class="stat">
            <div class="stat-label">Vehículos Totales</div>
            <div class="stat-value">${totalVehicles}</div>
          </div>
          <div class="stat">
            <div class="stat-label">En Ruta</div>
            <div class="stat-value" style="color: #10b981;">${activeVehicles}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Alertas Críticas</div>
            <div class="stat-value critical">${criticalAlerts}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Distancia Total</div>
            <div class="stat-value">${totalDistance.toFixed(1)} km</div>
          </div>
        </div>

        <h2>📋 Resumen de Vehículos</h2>
        <table>
          <tr>
            <th>Placa</th>
            <th>Marca/Modelo</th>
            <th>Odómetro</th>
            <th>Estado</th>
            <th>Ubicación</th>
          </tr>
          ${vehicles.map(v => `
            <tr>
              <td><strong>${v.licensePlate}</strong></td>
              <td>${v.make} ${v.model}</td>
              <td>${v.currentOdometer} km</td>
              <td>${v.status}</td>
              <td>${v.location ? `${v.location.lat.toFixed(4)}, ${v.location.lng.toFixed(4)}` : 'N/A'}</td>
            </tr>
          `).join('')}
        </table>

        <h2>🔔 Últimas Alertas</h2>
        <table>
          <tr>
            <th>Vehículo</th>
            <th>Tipo</th>
            <th>Mensaje</th>
            <th>Severidad</th>
            <th>Hora</th>
          </tr>
          ${alerts.slice(-10).reverse().map(a => `
            <tr>
              <td><strong>${vehicles.find(v => v.id === a.vehicleId)?.licensePlate || 'N/A'}</strong></td>
              <td>${a.type}</td>
              <td>${a.message}</td>
              <td><span class="${a.severity >= 3 ? 'critical' : ''}">${a.severity}</span></td>
              <td>${new Date(a.timestamp).toLocaleTimeString('es-ES')}</td>
            </tr>
          `).join('')}
        </table>

        <div class="footer">
          <p>Reporte generado automáticamente el ${reportDate} a las ${now.toLocaleTimeString('es-ES')}</p>
          <p>Sistema de Gestión de Flotas v1.0</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
};

const downloadReport = (vehicles, alerts, locationHistory) => {
  const html = generateFleetReport(vehicles, alerts, locationHistory);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `reporte_flota_${new Date().toISOString().split('T')[0]}.html`;
  link.click();
  URL.revokeObjectURL(url);
};

export { generateFleetReport, downloadReport };
