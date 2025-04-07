import React from 'react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import {
  TextField,
  Grid,
  Button as MuiButton,
  Box,
  CircularProgress,
  Typography,
  Alert,
  Divider,
} from '@mui/material';
import { SemenProvider } from '../../types/models';

interface SemenProviderFormProps {
  initialValues: Partial<SemenProvider>;
  onSubmit: (values: Partial<SemenProvider>) => void;
  isSubmitting: boolean;
  error: string | null;
  isEditMode: boolean;
}

const validationSchema = yup.object({
  name: yup.string().required('Nazwa dostawcy jest wymagana'),
  vet_id_number: yup.string().required('Numer weterynaryjny jest wymagany'),
  contact_email: yup.string().email('Niepoprawny format adresu email').nullable(),
  contact_phone: yup.string().matches(/^[0-9+ -]*$/, 'Niepoprawny format numeru telefonu').nullable(),
});

const SemenProviderForm: React.FC<SemenProviderFormProps> = ({
  initialValues,
  onSubmit,
  isSubmitting,
  error,
  isEditMode
}) => {
  const formik = useFormik({
    initialValues: {
      name: initialValues.name || '',
      vet_id_number: initialValues.vet_id_number || '',
      address_street: initialValues.address_street || '',
      address_city: initialValues.address_city || '',
      address_postal_code: initialValues.address_postal_code || '',
      address_province: initialValues.address_province || '',
      address_country: initialValues.address_country || 'Polska',
      contact_phone: initialValues.contact_phone || '',
      contact_email: initialValues.contact_email || '',
    },
    validationSchema,
    onSubmit: (values) => {
      onSubmit(values);
    }
  });

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
              id="name"
              name="name"
              label="Nazwa dostawcy *"
              value={formik.values.name}
              onChange={formik.handleChange}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="vet_id_number"
              name="vet_id_number"
              label="Numer weterynaryjny *"
              value={formik.values.vet_id_number}
              onChange={formik.handleChange}
              error={formik.touched.vet_id_number && Boolean(formik.errors.vet_id_number)}
              helperText={formik.touched.vet_id_number && formik.errors.vet_id_number}
              required
            />
          </Grid>
        </Grid>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box mb={4}>
        <Typography variant="h6" gutterBottom>
          Dane adresowe
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              id="address_street"
              name="address_street"
              label="Ulica i numer"
              value={formik.values.address_street}
              onChange={formik.handleChange}
              error={formik.touched.address_street && Boolean(formik.errors.address_street)}
              helperText={formik.touched.address_street && formik.errors.address_street}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="address_city"
              name="address_city"
              label="Miejscowość"
              value={formik.values.address_city}
              onChange={formik.handleChange}
              error={formik.touched.address_city && Boolean(formik.errors.address_city)}
              helperText={formik.touched.address_city && formik.errors.address_city}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="address_postal_code"
              name="address_postal_code"
              label="Kod pocztowy"
              value={formik.values.address_postal_code}
              onChange={formik.handleChange}
              error={formik.touched.address_postal_code && Boolean(formik.errors.address_postal_code)}
              helperText={formik.touched.address_postal_code && formik.errors.address_postal_code}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="address_province"
              name="address_province"
              label="Województwo"
              value={formik.values.address_province}
              onChange={formik.handleChange}
              error={formik.touched.address_province && Boolean(formik.errors.address_province)}
              helperText={formik.touched.address_province && formik.errors.address_province}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="address_country"
              name="address_country"
              label="Kraj"
              value={formik.values.address_country}
              onChange={formik.handleChange}
              error={formik.touched.address_country && Boolean(formik.errors.address_country)}
              helperText={formik.touched.address_country && formik.errors.address_country}
            />
          </Grid>
        </Grid>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box mb={4}>
        <Typography variant="h6" gutterBottom>
          Dane kontaktowe
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="contact_phone"
              name="contact_phone"
              label="Telefon"
              value={formik.values.contact_phone}
              onChange={formik.handleChange}
              error={formik.touched.contact_phone && Boolean(formik.errors.contact_phone)}
              helperText={formik.touched.contact_phone && formik.errors.contact_phone}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="contact_email"
              name="contact_email"
              label="Email"
              type="email"
              value={formik.values.contact_email}
              onChange={formik.handleChange}
              error={formik.touched.contact_email && Boolean(formik.errors.contact_email)}
              helperText={formik.touched.contact_email && formik.errors.contact_email}
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
          ) : isEditMode ? 'Zapisz zmiany' : 'Dodaj dostawcę'}
        </MuiButton>
      </Box>
    </form>
  );
};

export default SemenProviderForm;