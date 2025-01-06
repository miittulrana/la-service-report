import { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Nav } from './components/Nav';
import { supabase } from './lib/supabase';

// Lazy load pages for better initial load time
const Categories = lazy(() => import('./pages/Categories'));
const ScooterDetails = lazy(() => import('./pages/ScooterDetails'));

// Loading component with prop for custom message
const PageLoader = ({ message = 'Loading...' }) => (
  <div className="min-h-screen flex flex-col items-center justify-center p-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
    <p className="text-gray-600">{message}</p>
  </div>
);

// Error Boundary Component
const ErrorFallback = ({ message, resetError }) => (
  <div className="min-h-screen flex flex-col items-center justify-center p-4">
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
      <h2 className="text-red-600 text-lg font-semibold mb-2">Something went wrong</h2>
      <p className="text-gray-600 mb-4">{message}</p>
      <button
        onClick={resetError}
        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
      >
        Try again
      </button>
    </div>
  </div>
);

function App() {
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  // Check Supabase connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { error } = await supabase.from('categories').select('count');
        if (error) throw error;
        setIsSupabaseConnected(true);
      } catch (error) {
        console.error('Supabase connection error:', error);
        setConnectionError(error.message);
      }
    };

    checkConnection();
  }, []);

  // Show connection error if any
  if (connectionError) {
    return <ErrorFallback message={connectionError} resetError={() => window.location.reload()} />;
  }

  // Show loading while checking connection
  if (!isSupabaseConnected) {
    return <PageLoader message="Connecting to database..." />;
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-blue-50/30 to-gray-50 flex flex-col">
        <Nav />
        
        <main className="flex-grow py-4 md:pt-20">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Categories />} />
              <Route 
                path="/scooters/:id" 
                element={
                  <Suspense fallback={<PageLoader message="Loading scooter details..." />}>
                    <ScooterDetails />
                  </Suspense>
                } 
              />
              {/* Catch any invalid routes and redirect to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>

        {/* DEV MODE - Connection Status */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 right-4 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
            DB Connected
          </div>
        )}
      </div>
    </BrowserRouter>
  );
}

export default App;