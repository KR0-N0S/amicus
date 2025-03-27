import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { TextField, Button, Grid, Box, Typography, Alert, Checkbox, FormControlLabel, Divider, Paper } from '@mui/material';
import { Client } from '../../types/models';

// Rozszerzony schemat walidacji formularza klienta
const ClientFormSchema = Yup.object().shape({
  // Dane podstawowe
  email: Yup.string()
    .email('Nieprawidłowy format adresu email')
    .required('Email jest wymagany'),
  first_name: Yup.string()
    .required('Imię jest wymagane'),
  last_name: Yup.string()
    .required('Nazwisko jest wymagane'),
  phone: Yup.string()
    .nullable()
    .matches(/^(\+\d{2})?\d{9}$|^$/, 'Numer telefonu musi mieć format: 9 cyfr lub +XX 9 cyfr'),
  
  // Adres
  street: Yup.string().nullable(),
  house_number: Yup.string().nullable(),
  city: Yup.string().nullable(),
  postal_code: Yup.string()
    .nullable()
    .matches(/^\d{2}-\d{3}$|^$/, 'Kod pocztowy musi być w formacie XX-XXX'),
  tax_id: Yup.string()
    .nullable()
    .matches(/^(\d{10})?$|^$/, 'NIP musi składać się z 10 cyfr lub być pusty'),
  
  // Dane firmy
  has_company: Yup.boolean(),
  company_name: Yup.string()
    .when('has_company', {
      is: true,
      then: (schema) => schema.required('Nazwa firmy jest wymagana')
    }),
  company_tax_id: Yup.string()
    .nullable()
    .when('has_company', {
      is: true,
      then: (schema) => schema.matches(/^(\d{10})?$|^$/, 'NIP firmy musi składać się z 10 cyfr lub być pusty')
    }),
  company_city: Yup.string().nullable(),
  company_street: Yup.string().nullable(),
  company_house_number: Yup.string().nullable(),
  company_postal_code: Yup.string()
    .nullable()
    .matches(/^\d{2}-\d{3}$|^$/, 'Kod pocztowy musi być w formacie XX-XXX'),
  
  // Dane gospodarstwa
  has_farm: Yup.boolean(),
  farm_name: Yup.string()
    .nullable(),
  herd_registration_number: Yup.string()
    .when('has_farm', {
      is: true,
      then: (schema) => schema.required('Numer siedziby stada jest wymagany')
    }),
  herd_evaluation_number: Yup.string()
    .nullable()
});

interface ClientFormProps {
  initialValues: Partial<Client>;
  onSubmit: (values: Partial<Client>) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
  isEditMode: boolean;
}

