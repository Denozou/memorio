import { useEffect } from 'react'
import { Toaster } from 'sonner';
import { isAuthenticated } from './lib/auth';
import { sessionManager } from './lib/sessionManager';
import { API_BASE_URL } from './lib/api';

export default function App() {
  useEffect(() => {
    // Start session management if user is authenticated
    const checkAuthAndStartSession = async () => {
      try {
        if (await isAuthenticated()) {
          sessionManager.start();
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      }
    };

    checkAuthAndStartSession();

    // Cleanup on unmount
    return () => {
      sessionManager.stop();
    };
  }, []);

  return (
    <div style={{ fontFamily: "system-ui", padding: 24 }}>
      <h1>Memorio — Frontend</h1>
      <p><a href="/login">Login</a> · <a href="/signup">Sign Up</a> · <a href="/dashboard">Dashboard</a> · <a href="/profile">Profile</a></p>
      <p>API URL: {API_BASE_URL}</p>
      <Toaster position="top-right" />
      <div>
        <h2>Welcome to Memorio!</h2>
        <p>This is the home page. Use the navigation links above to access different parts of the application.</p>
      </div>
    </div>
  );
}
