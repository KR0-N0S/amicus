import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import ActionButtonsList from '../components/animals/ActionButtonsList';
import ActionButtonForm from '../components/animals/ActionButtonForm';
import { 
  getUserActionButtons, 
  getActionButtonById, 
  createActionButton, 
  updateActionButton, 
  deleteActionButton, 
  ActionButton,
  ActionButtonCreateUpdateDto 
} from '../api/actionButtonService';
import { Alert, CircularProgress, Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import { FaArrowLeft, FaTimes } from 'react-icons/fa';
import Button from '../components/common/Button';

const AnimalSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [actionButtons, setActionButtons] = useState<ActionButton[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState<boolean>(false);
  const [editingButton, setEditingButton] = useState<ActionButton | null>(null);

  // Pobierz przyciski akcji użytkownika
  useEffect(() => {
    fetchActionButtons();
  }, []);

  const fetchActionButtons = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const buttons = await getUserActionButtons();
      setActionButtons(buttons);
    } catch (err: any) {
      console.error('Błąd podczas pobierania przycisków akcji:', err);
      setError(err.response?.data?.message || 'Nie udało się pobrać przycisków akcji');
    } finally {
      setIsLoading(false);
    }
  };

  // Otwórz formularz dodawania nowego przycisku
  const handleAddButton = () => {
    setEditingButton(null);
    setFormOpen(true);
  };

  // Otwórz formularz edycji przycisku
  const handleEditButton = async (buttonId: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const button = await getActionButtonById(buttonId);
      setEditingButton(button);
      setFormOpen(true);
    } catch (err: any) {
      console.error('Błąd podczas pobierania szczegółów przycisku:', err);
      setError(err.response?.data?.message || 'Nie udało się pobrać szczegółów przycisku');
    } finally {
      setIsLoading(false);
    }
  };

  // Zamknij formularz
  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingButton(null);
  };

  // Obsługa zapisywania formularza
  const handleSubmitForm = async (values: ActionButtonCreateUpdateDto) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      if (editingButton) {
        // Aktualizacja istniejącego przycisku
        await updateActionButton(editingButton.id, values);
      } else {
        // Tworzenie nowego przycisku
        await createActionButton(values);
      }
      
      // Odśwież listę przycisków
      await fetchActionButtons();
      
      // Zamknij formularz
      setFormOpen(false);
      setEditingButton(null);
    } catch (err: any) {
      console.error('Błąd podczas zapisywania przycisku:', err);
      setError(err.response?.data?.message || 'Nie udało się zapisać przycisku');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Obsługa usuwania przycisku
  const handleDeleteButton = async (buttonId: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await deleteActionButton(buttonId);
      
      // Odśwież listę przycisków
      await fetchActionButtons();
    } catch (err: any) {
      console.error('Błąd podczas usuwania przycisku:', err);
      setError(err.response?.data?.message || 'Nie udało się usunąć przycisku');
    } finally {
      setIsLoading(false);
    }
  };

  // Akcje dla karty
  const cardActions = (
    <Button
      variant="secondary"
      icon={<FaArrowLeft />}
      onClick={() => navigate('/animals/farm')}
    >
      Wróć do zwierząt
    </Button>
  );

  return (
    <div className="animal-settings-page">
      <Card title="Ustawienia zwierząt" actions={cardActions}>
        {error && <Alert severity="error" style={{ marginBottom: '20px' }}>{error}</Alert>}
        
        {isLoading ? (
          <div className="loading-spinner" style={{ textAlign: 'center', padding: '40px' }}>
            <CircularProgress size={40} />
            <p>Ładowanie danych...</p>
          </div>
        ) : (
          <ActionButtonsList
            actionButtons={actionButtons}
            onEdit={handleEditButton}
            onDelete={handleDeleteButton}
            onAdd={handleAddButton}
            isLoading={isLoading}
          />
        )}
      </Card>

      {/* Dialog z formularzem dodawania/edycji przycisku */}
      <Dialog
        open={formOpen}
        onClose={handleCloseForm}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingButton ? 'Edycja przycisku akcji' : 'Dodaj nowy przycisk akcji'}
          <IconButton
            aria-label="zamknij"
            onClick={handleCloseForm}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <FaTimes />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" style={{ marginBottom: '20px' }}>{error}</Alert>}
          
          <ActionButtonForm
            initialValues={editingButton || undefined}
            onSubmit={handleSubmitForm}
            onCancel={handleCloseForm}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AnimalSettingsPage;