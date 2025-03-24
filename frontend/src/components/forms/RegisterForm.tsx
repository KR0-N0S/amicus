import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  TextField,
  Button,
  Typography,
  Box,
  Grid,
  Alert,
  Checkbox,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { registerUser } from '../../api/authService';
import { useNavigate } from 'react-router-dom';

const RegisterSchema = Yup.object().shape({
  email: Yup.string()
    .email('Nieprawidłowy format email')
    .required('Email jest wymagany'),
  password: Yup.string()
    .min(6, 'Hasło musi mieć co najmniej 6 znaków')
    .matches(/[A-Z]/, 'Hasło musi zawierać wielką literę')
    .matches(/[a-z]/, 'Hasło musi zawierać małą literę')
    .matches(/[0-9]/, 'Hasło musi zawierać cyfrę')
    .required('Hasło jest wymagane'),
  first_name: Yup.string().required('Imię jest wymagane'),
  last_name: Yup.string().required('Nazwisko jest wymagane'),
  createOrganization: Yup.boolean(),
  'organization.name': Yup.string().when('createOrganization', (createOrganization, schema) => {
    return createOrganization ? schema.required('Nazwa organizacji jest wymagana') : schema;
  })
});

const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = React.useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      phone: '',
      street: '',
      house_number: '',
      city: '',
      postal_code: '',
      tax_id: '',
      createOrganization: false,
      'organization.name': '',
      'organization.street': '',
      'organization.house_number': '',
      'organization.city': '',
      'organization.postal_code': '',
      'organization.tax_id': ''
    },
    validationSchema: RegisterSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        setError(null);
        
        const userData: any = {
          email: values.email,
          password: values.password,
          first_name: values.first_name,
          last_name: values.last_name,
          phone: values.phone || undefined,
          street: values.street || undefined,
          house_number: values.house_number || undefined,
          city: values.city || undefined,
          postal_code: values.postal_code || undefined,
          tax_id: values.tax_id || undefined
        };
        
        if (values.createOrganization) {
          userData.organization = {
            name: values['organization.name'],
            street: values['organization.street'] || undefined,
            house_number: values['organization.house_number'] || undefined,
            city: values['organization.city'] || undefined,
            postal_code: values['organization.postal_code'] || undefined,
            tax_id: values['organization.tax_id'] || undefined
          };
        }
        
        await registerUser(userData);
        navigate('/dashboard');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Błąd rejestracji. Spróbuj ponownie.');
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 3 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            id="first_name"
            name="first_name"
            label="Imię"
            value={formik.values.first_name}
            onChange={formik.handleChange}
            error={formik.touched.first_name && Boolean(formik.errors.first_name)}
            helperText={formik.touched.first_name && formik.errors.first_name}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            id="last_name"
            name="last_name"
            label="Nazwisko"
            value={formik.values.last_name}
            onChange={formik.handleChange}
            error={formik.touched.last_name && Boolean(formik.errors.last_name)}
            helperText={formik.touched.last_name && formik.errors.last_name}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            id="email"
            name="email"
            label="Email"
            value={formik.values.email}
            onChange={formik.handleChange}
            error={formik.touched.email && Boolean(formik.errors.email)}
            helperText={formik.touched.email && formik.errors.email}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            id="password"
            name="password"
            label="Hasło"
            type="password"
            value={formik.values.password}
            onChange={formik.handleChange}
            error={formik.touched.password && Boolean(formik.errors.password)}
            helperText={formik.touched.password && formik.errors.password}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            id="phone"
            name="phone"
            label="Telefon"
            value={formik.values.phone}
            onChange={formik.handleChange}
          />
        </Grid>
      </Grid>
      
      <Accordion sx={{ mt: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Adres (opcjonalnie)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                id="street"
                name="street"
                label="Ulica"
                value={formik.values.street}
                onChange={formik.handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                id="house_number"
                name="house_number"
                label="Numer budynku"
                value={formik.values.house_number}
                onChange={formik.handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="city"
                name="city"
                label="Miasto"
                value={formik.values.city}
                onChange={formik.handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="postal_code"
                name="postal_code"
                label="Kod pocztowy"
                value={formik.values.postal_code}
                onChange={formik.handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="tax_id"
                name="tax_id"
                label="NIP"
                value={formik.values.tax_id}
                onChange={formik.handleChange}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
      
      <Box mt={2}>
        <FormControlLabel
          control={
            <Checkbox
              id="createOrganization"
              name="createOrganization"
              checked={formik.values.createOrganization}
              onChange={formik.handleChange}
            />
          }
          label="Stwórz nową organizację"
        />
      </Box>
      
      {formik.values.createOrganization && (
        <Accordion expanded={formik.values.createOrganization} sx={{ mt: 2 }}>
          <AccordionSummary>
            <Typography>Dane organizacji</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="organization.name"
                  name="organization.name"
                  label="Nazwa organizacji"
                  value={formik.values['organization.name']}
                  onChange={formik.handleChange}
                  error={formik.touched['organization.name'] && Boolean(formik.errors['organization.name'])}
                  helperText={formik.touched['organization.name'] && formik.errors['organization.name']}
                />
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  id="organization.street"
                  name="organization.street"
                  label="Ulica"
                  value={formik.values['organization.street']}
                  onChange={formik.handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  id="organization.house_number"
                  name="organization.house_number"
                  label="Numer budynku"
                  value={formik.values['organization.house_number']}
                  onChange={formik.handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="organization.city"
                  name="organization.city"
                  label="Miasto"
                  value={formik.values['organization.city']}
                  onChange={formik.handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="organization.postal_code"
                  name="organization.postal_code"
                  label="Kod pocztowy"
                  value={formik.values['organization.postal_code']}
                  onChange={formik.handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="organization.tax_id"
                  name="organization.tax_id"
                  label="NIP"
                  value={formik.values['organization.tax_id']}
                  onChange={formik.handleChange}
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      )}
      
      <Button
        color="primary"
        variant="contained"
        fullWidth
        type="submit"
        disabled={formik.isSubmitting}
        sx={{ mt: 3, mb: 2 }}
      >
        {formik.isSubmitting ? 'Rejestracja...' : 'Zarejestruj się'}
      </Button>
      
      <Typography variant="body2" align="center">
        Masz już konto? <Button onClick={() => navigate('/login')} color="primary">Zaloguj się</Button>
      </Typography>
    </Box>
  );
};

export default RegisterForm;
