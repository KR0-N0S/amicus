import React from 'react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import {
  TextField,
  Grid,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Button,
  Divider,
  Box,
  CircularProgress,
  Typography,
  Alert,
  RadioGroup,
  Radio,
  FormControl,
  FormLabel
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/pl';
import { Animal } from '../../types/models';

interface CompanionAnimalFormProps {
  initialValues: Partial<Animal>;
  onSubmit: (values: any) => void;
  isSubmitting: boolean;
  error: string | null;
  isEditMode: boolean;
}

// Schema walidacji dla formularza zwierzęcia domowego
const validationSchema = yup.object({
  name: yup.string().required('Imię jest wymagane'),
  species: yup.string().required('Gatunek jest wymagany'),
  sex: yup.string().required('Płeć jest wymagana'),
  // birth_date lub age jest wymagane
  birth_date: yup.date().nullable(),
  age: yup.number().nullable().integer().min(0, 'Wiek nie może być ujemny'),
  // Jeśli is_sterilized jest true, to sterilization_date jest wymagane
  is_sterilized: yup.boolean(),
  sterilization_date: yup.date().nullable().when('is_sterilized', {
    is: true,
    then: (schema) => schema.required('Data sterylizacji/kastracji jest wymagana gdy zwierzę jest wysterylizowane/wykastrowane'),
    otherwise: (schema) => schema.nullable()
  }),
  breed: yup.string(),
  color: yup.string(),
  weight: yup.number().positive('Waga musi być większa od 0'),
  microchip_number: yup.string(),
  identifier: yup.string(),
  special_markings: yup.string(),
  temperament: yup.string(),
  special_needs: yup.string(),
  notes: yup.string(),
}).test(
  'birth-date-or-age',
  'Musisz podać datę urodzenia lub wiek',
  function(values) {
    if (values.birth_date || values.age) {
      return true;
    }
    return this.createError({ path: 'birth_date', message: 'Musisz podać datę urodzenia lub wiek' });
  }
);

