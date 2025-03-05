import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import LandingPage from './LandingPage';
import LoginPage from './LoginPage';
import CreateUserPage from './CreateUserPage';
import HouseholdMembers from './HouseHoldMembers';
import PatientDetails from './PatientDetails';
import PatientEditPage from './PatientEditPage';
import PatientFirstTimeForm from './PatientFirstTimeForm';
import Bubbles from './Bubbles';
import { useLocation } from 'react-router-dom';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2ecc71',
    },
    secondary: {
      main: '#e74c3c',
    },
    background: {
      default: '#f0f8ff',
    },
  },
});

const App = () => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const storedRole = localStorage.getItem('userRole');
    const storedToken = localStorage.getItem('token');
    const storedUserId = localStorage.getItem('userId');
    if (!storedRole || !storedToken || !storedUserId) {
      if (location.pathname !== '/create-user') {
        localStorage.removeItem('userRole');
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        navigate('/login');
      }
    } else {
      setUserRole(storedRole);
      setToken(storedToken);
      setUserId(storedUserId);
    }
  }, [navigate, location.pathname]);

  const handleLoginSuccess = (role: string, newToken: string, newUserId: string) => {
    setUserRole(role);
    setToken(newToken);
    setUserId(newUserId);
    localStorage.setItem('userRole', role);
    localStorage.setItem('token', newToken);
    localStorage.setItem('userId', newUserId);
  };

  const handleLogout = () => {
    setUserRole(null);
    setToken(null);
    setUserId(null);
    localStorage.removeItem('userRole');
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    navigate('/login');
  };

  const handleCreateUserClick = () => {
    navigate('/create-user');
  };

  const handleBackToLoginClick = () => {
    navigate('/login');
  };

  // Helper function to check if user can access patient details
  const canAccessPatientDetails = (patientId: string) => {
    return userRole === 'admin' || (userRole === 'patient' && userId === patientId);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
        <Bubbles />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Routes>
            <Route
              path="/dashboard"
              element={
                userRole && token ? (
                  <LandingPage
                    role={userRole}
                    userId={userId!}
                    onLogout={handleLogout}
                  />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/login"
              element={
                userRole && token ? (
                  <Navigate to="/dashboard" />
                ) : (
                  <LoginPage
                    onCreateUserClick={handleCreateUserClick}
                    onLoginSuccess={handleLoginSuccess}
                  />
                )
              }
            />
            <Route
              path="/create-user"
              element={<CreateUserPage onBackToLoginClick={handleBackToLoginClick} />}
            />
            <Route
              path="/household"
              element={
                userRole === 'admin' && token ? (
                  <HouseholdMembers adminId={userId!} />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/patient/edit/:id"
              element={
                token ? (
                  <PatientEditPage />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/patient/:patientId"
              element={
                token ? (
                  <PatientDetails />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/patient-first-time"
              element={
                userRole === 'patient' && token ? (
                  <PatientFirstTimeForm />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route path="/" element={<Navigate to={userRole && token ? '/dashboard' : '/login'} />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default App;
