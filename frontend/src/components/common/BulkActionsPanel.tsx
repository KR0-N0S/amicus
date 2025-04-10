import React from 'react';
import { 
  Box, Typography, Button,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { FaCheck, FaTag, FaEnvelope, FaSms } from 'react-icons/fa';

export interface BulkAction<T = string> {
  type: T;
  icon: React.ReactNode;
  label: string;
  handler: () => void;
}

interface BulkActionsPanelProps<T = string> {
  selectedIds: number[];
  actions: BulkAction<T>[];
  onClearSelection: () => void;
  entityName?: string;
}

/**
 * Reużywalny komponent panelu akcji masowych
 * Może być używany dla różnych typów list (klienci, zwierzęta, itp.)
 */
function BulkActionsPanel<T = string>({ 
  selectedIds, 
  actions, 
  onClearSelection,
  entityName = 'element'
}: BulkActionsPanelProps<T>) {
  if (selectedIds.length === 0) return null;
  
  // Formatowanie liczby elementów w języku polskim
  const getEntityText = () => {
    if (selectedIds.length === 1) return entityName;
    if (selectedIds.length < 5) return `${entityName}y`;
    return `${entityName}ów`;
  };
  
  return (
    <Box
      className="bulk-actions-panel"
      p={2}
      mb={2}
      sx={{
        border: '1px solid #eee',
        borderRadius: '4px',
        backgroundColor: '#f9f9f9',
      }}
    >
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        <FaCheck size={14} style={{ marginRight: 8, color: '#4caf50' }} />
        Wybrano {selectedIds.length} {getEntityText()}
      </Typography>
      
      <Box display="flex" gap={1} mt={1}>
        {actions.map((action, index) => (
          <Button
            key={index}
            variant="outlined"
            size="small"
            startIcon={action.icon}
            onClick={action.handler}
          >
            {action.label}
          </Button>
        ))}
        
        <Button
          variant="text"
          size="small"
          onClick={onClearSelection}
          sx={{ marginLeft: 'auto' }}
        >
          Wyczyść zaznaczenie
        </Button>
      </Box>
    </Box>
  );
}

export default BulkActionsPanel;