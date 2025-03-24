import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Layouts
import MainLayout from './components/layout/MainLayout';

// Components
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AnimalDetailPage from './pages/AnimalDetailPage';
import AnimalsPage from './pages/AnimalsPage';
import BullDetailPage from './pages/BullDetailPage';
import BullsPage from './pages/BullsPage';
import InseminationDetailPage from './pages/InseminationDetailPage';
import InseminationsPage from './pages/InseminationsPage';
import OrganizationsPage from './pages/OrganizationsPage';
import ProfilePage from './pages/ProfilePage';
import UsersPage from './pages/UsersPage';
import VisitDetailPage from './pages/VisitDetailPage';
import VisitsPage from './pages/VisitsPage';
import NotFoundPage from './pages/NotFoundPage';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected routes with MainLayout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/animals" element={<AnimalsPage />} />
              <Route path="/animals/:id" element={<AnimalDetailPage />} />
              <Route path="/bulls" element={<BullsPage />} />
              <Route path="/bulls/:id" element={<BullDetailPage />} />
              <Route path="/inseminations" element={<InseminationsPage />} />
              <Route path="/inseminations/:id" element={<InseminationDetailPage />} />
              <Route path="/organizations" element={<OrganizationsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/visits" element={<VisitsPage />} />
              <Route path="/visits/:id" element={<VisitDetailPage />} />
            </Route>
          </Route>
          
          {/* 404 Not Found page */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
