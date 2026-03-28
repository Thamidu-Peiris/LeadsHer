import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';
import App from './App.jsx';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

const rootTree = googleClientId ? (
  <GoogleOAuthProvider clientId={googleClientId}>
    <App />
  </GoogleOAuthProvider>
) : (
  <App />
);

createRoot(document.getElementById('root')).render(rootTree);
