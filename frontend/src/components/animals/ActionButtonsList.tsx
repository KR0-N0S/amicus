import React, { useState } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Paper, IconButton, Button, Typography, 
  Dialog, DialogActions, DialogContent, DialogContentText, 
  DialogTitle, Tooltip
} from '@mui/material';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import { ActionButton } from '../../api/actionButtonService';

interface ActionButtonsListProps {
  actionButtons: ActionButton[];
  onEdit: (buttonId: number) => void;
  onDelete: (buttonId: number) => void;
  onAdd: () => void;
  isLoading: boolean;
}

const ActionButtonsList: React.FC<ActionButtonsListProps> = ({
  actionButtons,
  onEdit,
  onDelete,
  onAdd,
  isLoading
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [buttonToDelete, setButtonToDelete] = useState<number | null>(null);

  const handleOpenDeleteDialog = (id: number) => {
    setButtonToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setButtonToDelete(null);
  };

  const handleConfirmDelete = () => {
    if (buttonToDelete !== null) {
      onDelete(buttonToDelete);
      handleCloseDeleteDialog();
    }
  };

  // Metoda wyświetlająca domyślne wartości w czytelny sposób
  const renderDefaultValues = (defaultValues: Record<string, any>) => {
    return Object.entries(defaultValues).map(([key, value]) => (
      <div key={key}>
        <strong>{key}:</strong> {value !== null && value !== undefined ? value.toString() : 'brak'}
      </div>
    ));
  };

  return (
    <div className="action-buttons-list">
      <div className="list-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <Typography variant="h6">Konfigurowalne przyciski akcji</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<FaPlus />} 
          onClick={onAdd}
        >
          Dodaj nową akcję
        </Button>
      </div>

      {actionButtons.length === 0 ? (
        <Paper elevation={2} style={{ padding: '20px', textAlign: 'center' }}>
          <Typography variant="body1">
            Nie masz jeszcze żadnych skonfigurowanych przycisków akcji.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nazwa</TableCell>
                <TableCell>Opis</TableCell>
                <TableCell>Typ akcji</TableCell>
                <TableCell>Domyślne wartości</TableCell>
                <TableCell>Akcje</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {actionButtons.map((button) => (
                <TableRow key={button.id}>
                  <TableCell>{button.name}</TableCell>
                  <TableCell>{button.description || 'Brak opisu'}</TableCell>
                  <TableCell>{button.action_type}</TableCell>
                  <TableCell>{renderDefaultValues(button.default_values)}</TableCell>
                  <TableCell>
                    <Tooltip title="Edytuj">
                      <IconButton onClick={() => onEdit(button.id)} size="small">
                        <FaEdit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Usuń">
                      <IconButton onClick={() => handleOpenDeleteDialog(button.id)} size="small" color="error">
                        <FaTrash />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog potwierdzenia usunięcia */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Potwierdź usunięcie</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Czy na pewno chcesz usunąć ten przycisk akcji? Ta operacja jest nieodwracalna.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">
            Anuluj
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Usuń
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ActionButtonsList;