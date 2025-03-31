import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaSearch, FaTrash, FaEdit, FaEye } from 'react-icons/fa';
import { 
  Table, 
  TableHead, 
  TableRow, 
  TableCell, 
  TableBody, 
  Paper, 
  TextField,
  CircularProgress,
  Alert
} from '@mui/material';

import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { getAnimals, deleteAnimal } from '../api/animalService';
import { Animal } from '../types/models';

import './DataList.css';

const FarmAnimalsPage: React.FC = () => {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [filteredAnimals, setFilteredAnimals] = useState<Animal[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Pobieranie listy zwierząt gospodarskich
  useEffect(() => {
    // Zmiana w fetchAnimals
const fetchAnimals = async () => {
  try {
    setIsLoading(true);
    setError(null);
    const response = await getAnimals(1, 100, 'farm'); // Zmieniono 'large' na 'farm'
    setAnimals(response.data);
    setFilteredAnimals(response.data);
  } catch (err: any) {
    console.error('Error fetching farm animals:', err);
    setError(err.response?.data?.message || 'Nie udało się pobrać listy zwierząt gospodarskich');
  } finally {
    setIsLoading(false);
  }
};

    fetchAnimals();
  }, []);

  // Filtrowanie zwierząt
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredAnimals(animals);
      return;
    }

    const lowerCaseSearch = searchTerm.toLowerCase();
    const filtered = animals.filter(animal => 
      (animal.identifier && animal.identifier.toLowerCase().includes(lowerCaseSearch)) ||
      (animal.animal_number && animal.animal_number.toLowerCase().includes(lowerCaseSearch)) ||
      (animal.breed && animal.breed.toLowerCase().includes(lowerCaseSearch)) ||
      (animal.species && animal.species.toLowerCase().includes(lowerCaseSearch))
    );
    
    setFilteredAnimals(filtered);
  }, [searchTerm, animals]);

  // Obsługa usuwania zwierzęcia
  const handleDelete = async (id: number) => {
    if (window.confirm('Czy na pewno chcesz usunąć to zwierzę? Ta operacja jest nieodwracalna.')) {
      try {
        await deleteAnimal(id);
        // Usuwamy z lokalnej pamięci
        const updatedAnimals = animals.filter(animal => animal.id !== id);
        setAnimals(updatedAnimals);
        setFilteredAnimals(updatedAnimals.filter(animal => 
          (animal.identifier && animal.identifier.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (animal.animal_number && animal.animal_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (animal.breed && animal.breed.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (animal.species && animal.species.toLowerCase().includes(searchTerm.toLowerCase()))
        ));
      } catch (err: any) {
        console.error('Error deleting animal:', err);
        setError(err.response?.data?.message || 'Nie udało się usunąć zwierzęcia');
      }
    }
  };

  // Akcje dla karty
  const cardActions = (
    <Button
      variant="primary"
      icon={<FaPlus />}
      onClick={() => navigate('/animals/farm/new')}
    >
      Dodaj zwierzę gospodarskie
    </Button>
  );

  return (
    <div className="clients-list">
      <h1 className="page-title">Zwierzęta gospodarskie</h1>
      <Card 
        title="Lista zwierząt gospodarskich"
        actions={cardActions}
      >
        <div className="card-actions">
          <div className="search-container">
            <TextField
              className="search-input"
              placeholder="Szukaj zwierząt..."
              variant="outlined"
              size="small"
              fullWidth
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch className="search-icon" />
          </div>
        </div>
        
        {error && <Alert severity="error">{error}</Alert>}
        
        {isLoading ? (
          <div className="loading-spinner">
            <CircularProgress size={40} />
            <p>Ładowanie danych...</p>
          </div>
        ) : (
          <div className="table-container">
            {filteredAnimals.length === 0 ? (
              <div className="empty-message">
                Nie znaleziono zwierząt gospodarskich
              </div>
            ) : (
              <Paper elevation={0}>
                <Table className="data-table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Nr kolczyka</TableCell>
                      <TableCell>Nr zwierzęcia</TableCell>
                      <TableCell>Gatunek</TableCell>
                      <TableCell>Rasa</TableCell>
                      <TableCell>Płeć</TableCell>
                      <TableCell>Data urodzenia</TableCell>
                      <TableCell align="center">Akcje</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredAnimals.map((animal) => (
                      <TableRow key={animal.id}>
                        <TableCell>{animal.identifier || '-'}</TableCell>
                        <TableCell>{animal.animal_number}</TableCell>
                        <TableCell>{animal.species}</TableCell>
                        <TableCell>{animal.breed || '-'}</TableCell>
                        <TableCell>{animal.sex === 'male' ? 'Samiec' : animal.sex === 'female' ? 'Samica' : '-'}</TableCell>
                        <TableCell>{animal.birth_date ? new Date(animal.birth_date).toLocaleDateString('pl-PL') : (animal.age ? `${animal.age} lat` : '-')}</TableCell>
                        <TableCell align="center">
                          <div className="action-buttons">
                            <Button 
                              icon={<FaEye size={18} />} 
                              variant="secondary"
                              tooltip="Zobacz"
                              onClick={() => navigate(`/animals/farm/${animal.id}`)}
                            />
                            <Button 
                              icon={<FaEdit size={18} />} 
                              variant="warning"
                              tooltip="Edytuj"
                              onClick={() => navigate(`/animals/farm/${animal.id}/edit`)}
                            />
                            <Button 
                              icon={<FaTrash size={18} />} 
                              variant="danger"
                              tooltip="Usuń"
                              onClick={() => handleDelete(animal.id)}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default FarmAnimalsPage;