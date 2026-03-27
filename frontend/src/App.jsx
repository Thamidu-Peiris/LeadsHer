import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';
import { useAuth } from './context/AuthContext';

import HomePage         from './pages/HomePage';
import LoginPage        from './pages/LoginPage';
import RegisterPage     from './pages/RegisterPage';
import StoriesPage      from './pages/StoriesPage';
import StoryDetailPage  from './pages/StoryDetailPage';
import EventsPage       from './pages/EventsPage';
import EventDetailPage  from './pages/EventDetailPage';
import CreateEventPage  from './pages/CreateEventPage';
import DashboardPage    from './pages/DashboardPage';
import MentorDashboardStoriesPage from './pages/MentorDashboardStoriesPage';
import MentorDashboardCreateStoryPage from './pages/MentorDashboardCreateStoryPage';
import MentorDashboardMentorshipPage from './pages/MentorDashboardMentorshipPage';
import MenteeDashboardMentorsPage from './pages/MenteeDashboardMentorsPage';
import MenteeProfilePage from './pages/MenteeProfilePage';
import DashboardSettingsRouter from './pages/DashboardSettingsRouter';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import MentorsPage      from './pages/MentorsPage';
import MentorDashboardResourcesPage from './pages/MentorDashboardResourcesPage';
import MenteeDashboardResourcesPage from './pages/MenteeDashboardResourcesPage';
import AdminDashboardResourcesPage from './pages/AdminDashboardResourcesPage';
import PublicResourcesPage from './pages/PublicResourcesPage';
import NotFoundPage     from './pages/NotFoundPage';

const MENTOR_ADMIN = ['mentor', 'admin'];
const ANY_USER     = ['mentee', 'mentor', 'admin'];
const MENTEE_ONLY  = ['mentee'];
const ADMIN_ONLY   = ['admin'];

/* Role-based resources page */
function ResourcesRoute() {
  const { user } = useAuth();
  if (user?.role === 'admin') return <AdminDashboardResourcesPage />;
  if (user?.role === 'mentee') return <MenteeDashboardResourcesPage />;
  return <MentorDashboardResourcesPage />;
}


/* Layout with Navbar + Footer */
function MainLayout() {
  const location = useLocation();
  const { user } = useAuth();

  const hideChromeForRoleDashboard =
    location.pathname.startsWith('/dashboard') &&
    (user?.role === 'mentor' || user?.role === 'mentee' || user?.role === 'admin');

  const hideChromeForStoryEditor = /^\/stories\/[^/]+\/edit$/.test(location.pathname);

  const hideChrome = hideChromeForRoleDashboard || hideChromeForStoryEditor;

  return (
    <div className="min-h-screen flex flex-col">
      {!hideChrome && <Navbar />}
      <div className="flex-1">
        <Outlet />
      </div>
      {!hideChrome && <Footer />}
    </div>
  );
}

/* Layout for auth pages — no Navbar, no Footer, no extra wrappers */
function AuthLayout() {
  return <Outlet />;
}

export default function App() {
  return (
    <ThemeProvider>
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-center"
          containerStyle={{ pointerEvents: 'none' }}
          toastOptions={{
            duration: 2500,
            style: { pointerEvents: 'auto' },
          }}
        />
        <Routes>

          {/* All pages — with Navbar + Footer */}
          <Route element={<MainLayout />}>
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/"            element={<HomePage />} />
            <Route path="/stories"     element={<StoriesPage />} />
            <Route path="/stories/:id" element={<StoryDetailPage />} />
            <Route path="/events"      element={<EventsPage />} />
            <Route path="/events/:id"  element={<EventDetailPage />} />
            <Route path="/mentors"     element={<MentorsPage />} />

            <Route path="/dashboard" element={
              <ProtectedRoute roles={ANY_USER}><DashboardPage /></ProtectedRoute>
            } />
            <Route path="/dashboard/manage-account" element={
              <ProtectedRoute roles={ADMIN_ONLY}><DashboardPage /></ProtectedRoute>
            } />
            <Route path="/dashboard/manage-mentors" element={
              <ProtectedRoute roles={ADMIN_ONLY}><DashboardPage /></ProtectedRoute>
            } />
            <Route path="/dashboard/generated-reports" element={
              <ProtectedRoute roles={ADMIN_ONLY}><DashboardPage /></ProtectedRoute>
            } />
            <Route path="/dashboard/stories" element={
              <ProtectedRoute roles={MENTOR_ADMIN}><MentorDashboardStoriesPage /></ProtectedRoute>
            } />
            <Route path="/dashboard/stories/new" element={
              <ProtectedRoute roles={MENTOR_ADMIN}><MentorDashboardCreateStoryPage /></ProtectedRoute>
            } />
            <Route path="/dashboard/stories/:id/edit" element={
              <ProtectedRoute roles={MENTOR_ADMIN}><MentorDashboardCreateStoryPage /></ProtectedRoute>
            } />
            <Route path="/dashboard/mentorship" element={
              <ProtectedRoute roles={MENTOR_ADMIN}><MentorDashboardMentorshipPage /></ProtectedRoute>
            } />
            <Route path="/dashboard/settings" element={
              <ProtectedRoute roles={ANY_USER}><DashboardSettingsRouter /></ProtectedRoute>
            } />
            <Route path="/dashboard/mentors" element={
              <ProtectedRoute roles={MENTEE_ONLY}><MenteeDashboardMentorsPage /></ProtectedRoute>
            } />
            <Route path="/resources" element={<PublicResourcesPage />} />
            <Route path="/dashboard/resources" element={
              <ProtectedRoute roles={ANY_USER}><ResourcesRoute /></ProtectedRoute>
            } />
            <Route path="/dashboard/profile" element={
              <ProtectedRoute roles={MENTEE_ONLY}><MenteeProfilePage /></ProtectedRoute>
            } />
            <Route path="/stories/:id/edit" element={
              <ProtectedRoute roles={ANY_USER}><MentorDashboardCreateStoryPage /></ProtectedRoute>
            } />
            <Route path="/events/new" element={
              <ProtectedRoute roles={MENTOR_ADMIN}><CreateEventPage /></ProtectedRoute>
            } />
            <Route path="/events/:id/edit" element={
              <ProtectedRoute roles={MENTOR_ADMIN}><CreateEventPage /></ProtectedRoute>
            } />

            <Route path="*" element={<NotFoundPage />} />
          </Route>

        </Routes>
      </AuthProvider>
    </BrowserRouter>
    </ThemeProvider>
  );
}
