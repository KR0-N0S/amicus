import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AuthContextType } from '../../context/auth-types';

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, loading } = useAuth() as AuthContextType;
  
  if (loading) {
    // Możesz tu dodać komponent ładowania
    return <div>Ładowanie...</div>;
  }
  
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
