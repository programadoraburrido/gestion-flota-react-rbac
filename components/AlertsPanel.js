import React from 'react';
import PropTypes from 'prop-types';

const AlertsPanel = ({ alerts = [], onAcknowledge }) => {
  return (
    <div style={{ width: 320, maxHeight: '60vh', overflow: 'auto', padding: 12, borderLeft: '1px solid #e5e7eb' }}>
      <h3 style={{ marginTop: 0, marginBottom: 8 }}>Alertas</h3>
      {alerts.length === 0 && <div style={{ color: '#6b7280' }}>No hay alertas activas</div>}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {alerts.map(a => (
          <li key={a.id} style={{ marginBottom: 8, padding: 8, background: a.acknowledged ? '#f3f4f6' : '#fff7ed', borderRadius: 6, border: '1px solid #eaeaea' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <strong style={{ color: a.severity >= 3 ? '#b91c1c' : '#92400e' }}>{a.type}</strong>
              <small style={{ color: '#6b7280' }}>{new Date(a.timestamp).toLocaleTimeString()}</small>
            </div>
            <div style={{ marginTop: 6 }}>{a.message}</div>
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              {!a.acknowledged && (
                <button onClick={() => onAcknowledge && onAcknowledge(a.id)} style={{ padding: '6px 8px', background: '#111827', color: '#fff', borderRadius: 4, border: 'none' }}>Reconocer</button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

AlertsPanel.propTypes = {
  alerts: PropTypes.array,
  onAcknowledge: PropTypes.func,
};

export default AlertsPanel;
