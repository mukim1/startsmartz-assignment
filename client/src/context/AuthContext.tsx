import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import axios from "axios";
import type { AuthResponse, AuthState } from "../types";

// Define the Auth Context type
interface AuthContextType {
  authState: AuthState;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

// Create the Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API base URL
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Auth Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Add dark mode state
  const [darkMode, setDarkMode] = useState(() => {
    // Initialize from localStorage or system preference
    const savedMode = localStorage.getItem("darkMode");
    if (savedMode !== null) {
      return savedMode === "true";
    }
    // Default to system preference
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  });

  const navigate = useNavigate();

  // Initialize the auth state from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        // Set authorization header for all future requests
        axios.defaults.headers.common["Authorization"] = `Bearer ${user.token}`;
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem("user");
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      }
    } else {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Apply dark mode class to body element
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
    // Save to localStorage
    localStorage.setItem("darkMode", darkMode.toString());
  }, [darkMode]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  // Register a new user
  const register = async (email: string, password: string) => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      const response = await axios.post<AuthResponse>(
        `${API_URL}/auth/signup`,
        { email, password },
        { withCredentials: true }
      );

      const user = response.data;

      localStorage.setItem("user", JSON.stringify(user));
      axios.defaults.headers.common["Authorization"] = `Bearer ${user.token}`;

      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      navigate("/");
    } catch (error: any) {
      console.error("Registration error:", error);
      const errorMessage =
        error.response?.data?.message || "Registration failed";
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw new Error(errorMessage);
    }
  };

  // Login a user
  const login = async (email: string, password: string) => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      const response = await axios.post<AuthResponse>(
        `${API_URL}/auth/login`,
        { email, password },
        { withCredentials: true }
      );

      const user = response.data;

      localStorage.setItem("user", JSON.stringify(user));
      axios.defaults.headers.common["Authorization"] = `Bearer ${user.token}`;

      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      navigate("/");
    } catch (error: any) {
      console.error("Login error:", error);
      const errorMessage = error.response?.data?.message || "Login failed";
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw new Error(errorMessage);
    }
  };

  // Logout a user
  const logout = async () => {
    try {
      await axios.post(`${API_URL}/auth/logout`, {}, { withCredentials: true });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear local storage and state regardless of API response
      localStorage.removeItem("user");
      delete axios.defaults.headers.common["Authorization"];

      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });

      navigate("/login");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        authState,
        login,
        register,
        logout,
        darkMode,
        toggleDarkMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the Auth Context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// import React, { createContext, useContext, useEffect, useState } from 'react';
// import { useNavigate } from 'react-router';
// import axios from 'axios';
// import type { AuthResponse, AuthState } from '../types';
// // import { User, AuthState, AuthResponse } from '../types';

// // Define the Auth Context type
// interface AuthContextType {
//   authState: AuthState;
//   login: (email: string, password: string) => Promise<void>;
//   register: (email: string, password: string) => Promise<void>;
//   logout: () => Promise<void>;
// }

// // Create the Auth Context
// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// // API base URL
// const API_URL = import.meta.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// // Auth Provider Component
// export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const [authState, setAuthState] = useState<AuthState>({
//     user: null,
//     isAuthenticated: false,
//     isLoading: true,
//     error: null,
//   });
//   const navigate = useNavigate();

//   // Initialize the auth state from localStorage
//   useEffect(() => {
//     const storedUser = localStorage.getItem('user');
//     if (storedUser) {
//       try {
//         const user = JSON.parse(storedUser);
//         setAuthState({
//           user,
//           isAuthenticated: true,
//           isLoading: false,
//           error: null,
//         });

//         // Set authorization header for all future requests
//         axios.defaults.headers.common['Authorization'] = `Bearer ${user.token}`;
//       } catch (error) {
//         console.error('Error parsing stored user:', error);
//         localStorage.removeItem('user');
//         setAuthState({
//           user: null,
//           isAuthenticated: false,
//           isLoading: false,
//           error: null,
//         });
//       }
//     } else {
//       setAuthState(prev => ({ ...prev, isLoading: false }));
//     }
//   }, []);

//   // Register a new user
//   const register = async (email: string, password: string) => {
//     try {
//       setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

//       const response = await axios.post<AuthResponse>(
//         `${API_URL}/auth/signup`,
//         { email, password },
//         { withCredentials: true }
//       );

//       const user = response.data;

//       localStorage.setItem('user', JSON.stringify(user));
//       axios.defaults.headers.common['Authorization'] = `Bearer ${user.token}`;

//       setAuthState({
//         user,
//         isAuthenticated: true,
//         isLoading: false,
//         error: null,
//       });

//       navigate('/');
//     } catch (error: any) {
//       console.error('Registration error:', error);
//       const errorMessage = error.response?.data?.message || 'Registration failed';
//       setAuthState(prev => ({
//         ...prev,
//         isLoading: false,
//         error: errorMessage,
//       }));
//       throw new Error(errorMessage);
//     }
//   };

//   // Login a user
//   const login = async (email: string, password: string) => {
//     try {
//       setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

//       const response = await axios.post<AuthResponse>(
//         `${API_URL}/auth/login`,
//         { email, password },
//         { withCredentials: true }
//       );

//       const user = response.data;

//       localStorage.setItem('user', JSON.stringify(user));
//       axios.defaults.headers.common['Authorization'] = `Bearer ${user.token}`;

//       setAuthState({
//         user,
//         isAuthenticated: true,
//         isLoading: false,
//         error: null,
//       });

//       navigate('/');
//     } catch (error: any) {
//       console.error('Login error:', error);
//       const errorMessage = error.response?.data?.message || 'Login failed';
//       setAuthState(prev => ({
//         ...prev,
//         isLoading: false,
//         error: errorMessage,
//       }));
//       throw new Error(errorMessage);
//     }
//   };

//   // Logout a user
//   const logout = async () => {
//     try {
//       await axios.post(
//         `${API_URL}/auth/logout`,
//         {},
//         { withCredentials: true }
//       );
//     } catch (error) {
//       console.error('Logout error:', error);
//     } finally {
//       // Clear local storage and state regardless of API response
//       localStorage.removeItem('user');
//       delete axios.defaults.headers.common['Authorization'];

//       setAuthState({
//         user: null,
//         isAuthenticated: false,
//         isLoading: false,
//         error: null,
//       });

//       navigate('/login');
//     }
//   };

//   return (
//     <AuthContext.Provider value={{ authState, login, register, logout }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// // Custom hook to use the Auth Context
// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };
