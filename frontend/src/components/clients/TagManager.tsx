import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  TextField, Typography, Box, Button, IconButton, 
  Chip, Popover, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { FiPlus, FiX, FiTag, FiSearch } from 'react-icons/fi';
import Tag, { TagColor } from '../common/Tag';

// Interfejs dla tagów
export interface TagType {
  id: number | string;
  name: string;
  color: TagColor;
}

// Interfejs bazowy dla różnych trybów działania
interface BaseTagManagerProps {
  availableTags?: TagType[];
  onTagCreate?: (tag: Omit<TagType, 'id'>) => Promise<TagType>;
  className?: string;
  organizationId?: number;
}

// Interfejs dla trybu pojedynczego klienta
interface SingleClientMode extends BaseTagManagerProps {
  clientId: number;
  initialTags?: TagType[];
  onTagsChange: (clientId: number, tags: TagType[]) => void;
  selectedTags?: never;  // Nie używamy w tym trybie
  onChange?: never;      // Nie używamy w tym trybie
}

// Interfejs dla trybu zbiorczego (wielu klientów)
interface BulkMode extends BaseTagManagerProps {
  selectedTags: number[];
  onChange: (tagIds: number[]) => void;
  clientId?: never;      // Nie używamy w tym trybie
  initialTags?: never;   // Nie używamy w tym trybie
  onTagsChange?: never;  // Nie używamy w tym trybie
}

// Typ unii dla obu trybów
export type TagManagerProps = SingleClientMode | BulkMode;

/**
 * Zoptymalizowany komponent TagManager obsługujący zarówno pojedynczych klientów jak i operacje masowe
 */
