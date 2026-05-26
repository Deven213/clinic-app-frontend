import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import MedicalLoader from './MedicalLoader.jsx';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <MedicalLoader variant="page" text="Initializing secure session…" />;

  if (!user) return <Navigate to="/login" replace />;

  return children;
}
