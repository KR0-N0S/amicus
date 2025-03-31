import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Typography,
  Paper,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Chip,
  Box
} from '@mui/material';
import { FaChevronDown, FaPlus, FaTimes } from 'react-icons/fa';
import { ActionButton, ActionButtonCreateUpdateDto } from '../../api/actionButtonService';

interface ActionButtonFormProps {
  initialValues?: Partial<ActionButton>;
  onSubmit: (values: ActionButtonCreateUpdateDto) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

// Dostępne pola formularza zwierząt, które można ustawić jako domyślne
const availableFields = [
  { id: 'species', label: 'Gatunek', type: 'select', options: ['Bydło', 'Świnie', 'Owce', 'Kozy', 'Drób', 'Inne'] },
  { id: 'breed', label: 'Rasa', type: 'text' },
  { id: 'gender', label: 'Płeć', type: 'select', options: ['Samica', 'Samiec'] },
  { id: 'birth_date', label: 'Data urodzenia', type: 'date' },
  { id: 'acquisition_date', label: 'Data nabycia', type: 'date' },
  { id: 'weight', label: 'Waga', type: 'number' },
  { id: 'color', label: 'Umaszczenie', type: 'text' },
  { id: 'purpose', label: 'Cel hodowli', type: 'select', options: ['Mleczny', 'Mięsny', 'Rozpłodowy', 'Inny'] },
  { id: 'notes', label: 'Uwagi', type: 'textarea' },
];

const ActionButtonForm: React.FC<ActionButtonFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting
}) => {
  const [selectedField, setSelectedField] = useState<string>('');

  const formik = useFormik({
    initialValues: {
      name: initialValues?.name || '',
      description: initialValues?.description || '',
      action_type: initialValues?.action_type || 'animal_create',
      default_values: initialValues?.default_values || {}
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Nazwa jest wymagana'),
      action_type: Yup.string().required('Typ akcji jest wymagany'),
      default_values: Yup.object()
    }),
    onSubmit: (values) => {
      onSubmit(values);
    }
  });

  // Dodawanie nowego pola do domyślnych wartości
  const handleAddField = () => {
    if (!selectedField) return;
    
    const field = availableFields.find(f => f.id === selectedField);
    if (!field) return;
    
    let defaultValue: any = '';
    if (field.type === 'number') defaultValue = 0;
    if (field.type === 'select' && field.options && field.options.length > 0) defaultValue = field.options[0];

    formik.setFieldValue('default_values', {
      ...formik.values.default_values,
      [selectedField]: defaultValue
    });
    
    setSelectedField('');
  };

  // Usuwanie pola z domyślnych wartości
  const handleRemoveField = (fieldId: string) => {
    const newValues = { ...formik.values.default_values };
    delete newValues[fieldId];
    formik.setFieldValue('default_values', newValues);
  };

  // Aktualizacja wartości pola
  const handleFieldValueChange = (fieldId: string, value: any) => {
    formik.setFieldValue('default_values', {
      ...formik.values.default_values,
      [fieldId]: value
    });
  };

  // Renderowanie pola formularza w zależności od jego typu
  const renderFieldInput = (fieldId: string, value: any) => {
    const field = availableFields.find(f => f.id === fieldId);
    if (!field) return null;

    switch (field.type) {
      case 'select':
        return (
          <FormControl fullWidth size="small">
            <InputLabel>{field.label}</InputLabel>
            <Select
              value={value}
              onChange={(e) => handleFieldValueChange(fieldId, e.target.value)}
              label={field.label}
            >
              {field.options?.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      
      case 'date':
        return (
          <TextField
            type="date"
            label={field.label}
            value={value}
            onChange={(e) => handleFieldValueChange(fieldId, e.target.value)}
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
          />
        );
      
      case 'number':
        return (
          <TextField
            type="number"
            label={field.label}
            value={value}
            onChange={(e) => handleFieldValueChange(fieldId, e.target.value)}
            fullWidth
            size="small"
          />
        );
      
      case 'textarea':
        return (
          <TextField
            multiline
            rows={3}
            label={field.label}
            value={value}
            onChange={(e) => handleFieldValueChange(fieldId, e.target.value)}
            fullWidth
            size="small"
          />
        );
      
      default:
        return (
          <TextField
            type="text"
            label={field.label}
            value={value}
            onChange={(e) => handleFieldValueChange(fieldId, e.target.value)}
            fullWidth
            size="small"
          />
        );
    }
  };

  return (
    <form onSubmit={formik.handleSubmit}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            id="name"
            name="name"
            label="Nazwa przycisku"
            value={formik.values.name}
            onChange={formik.handleChange}
            error={formik.touched.name && Boolean(formik.errors.name)}
            helperText={formik.touched.name && formik.errors.name}
            disabled={isSubmitting}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            id="description"
            name="description"
            label="Opis (opcjonalnie)"
            multiline
            rows={2}
            value={formik.values.description}
            onChange={formik.handleChange}
            disabled={isSubmitting}
          />
        </Grid>

        <Grid item xs={12}>
          <FormControl fullWidth error={formik.touched.action_type && Boolean(formik.errors.action_type)}>
            <InputLabel id="action-type-label">Typ akcji</InputLabel>
            <Select
              labelId="action-type-label"
              id="action_type"
              name="action_type"
              value={formik.values.action_type}
              onChange={formik.handleChange}
              disabled={isSubmitting}
            >
              <MenuItem value="animal_create">Dodawanie zwierzęcia</MenuItem>
            </Select>
            {formik.touched.action_type && formik.errors.action_type && (
              <FormHelperText>{formik.errors.action_type}</FormHelperText>
            )}
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<FaChevronDown />}>
              <Typography variant="subtitle1">Domyślne wartości pól</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={9}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Wybierz pole</InputLabel>
                      <Select
                        value={selectedField}
                        onChange={(e) => setSelectedField(e.target.value)}
                        label="Wybierz pole"
                      >
                        {availableFields
                          .filter(field => !(field.id in formik.values.default_values))
                          .map((field) => (
                            <MenuItem key={field.id} value={field.id}>
                              {field.label}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={3}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={handleAddField}
                      disabled={!selectedField}
                      startIcon={<FaPlus />}
                    >
                      Dodaj
                    </Button>
                  </Grid>
                </Grid>
              </Box>

              {Object.entries(formik.values.default_values).length > 0 ? (
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Grid container spacing={2}>
                    {Object.entries(formik.values.default_values).map(([fieldId, value]) => {
                      const field = availableFields.find(f => f.id === fieldId);
                      return (
                        <Grid item xs={12} key={fieldId}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Chip 
                              label={field?.label || fieldId} 
                              size="small" 
                              color="primary" 
                              sx={{ mr: 1 }} 
                            />
                            <IconButton 
                              size="small" 
                              color="error" 
                              onClick={() => handleRemoveField(fieldId)}
                            >
                              <FaTimes />
                            </IconButton>
                          </Box>
                          {renderFieldInput(fieldId, value)}
                        </Grid>
                      );
                    })}
                  </Grid>
                </Paper>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  Nie dodano jeszcze żadnych domyślnych wartości pól. Wybierz pole z listy powyżej.
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
            <Button
              variant="outlined"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Zapisywanie...' : 'Zapisz'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </form>
  );
};

export default ActionButtonForm;