const TagManager: React.FC<TagManagerProps> = (props) => {
  // Sprawdzamy, w którym trybie działa komponent
  const isBulkMode = 'selectedTags' in props && 'onChange' in props;
  
  // Stan dla tagów
  const [selectedTagObjects, setSelectedTagObjects] = useState<TagType[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  
  // Stan interfejsu
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [showNewTagDialog, setShowNewTagDialog] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState<TagColor>('default');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Referencje
  const searchInputRef = useRef<HTMLInputElement>(null);
  const prevPropsRef = useRef<any>(null);
  
  // Pobieramy odpowiednie propsy w zależności od trybu
  const {
    availableTags = [],
    onTagCreate,
    className = '',
    organizationId
  } = props;
  
  // Inicjalizacja stanu na podstawie propsów dla odpowiedniego trybu
  useEffect(() => {
    if (isBulkMode) {
      // Tryb zbiorczy
      const bulkProps = props as BulkMode;
      setSelectedTagIds(bulkProps.selectedTags || []);
      
      // Konwersja ID tagów na obiekty jeśli dostępne są availableTags
      if (availableTags.length > 0) {
        const tagObjects = (bulkProps.selectedTags || [])
          .map(id => availableTags.find(tag => Number(tag.id) === id))
          .filter(tag => tag !== undefined) as TagType[];
          
        setSelectedTagObjects(tagObjects);
      }
    } else {
      // Tryb pojedynczego klienta
      const singleProps = props as SingleClientMode;
      setSelectedTagObjects(singleProps.initialTags || []);
      
      // Konwersja obiektów tagów na ID
      setSelectedTagIds((singleProps.initialTags || []).map(tag => Number(tag.id)));
    }
  }, [isBulkMode, props, availableTags]);
  
  // Memoizujemy przefiltrowane tagi - optymalizacja renderowania
  const filteredTags = useMemo(() => {
    return availableTags.filter(tag => 
      tag.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !selectedTagIds.includes(Number(tag.id))
    );
  }, [availableTags, searchQuery, selectedTagIds]);
  
  // Fokus na pole wyszukiwania po otwarciu menu - optymalizacja z useCallback
  const focusSearchInput = useCallback(() => {
    if (searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, []);
  
  useEffect(() => {
    if (anchorEl) {
      focusSearchInput();
    }
  }, [anchorEl, focusSearchInput]);
  
  // Optymalizacja - zabezpieczenie przed zbędnymi rerenderami
  const handleTagClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setSearchQuery('');
  }, []);
  
  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);
  
  const handleTagSelect = useCallback((tag: TagType) => {
    const tagId = Number(tag.id);
    
    if (!selectedTagIds.includes(tagId)) {
      // Aktualizacja stanu lokalnego
      setSelectedTagIds(prev => [...prev, tagId]);
      setSelectedTagObjects(prev => [...prev, tag]);
      
      // Wywołanie odpowiedniej funkcji zwrotnej w zależności od trybu
      if (isBulkMode) {
        const bulkProps = props as BulkMode;
        bulkProps.onChange([...selectedTagIds, tagId]);
      } else {
        const singleProps = props as SingleClientMode;
        singleProps.onTagsChange(singleProps.clientId, [...selectedTagObjects, tag]);
      }
    }
  }, [props, isBulkMode, selectedTagIds, selectedTagObjects]);
  
  const handleTagRemove = useCallback((tagId: string | number) => {
    const numericTagId = Number(tagId);
    
    // Aktualizacja stanu lokalnego
    setSelectedTagIds(prev => prev.filter(id => id !== numericTagId));
    setSelectedTagObjects(prev => prev.filter(tag => Number(tag.id) !== numericTagId));
    
    // Wywołanie odpowiedniej funkcji zwrotnej w zależności od trybu
    if (isBulkMode) {
      const bulkProps = props as BulkMode;
      bulkProps.onChange(selectedTagIds.filter(id => id !== numericTagId));
    } else {
      const singleProps = props as SingleClientMode;
      singleProps.onTagsChange(
        singleProps.clientId,
        selectedTagObjects.filter(tag => Number(tag.id) !== numericTagId)
      );
    }
  }, [props, isBulkMode, selectedTagIds, selectedTagObjects]);
  
  const handleNewTagDialogOpen = useCallback(() => {
    setShowNewTagDialog(true);
    handleClose();
  }, [handleClose]);
  
  const handleNewTagDialogClose = useCallback(() => {
    setShowNewTagDialog(false);
    setNewTagName('');
    setNewTagColor('default');
  }, []);
  
  const handleNewTagCreate = useCallback(async () => {
    if (newTagName.trim() && onTagCreate) {
      try {
        const newTag = await onTagCreate({
          name: newTagName.trim(),
          color: newTagColor
        });
        
        handleTagSelect(newTag);
        handleNewTagDialogClose();
      } catch (error) {
        console.error('Error creating tag:', error);
      }
    }
  }, [newTagName, newTagColor, onTagCreate, handleTagSelect, handleNewTagDialogClose]);
  
  const open = Boolean(anchorEl);
  const popoverId = open ? 'tags-popover' : undefined;
  
  return (
    <div className={`tag-manager ${className}`}>
      <Box className="tags-container" display="flex" flexWrap="wrap" gap={1}>
        {selectedTagObjects.map(tag => (
          <Chip
            key={tag.id}
            label={tag.name}
            color={tag.color as any}
            size="small"
            variant="outlined"
            onDelete={() => handleTagRemove(tag.id)}
            className="client-tag-chip"
          />
        ))}
        <IconButton 
          size="small" 
          onClick={handleTagClick} 
          className="add-tag-button"
          aria-describedby={popoverId}
        >
          <FiPlus size={16} />
        </IconButton>
      </Box>

      <Popover
        id={popoverId}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <Box className="tag-menu" p={2} width="250px">
          <Box className="tag-menu-header" display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="subtitle2">Dodaj tag</Typography>
            <IconButton size="small" onClick={handleClose}>
              <FiX size={16} />
            </IconButton>
          </Box>
          
          <TextField 
            placeholder="Szukaj tagów..."
            variant="outlined"
            size="small"
            fullWidth
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            inputRef={searchInputRef}
            margin="dense"
            InputProps={{
              startAdornment: (
                <Box component="span" mr={1} display="flex" alignItems="center">
                  <FiSearch size={16} />
                </Box>
              ),
            }}
          />
          
          <Box className="tag-menu-list" mt={1} maxHeight="200px" overflow="auto">
            {filteredTags.length > 0 ? (
              filteredTags.map(tag => (
                <Box 
                  key={tag.id} 
                  className="tag-menu-item" 
                  onClick={() => handleTagSelect(tag)}
                  py={0.5}
                  px={1}
                  display="flex"
                  alignItems="center"
                  gap={1}
                  sx={{ cursor: 'pointer', borderRadius: 1, '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' } }}
                >
                  <Box 
                    component="span" 
                    width="12px" 
                    height="12px" 
                    borderRadius="50%" 
                    bgcolor={
                      tag.color === 'default' ? '#e2e8f0' : 
                      tag.color === 'primary' ? 'var(--primary-color, #1976d2)' : 
                      tag.color === 'secondary' ? 'var(--secondary-color, #9c27b0)' : 
                      tag.color === 'success' ? 'var(--success-color, #2e7d32)' : 
                      tag.color === 'warning' ? 'var(--warning-color, #ed6c02)' : 
                      tag.color === 'danger' ? 'var(--danger-color, #d32f2f)' : 
                      tag.color === 'info' ? 'var(--info-color, #0288d1)' : '#e2e8f0'
                    } 
                  />
                  <Typography variant="body2">{tag.name}</Typography>
                </Box>
              ))
            ) : (
              <Typography variant="body2" color="textSecondary" py={1}>
                {searchQuery ? 'Nie znaleziono pasujących tagów' : 'Brak dostępnych tagów'}
              </Typography>
            )}
          </Box>
          
          <Button
            startIcon={<FiPlus size={14} />}
            fullWidth
            variant="outlined"
            size="small"
            onClick={handleNewTagDialogOpen}
            sx={{ mt: 2 }}
          >
            Utwórz nowy tag
          </Button>
        </Box>
      </Popover>

      <Dialog open={showNewTagDialog} onClose={handleNewTagDialogClose} maxWidth="xs" fullWidth>
        <DialogTitle>Utwórz nowy tag</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nazwa tagu"
            fullWidth
            variant="outlined"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
          />
          <FormControl fullWidth variant="outlined" margin="dense">
            <InputLabel>Kolor</InputLabel>
            <Select
              value={newTagColor}
              onChange={(e) => setNewTagColor(e.target.value as TagColor)}
              label="Kolor"
            >
              <MenuItem value="default">Domyślny</MenuItem>
              <MenuItem value="primary">Niebieski</MenuItem>
              <MenuItem value="secondary">Fioletowy</MenuItem>
              <MenuItem value="success">Zielony</MenuItem>
              <MenuItem value="warning">Pomarańczowy</MenuItem>
              <MenuItem value="danger">Czerwony</MenuItem>
              <MenuItem value="info">Turkusowy</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleNewTagDialogClose}>Anuluj</Button>
          <Button 
            onClick={handleNewTagCreate} 
            disabled={!newTagName.trim()}
            variant="contained" 
            color="primary"
          >
            Utwórz
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default TagManager;