import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HeroCarousel from './components/HeroCarousel';
import ProductGrid from './components/ProductGrid';
import EnquiryForm from './components/EnquiryForm';
import Footer from './components/Footer';
import ProductDetails from './pages/ProductDetails';

function App() {
  return (
    <Routes>
      <Route path="/" element={
        <div className="min-h-screen bg-gray-50 font-sans">
          <Navbar />
          <main>
            <HeroCarousel />
            <div className="-mt-16 relative z-10 px-4">
              {/* Overlap effect for carousel */}
            </div>
            <ProductGrid />
            <EnquiryForm />
          </main>
          <Footer />
        </div>
      } />
      <Route path="/product/:id" element={<ProductDetails />} />
    </Routes>
  );
}

export default App;
