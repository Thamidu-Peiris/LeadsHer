import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';

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
import MentorsPage      from './pages/MentorsPage';
import NotFoundPage     from './pages/NotFoundPage';

const MENTOR_ADMIN = ['mentor', 'admin'];
const ANY_USER     = ['mentee', 'mentor', 'admin'];

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <div className="flex-1">
            <Routes>
              {/* Public */}
              <Route path="/"              element={<HomePage />} />
              <Route path="/login"         element={<LoginPage />} />
              <Route path="/register"      element={<RegisterPage />} />
              <Route path="/stories"       element={<StoriesPage />} />
              <Route path="/stories/:id"   element={<StoryDetailPage />} />
              <Route path="/events"        element={<EventsPage />} />
              <Route path="/events/:id"    element={<EventDetailPage />} />
              <Route path="/mentors"       element={<MentorsPage />} />

              {/* Protected – any logged-in user */}
              <Route path="/dashboard" element={
                <ProtectedRoute roles={ANY_USER}><DashboardPage /></ProtectedRoute>
              } />
              <Route path="/stories/new" element={
                <ProtectedRoute roles={ANY_USER}><CreateStoryPage /></ProtectedRoute>
              } />
              <Route path="/stories/:id/edit" element={
                <ProtectedRoute roles={ANY_USER}><CreateStoryPage /></ProtectedRoute>
              } />

              {/* Protected – mentor or admin */}
              <Route path="/events/new" element={
                <ProtectedRoute roles={MENTOR_ADMIN}><CreateEventPage /></ProtectedRoute>
              } />
              <Route path="/events/:id/edit" element={
                <ProtectedRoute roles={MENTOR_ADMIN}><CreateEventPage /></ProtectedRoute>
              } />

              {/* 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
