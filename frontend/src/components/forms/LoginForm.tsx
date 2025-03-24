import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { TextField, Button, Typography, Box, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AuthContextType } from '../../context/auth-types';

const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Nieprawidłowy format email')
    .required('Email jest wymagany'),
  password: Yup.string()
    .required('Hasło jest wymagane')
});

const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = React.useState<string | null>(null);
  // Jawnie przypisujemy typ dla kontekstu autoryzacji
  const { login } = useAuth() as AuthContextType;

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: LoginSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        setError(null);
        console.log("Próba logowania z danymi:", values.email);
        
        // Teraz TypeScript powinien rozpoznać login jako funkcję
        const result = await login(values.email, values.password);
        
        if (result) {
          console.log("Logowanie udane, przekierowanie do dashboard");
          navigate('/dashboard');
        } else {
          console.error("Logowanie nieudane");
          setError('Nieprawidłowe dane logowania');
        }
      } catch (err: any) {
        console.error("Błąd podczas logowania:", err);
        setError(err.response?.data?.message || 'Błąd logowania. Spróbuj ponownie.');
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 3 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <TextField
        fullWidth
        id="email"
        name="email"
        label="Email"
        value={formik.values.email}
        onChange={formik.handleChange}
        error={formik.touched.email && Boolean(formik.errors.email)}
        helperText={formik.touched.email && formik.errors.email}
        margin="normal"
      />
      
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
        margin="normal"
      />
      
      <Button
        color="primary"
        variant="contained"
        fullWidth
        type="submit"
        disabled={formik.isSubmitting}
        sx={{ mt: 3, mb: 2 }}
      >
        {formik.isSubmitting ? 'Logowanie...' : 'Zaloguj się'}
      </Button>
      
      <Typography variant="body2" align="center">
        Nie masz konta? <Button onClick={() => navigate('/register')} color="primary">Zarejestruj się</Button>
      </Typography>
    </Box>
  );
};

export default LoginForm;
