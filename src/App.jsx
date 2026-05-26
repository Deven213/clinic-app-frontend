import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Appointments from './pages/Appointments';
import Prescription from './pages/Prescription';
import DiseaseManager from './pages/DiseaseManager';
import Billing from './pages/Billing';
import Inventory from './pages/Inventory';
import FollowUp from './pages/FollowUp';
import PatientHistory from './pages/PatientHistory';
import Profile from './pages/Profile';
import Service from './pages/Service';

// Role-gated route: redirects to /dashboard if role not allowed
function RoleRoute({ allow, children }) {
  const { role } = useAuth();
  if (role && !allow.includes(role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected clinic routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/appointments" element={<Appointments />} />
                    <Route path="/patients" element={<Patients />} />
                    <Route path="/patients/:id/history" element={<PatientHistory />} />

                    {/* Doctor only */}
                    <Route path="/prescription" element={
                      <RoleRoute allow={['Doctor']}>
                        <Prescription />
                      </RoleRoute>
                    } />
                    <Route path="/diseases" element={
                      <RoleRoute allow={['Doctor']}>
                        <DiseaseManager />
                      </RoleRoute>
                    } />

                    {/* All roles */}
                    <Route path="/billing" element={<Billing />} />
                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/follow-ups" element={<FollowUp />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/service" element={<Service />} />
                    <Route path="/signup" element={<Signup />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
