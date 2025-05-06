import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import UploadVideoPage from './pages/UploadVideoPage';
import MyVideosPage from './pages/MyVideosPage';
import Navbar from './components/Navbar';
import './styles/App.css';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authState } = useAuth();
  const { isAuthenticated, isLoading } = authState;

  if (isLoading) {
    return <div className="loading-container">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Routes component
const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route 
        path="/upload-video" 
        element={
          <ProtectedRoute>
            <UploadVideoPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/my-videos" 
        element={
          <ProtectedRoute>
            <MyVideosPage />
          </ProtectedRoute>
        } 
      />
      <Route path="/" element={<Navigate to="/my-videos" replace />} />
    </Routes>
  );
};

// Main App component
const App: React.FC = () => {
  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <div className="app-container">
            <Navbar />
            <main className="main-content">
              <AppRoutes />
            </main>
          </div>
        </AuthProvider>
      </QueryClientProvider>
    </Router>
  );
};

export default App;