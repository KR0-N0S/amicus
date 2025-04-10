import React, { useState } from 'react';
import {
  Box, Button, Divider, TextField,
  Typography, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { FaRegBookmark } from 'react-icons/fa';
import { FiX } from 'react-icons/fi';
import { SavedView } from '../../hooks/useSavedViews';

interface ListViewsManagerProps {
  views: SavedView[];
  onApplyView: (view: SavedView) => void;
  onDeleteView: (viewId: string) => void;
  onSaveView: (viewName: string) => void;
  className?: string;
}

/**
 * Komponent do zarządzania zapisanymi widokami list
 */
const ListViewsManager: React.FC<ListViewsManagerProps> = ({
  views,
  onApplyView,
  onDeleteView,
  onSaveView,
  className = ''
}) => {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newViewName, setNewViewName] = useState('');

  const handleSaveView = () => {
    if (newViewName.trim()) {
      onSaveView(newViewName);
      setNewViewName('');
      setShowSaveDialog(false);
    }
  };

  return (
    <>
      <Box className={`views-manager ${className}`} p={2} sx={{ border: '1px solid #eee', borderRadius: '4px' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="subtitle1">Zapisane widoki</Typography>
          <Button 
            variant="outlined" 
            size="small"
            startIcon={<FaRegBookmark size={14} />}
            onClick={() => setShowSaveDialog(true)}
          >
            Zapisz aktualny widok
          </Button>
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        {views.length > 0 ? (
          <Box>
            {views.map(view => (
              <Box 
                key={view.id}
                display="flex" 
                justifyContent="space-between" 
                alignItems="center"
                p={1}
                sx={{ 
                  borderBottom: '1px solid #eee',
                  '&:hover': { backgroundColor: '#f5f5f5' },
                  cursor: 'pointer'
                }}
              >
                <Typography 
                  variant="body2"
                  onClick={() => onApplyView(view)}
                  sx={{ flexGrow: 1 }}
                >
                  {view.name}
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={() => onDeleteView(view.id)}
                  color="default"
                >
                  <FiX size={16} />
                </IconButton>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography variant="body2" color="textSecondary">
            Nie masz jeszcze zapisanych widoków.
          </Typography>
        )}
      </Box>

      <Dialog open={showSaveDialog} onClose={() => setShowSaveDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Zapisz widok</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nazwa widoku"
            fullWidth
            value={newViewName}
            onChange={(e) => setNewViewName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSaveDialog(false)}>
            Anuluj
          </Button>
          <Button onClick={handleSaveView} variant="contained" color="primary" disabled={!newViewName.trim()}>
            Zapisz
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ListViewsManager;