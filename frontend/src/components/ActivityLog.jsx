import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';

const ActivityLog = () => {
  const { syncLogs } = useSocket();
  const [expandedLogId, setExpandedLogId] = useState(null);

  const getLogTypeColor = (type) => {
    switch (type) {
      case 'product_create': return 'log-type-create';
      case 'product_update': return 'log-type-update';
      case 'product_delete': return 'log-type-delete';
      case 'simulated_order_received':
      case 'webhook_order_received': return 'log-type-order';
      case 'order_status_sync': return 'log-type-sync';
      case 'order_status_sync_error': return 'log-type-error';
      default: return 'log-type-default';
    }
  };

  const formatLogTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString() + `.${String(date.getMilliseconds()).padStart(3, '0')}`;
  };

  const toggleExpandLog = (index) => {
    if (expandedLogId === index) {
      setExpandedLogId(null);
    } else {
      setExpandedLogId(index);
    }
  };

  return (
    <div className="activity-log-container">
      <div className="log-header">
        <h2>Integration Activity Logs</h2>
        <span className="subtitle">Real-time Middleware Translation & API Dispatch Logs</span>
      </div>

      <div className="log-body">
        {syncLogs.length === 0 ? (
          <div className="empty-logs-placeholder">
            📡 Listening for integration logs... Try adding products, changing orders, or placing orders.
          </div>
        ) : (
          <div className="logs-timeline">
            {syncLogs.map((log, idx) => (
              <div key={idx} className="log-entry-wrapper">
                <div className="log-entry-row" onClick={() => toggleExpandLog(idx)}>
                  <span className="log-time">{formatLogTime(log.timestamp)}</span>
                  <span className={`log-type-badge ${getLogTypeColor(log.type)}`}>
                    {log.type.replace(/_/g, ' ').toUpperCase()}
                  </span>
                  <span className="log-message">{log.message}</span>
                  <span className="log-expand-icon">
                    {expandedLogId === idx ? '▲' : '▼'}
                  </span>
                </div>

                {expandedLogId === idx && (
                  <div className="log-details-expanded">
                    <h5>API Payload & Adapter Response Details:</h5>
                    <pre>{JSON.stringify(log.details || log.error || log, null, 2)}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLog;
