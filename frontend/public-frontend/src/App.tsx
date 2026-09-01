import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HeroCarousel from './components/HeroCarousel';
import Features from './components/Features';
import CategorySection from './components/CategorySection';
import ProductGrid from './components/ProductGrid';
import AboutSection from './components/AboutSection';
import EnquiryForm from './components/EnquiryForm';
import Footer from './components/Footer';
import ProductDetails from './pages/ProductDetails';

function App() {
  return (
    <Routes>
      <Route path="/" element={
        <div className="min-h-screen bg-white font-sans">
          <Navbar />
          <main>
            <div id="home">
              <HeroCarousel />
            </div>
            <Features />
            <CategorySection />
            <ProductGrid />
            <AboutSection />
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