const ClientForm: React.FC<ClientFormProps> = ({ 
  initialValues, 
  onSubmit, 
  isSubmitting, 
  error,
  isEditMode
}) => {
  // Stan do kontrolowania widoczności sekcji
  const [hasCompany, setHasCompany] = useState<boolean>(!!initialValues.has_company);
  const [hasFarm, setHasFarm] = useState<boolean>(!!initialValues.has_farm);
  
  const formik = useFormik({
    initialValues: {
      // Dane podstawowe
      email: initialValues.email || '',
      first_name: initialValues.first_name || '',
      last_name: initialValues.last_name || '',
      phone: initialValues.phone || '',
      street: initialValues.street || '',
      house_number: initialValues.house_number || '',
      city: initialValues.city || '',
      postal_code: initialValues.postal_code || '',
      tax_id: initialValues.tax_id || '',
      
      // Dane firmy
      has_company: !!initialValues.has_company,
      company_name: initialValues.company_name || '',
      company_tax_id: initialValues.company_tax_id || '',
      company_city: initialValues.company_city || '',
      company_street: initialValues.company_street || '',
      company_house_number: initialValues.company_house_number || '',
      company_postal_code: initialValues.company_postal_code || '',
      
      // Dane gospodarstwa
      has_farm: !!initialValues.has_farm,
      farm_name: initialValues.farm_name || '',
      herd_registration_number: initialValues.herd_registration_number || '',
      herd_evaluation_number: initialValues.herd_evaluation_number || ''
    },
    validationSchema: ClientFormSchema,
    onSubmit: async (values) => {
      await onSubmit(values);
    },
    enableReinitialize: true, // Pozwala na reinicjalizację wartości gdy zmienią się initialValues
  });
  
  // Obsługa zmiany checkboxa dla firmy
  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setHasCompany(checked);
    formik.setFieldValue('has_company', checked);
  };
  
  // Obsługa zmiany checkboxa dla gospodarstwa
  const handleFarmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setHasFarm(checked);
    formik.setFieldValue('has_farm', checked);
  };

  return (
    <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 3 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Dane podstawowe
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="email"
              name="email"
              label="Email *"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="phone"
              name="phone"
              label="Telefon"
              value={formik.values.phone}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.phone && Boolean(formik.errors.phone)}
              helperText={formik.touched.phone && formik.errors.phone}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              id="first_name"
              name="first_name"
              label="Imię *"
              value={formik.values.first_name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.first_name && Boolean(formik.errors.first_name)}
              helperText={formik.touched.first_name && formik.errors.first_name}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              id="last_name"
              name="last_name"
              label="Nazwisko *"
              value={formik.values.last_name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.last_name && Boolean(formik.errors.last_name)}
              helperText={formik.touched.last_name && formik.errors.last_name}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              id="tax_id"
              name="tax_id"
              label="NIP (osobisty)"
              value={formik.values.tax_id}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.tax_id && Boolean(formik.errors.tax_id)}
              helperText={formik.touched.tax_id && formik.errors.tax_id}
              margin="normal"
            />
          </Grid>
        </Grid>
      </Paper>
      
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Adres zamieszkania
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              id="city"
              name="city"
              label="Miejscowość"
              value={formik.values.city}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.city && Boolean(formik.errors.city)}
              helperText={formik.touched.city && formik.errors.city}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              id="postal_code"
              name="postal_code"
              label="Kod pocztowy"
              placeholder="XX-XXX"
              value={formik.values.postal_code}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.postal_code && Boolean(formik.errors.postal_code)}
              helperText={formik.touched.postal_code && formik.errors.postal_code}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} sm={8}>
            <TextField
              fullWidth
              id="street"
              name="street"
              label="Ulica"
              value={formik.values.street}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.street && Boolean(formik.errors.street)}
              helperText={formik.touched.street && formik.errors.street}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              id="house_number"
              name="house_number"
              label="Nr domu/mieszkania"
              value={formik.values.house_number}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.house_number && Boolean(formik.errors.house_number)}
              helperText={formik.touched.house_number && formik.errors.house_number}
              margin="normal"
            />
          </Grid>
        </Grid>
      </Paper>
      
      {/* Sekcja danych firmy */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={hasCompany}
              onChange={handleCompanyChange}
              name="has_company"
              color="primary"
            />
          }
          label="Klient posiada firmę"
        />
        
        {hasCompany && (
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Dane firmy
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="company_name"
                  name="company_name"
                  label="Nazwa firmy *"
                  value={formik.values.company_name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.company_name && Boolean(formik.errors.company_name)}
                  helperText={formik.touched.company_name && formik.errors.company_name}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="company_tax_id"
                  name="company_tax_id"
                  label="NIP firmy"
                  value={formik.values.company_tax_id}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.company_tax_id && Boolean(formik.errors.company_tax_id)}
                  helperText={formik.touched.company_tax_id && formik.errors.company_tax_id}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Adres firmy
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="company_city"
                  name="company_city"
                  label="Miejscowość firmy"
                  value={formik.values.company_city}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.company_city && Boolean(formik.errors.company_city)}
                  helperText={formik.touched.company_city && formik.errors.company_city}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="company_postal_code"
                  name="company_postal_code"
                  label="Kod pocztowy firmy"
                  placeholder="XX-XXX"
                  value={formik.values.company_postal_code}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.company_postal_code && Boolean(formik.errors.company_postal_code)}
                  helperText={formik.touched.company_postal_code && formik.errors.company_postal_code}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  id="company_street"
                  name="company_street"
                  label="Ulica firmy"
                  value={formik.values.company_street}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.company_street && Boolean(formik.errors.company_street)}
                  helperText={formik.touched.company_street && formik.errors.company_street}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  id="company_house_number"
                  name="company_house_number"
                  label="Nr budynku firmy"
                  value={formik.values.company_house_number}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.company_house_number && Boolean(formik.errors.company_house_number)}
                  helperText={formik.touched.company_house_number && formik.errors.company_house_number}
                  margin="normal"
                />
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>
      
      {/* Sekcja danych gospodarstwa rolnego */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={hasFarm}
              onChange={handleFarmChange}
              name="has_farm"
              color="primary"
            />
          }
          label="Klient posiada gospodarstwo rolne"
        />
        
        {hasFarm && (
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Dane gospodarstwa rolnego
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="farm_name"
                  name="farm_name"
                  label="Nazwa gospodarstwa"
                  value={formik.values.farm_name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.farm_name && Boolean(formik.errors.farm_name)}
                  helperText={formik.touched.farm_name && formik.errors.farm_name}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="herd_registration_number"
                  name="herd_registration_number"
                  label="Numer siedziby stada *"
                  value={formik.values.herd_registration_number}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.herd_registration_number && Boolean(formik.errors.herd_registration_number)}
                  helperText={formik.touched.herd_registration_number && formik.errors.herd_registration_number}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="herd_evaluation_number"
                  name="herd_evaluation_number"
                  label="Numer stada pod oceną (opcjonalnie)"
                  value={formik.values.herd_evaluation_number}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.herd_evaluation_number && Boolean(formik.errors.herd_evaluation_number)}
                  helperText={formik.touched.herd_evaluation_number && formik.errors.herd_evaluation_number}
                  margin="normal"
                />
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>
      
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          type="submit"
          disabled={isSubmitting}
          size="large"
        >
          {isSubmitting ? 'Zapisywanie...' : isEditMode ? 'Zapisz zmiany' : 'Dodaj klienta'}
        </Button>
      </Box>
    </Box>
  );
};

export default ClientForm;