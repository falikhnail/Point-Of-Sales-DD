import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import AppContent from './components/AppContent';
import { Toaster } from './components/ui/toaster';
import { migrateLocalStorage } from './lib/storage';
import './App.css';

function App() {
  useEffect(() => {
    // Run migration once at app initialization
    migrateLocalStorage();
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <AppContent />
          <Toaster />
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;