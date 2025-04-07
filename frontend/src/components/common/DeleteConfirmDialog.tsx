import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress
} from '@mui/material';

interface DeleteConfirmDialogProps {
  open: boolean;
  title: string;
  content: string;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Komponent dialogu potwierdzenia usunięcia elementu
 */
const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  open,
  title,
  content,
  isDeleting,
  onCancel,
  onConfirm
}) => {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="delete-confirm-dialog-title"
      aria-describedby="delete-confirm-dialog-description"
    >
      <DialogTitle id="delete-confirm-dialog-title">
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="delete-confirm-dialog-description">
          {content}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={onCancel} 
          color="primary" 
          disabled={isDeleting}
          variant="outlined"
        >
          Anuluj
        </Button>
        <Button 
          onClick={onConfirm} 
          color="error" 
          autoFocus 
          disabled={isDeleting}
          variant="contained"
          startIcon={isDeleting ? <CircularProgress size={20} color="inherit" /> : undefined}
        >
          {isDeleting ? 'Usuwanie...' : 'Usuń'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmDialog;