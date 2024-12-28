// src/App.jsx
import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Nav } from './components/Nav';

// Lazy load pages for better initial load time
const Categories = lazy(() => import('./pages/Categories'));
const ScooterDetails = lazy(() => import('./pages/ScooterDetails'));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="hidden md:block">
          <Nav />
        </div>
        
        <main className="flex-grow py-4 md:pt-20">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Categories />} />
              <Route path="/scooters/:id" element={<ScooterDetails />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;