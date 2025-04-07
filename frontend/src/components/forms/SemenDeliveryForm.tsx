import React, { useState, useEffect } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  IconButton,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper
} from '@mui/material';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { SemenDelivery, SemenProvider, Bull } from '../../types/models';
import { getSemenProviders } from '../../api/semenProviderService';
import { getBulls } from '../../api/bullService';

interface SemenDeliveryFormProps {
  initialValues: Partial<SemenDelivery>;
  onSubmit: (values: Partial<SemenDelivery>) => void;
  isSubmitting: boolean;
  error: string | null;
  isEditMode: boolean;
}

const validationSchema = yup.object({
  provider_id: yup.number().required('Dostawca jest wymagany'),
  delivery_date: yup.string().required('Data dostawy jest wymagana'),
  invoice_number: yup.string()
});

const SemenDeliveryForm: React.FC<SemenDeliveryFormProps> = ({
  initialValues,
  onSubmit,
  isSubmitting,
  error,
  isEditMode
}) => {
  const [providers, setProviders] = useState<SemenProvider[]>([]);
  const [providersLoading, setProvidersLoading] = useState<boolean>(false);
  const [bulls, setBulls] = useState<Bull[]>([]);
  const [bullsLoading, setBullsLoading] = useState<boolean>(false);
  const [items, setItems] = useState<any[]>(initialValues.items || []);

  // Pobieranie listy dostawców
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setProvidersLoading(true);
        const response = await getSemenProviders();
        setProviders(response.data || []);
      } catch (error) {
        console.error('Error fetching providers:', error);
      } finally {
        setProvidersLoading(false);
      }
    };
    
    fetchProviders();
  }, []);

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
      provider_id: initialValues.provider_id || '',
      delivery_date: initialValues.delivery_date ? initialValues.delivery_date.substring(0, 10) : '',
      invoice_number: initialValues.invoice_number || '',
      notes: initialValues.notes || ''
    },
    validationSchema,
    onSubmit: (values) => {
      if (items.length === 0) {
        formik.setErrors({ ...formik.errors, provider_id: 'Dodaj przynajmniej jedną pozycję dostawy' });
        return;
      }

      const combinedValues = {
        ...values,
        provider_id: Number(values.provider_id),
        items: items
      };
      
      onSubmit(combinedValues);
    }
  });

  const addItem = () => {
    setItems([...items, {
      bull_id: '',
      straw_count: 0,
      straw_price: '',
      batch_number: '',
      production_date: '',
      expiration_date: '',
      notes: ''
    }]);
  };

  const removeItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  return (
    <form onSubmit={formik.handleSubmit}>
      {error && (
        <Box mb={3}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}

      <Box mb={4}>
        <Typography variant="h6" gutterBottom>
          Dane dostawy
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl 
              fullWidth 
              error={formik.touched.provider_id && Boolean(formik.errors.provider_id)}
            >
              <InputLabel id="provider-select-label">Dostawca *</InputLabel>
              <Select
                labelId="provider-select-label"
                id="provider_id"
                name="provider_id"
                value={formik.values.provider_id}
                onChange={formik.handleChange}
                label="Dostawca *"
                disabled={providersLoading}
                required
              >
                <MenuItem value="">Wybierz dostawcę</MenuItem>
                {providers.map((provider) => (
                  <MenuItem key={provider.id} value={provider.id}>
                    {provider.name} ({provider.vet_id_number})
                  </MenuItem>
                ))}
              </Select>
              {formik.touched.provider_id && formik.errors.provider_id && (
                <FormHelperText error>{formik.errors.provider_id}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="delivery_date"
              name="delivery_date"
              label="Data dostawy *"
              type="date"
              value={formik.values.delivery_date}
              onChange={formik.handleChange}
              InputLabelProps={{
                shrink: true,
              }}
              error={formik.touched.delivery_date && Boolean(formik.errors.delivery_date)}
              helperText={formik.touched.delivery_date && formik.errors.delivery_date}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              id="invoice_number"
              name="invoice_number"
              label="Numer faktury"
              value={formik.values.invoice_number}
              onChange={formik.handleChange}
              error={formik.touched.invoice_number && Boolean(formik.errors.invoice_number)}
              helperText={formik.touched.invoice_number && formik.errors.invoice_number}
            />
          </Grid>
        </Grid>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Pozycje dostawy
          </Typography>
          <MuiButton 
            variant="outlined" 
            color="primary" 
            startIcon={<FaPlus />}
            onClick={addItem}
          >
            Dodaj pozycję
          </MuiButton>
        </Box>

        {items.length === 0 ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            Brak pozycji dostawy. Dodaj przynajmniej jedną pozycję, aby zapisać dostawę.
          </Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Buhaj</TableCell>
                  <TableCell>Ilość słomek</TableCell>
                  <TableCell>Cena za słomkę</TableCell>
                  <TableCell>Numer partii</TableCell>
                  <TableCell>Data produkcji</TableCell>
                  <TableCell>Data ważności</TableCell>
                  <TableCell>Akcje</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <FormControl fullWidth>
                        <Select
                          value={item.bull_id}
                          onChange={(e) => handleItemChange(index, 'bull_id', e.target.value)}
                          displayEmpty
                          disabled={bullsLoading}
                        >
                          <MenuItem value="">Wybierz buhaja</MenuItem>
                          {bulls.map((bull) => (
                            <MenuItem key={bull.id} value={bull.id}>
                              {bull.identification_number}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        value={item.straw_count}
                        onChange={(e) => handleItemChange(index, 'straw_count', parseInt(e.target.value) || 0)}
                        fullWidth
                        inputProps={{ min: 0 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        value={item.straw_price}
                        onChange={(e) => handleItemChange(index, 'straw_price', e.target.value)}
                        fullWidth
                        inputProps={{ step: "0.01" }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        value={item.batch_number}
                        onChange={(e) => handleItemChange(index, 'batch_number', e.target.value)}
                        fullWidth
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="date"
                        value={item.production_date || ''}
                        onChange={(e) => handleItemChange(index, 'production_date', e.target.value)}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="date"
                        value={item.expiration_date || ''}
                        onChange={(e) => handleItemChange(index, 'expiration_date', e.target.value)}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton color="error" onClick={() => removeItem(index)}>
                        <FaTrash />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      <Box mb={4}>
        <Typography variant="h6" gutterBottom>
          Uwagi
        </Typography>
        <TextField
          fullWidth
          id="notes"
          name="notes"
          label="Dodatkowe informacje"
          multiline
          rows={4}
          value={formik.values.notes}
          onChange={formik.handleChange}
        />
      </Box>

      <Box display="flex" justifyContent="flex-end" mt={4}>
        <MuiButton
          type="submit"
          variant="contained"
          color="primary"
          disabled={isSubmitting || items.length === 0}
        >
          {isSubmitting ? (
            <>
              <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
              Zapisywanie...
            </>
          ) : isEditMode ? 'Zapisz zmiany' : 'Dodaj dostawę'}
        </MuiButton>
      </Box>
    </form>
  );
};

export default SemenDeliveryForm;