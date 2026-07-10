/**
 * File: src/App.jsx
 * Overall Purpose: Frontend router definition and root wrapper.
 * Connections: Integrates the AuthProvider, configures React Router, and lays out
 * the core routing hierarchy for all views.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// Page Views (to be built)
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ProjectBoard from './pages/ProjectBoard';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-background text-textPrimary flex flex-col font-sans">
          {/* Global Header Navigation */}
          <Navbar />

          {/* Main content grid */}
          <main className="flex-1 w-full max-w-7xl mx-auto px-24 py-32 flex flex-col">
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Secure Workspace Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/project/:projectId"
                element={
                  <ProtectedRoute>
                    <ProjectBoard />
                  </ProtectedRoute>
                }
              />

              {/* Fallback Catch-all Route */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;