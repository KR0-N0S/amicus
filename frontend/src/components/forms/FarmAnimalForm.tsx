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
  // Usunięto walidację dla age, ponieważ pole zostało usunięte z bazy danych
  additional_number: yup.string(),
  breed: yup.string(),
  weight: yup.number().positive('Waga musi być większa od 0').nullable(),
  registration_date: yup.date().nullable(),
  origin: yup.string(),
  notes: yup.string(),
  owner_id: yup.mixed().when('userRole', {
    is: (role: string) => !['farmer', 'client'].includes(role),
    then: () => yup.string().required('Właściciel jest wymagany'),
    otherwise: () => yup.string()
  })
}).test(
  'birth-date',
  'Data urodzenia jest wymagana',
  function(values) {
    if (values.birth_date) {
      return true;
    }
    return this.createError({ path: 'birth_date', message: 'Data urodzenia jest wymagana' });
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
          if (details?.herds && details.herds.length > 0 && details.herds[0].herd_id) {
            formik.setFieldValue('herd_number', details.herds[0].herd_id);
          }
        } catch (error) {
          console.error('Błąd podczas pobierania danych właściciela:', error);
          
          // Mimo błędu, zachowaj ID właściciela w formularzu
          formik.setFieldValue('owner_id', selectedOwner.id);
          
          // Wyświetl podstawowe informacje na podstawie danych z Autocomplete
          let ownerName = selectedOwner.label || '';
          let nameParts = ownerName.split(' - ')[0].trim().split(' ');
          
          setOwnerDetails({
            first_name: nameParts[0] || 'Nieznane',
            last_name: nameParts.slice(1).join(' ') || 'Nazwisko',
            email: '',
            phone: '',
            city: '',
            street: '',
            house_number: ''
          });
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
      animal_type: 'farm',
      species: initialValues.species || 'bydło',
      breed: initialValues.breed || '',
      sex: initialValues.sex || '',
      birth_date: initialValues.birth_date ? new Date(initialValues.birth_date) : null,
      // Usunięto pole age - będzie dynamicznie obliczane na podstawie daty urodzenia
      weight: initialValues.weight || '',
      
      // Pola specyficzne dla farm_animals
      identifier: initialValues.farm_animal?.identifier || initialValues.identifier || '',
      additional_number: initialValues.additional_number || '',
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
      // Upewnij się, że identifier ma wartość
      if (!values.identifier) {
        formik.setFieldError('identifier', 'Numer identyfikacyjny (kolczyk) jest wymagany');
        return;
      }

      // Przygotowanie danych do wysłania - rozdzielamy na dane główne i dane farm_animals
      const commonAnimalData = {
        // Dane do tabeli animals
        animal_type: 'farm',
        species: values.species,
        sex: values.sex,
        breed: values.breed,
        birth_date: values.birth_date,
        // Usunięto pole age - będzie obliczane na backendzie
        weight: values.weight ? Number(values.weight) : null,
        owner_id: isFarmerOrClient ? undefined : values.owner_id,
        notes: values.notes,
        // Dodano animal_number jako kopię identyfikatora - wymagane przez API
        animal_number: values.identifier,
      };
      
      const farmAnimalData = {
        // Dane do tabeli farm_animals
        identifier: values.identifier,
        // Usunięto zbędne pola dodatkowe, które są pobierane z danych właściciela
        registration_date: values.registration_date,
        origin: values.origin,
        // Dodatkowy identyfikator jako opcjonalne pole
        additional_id: values.additional_number || null,
      };
      
      // Łączymy dane do wysłania do API
      const combinedData = {
        ...commonAnimalData,
        farm_animal: farmAnimalData
      };
      
      console.log('Przesyłane dane zwierzęcia:', combinedData);
      
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
                      {ownerDetails.herds && ownerDetails.herds.length > 0 && (
                        <>
                          <Typography variant="body2">
                            <strong>Numer stada:</strong> {ownerDetails.herds[0].herd_id || 'Brak'}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Numer pod oceną:</strong> {ownerDetails.herds[0].eval_herd_no || 'Brak'}
                          </Typography>
                        </>
                      )}
                      
                      {ownerDetails.organizations && ownerDetails.organizations.length > 0 && (
                        <>
                          <Typography variant="body2">
                            <strong>Firma:</strong> {ownerDetails.organizations[0].name || 'Brak'}
                          </Typography>
                          <Typography variant="body2">
                            <strong>NIP:</strong> {ownerDetails.organizations[0].tax_id || 'Brak'}
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
              required
            />
          </Grid>
          
          {/* Numer dodatkowy (opcjonalny) */}
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
          
          {/* Gatunek */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="species"
              name="species"
              label="Gatunek *"
              select
              value={formik.values.species}
              onChange={formik.handleChange}
              error={formik.touched.species && Boolean(formik.errors.species)}
              helperText={formik.touched.species && formik.errors.species as string}
              required
            >
              <MenuItem value="bydło">Bydło</MenuItem>
              <MenuItem value="świnia">Świnia</MenuItem>
              <MenuItem value="owca">Owca</MenuItem>
              <MenuItem value="koza">Koza</MenuItem>
              <MenuItem value="koń">Koń</MenuItem>
              <MenuItem value="drób">Drób</MenuItem>
              <MenuItem value="inne">Inne</MenuItem>
            </TextField>
          </Grid>
          
          {/* Rasa */}
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
          
          {/* Płeć */}
          <Grid item xs={12} md={6}>
            <FormControl component="fieldset" error={formik.touched.sex && Boolean(formik.errors.sex)}>
              <FormLabel component="legend">Płeć *</FormLabel>
              <RadioGroup
                row
                name="sex"
                value={formik.values.sex}
                onChange={formik.handleChange}
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
          
          {/* Data urodzenia */}
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pl">
              <DatePicker
                label="Data urodzenia *"
                value={formik.values.birth_date ? dayjs(formik.values.birth_date) : null}
                onChange={(newValue) => {
                  formik.setFieldValue('birth_date', newValue ? newValue.toDate() : null);
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: formik.touched.birth_date && Boolean(formik.errors.birth_date),
                    helperText: formik.touched.birth_date && formik.errors.birth_date as string,
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>
          
          {/* Waga */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="weight"
              name="weight"
              label="Waga (kg)"
              type="number"
              inputProps={{ min: 0, step: 0.1 }}
              value={formik.values.weight}
              onChange={formik.handleChange}
              error={formik.touched.weight && Boolean(formik.errors.weight)}
              helperText={formik.touched.weight && formik.errors.weight as string}
            />
          </Grid>
        </Grid>
      </Box>
      
      <Box mb={3}>
        <Typography variant="h6" gutterBottom>
          Informacje o rejestracji
        </Typography>
        <Grid container spacing={3}>
          {/* Data rejestracji */}
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pl">
              <DatePicker
                label="Data rejestracji"
                value={formik.values.registration_date ? dayjs(formik.values.registration_date) : null}
                onChange={(newValue) => {
                  formik.setFieldValue('registration_date', newValue ? newValue.toDate() : null);
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: formik.touched.registration_date && Boolean(formik.errors.registration_date),
                    helperText: formik.touched.registration_date && formik.errors.registration_date as string,
                  }
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
      
      <Box mb={3}>
        <Typography variant="h6" gutterBottom>
          Dodatkowe informacje
        </Typography>
        <Grid container spacing={3}>
          {/* Notatki */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              id="notes"
              name="notes"
              label="Notatki"
              multiline
              rows={4}
              value={formik.values.notes}
              onChange={formik.handleChange}
              error={formik.touched.notes && Boolean(formik.errors.notes)}
              helperText={formik.touched.notes && formik.errors.notes as string}
            />
          </Grid>
        </Grid>
      </Box>
      
      <Box display="flex" justifyContent="flex-end" mt={4}>
        <Button
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
          ) : isEditMode ? 'Zapisz zmiany' : 'Dodaj zwierzę'}
        </Button>
      </Box>
    </form>
  );
};

export default FarmAnimalForm;