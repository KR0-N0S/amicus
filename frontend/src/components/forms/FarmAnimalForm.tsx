import React from 'react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import {
  TextField,
  Grid,
  MenuItem,
  Button,
  Divider,
  Box,
  CircularProgress,
  Typography,
  Alert,
  RadioGroup,
  Radio,
  FormControl,
  FormControlLabel,
  FormLabel
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/pl';
import { Animal } from '../../types/models';

interface FarmAnimalFormProps {
  initialValues: Partial<Animal>;
  onSubmit: (values: any) => void;
  isSubmitting: boolean;
  error: string | null;
  isEditMode: boolean;
}

// Schema walidacji dla formularza zwierzęcia gospodarskiego
const validationSchema = yup.object({
  species: yup.string().required('Gatunek jest wymagany'),
  identifier: yup.string().required('Numer identyfikacyjny jest wymagany'),
  sex: yup.string().required('Płeć jest wymagana'),
  // birth_date lub age jest wymagane
  birth_date: yup.date().nullable(),
  age: yup.number().nullable().integer().min(0, 'Wiek nie może być ujemny'),
  animal_number: yup.string(),
  breed: yup.string(),
  weight: yup.number().positive('Waga musi być większa od 0'),
  herd_number: yup.string(),
  registration_date: yup.date().nullable(),
  origin: yup.string(),
  vaccination_status: yup.string(),
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

const FarmAnimalForm: React.FC<FarmAnimalFormProps> = ({
  initialValues,
  onSubmit,
  isSubmitting,
  error,
  isEditMode
}) => {
  // Przygotowanie formularza z Formik
  const formik = useFormik({
    initialValues: {
      animal_type: 'large',
      species: initialValues.species || '',
      identifier: initialValues.identifier || '',
      animal_number: initialValues.animal_number || '',
      breed: initialValues.breed || '',
      sex: initialValues.sex || '',
      birth_date: initialValues.birth_date ? new Date(initialValues.birth_date) : null,
      age: initialValues.age || '',
      weight: initialValues.weight || '',
      herd_number: initialValues.herd_number || '',
      registration_date: initialValues.registration_date ? new Date(initialValues.registration_date) : null,
      origin: initialValues.origin || '',
      vaccination_status: initialValues.vaccination_status || '',
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
              id="species"
              name="species"
              label="Gatunek *"
              value={formik.values.species}
              onChange={formik.handleChange}
              error={formik.touched.species && Boolean(formik.errors.species)}
              helperText={formik.touched.species && formik.errors.species as string}
              select
            >
              <MenuItem value="krowa">Krowa</MenuItem>
              <MenuItem value="buhaj">Buhaj</MenuItem>
              <MenuItem value="cielę">Cielę</MenuItem>
              <MenuItem value="świnia">Świnia</MenuItem>
              <MenuItem value="koń">Koń</MenuItem>
              <MenuItem value="owca">Owca</MenuItem>
              <MenuItem value="koza">Koza</MenuItem>
              <MenuItem value="inne">Inne</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="identifier"
              name="identifier"
              label="Numer identyfikacyjny (kolczyk) *"
              value={formik.values.identifier}
              onChange={formik.handleChange}
              error={formik.touched.identifier && Boolean(formik.errors.identifier)}
              helperText={formik.touched.identifier && formik.errors.identifier as string}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="animal_number"
              name="animal_number"
              label="Numer zwierzęcia"
              value={formik.values.animal_number}
              onChange={formik.handleChange}
              error={formik.touched.animal_number && Boolean(formik.errors.animal_number)}
              helperText={formik.touched.animal_number && formik.errors.animal_number as string}
            />
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
              helperText={formik.touched.breed && formik.errors.breed as string}
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
                    helperText: formik.touched.birth_date && formik.errors.birth_date as string
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
              helperText={formik.touched.age && formik.errors.age as string}
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
              helperText={formik.touched.weight && formik.errors.weight as string}
            />
          </Grid>
        </Grid>
      </Box>
      
      <Divider sx={{ my: 3 }} />
      
      <Box mb={3}>
        <Typography variant="h6" gutterBottom>
          Informacje o stadzie i rejestracji
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="herd_number"
              name="herd_number"
              label="Numer stada"
              value={formik.values.herd_number}
              onChange={formik.handleChange}
              error={formik.touched.herd_number && Boolean(formik.errors.herd_number)}
              helperText={formik.touched.herd_number && formik.errors.herd_number as string}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pl">
              <DatePicker
                label="Data rejestracji"
                value={formik.values.registration_date ? dayjs(formik.values.registration_date) : null}
                onChange={(date) => formik.setFieldValue('registration_date', date ? date.toDate() : null)}
                slotProps={{
                  textField: {
                    variant: 'outlined',
                    fullWidth: true,
                    error: formik.touched.registration_date && Boolean(formik.errors.registration_date),
                    helperText: formik.touched.registration_date && formik.errors.registration_date as string
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="origin"
              name="origin"
              label="Pochodzenie"
              value={formik.values.origin}
              onChange={formik.handleChange}
              error={formik.touched.origin && Boolean(formik.errors.origin)}
              helperText={formik.touched.origin && formik.errors.origin as string}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="vaccination_status"
              name="vaccination_status"
              label="Status szczepień"
              value={formik.values.vaccination_status}
              onChange={formik.handleChange}
              error={formik.touched.vaccination_status && Boolean(formik.errors.vaccination_status)}
              helperText={formik.touched.vaccination_status && formik.errors.vaccination_status as string}
              select
            >
              <MenuItem value="aktualne">Aktualne</MenuItem>
              <MenuItem value="nieaktualne">Nieaktualne</MenuItem>
              <MenuItem value="brak">Brak szczepień</MenuItem>
              <MenuItem value="nieznane">Status nieznany</MenuItem>
            </TextField>
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
              helperText={formik.touched.notes && formik.errors.notes as string}
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

export default FarmAnimalForm;