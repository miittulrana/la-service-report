import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Nav } from './components/Nav';
import Categories from './pages/Categories';
import ScooterDetails from './pages/ScooterDetails';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="hidden md:block">
          <Nav />
        </div>
        
        <main className="flex-grow py-4 md:pt-20">
          <Routes>
            <Route path="/" element={<Categories />} />
            <Route path="/scooters/:id" element={<ScooterDetails />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;