const CompanionAnimalForm: React.FC<CompanionAnimalFormProps> = ({
  initialValues,
  onSubmit,
  isSubmitting,
  error,
  isEditMode
}) => {
  // Przygotowanie formularza z Formik
  const formik = useFormik({
    initialValues: {
      name: initialValues.name || '',
      animal_type: 'small',
      species: initialValues.species || '',
      breed: initialValues.breed || '',
      sex: initialValues.sex || '',
      birth_date: initialValues.birth_date ? new Date(initialValues.birth_date) : null,
      age: initialValues.age || '',
      color: initialValues.color || '',
      weight: initialValues.weight || '',
      microchip_number: initialValues.microchip_number || '',
      identifier: initialValues.identifier || '',
      is_sterilized: initialValues.is_sterilized || false,
      sterilization_date: initialValues.sterilization_date ? new Date(initialValues.sterilization_date) : null,
      special_markings: initialValues.special_markings || '',
      temperament: initialValues.temperament || '',
      special_needs: initialValues.special_needs || '',
      notes: initialValues.notes || '',
      owner_id: initialValues.owner_id || '',
    },
    validationSchema,
    onSubmit: (values) => {
      // Wywołanie funkcji onSubmit z komponentu nadrzędnego
      onSubmit(values);
    },
  });

  return (
    <form onSubmit={formik.handleSubmit}>
      {error && (
        <Box mb={3}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}
      
      <Box mb={3}>
        <Typography variant="h6" gutterBottom>
          Podstawowe informacje
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="name"
              name="name"
              label="Imię *"
              value={formik.values.name}
              onChange={formik.handleChange}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={(formik.touched.name && formik.errors.name) as React.ReactNode}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="species"
              name="species"
              label="Gatunek *"
              value={formik.values.species}
              onChange={formik.handleChange}
              error={formik.touched.species && Boolean(formik.errors.species)}
              helperText={(formik.touched.species && formik.errors.species) as React.ReactNode}
              select
            >
              <MenuItem value="pies">Pies</MenuItem>
              <MenuItem value="kot">Kot</MenuItem>
              <MenuItem value="królik">Królik</MenuItem>
              <MenuItem value="fretka">Fretka</MenuItem>
              <MenuItem value="świnka morska">Świnka morska</MenuItem>
              <MenuItem value="chomik">Chomik</MenuItem>
              <MenuItem value="inne">Inne</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="breed"
              name="breed"
              label="Rasa"
              value={formik.values.breed}
              onChange={formik.handleChange}
              error={formik.touched.breed && Boolean(formik.errors.breed)}
              helperText={(formik.touched.breed && formik.errors.breed) as React.ReactNode}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl component="fieldset" sx={{ display: 'flex', justifyContent: 'space-around', width: '100%' }}>
              <FormLabel component="legend">Płeć *</FormLabel>
              <RadioGroup
                row
                name="sex"
                value={formik.values.sex}
                onChange={formik.handleChange}
                sx={{ justifyContent: 'center' }}
              >
                <FormControlLabel value="male" control={<Radio />} label="Samiec" />
                <FormControlLabel value="female" control={<Radio />} label="Samica" />
                <FormControlLabel value="unknown" control={<Radio />} label="Nieznana" />
              </RadioGroup>
              {formik.touched.sex && formik.errors.sex && (
                <Typography color="error" variant="caption">
                  {formik.errors.sex as string}
                </Typography>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pl">
              <DatePicker
                label="Data urodzenia"
                value={formik.values.birth_date ? dayjs(formik.values.birth_date) : null}
                onChange={(date) => formik.setFieldValue('birth_date', date ? date.toDate() : null)}
                slotProps={{
                  textField: {
                    variant: 'outlined',
                    fullWidth: true,
                    error: formik.touched.birth_date && Boolean(formik.errors.birth_date),
                    helperText: (formik.touched.birth_date && formik.errors.birth_date) as React.ReactNode
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="age"
              name="age"
              label="Wiek (lata)"
              type="number"
              value={formik.values.age}
              onChange={formik.handleChange}
              error={formik.touched.age && Boolean(formik.errors.age)}
              helperText={(formik.touched.age && formik.errors.age) as React.ReactNode}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="color"
              name="color"
              label="Umaszczenie"
              value={formik.values.color}
              onChange={formik.handleChange}
              error={formik.touched.color && Boolean(formik.errors.color)}
              helperText={(formik.touched.color && formik.errors.color) as React.ReactNode}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="weight"
              name="weight"
              label="Waga (kg)"
              type="number"
              value={formik.values.weight}
              onChange={formik.handleChange}
              error={formik.touched.weight && Boolean(formik.errors.weight)}
              helperText={(formik.touched.weight && formik.errors.weight) as React.ReactNode}
            />
          </Grid>
        </Grid>
      </Box>
      
      <Divider sx={{ my: 3 }} />
      
      <Box mb={3}>
        <Typography variant="h6" gutterBottom>
          Identyfikacja
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="microchip_number"
              name="microchip_number"
              label="Numer microchipa"
              value={formik.values.microchip_number}
              onChange={formik.handleChange}
              error={formik.touched.microchip_number && Boolean(formik.errors.microchip_number)}
              helperText={(formik.touched.microchip_number && formik.errors.microchip_number) as React.ReactNode}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="identifier"
              name="identifier"
              label="Numer identyfikacyjny"
              value={formik.values.identifier}
              onChange={formik.handleChange}
              error={formik.touched.identifier && Boolean(formik.errors.identifier)}
              helperText={(formik.touched.identifier && formik.errors.identifier) as React.ReactNode}
            />
          </Grid>
        </Grid>
      </Box>
      
      <Divider sx={{ my: 3 }} />
      
      <Box mb={3}>
        <Typography variant="h6" gutterBottom>
          Dodatkowe informacje
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  id="is_sterilized"
                  name="is_sterilized"
                  checked={formik.values.is_sterilized}
                  onChange={formik.handleChange}
                />
              }
              label="Zwierzę jest wysterylizowane/wykastrowane"
            />
          </Grid>
          {formik.values.is_sterilized && (
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pl">
                <DatePicker
                  label="Data sterylizacji/kastracji *"
                  value={formik.values.sterilization_date ? dayjs(formik.values.sterilization_date) : null}
                  onChange={(date) => formik.setFieldValue('sterilization_date', date ? date.toDate() : null)}
                  slotProps={{
                    textField: {
                      variant: 'outlined',
                      fullWidth: true,
                      error: formik.touched.sterilization_date && Boolean(formik.errors.sterilization_date),
                      helperText: (formik.touched.sterilization_date && formik.errors.sterilization_date) as React.ReactNode
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
          )}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="special_markings"
              name="special_markings"
              label="Znaki szczególne"
              value={formik.values.special_markings}
              onChange={formik.handleChange}
              error={formik.touched.special_markings && Boolean(formik.errors.special_markings)}
              helperText={(formik.touched.special_markings && formik.errors.special_markings) as React.ReactNode}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="temperament"
              name="temperament"
              label="Temperament"
              value={formik.values.temperament}
              onChange={formik.handleChange}
              error={formik.touched.temperament && Boolean(formik.errors.temperament)}
              helperText={(formik.touched.temperament && formik.errors.temperament) as React.ReactNode}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              id="special_needs"
              name="special_needs"
              label="Specjalne potrzeby"
              value={formik.values.special_needs}
              onChange={formik.handleChange}
              error={formik.touched.special_needs && Boolean(formik.errors.special_needs)}
              helperText={(formik.touched.special_needs && formik.errors.special_needs) as React.ReactNode}
              multiline
              rows={3}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              id="notes"
              name="notes"
              label="Dodatkowe notatki"
              value={formik.values.notes}
              onChange={formik.handleChange}
              error={formik.touched.notes && Boolean(formik.errors.notes)}
              helperText={(formik.touched.notes && formik.errors.notes) as React.ReactNode}
              multiline
              rows={4}
            />
          </Grid>
        </Grid>
      </Box>
      
      <Box display="flex" justifyContent="flex-end" mt={3}>
        <Button
          variant="contained"
          color="primary"
          type="submit"
          disabled={isSubmitting}
          sx={{ minWidth: 120 }}
        >
          {isSubmitting ? (
            <CircularProgress size={24} />
          ) : isEditMode ? (
            'Zapisz zmiany'
          ) : (
            'Dodaj zwierzę'
          )}
        </Button>
      </Box>
    </form>
  );
};

export default CompanionAnimalForm;