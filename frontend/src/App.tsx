import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Layouts
import MainLayout from './components/layout/MainLayout';

// Components
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import DataList from './pages/DataList';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import ClientsList from './pages/ClientsList';
import ClientDetails from './pages/ClientDetails';
import ClientFormPage from './pages/ClientFormPage';

// Strony zwierząt
import CompanionAnimalsPage from './pages/CompanionAnimalsPage';
import CompanionAnimalDetailsPage from './pages/CompanionAnimalDetailsPage';
import CompanionAnimalFormPage from './pages/CompanionAnimalFormPage';
import FarmAnimalsPage from './pages/FarmAnimalsPage';
import FarmAnimalDetailsPage from './pages/FarmAnimalDetailsPage';
import FarmAnimalFormPage from './pages/FarmAnimalFormPage';
import AnimalSettingsPage from './pages/AnimalSettingsPage';

// Strony inseminacji
import BullsPage from './pages/insemination/BullsPage';
import BullDetailPage from './pages/insemination/BullDetailPage';
import BullFormPage from './pages/insemination/BullFormPage';
import InseminationsPage from './pages/insemination/InseminationsPage';
import InseminationDetailPage from './pages/insemination/InseminationDetailPage';
import InseminationFormPage from './pages/insemination/InseminationFormPage';
import WarehousesPage from './pages/insemination/WarehousesPage';

// Styles
import './assets/css/main.css';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes with MainLayout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/data/all" element={<DataList />} />
              
              {/* Trasy dla klientów */}
              <Route path="/clients" element={<ClientsList />} />
              <Route path="/clients/new" element={<ClientFormPage />} />
              <Route path="/clients/:id" element={<ClientDetails />} />
              <Route path="/clients/:id/edit" element={<ClientFormPage />} />
              
              {/* Trasy dla zwierząt domowych */}
              <Route path="/animals/pets" element={<CompanionAnimalsPage />} />
              <Route path="/animals/pets/new" element={<CompanionAnimalFormPage />} />
              <Route path="/animals/pets/:id" element={<CompanionAnimalDetailsPage />} />
              <Route path="/animals/pets/:id/edit" element={<CompanionAnimalFormPage />} />
              
              {/* Trasy dla zwierząt gospodarskich */}
              <Route path="/animals/farm" element={<FarmAnimalsPage />} />
              <Route path="/animals/farm/new" element={<FarmAnimalFormPage />} />
              <Route path="/animals/farm/:id" element={<FarmAnimalDetailsPage />} />
              <Route path="/animals/farm/:id/edit" element={<FarmAnimalFormPage />} />
              
              <Route path="/animals/settings" element={<AnimalSettingsPage />} />

              {/* Trasy dla modułu inseminacji */}
              <Route path="/insemination/bulls" element={<BullsPage />} />
              <Route path="/insemination/bulls/new" element={<BullFormPage />} />
              <Route path="/insemination/bulls/:id" element={<BullDetailPage />} />
              <Route path="/insemination/bulls/:id/edit" element={<BullFormPage />} />
              
              <Route path="/insemination/registers" element={<InseminationsPage />} />
              <Route path="/insemination/registers/new" element={<InseminationFormPage />} />
              <Route path="/insemination/registers/:id" element={<InseminationDetailPage />} />
              <Route path="/insemination/registers/:id/edit" element={<InseminationFormPage />} />
              
              <Route path="/insemination/warehouses" element={<WarehousesPage />} />
              
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>

          {/* 404 Not Found page */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;