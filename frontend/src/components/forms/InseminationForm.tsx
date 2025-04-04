import React, { useState, useEffect } from 'react';
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
  Divider,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import { Insemination } from '../../types/models';
import { getBulls } from '../../api/bullService';

interface InseminationFormProps {
  initialValues: Partial<Insemination>;
  onSubmit: (values: Partial<Insemination>) => void;
  isSubmitting: boolean;
  error: string | null;
  isEditMode: boolean;
}

const validationSchema = yup.object({
  certificate_number: yup.string().required('Numer certyfikatu jest wymagany'),
  procedure_date: yup.string().required('Data zabiegu jest wymagana'),
  procedure_number: yup.string().required('Numer procedury jest wymagany')
});

const InseminationForm: React.FC<InseminationFormProps> = ({
  initialValues,
  onSubmit,
  isSubmitting,
  error,
  isEditMode
}) => {
  const [bulls, setBulls] = useState<any[]>([]);
  const [bullsLoading, setBullsLoading] = useState<boolean>(false);
  
  // Pobieranie listy buhajów
  useEffect(() => {
    const fetchBulls = async () => {
      try {
        setBullsLoading(true);
        const response = await getBulls();
        setBulls(response.data || []);
      } catch (error) {
        console.error('Error fetching bulls:', error);
      } finally {
        setBullsLoading(false);
      }
    };
    
    fetchBulls();
  }, []);

  const formik = useFormik({
    initialValues: {
      certificate_number: initialValues.certificate_number || '',
      file_number: initialValues.file_number || '',
      procedure_number: initialValues.procedure_number || '',
      procedure_date: initialValues.procedure_date ? initialValues.procedure_date.substring(0, 10) : '',
      re_insemination: initialValues.re_insemination || 'Nie',
      animal_id: initialValues.animal_id || 0,
      ear_tag_number: initialValues.ear_tag_number || '',
      herd_number: initialValues.herd_number || '',
      herd_eval_number: initialValues.herd_eval_number || '',
      dam_owner: initialValues.dam_owner || '',
      last_calving_date: initialValues.last_calving_date ? initialValues.last_calving_date.substring(0, 10) : '',
      // Zapisujemy bull_id jako string w formiku dla łatwiejszej obsługi pola Select
      bull_id: initialValues.bull_id ? initialValues.bull_id.toString() : '',
      bull_type: initialValues.bull_type || '',
      supplier: initialValues.supplier || '',
      inseminator: initialValues.inseminator || '',
      symlek_status: initialValues.symlek_status || '',
      symlek_responsibility: initialValues.symlek_responsibility || ''
    },
    validationSchema,
    onSubmit: (values) => {
      // Konwertujemy bull_id na liczbę przed przekazaniem dalej
      const processedValues: Partial<Insemination> = {
        ...values,
        // Konwersja bull_id z string na number (lub undefined jeśli pusty)
        bull_id: values.bull_id ? parseInt(values.bull_id as string, 10) : undefined
      };
      
      onSubmit(processedValues);
    }
  });

  const bullTypeOptions = [
    { value: 'dairy', label: 'Mleczny' },
    { value: 'beef', label: 'Mięsny' },
    { value: 'dual', label: 'Dwukierunkowy' }
  ];

  const symlekStatusOptions = [
    { value: 'not_sent', label: 'Nie wysłano' },
    { value: 'pending', label: 'Oczekuje' },
    { value: 'accepted', label: 'Zaakceptowano' },
    { value: 'rejected', label: 'Odrzucono' }
  ];

  const symlekResponsibilityOptions = [
    { value: 'full', label: 'Pełna odpowiedzialność' },
    { value: 'partial', label: 'Częściowa odpowiedzialność' },
    { value: 'none', label: 'Brak odpowiedzialności' }
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
          Dane certyfikatu
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              id="certificate_number"
              name="certificate_number"
              label="Numer certyfikatu *"
              value={formik.values.certificate_number}
              onChange={formik.handleChange}
              error={formik.touched.certificate_number && Boolean(formik.errors.certificate_number)}
              helperText={formik.touched.certificate_number && formik.errors.certificate_number}
              required
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              id="file_number"
              name="file_number"
              label="Numer pliku"
              value={formik.values.file_number}
              onChange={formik.handleChange}
              error={formik.touched.file_number && Boolean(formik.errors.file_number)}
              helperText={formik.touched.file_number && formik.errors.file_number}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              id="procedure_number"
              name="procedure_number"
              label="Numer procedury *"
              value={formik.values.procedure_number}
              onChange={formik.handleChange}
              error={formik.touched.procedure_number && Boolean(formik.errors.procedure_number)}
              helperText={formik.touched.procedure_number && formik.errors.procedure_number}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="procedure_date"
              name="procedure_date"
              label="Data zabiegu *"
              type="date"
              value={formik.values.procedure_date}
              onChange={formik.handleChange}
              InputLabelProps={{
                shrink: true,
              }}
              error={formik.touched.procedure_date && Boolean(formik.errors.procedure_date)}
              helperText={formik.touched.procedure_date && formik.errors.procedure_date}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Ponowna inseminacja</InputLabel>
              <Select
                id="re_insemination"
                name="re_insemination"
                value={formik.values.re_insemination}
                onChange={formik.handleChange}
                error={formik.touched.re_insemination && Boolean(formik.errors.re_insemination)}
                label="Ponowna inseminacja"
              >
                <MenuItem value="Nie">Nie</MenuItem>
                <MenuItem value="Tak">Tak</MenuItem>
              </Select>
              {formik.touched.re_insemination && formik.errors.re_insemination && (
                <FormHelperText error>{formik.errors.re_insemination}</FormHelperText>
              )}
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box mb={4}>
        <Typography variant="h6" gutterBottom>
          Dane zwierzęcia
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="ear_tag_number"
              name="ear_tag_number"
              label="Numer kolczyka"
              value={formik.values.ear_tag_number}
              onChange={formik.handleChange}
              error={formik.touched.ear_tag_number && Boolean(formik.errors.ear_tag_number)}
              helperText={formik.touched.ear_tag_number && formik.errors.ear_tag_number}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="last_calving_date"
              name="last_calving_date"
              label="Data ostatniego wycielenia"
              type="date"
              value={formik.values.last_calving_date}
              onChange={formik.handleChange}
              InputLabelProps={{
                shrink: true,
              }}
              error={formik.touched.last_calving_date && Boolean(formik.errors.last_calving_date)}
              helperText={formik.touched.last_calving_date && formik.errors.last_calving_date}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              id="herd_number"
              name="herd_number"
              label="Numer stada"
              value={formik.values.herd_number}
              onChange={formik.handleChange}
              error={formik.touched.herd_number && Boolean(formik.errors.herd_number)}
              helperText={formik.touched.herd_number && formik.errors.herd_number}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              id="herd_eval_number"
              name="herd_eval_number"
              label="Numer oceny stada"
              value={formik.values.herd_eval_number}
              onChange={formik.handleChange}
              error={formik.touched.herd_eval_number && Boolean(formik.errors.herd_eval_number)}
              helperText={formik.touched.herd_eval_number && formik.errors.herd_eval_number}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              id="dam_owner"
              name="dam_owner"
              label="Właściciel samicy"
              value={formik.values.dam_owner}
              onChange={formik.handleChange}
              error={formik.touched.dam_owner && Boolean(formik.errors.dam_owner)}
              helperText={formik.touched.dam_owner && formik.errors.dam_owner}
            />
          </Grid>
        </Grid>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box mb={4}>
        <Typography variant="h6" gutterBottom>
          Dane buhaja
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Buhaj</InputLabel>
              <Select
                id="bull_id"
                name="bull_id"
                value={formik.values.bull_id}
                onChange={formik.handleChange}
                error={formik.touched.bull_id && Boolean(formik.errors.bull_id)}
                label="Buhaj"
                disabled={bullsLoading}
              >
                <MenuItem value="">Wybierz buhaja</MenuItem>
                {bulls.map((bull) => (
                  <MenuItem key={bull.id} value={bull.id.toString()}>
                    {bull.identification_number}
                  </MenuItem>
                ))}
              </Select>
              {bullsLoading && (
                <FormHelperText>Ładowanie buhajów...</FormHelperText>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="bull_type"
              name="bull_type"
              label="Typ buhaja"
              select
              value={formik.values.bull_type}
              onChange={formik.handleChange}
              error={formik.touched.bull_type && Boolean(formik.errors.bull_type)}
              helperText={formik.touched.bull_type && formik.errors.bull_type}
            >
              <MenuItem value="">Wybierz typ</MenuItem>
              {bullTypeOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={12}>
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
        </Grid>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box mb={4}>
        <Typography variant="h6" gutterBottom>
          Dane wykonawcy i status
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              id="inseminator"
              name="inseminator"
              label="Inseminator"
              value={formik.values.inseminator}
              onChange={formik.handleChange}
              error={formik.touched.inseminator && Boolean(formik.errors.inseminator)}
              helperText={formik.touched.inseminator && formik.errors.inseminator}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              id="symlek_status"
              name="symlek_status"
              label="Status SymLek"
              select
              value={formik.values.symlek_status}
              onChange={formik.handleChange}
              error={formik.touched.symlek_status && Boolean(formik.errors.symlek_status)}
              helperText={formik.touched.symlek_status && formik.errors.symlek_status}
            >
              <MenuItem value="">Wybierz status</MenuItem>
              {symlekStatusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              id="symlek_responsibility"
              name="symlek_responsibility"
              label="Odpowiedzialność SymLek"
              select
              value={formik.values.symlek_responsibility}
              onChange={formik.handleChange}
              error={formik.touched.symlek_responsibility && Boolean(formik.errors.symlek_responsibility)}
              helperText={formik.touched.symlek_responsibility && formik.errors.symlek_responsibility}
            >
              <MenuItem value="">Wybierz odpowiedzialność</MenuItem>
              {symlekResponsibilityOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
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
          ) : isEditMode ? 'Zapisz zmiany' : 'Dodaj zabieg'}
        </MuiButton>
      </Box>
    </form>
  );
};

export default InseminationForm;