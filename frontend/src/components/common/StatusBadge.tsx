import React from 'react';
import { Tooltip } from '@mui/material';
import './StatusBadge.css';

// Definicja dozwolonych typów statusów
export type StatusType = 
  | 'active'      // aktywny
  | 'pending'     // oczekujący
  | 'completed'   // zakończony
  | 'cancelled'   // anulowany
  | 'processing'  // w trakcie
  // Nowe typy statusów zgodnie z propozycją
  | 'inactive'    // nieaktywny
  | 'new'         // nowy
  | 'vip'         // vip
  | 'blocked'     // zablokowany
  | 'debt'        // zadłużony
  | 'potential'   // potencjalny
  | 'archived';   // zarchiwizowany

// Dla kompatybilności wstecznej
export type ClientStatusType = StatusType;

// Interfejs dla konfiguracji statusów
interface StatusConfigItem {
  label: string;
  color: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  description?: string;
}

// Interfejs dla props komponentu
interface StatusBadgeProps {
  status: StatusType;
  customLabel?: string;
  withTooltip?: boolean;
  withDot?: boolean;
  className?: string;
}

// Konfiguracja statusów z opisami
const statusConfig: Record<StatusType, StatusConfigItem> = {
  active: {
    label: 'Aktywny',
    color: 'success',
    description: 'Aktywny klient lub konto'
  },
  pending: {
    label: 'Oczekujący',
    color: 'warning',
    description: 'Oczekuje na działanie'
  },
  completed: {
    label: 'Zakończony',
    color: 'primary',
    description: 'Proces został zakończony'
  },
  cancelled: {
    label: 'Anulowany',
    color: 'danger',
    description: 'Działanie zostało anulowane'
  },
  processing: {
    label: 'W trakcie',
    color: 'info',
    description: 'Proces w trakcie realizacji'
  },
  // Nowe statusy
  inactive: {
    label: 'Nieaktywny',
    color: 'secondary',
    description: 'Konto jest nieaktywne'
  },
  new: {
    label: 'Nowy',
    color: 'info',
    description: 'Nowy klient lub konto'
  },
  vip: {
    label: 'VIP',
    color: 'primary',
    description: 'Klient VIP'
  },
  blocked: {
    label: 'Zablokowany',
    color: 'danger',
    description: 'Konto zostało zablokowane'
  },
  debt: {
    label: 'Zaległości',
    color: 'warning',
    description: 'Klient posiada zaległości płatnicze'
  },
  potential: {
    label: 'Potencjalny',
    color: 'info',
    description: 'Potencjalny klient'
  },
  archived: {
    label: 'Zarchiwizowany',
    color: 'secondary',
    description: 'Konto zostało zarchiwizowane'
  }
};

/**
 * Komponent StatusBadge - wyświetla status z odpowiednim kolorem i etykietą
 * @param status - Typ statusu
 * @param customLabel - Opcjonalna niestandardowa etykieta
 * @param withTooltip - Czy pokazywać tooltip z opisem (domyślnie true)
 * @param withDot - Czy pokazywać kropkę statusu (domyślnie false)
 * @param className - Dodatkowe klasy CSS
 */
const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  customLabel,
  withTooltip = true,
  withDot = false,
  className = ''
}) => {
  // Pobierz konfigurację dla danego statusu lub użyj domyślnej
  const config = statusConfig[status] || { 
    label: 'Nieznany', 
    color: 'secondary',
    description: 'Nieznany status'
  };
  
  // Etykieta do wyświetlenia (niestandardowa lub z konfiguracji)
  const displayLabel = customLabel || config.label;
  
  // Komponent badge
  const badge = (
    <span className={`status-badge ${config.color} ${className}`}>
      {withDot && <span className="status-dot"></span>}
      {displayLabel}
    </span>
  );
  
  // Jeśli z tooltipem, opakuj w komponent Tooltip
  if (withTooltip && config.description) {
    return (
      <Tooltip title={config.description} arrow placement="top">
        {badge}
      </Tooltip>
    );
  }
  
  // W przeciwnym razie zwróć sam badge
  return badge;
};

export default StatusBadge;