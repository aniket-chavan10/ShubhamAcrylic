import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HeroCarousel from './components/HeroCarousel';
import Features from './components/Features';
import ProductGrid from './components/ProductGrid';
import Footer from './components/Footer';
import ProductDetails from './pages/ProductDetails';
import EnquiryForm from './components/EnquiryForm';

function App() {
  return (
    <Routes>
      <Route path="/" element={
        <div className="min-h-screen bg-white font-sans">
          <Navbar />
          <main>
            <HeroCarousel />
            <Features />
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
