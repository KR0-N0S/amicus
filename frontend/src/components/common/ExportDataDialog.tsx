import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, TextField, Switch,
  FormControlLabel, Grid, Checkbox
} from '@mui/material';
import { FiDownload } from 'react-icons/fi';

export interface ExportColumn {
  key: string;
  title: string;
}

interface ExportDataDialogProps {
  open: boolean;
  onClose: () => void;
  onExport: (format: 'csv' | 'excel', includeAllColumns: boolean, selectedColumnKeys: string[], filename: string) => void;
  columns: ExportColumn[];
  defaultFilename?: string;
}

const ExportDataDialog: React.FC<ExportDataDialogProps> = ({
  open,
  onClose,
  onExport,
  columns,
  defaultFilename = `export_${new Date().toISOString().slice(0, 10)}`
}) => {
  const [format, setFormat] = useState<'csv' | 'excel'>('excel');
  const [includeAllColumns, setIncludeAllColumns] = useState(true);
  const [selectedColumnKeys, setSelectedColumnKeys] = useState<string[]>(
    columns.map(col => col.key)
  );
  const [filename, setFilename] = useState(defaultFilename);

  const handleColumnToggle = (columnKey: string) => {
    setSelectedColumnKeys(prev => 
      prev.includes(columnKey)
        ? prev.filter(key => key !== columnKey)
        : [...prev, columnKey]
    );
  };

  const handleExport = () => {
    onExport(format, includeAllColumns, selectedColumnKeys, filename);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Eksport danych</DialogTitle>
      <DialogContent>
        <Box mt={2}>
          <Typography variant="subtitle2" gutterBottom>
            Format pliku:
          </Typography>
          <Box display="flex" gap={1} mb={3}>
            <Button
              variant={format === 'excel' ? 'contained' : 'outlined'}
              onClick={() => setFormat('excel')}
              startIcon={<FiDownload />}
            >
              Excel (.xlsx)
            </Button>
            <Button
              variant={format === 'csv' ? 'contained' : 'outlined'}
              onClick={() => setFormat('csv')}
              startIcon={<FiDownload />}
            >
              CSV
            </Button>
          </Box>

          <TextField
            label="Nazwa pliku"
            fullWidth
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            sx={{ mb: 3 }}
          />

          <Typography variant="subtitle2" gutterBottom>
            Kolumny do eksportu:
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={includeAllColumns}
                onChange={(e) => setIncludeAllColumns(e.target.checked)}
                color="primary"
              />
            }
            label="Eksportuj wszystkie widoczne kolumny"
          />

          {!includeAllColumns && (
            <Box mt={2}>
              <Typography variant="body2" gutterBottom>
                Wybierz kolumny do eksportu:
              </Typography>
              <Grid container spacing={2}>
                {columns.map((col) => (
                  <Grid item xs={6} key={col.key}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedColumnKeys.includes(col.key)}
                          onChange={() => handleColumnToggle(col.key)}
                        />
                      }
                      label={col.title}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          Anuluj
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleExport}
          disabled={!filename || (!includeAllColumns && selectedColumnKeys.length === 0)}
        >
          Eksportuj
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportDataDialog;