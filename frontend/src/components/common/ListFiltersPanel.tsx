import React, { useEffect, useState } from 'react';
import { 
  Box, Button, Divider, Grid, Typography, 
  FormControl, InputLabel, Select, MenuItem, 
  TextField, SelectChangeEvent, Chip, Autocomplete
} from '@mui/material';
import { ClientFilterState } from '../../types/filters';

interface Tag {
  id: number;
  name: string;
  color: string;
  organization_id?: number;
}

interface ListFiltersPanelProps {
  filters: ClientFilterState;
  onFilterChange: (key: string, value: any) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
  className?: string;
  availableTags?: Tag[]; // Dodana nowa właściwość dla listy dostępnych tagów
}

/**
 * Panel filtrów dla list danych
 */
const ListFiltersPanel: React.FC<ListFiltersPanelProps> = ({
  filters,
  onFilterChange,
  onApplyFilters,
  onResetFilters,
  className = '',
  availableTags = []
}) => {
  // Handlery dla zmiany filtra - rozdzielone na typ inputa
  const handleSelectChange = (key: string) => (event: SelectChangeEvent) => {
    onFilterChange(key, event.target.value);
  };

  const handleTextChange = (key: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange(key, event.target.value);
  };

  // Handler dla zmiany tagów
  const handleTagsChange = (_event: React.SyntheticEvent, newValue: string[]) => {
    onFilterChange('tags', newValue);
  };

  return (
    <Box className={`filters-panel ${className}`} p={2} sx={{ border: '1px solid #eee', borderRadius: '4px' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle1">Filtry</Typography>
        <Box>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={onResetFilters}
            sx={{ mr: 1 }}
          >
            Wyczyść
          </Button>
          <Button 
            variant="contained" 
            size="small"
            onClick={onApplyFilters}
          >
            Zastosuj
          </Button>
        </Box>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      <Grid container spacing={2}>
        {/* Status */}
        <Grid item xs={12} md={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status}
              label="Status"
              onChange={handleSelectChange('status')}
            >
              <MenuItem value="all">Wszystkie</MenuItem>
              <MenuItem value="active">Aktywni</MenuItem>
              <MenuItem value="inactive">Nieaktywni</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        {/* Typ */}
        <Grid item xs={12} md={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Typ</InputLabel>
            <Select
              value={filters.type}
              label="Typ"
              onChange={handleSelectChange('type')}
            >
              <MenuItem value="all">Wszystkie</MenuItem>
              <MenuItem value="client">Klient</MenuItem>
              <MenuItem value="farmer">Rolnik</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        {/* Miasto */}
        <Grid item xs={12} md={4}>
          <TextField 
            label="Miasto"
            value={filters.city || ''}
            onChange={handleTextChange('city')}
            fullWidth
            size="small"
          />
        </Grid>

        {/* Tagi - nowy element formularza */}
        <Grid item xs={12}>
          <Autocomplete
            multiple
            size="small"
            options={availableTags.map(tag => tag.name)}
            value={filters.tags}
            onChange={handleTagsChange}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Tagi"
                placeholder="Wybierz tagi"
                helperText="Filtruj klientów po przypisanych tagach"
              />
            )}
            renderTags={(tagValues, getTagProps) =>
              tagValues.map((tag, index) => {
                const tagObj = availableTags.find(t => t.name === tag);
                return (
                  <Chip
                    label={tag}
                    size="small"
                    {...getTagProps({ index })}
                    color={tagObj?.color as any || "default"}
                  />
                );
              })
            }
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default ListFiltersPanel;