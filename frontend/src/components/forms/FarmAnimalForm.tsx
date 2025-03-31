import React, { useState, useEffect } from 'react';
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
  FormLabel,
  Autocomplete,
  IconButton,
  Tooltip,
  Paper
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/pl';
import { Animal } from '../../types/models';
import { searchUsers, fetchOwnerDetails } from '../../api/userApi';

interface FarmAnimalFormProps {
  initialValues: Partial<Animal> & { owner_data?: { id: string, name: string } };
  onSubmit: (values: any) => void;
  isSubmitting: boolean;
  error: string | null;
  isEditMode: boolean;
  userRole?: string;
  onAddNewClient?: () => void;
  currentOrganizationId?: number;
}

// Role, które mogą wybierać właściciela zwierzęcia
const ADMIN_ROLES = ['admin', 'superadmin', 'owner', 'employee', 'officestaff'];

// Schema walidacji dla formularza zwierzęcia gospodarskiego
const validationSchema = yup.object({
  species: yup.string().required('Gatunek jest wymagany'),
  identifier: yup.string().required('Numer identyfikacyjny (kolczyk) jest wymagany'),
  sex: yup.string().required('Płeć jest wymagana'),
  animal_type: yup.string().required('Typ zwierzęcia jest wymagany'),
  birth_date: yup.date().nullable(),
  age: yup.number().nullable().integer().min(0, 'Wiek nie może być ujemny'),
  additional_number: yup.string(), // Zmieniona nazwa pola z animal_number na additional_number
  breed: yup.string(),
  weight: yup.number().positive('Waga musi być większa od 0').nullable(),
  herd_number: yup.string(),
  registration_date: yup.date().nullable(),
  origin: yup.string(),
  notes: yup.string(),
  owner_id: yup.mixed().when('userRole', {
    is: (role: string) => !['farmer', 'client'].includes(role),
    then: () => yup.string().required('Właściciel jest wymagany'),
    otherwise: () => yup.string()
  })
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
  isEditMode,
  userRole = 'client',
  onAddNewClient,
  currentOrganizationId
}) => {
  const [ownerOptions, setOwnerOptions] = useState<Array<{id: string, label: string}>>([]);
  const [ownerSearchQuery, setOwnerSearchQuery] = useState<string>('');
  const [selectedOwner, setSelectedOwner] = useState<{id: string, label: string} | null>(null);
  const [ownerDetails, setOwnerDetails] = useState<any>(null);
  const [isLoadingOwnerDetails, setIsLoadingOwnerDetails] = useState<boolean>(false);
  
  // Sprawdzenie uprawnień użytkownika
  const isAdminRole = ADMIN_ROLES.includes(userRole);
  const isFarmerOrClient = ['farmer', 'client'].includes(userRole);
  
  // Wyszukiwanie właściciela - tylko dla ról administracyjnych
  useEffect(() => {
    const fetchOwners = async () => {
      if (ownerSearchQuery.length >= 3 && isAdminRole) {
        try {
          const response = await searchUsers(ownerSearchQuery, ['farmer', 'client'], currentOrganizationId);
          
          const mappedUsers = response.data.map((user: any) => ({
            id: user.id.toString(),
            label: `${user.first_name} ${user.last_name} - ${user.city || ''}, ${user.street || ''}`
          }));
          
          setOwnerOptions(mappedUsers);
        } catch (error) {
          console.error('Błąd podczas wyszukiwania użytkowników:', error);
        }
      }
    };
    
    fetchOwners();
  }, [ownerSearchQuery, isAdminRole, currentOrganizationId]);

  // Pobieranie szczegółowych danych właściciela po jego wybraniu
  useEffect(() => {
    const getOwnerDetails = async () => {
      if (selectedOwner && selectedOwner.id) {
        setIsLoadingOwnerDetails(true);
        try {
          const details = await fetchOwnerDetails(selectedOwner.id);
          setOwnerDetails(details);
          
          // Automatyczne uzupełnienie numeru stada, jeśli jest dostępny
          if (details?.herd?.herd_id) {
            formik.setFieldValue('herd_number', details.herd.herd_id);
          }
        } catch (error) {
          console.error('Błąd podczas pobierania danych właściciela:', error);
        } finally {
          setIsLoadingOwnerDetails(false);
        }
      }
    };
    
    getOwnerDetails();
  }, [selectedOwner]);

  // Ustawienie wybranego właściciela na podstawie initialValues
  useEffect(() => {
    if (initialValues.owner_id && initialValues.owner_data && isAdminRole) {
      setSelectedOwner({
        id: initialValues.owner_id.toString(),
        label: initialValues.owner_data.name
      });
    }
  }, [initialValues, isAdminRole]);

  // Przygotowanie formularza z Formik
  const formik = useFormik({
    initialValues: {
      // Pola z głównej tabeli animals
      animal_type: 'farm', // Zmieniono z 'large' na 'farm' dla lepszej czytelności
      species: initialValues.species || 'bydło',
      breed: initialValues.breed || '',
      sex: initialValues.sex || '',
      birth_date: initialValues.birth_date ? new Date(initialValues.birth_date) : null,
      age: initialValues.age || '',
      weight: initialValues.weight || '',
      
      // Pola specyficzne dla farm_animals
      identifier: initialValues.identifier || '',
      additional_number: initialValues.additional_number || '', // Zmiana nazwy pola
      herd_number: initialValues.herd_number || '',
      registration_date: initialValues.registration_date ? new Date(initialValues.registration_date) : null,
      origin: initialValues.origin || '',
      
      // Pozostałe pola
      notes: initialValues.notes || '',
      owner_id: initialValues.owner_id || '',
      userRole: userRole
    },
    validationSchema,
    onSubmit: (values) => {
      // Przygotowanie danych do wysłania - rozdzielamy na dane główne i dane farm_animals
      const commonAnimalData = {
        // Dane do tabeli animals
        animal_type: 'farm',
        species: values.species,
        sex: values.sex,
        breed: values.breed,
        birth_date: values.birth_date,
        age: values.age,
        weight: values.weight,
        owner_id: isFarmerOrClient ? undefined : values.owner_id,
        notes: values.notes,
      };
      
      const farmAnimalData = {
        // Dane do tabeli farm_animals
        identifier: values.identifier,
        additional_number: values.additional_number, // Zmieniona nazwa pola
        herd_number: isFarmerOrClient ? undefined : values.herd_number,
        registration_date: values.registration_date,
        origin: values.origin,
      };
      
      // Łączymy dane do wysłania do API
      const combinedData = {
        ...commonAnimalData,
        farm_animal: farmAnimalData
      };
      
      // Wywołanie funkcji onSubmit z komponentu nadrzędnego
      onSubmit(combinedData);
    },
  });

  // Aktualizacja wartości owner_id gdy zmieniamy wybranego właściciela
  useEffect(() => {
    if (selectedOwner) {
      formik.setFieldValue('owner_id', selectedOwner.id);
    }
  }, [selectedOwner]);

  return (
    <form onSubmit={formik.handleSubmit}>
      {error && (
        <Box mb={3}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}
      
      {/* Sekcja wyszukiwania właściciela - widoczna tylko dla ról administracyjnych */}
      {isAdminRole && (
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Właściciel zwierzęcia
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={onAddNewClient ? 10 : 12}>
              <Autocomplete
                id="owner-search"
                options={ownerOptions}
                getOptionLabel={(option) => option.label}
                value={selectedOwner}
                onChange={(event, newValue) => {
                  setSelectedOwner(newValue);
                }}
                onInputChange={(event, newInputValue) => {
                  setOwnerSearchQuery(newInputValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Wyszukaj właściciela *"
                    variant="outlined"
                    fullWidth
                    error={formik.touched.owner_id && Boolean(formik.errors.owner_id)}
                    helperText={formik.touched.owner_id && formik.errors.owner_id as string}
                  />
                )}
              />
            </Grid>
            {onAddNewClient && (
              <Grid item xs={2}>
                <Tooltip title="Dodaj nowego klienta">
                  <IconButton 
                    color="primary" 
                    onClick={onAddNewClient}
                    aria-label="dodaj nowego klienta"
                  >
                    <AddCircleOutlineIcon />
                  </IconButton>
                </Tooltip>
              </Grid>
            )}
          </Grid>
          
          {/* Wyświetlanie szczegółowych danych właściciela po wybraniu */}
          {selectedOwner && ownerDetails && (
            <Box mt={2}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                {isLoadingOwnerDetails ? (
                  <Box display="flex" justifyContent="center" p={2}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Dane właściciela
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2">
                        <strong>Imię i nazwisko:</strong> {ownerDetails.first_name} {ownerDetails.last_name}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Email:</strong> {ownerDetails.email}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Telefon:</strong> {ownerDetails.phone || 'Brak'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Adres:</strong> {ownerDetails.city || ''}, {ownerDetails.street || ''} {ownerDetails.house_number || ''}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      {ownerDetails.herd && (
                        <>
                          <Typography variant="body2">
                            <strong>Numer stada:</strong> {ownerDetails.herd.herd_id || 'Brak'}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Numer pod oceną:</strong> {ownerDetails.herd.eval_herd_no || 'Brak'}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Adres gospodarstwa:</strong> {ownerDetails.herd.city || ''}, {ownerDetails.herd.street || ''} {ownerDetails.herd.house_number || ''}
                          </Typography>
                        </>
                      )}
                      
                      {ownerDetails.organization && (
                        <>
                          <Typography variant="body2">
                            <strong>Firma:</strong> {ownerDetails.organization.name || 'Brak'}
                          </Typography>
                          <Typography variant="body2">
                            <strong>NIP:</strong> {ownerDetails.organization.tax_id || 'Brak'}
                          </Typography>
                        </>
                      )}
                    </Grid>
                  </Grid>
                )}
              </Paper>
            </Box>
          )}
          
          <Divider sx={{ my: 3 }} />
        </Box>
      )}
      
      <Box mb={3}>
        <Typography variant="h6" gutterBottom>
          Podstawowe informacje
        </Typography>
        <Grid container spacing={3}>
          {/* Numer identyfikacyjny (kolczyk) - jako pierwszy i najważniejszy */}
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
          
          {/* Numer dodatkowy (zamiast Numer zwierzęcia) */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="additional_number"
              name="additional_number"
              label="Numer dodatkowy"
              value={formik.values.additional_number}
              onChange={formik.handleChange}
              error={formik.touched.additional_number && Boolean(formik.errors.additional_number)}
              helperText={formik.touched.additional_number && formik.errors.additional_number as string}
            />
          </Grid>
          
          {/* Gatunek - domyślnie bydło */}
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
              <MenuItem value="bydło">Bydło</MenuItem>
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
          {/* Numer stada - widoczny tylko dla ról administracyjnych */}
          {isAdminRole && (
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
          )}
          {/* Data rejestracji */}
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pl">
              <DatePicker
                label="Data rejestracji"
                value={formik.values.registration_date ? dayjs(formik.values.registration_date) : null}
                onChange={(date) =>
                  formik.setFieldValue('registration_date', date ? date.toDate() : null)
                }
                slotProps={{
                  textField: {
                    variant: 'outlined',
                    fullWidth: true,
                    error: formik.touched.registration_date && Boolean(formik.errors.registration_date),
                    helperText: formik.touched.registration_date && formik.errors.registration_date as string,
                  },
                }}
              />
            </LocalizationProvider>
          </Grid>
          {/* Pochodzenie */}
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
        </Grid>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Sekcja notatek */}
      <Box mb={3}>
        <TextField
          fullWidth
          id="notes"
          name="notes"
          label="Dodatkowe uwagi"
          multiline
          rows={4}
          value={formik.values.notes}
          onChange={formik.handleChange}
          error={formik.touched.notes && Boolean(formik.errors.notes)}
          helperText={formik.touched.notes && formik.errors.notes as string}
        />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
          {isEditMode ? 'Zaktualizuj zwierzę' : 'Dodaj zwierzę'}
        </Button>
      </Box>
    </form>
  );
};

export default FarmAnimalForm;