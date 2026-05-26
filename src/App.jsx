import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Appointments from './pages/Appointments';
import Prescription from './pages/Prescription';
import DiseaseManager from './pages/DiseaseManager';
import Billing from './pages/Billing';
import Inventory from './pages/Inventory';
import FollowUp from './pages/FollowUp';
import PatientHistory from './pages/PatientHistory';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/prescription" element={<Prescription />} />
          <Route path="/diseases" element={<DiseaseManager />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/follow-ups" element={<FollowUp />} />
          <Route path="/patients/:id/history" element={<PatientHistory />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
