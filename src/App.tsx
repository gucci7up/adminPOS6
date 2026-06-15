import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import AgenciesPage from './pages/AgenciesPage';
import UsersPage from './pages/UsersPage';
import ReportsPage from './pages/ReportsPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/agencias" element={<AgenciesPage />} />
            <Route path="/usuarios" element={<UsersPage />} />
            <Route path="/reportes" element={<ReportsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/agencias" replace />} />
      </Routes>
    </AuthProvider>
  );
}
