import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';
import { useAuth } from './context/AuthContext';

import HomePage         from './pages/HomePage';
import LoginPage        from './pages/LoginPage';
import RegisterPage     from './pages/RegisterPage';
import StoriesPage      from './pages/StoriesPage';
import StoryDetailPage  from './pages/StoryDetailPage';
import CreateStoryPage  from './pages/CreateStoryPage';
import EventsPage       from './pages/EventsPage';
import EventDetailPage  from './pages/EventDetailPage';
import CreateEventPage  from './pages/CreateEventPage';
import DashboardPage    from './pages/DashboardPage';
import MentorDashboardStoriesPage from './pages/MentorDashboardStoriesPage';
import MentorDashboardCreateStoryPage from './pages/MentorDashboardCreateStoryPage';
import MentorsPage      from './pages/MentorsPage';
import NotFoundPage     from './pages/NotFoundPage';

const MENTOR_ADMIN = ['mentor', 'admin'];
const ANY_USER     = ['mentee', 'mentor', 'admin'];

function MentorStoryNewWrapper() {
  const { user } = useAuth();
  if (user?.role === 'mentor') return <MentorDashboardCreateStoryPage />;
  return <CreateStoryPage />;
}

/* Layout with Navbar + Footer */
function MainLayout() {
  const location = useLocation();
  const { user } = useAuth();

  const hideChromeForRoleDashboard =
    location.pathname.startsWith('/dashboard') && (user?.role === 'mentor' || user?.role === 'mentee');

  return (
    <div className="min-h-screen flex flex-col">
      {!hideChromeForRoleDashboard && <Navbar />}
      <div className="flex-1">
        <Outlet />
      </div>
      {!hideChromeForRoleDashboard && <Footer />}
    </div>
  );
}

/* Layout for auth pages — no Navbar, no Footer, no extra wrappers */
function AuthLayout() {
  return <Outlet />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
        <Routes>

          {/* All pages — with Navbar + Footer */}
          <Route element={<MainLayout />}>
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/"            element={<HomePage />} />
            <Route path="/stories"     element={<StoriesPage />} />
            <Route path="/stories/:id" element={<StoryDetailPage />} />
            <Route path="/events"      element={<EventsPage />} />
            <Route path="/events/:id"  element={<EventDetailPage />} />
            <Route path="/mentors"     element={<MentorsPage />} />

            <Route path="/dashboard" element={
              <ProtectedRoute roles={ANY_USER}><DashboardPage /></ProtectedRoute>
            } />
            <Route path="/dashboard/stories" element={
              <ProtectedRoute roles={MENTOR_ADMIN}><MentorDashboardStoriesPage /></ProtectedRoute>
            } />
            <Route path="/dashboard/stories/new" element={
              <ProtectedRoute roles={MENTOR_ADMIN}><MentorDashboardCreateStoryPage /></ProtectedRoute>
            } />
            <Route path="/stories/new" element={
              <ProtectedRoute roles={ANY_USER}>
                <MentorStoryNewWrapper />
              </ProtectedRoute>
            } />
            <Route path="/stories/:id/edit" element={
              <ProtectedRoute roles={ANY_USER}><CreateStoryPage /></ProtectedRoute>
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
  );
}
