import React from 'react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import {
  TextField,
  Grid,
  MenuItem,
  Button as MuiButton,
  Box,
  CircularProgress,
  Typography,
  Alert,
  FormHelperText,
  InputAdornment,
  Tooltip,
  IconButton
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Bull } from '../../types/models';

interface BullFormProps {
  initialValues: Partial<Bull>;
  onSubmit: (values: Partial<Bull>) => void;
  isSubmitting: boolean;
  error: string | null;
  isEditMode: boolean;
}

const validationSchema = yup.object({
  identification_number: yup
    .string()
    .required('Numer identyfikacyjny jest wymagany')
    .matches(/^[A-Z]{2}[0-9]+$/, 'Format: 2 wielkie litery + cyfry (np. PL12345)'),
  bull_type: yup.string().required('Typ buhaja jest wymagany'),
  breed: yup.string(),
  vet_number: yup.string()
});

const BullForm: React.FC<BullFormProps> = ({
  initialValues,
  onSubmit,
  isSubmitting,
  error,
  isEditMode
}) => {
  const formik = useFormik({
    initialValues: {
      identification_number: initialValues.identification_number || '',
      vet_number: initialValues.vet_number || '',
      breed: initialValues.breed || '',
      bull_type: initialValues.bull_type || '',
      supplier: initialValues.supplier || '',
      semen_production_date: initialValues.semen_production_date || '',
      additional_info: initialValues.additional_info || ''
    },
    validationSchema,
    onSubmit: (values) => {
      onSubmit(values);
    }
  });

  const bullTypes = [
    { value: 'dairy', label: 'Mleczny' },
    { value: 'beef', label: 'Mięsny' },
    { value: 'dual', label: 'Dwukierunkowy' }
  ];

  const breedOptions = [
    'Holsztyńsko-fryzyjska',
    'Jersey',
    'Simental',
    'Limousine',
    'Charolais',
    'Hereford',
    'Aberdeen Angus',
    'Polska Czerwona',
    'Montbeliarde',
    'Inna'
  ];

  return (
    <form onSubmit={formik.handleSubmit}>
      {error && (
        <Box mb={3}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}

      <Box mb={4}>
        <Typography variant="h6" gutterBottom>
          Podstawowe informacje
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="identification_number"
              name="identification_number"
              label="Numer identyfikacyjny *"
              value={formik.values.identification_number}
              onChange={formik.handleChange}
              error={formik.touched.identification_number && Boolean(formik.errors.identification_number)}
              helperText={formik.touched.identification_number && formik.errors.identification_number}
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title="Format: 2 wielkie litery + cyfry (np. PL12345)">
                      <IconButton edge="end">
                        <InfoOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="vet_number"
              name="vet_number"
              label="Numer weterynaryjny"
              value={formik.values.vet_number}
              onChange={formik.handleChange}
              error={formik.touched.vet_number && Boolean(formik.errors.vet_number)}
              helperText={formik.touched.vet_number && formik.errors.vet_number}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="bull_type"
              name="bull_type"
              label="Typ buhaja *"
              select
              value={formik.values.bull_type}
              onChange={formik.handleChange}
              error={formik.touched.bull_type && Boolean(formik.errors.bull_type)}
              helperText={formik.touched.bull_type && formik.errors.bull_type}
              required
            >
              {bullTypes.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="breed"
              name="breed"
              label="Rasa"
              select
              value={formik.values.breed}
              onChange={formik.handleChange}
              error={formik.touched.breed && Boolean(formik.errors.breed)}
              helperText={formik.touched.breed && formik.errors.breed}
            >
              {breedOptions.map((breed) => (
                <MenuItem key={breed} value={breed.toLowerCase()}>
                  {breed}
                </MenuItem>
              ))}
            </TextField>
            <FormHelperText>Wybierz rasę buhaja</FormHelperText>
          </Grid>
        </Grid>
      </Box>

      <Box mb={4}>
        <Typography variant="h6" gutterBottom>
          Dane produkcyjne
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="supplier"
              name="supplier"
              label="Dostawca"
              value={formik.values.supplier}
              onChange={formik.handleChange}
              error={formik.touched.supplier && Boolean(formik.errors.supplier)}
              helperText={formik.touched.supplier && formik.errors.supplier}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="semen_production_date"
              name="semen_production_date"
              label="Data produkcji nasienia"
              type="date"
              value={formik.values.semen_production_date}
              onChange={formik.handleChange}
              InputLabelProps={{
                shrink: true,
              }}
              error={formik.touched.semen_production_date && Boolean(formik.errors.semen_production_date)}
              helperText={formik.touched.semen_production_date && formik.errors.semen_production_date}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              id="additional_info"
              name="additional_info"
              label="Dodatkowe informacje"
              multiline
              rows={4}
              value={formik.values.additional_info}
              onChange={formik.handleChange}
              error={formik.touched.additional_info && Boolean(formik.errors.additional_info)}
              helperText={formik.touched.additional_info && formik.errors.additional_info}
            />
          </Grid>
        </Grid>
      </Box>

      <Box display="flex" justifyContent="flex-end" mt={4}>
        <MuiButton
          type="submit"
          variant="contained"
          color="primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
              Zapisywanie...
            </>
          ) : isEditMode ? 'Zapisz zmiany' : 'Dodaj buhaja'}
        </MuiButton>
      </Box>
    </form>
  );
};

export default BullForm;