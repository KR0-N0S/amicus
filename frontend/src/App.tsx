import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Layouts
import MainLayout from './components/layout/MainLayout';

// Components
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage'; // <-- Dodany import strony rejestracji
import Dashboard from './pages/Dashboard';
import DataList from './pages/DataList';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import ClientsList from './pages/ClientsList'; // Dodajemy import naszego nowego komponentu
import ClientDetails from './pages/ClientDetails';
import ClientFormPage from './pages/ClientFormPage'; // Import nowego komponentu formularza klienta

// Styles
import './assets/css/main.css';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} /> {/* Trasa rejestracji */}

          {/* Protected routes with MainLayout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/data/all" element={<DataList />} />
              <Route path="/clients" element={<ClientsList />} /> {/* Trasa listy klientów */}
              <Route path="/clients/new" element={<ClientFormPage />} /> {/* Trasa dodawania klienta */}
              <Route path="/clients/:id" element={<ClientDetails />} />
              <Route path="/clients/:id/edit" element={<ClientFormPage />} /> {/* Trasa edycji klienta */}
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