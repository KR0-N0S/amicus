import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { TextField, Button, Grid, Box, Typography, Alert, Checkbox, FormControlLabel, Divider, Paper, InputAdornment } from '@mui/material';
import { Client } from '../../types/models';

// Funkcja walidująca NIP
const validateNip = (nip: string): boolean => {
  // Usuwamy wszystkie nie-cyfry
  const cleanNip = nip.replace(/[^0-9]/g, '');
  
  if (cleanNip.length !== 10) return false;
  
  // Wagi dla poszczególnych cyfr NIP
  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  
  // Obliczamy sumę kontrolną
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanNip[i]) * weights[i];
  }
  
  // Obliczamy cyfrę kontrolną
  const checksum = sum % 11;
  const controlDigit = checksum === 10 ? 0 : checksum;
  
  // Porównujemy z ostatnią cyfrą NIP
  return controlDigit === parseInt(cleanNip[9]);
};

// Funkcja formatująca NIP dla lepszej czytelności
const formatNip = (nip: string): string => {
  // Usuwamy wszystkie nie-cyfry
  const cleanNip = nip.replace(/[^0-9]/g, '');
  
  if (cleanNip.length <= 3) return cleanNip;
  if (cleanNip.length <= 6) return `${cleanNip.slice(0, 3)}-${cleanNip.slice(3)}`;
  if (cleanNip.length <= 8) return `${cleanNip.slice(0, 3)}-${cleanNip.slice(3, 6)}-${cleanNip.slice(6)}`;
  return `${cleanNip.slice(0, 3)}-${cleanNip.slice(3, 6)}-${cleanNip.slice(6, 8)}-${cleanNip.slice(8, 10)}`;
};

// Funkcja formatująca numer siedziby stada
const formatHerdId = (herdId: string): string => {
  if (!herdId) return 'PL';
  
  // Usuń wszystkie nie-alfanumeryczne znaki i zamień na wielkie litery
  let cleaned = herdId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  
  // Zapewnij, że zaczyna się od PL
  if (!cleaned.startsWith('PL')) {
    cleaned = 'PL' + cleaned.replace(/[^0-9]/g, '');
  } else {
    // Zachowaj PL i usuń wszystkie nie-cyfry z reszty
    cleaned = 'PL' + cleaned.substring(2).replace(/[^0-9]/g, '');
  }
  
  // Ogranicz długość do 14 znaków (PL + 12 cyfr)
  return cleaned.slice(0, 14);
};

