import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MentorDashboardSettingsPage from './MentorDashboardSettingsPage';
import MenteeSettingsPage from './MenteeSettingsPage';

export default function DashboardSettingsRouter() {
  const { user } = useAuth();
  const role = (user?.role || '').toLowerCase();
  if (role === 'mentee') return <MenteeSettingsPage />;
  if (role === 'mentor' || role === 'admin') return <MentorDashboardSettingsPage />;
  return <Navigate to="/dashboard" replace />;
}
