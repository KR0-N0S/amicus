import React from 'react';
import './StatusBadge.css';

const statusConfig = {
  active: {
    label: 'Aktywny',
    color: 'success'
  },
  pending: {
    label: 'Oczekujący',
    color: 'warning'
  },
  completed: {
    label: 'Zakończony',
    color: 'primary'
  },
  cancelled: {
    label: 'Anulowany',
    color: 'danger'
  },
  processing: {
    label: 'W trakcie',
    color: 'info'
  }
};

const StatusBadge = ({ status, customLabel }) => {
  const config = statusConfig[status] || { label: 'Nieznany', color: 'secondary' };
  
  return (
    <span className={`status-badge ${config.color}`}>
      {customLabel || config.label}
    </span>
  );
};

export default StatusBadge;