// Funkcja formatująca kod pocztowy
const formatPostalCode = (code: string): string => {
  if (!code) return '';
  
  // Usuń wszystkie nie-cyfry
  const cleaned = code.replace(/[^0-9]/g, '');
  
  // Format XX-XXX
  if (cleaned.length <= 2) return cleaned;
  return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 5)}`;
};

// Rozszerzony schemat walidacji formularza klienta z niestandardowymi walidacjami
const ClientFormSchema = Yup.object().shape({
  // Dane podstawowe
  email: Yup.string()
    .email('Nieprawidłowy format adresu email')
    .required('Email jest wymagany'),
  first_name: Yup.string()
    .required('Imię jest wymagane')
    .min(2, 'Imię musi zawierać co najmniej 2 znaki'),
  last_name: Yup.string()
    .required('Nazwisko jest wymagane')
    .min(2, 'Nazwisko musi zawierać co najmniej 2 znaki'),
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
  
  // NIP z walidacją cyfry kontrolnej
  tax_id: Yup.string()
    .nullable()
    .test('is-valid-nip', 'Nieprawidłowy NIP - błędna cyfra kontrolna', function (value) {
      if (!value) return true; // Puste pole jest dopuszczalne
      const cleanNip = value.replace(/[^0-9]/g, '');
      if (cleanNip.length !== 10) return true; // Walidacja długości jest już w innej regule
      return validateNip(cleanNip);
    })
    .matches(/^(\d{3}-\d{3}-\d{2}-\d{2})?$|^(\d{10})?$|^$/, 'NIP musi składać się z 10 cyfr'),
  
  // Dane firmy - POPRAWIONA WALIDACJA
  has_company: Yup.boolean(),
  company_name: Yup.string()
    .when('has_company', {
      is: true,
      then: (schema) => schema.required('Nazwa firmy jest wymagana'),
      otherwise: (schema) => schema.notRequired() // Jawnie oznaczamy jako niewymagane
    }),
  
  // NIP firmy z walidacją cyfry kontrolnej
  company_tax_id: Yup.string()
    .nullable()
    .when('has_company', {
      is: true,
      then: (schema) => schema
        .test('is-valid-company-nip', 'Nieprawidłowy NIP firmy - błędna cyfra kontrolna', function (value) {
          if (!value) return true;
          const cleanNip = value.replace(/[^0-9]/g, '');
          if (cleanNip.length !== 10) return true;
          return validateNip(cleanNip);
        })
        .matches(/^(\d{3}-\d{3}-\d{2}-\d{2})?$|^(\d{10})?$|^$/, 'NIP firmy musi składać się z 10 cyfr')
    }),
  
  company_city: Yup.string().nullable(),
  company_street: Yup.string().nullable(),
  company_house_number: Yup.string().nullable(),
  company_postal_code: Yup.string()
    .nullable()
    .matches(/^\d{2}-\d{3}$|^$/, 'Kod pocztowy firmy musi być w formacie XX-XXX'),
  
  // Dane gospodarstwa
  has_farm: Yup.boolean(),
  farm_name: Yup.string()
    .nullable(),
  
  // Walidacja numeru siedziby stada
  herd_registration_number: Yup.string()
    .when('has_farm', {
      is: true,
      then: (schema) => schema
        .required('Numer siedziby stada jest wymagany')
        .matches(/^PL\d{12}$/, 'Numer siedziby stada musi zawierać PL i 12 cyfr'),
      otherwise: (schema) => schema.notRequired() // Jawnie oznaczamy jako niewymagane
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
  
  // Przygotowanie początkowego numeru siedziby stada
  const initialHerdId = initialValues.herd_registration_number || 'PL';
  
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
      herd_registration_number: initialHerdId,
      herd_evaluation_number: initialValues.herd_evaluation_number || ''
    },
    validationSchema: ClientFormSchema,
    onSubmit: async (values) => {
      // Czyszczenie formatowania przed wysłaniem
      const cleanedValues = {
        ...values,
        tax_id: values.tax_id ? values.tax_id.replace(/[^0-9]/g, '') : '',
        company_tax_id: values.company_tax_id ? values.company_tax_id.replace(/[^0-9]/g, '') : '',
        postal_code: values.postal_code ? values.postal_code.replace(/[^0-9]/g, '') : '',
        company_postal_code: values.company_postal_code ? values.company_postal_code.replace(/[^0-9]/g, '') : '',
      };
      
      await onSubmit(cleanedValues);
    },
    enableReinitialize: true, // Pozwala na reinicjalizację wartości gdy zmienią się initialValues
  });
  
  // Obsługa zmiany checkboxa dla firmy
  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setHasCompany(checked);
    formik.setFieldValue('has_company', checked);
    
    // Jeśli odznaczamy checkbox, wyczyść wszystkie pola związane z firmą
    if (!checked) {
      formik.setFieldValue('company_name', '');
      formik.setFieldValue('company_tax_id', '');
      formik.setFieldValue('company_city', '');
      formik.setFieldValue('company_street', '');
      formik.setFieldValue('company_house_number', '');
      formik.setFieldValue('company_postal_code', '');
      
      // Resetuj też błędy walidacji związane z firmą
      formik.setFieldError('company_name', undefined);
      formik.setFieldError('company_tax_id', undefined);
    }
  };
  
  // Obsługa zmiany checkboxa dla gospodarstwa
  const handleFarmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setHasFarm(checked);
    formik.setFieldValue('has_farm', checked);
    
    // Jeśli włączamy gospodarstwo, a pole jest puste, dodajemy prefiks PL
    if (checked && (!formik.values.herd_registration_number || formik.values.herd_registration_number === '')) {
      formik.setFieldValue('herd_registration_number', 'PL');
    }
    
    // Jeśli wyłączamy gospodarstwo, czyścimy pola
    if (!checked) {
      formik.setFieldValue('farm_name', '');
      formik.setFieldValue('herd_registration_number', '');
      formik.setFieldValue('herd_evaluation_number', '');
      
      // Resetuj błędy walidacji
      formik.setFieldError('herd_registration_number', undefined);
    }
  };
  
  // Obsługa formatowania dla NIP - poprawiona sygnatura funkcji
  const handleNipChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, fieldName: string) => {
    const rawValue = e.target.value;
    const formattedValue = formatNip(rawValue);
    formik.setFieldValue(fieldName, formattedValue);
  };
  
  // Obsługa formatowania dla kodu pocztowego - poprawiona sygnatura funkcji
  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, fieldName: string) => {
    const rawValue = e.target.value;
    const formattedValue = formatPostalCode(rawValue);
    formik.setFieldValue(fieldName, formattedValue);
  };
  
  // Obsługa formatowania dla numeru siedziby stada - poprawiona sygnatura funkcji
  const handleHerdIdChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const rawValue = e.target.value;
    const formattedValue = formatHerdId(rawValue);
    formik.setFieldValue('herd_registration_number', formattedValue);
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
              onChange={(e) => handleNipChange(e, 'tax_id')}
              onBlur={formik.handleBlur}
              error={formik.touched.tax_id && Boolean(formik.errors.tax_id)}
              helperText={
                (formik.touched.tax_id && formik.errors.tax_id) || 
                'Format: XXX-XXX-XX-XX'
              }
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
              onChange={(e) => handlePostalCodeChange(e, 'postal_code')}
              onBlur={formik.handleBlur}
              error={formik.touched.postal_code && Boolean(formik.errors.postal_code)}
              helperText={
                (formik.touched.postal_code && formik.errors.postal_code) ||
                'Format: XX-XXX'
              }
              margin="normal"
              inputProps={{ maxLength: 6 }}
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
                  onChange={(e) => handleNipChange(e, 'company_tax_id')}
                  onBlur={formik.handleBlur}
                  error={formik.touched.company_tax_id && Boolean(formik.errors.company_tax_id)}
                  helperText={
                    (formik.touched.company_tax_id && formik.errors.company_tax_id) ||
                    'Format: XXX-XXX-XX-XX'
                  }
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
                  onChange={(e) => handlePostalCodeChange(e, 'company_postal_code')}
                  onBlur={formik.handleBlur}
                  error={formik.touched.company_postal_code && Boolean(formik.errors.company_postal_code)}
                  helperText={
                    (formik.touched.company_postal_code && formik.errors.company_postal_code) ||
                    'Format: XX-XXX'
                  }
                  margin="normal"
                  inputProps={{ maxLength: 6 }}
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
                  onChange={handleHerdIdChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.herd_registration_number && Boolean(formik.errors.herd_registration_number)}
                  helperText={
                    (formik.touched.herd_registration_number && formik.errors.herd_registration_number) ||
                    'Format: PL + 12 cyfr'
                  }
                  margin="normal"
                  InputProps={{
                    startAdornment: !formik.values.herd_registration_number.startsWith('PL') ? (
                      <InputAdornment position="start">PL</InputAdornment>
                    ) : null,
                  }}
                  inputProps={{ maxLength: 14 }}
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