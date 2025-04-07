import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  Tabs, 
  Tab, 
  Typography, 
  Paper
} from '@mui/material';

// Import komponentu zakładki dostawców
import ProvidersTab from './settings/ProvidersTab';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
}

const SettingsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Sprawdzanie czy w URL jest informacja o zakładce
  const getTabFromUrl = (): number => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    return tab ? parseInt(tab, 10) : 0;
  };

  const [activeTab, setActiveTab] = useState<number>(getTabFromUrl());

  useEffect(() => {
    // Aktualizacja aktywnej zakładki na podstawie URL przy zmianie ścieżki
    setActiveTab(getTabFromUrl());
  }, [location.search]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    navigate(`/insemination/settings?tab=${newValue}`, { replace: true });
  };

  return (
    <Paper elevation={1} sx={{ borderRadius: 2 }}>
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            aria-label="ustawienia inseminacji"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Dostawcy nasienia" {...a11yProps(0)} />
            <Tab label="Parametry" {...a11yProps(1)} />
            <Tab label="Szablon certyfikatu" {...a11yProps(2)} />
          </Tabs>
        </Box>
        
        <TabPanel value={activeTab} index={0}>
          <ProvidersTab />
        </TabPanel>
        
        <TabPanel value={activeTab} index={1}>
          <Typography variant="h6">Parametry inseminacji</Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
            Konfiguracja parametrów inseminacji będzie dostępna wkrótce.
          </Typography>
        </TabPanel>
        
        <TabPanel value={activeTab} index={2}>
          <Typography variant="h6">Szablon certyfikatu inseminacji</Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
            Konfiguracja szablonu certyfikatu inseminacji będzie dostępna wkrótce.
          </Typography>
        </TabPanel>
      </Box>
    </Paper>
  );
};

export default SettingsPage;