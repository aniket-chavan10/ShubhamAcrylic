import { Routes, Route } from 'react-router-dom';
import { SiteSettingsProvider } from './context/SiteSettingsContext';
import Navbar from './components/Navbar';
import HeroCarousel from './components/HeroCarousel';
import Features from './components/Features';
import CategorySection from './components/CategorySection';
import ProductGrid from './components/ProductGrid';
import AboutSection from './components/AboutSection';
import EnquiryForm from './components/EnquiryForm';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import ProductDetails from './pages/ProductDetails';
import { useSiteSettings } from './context/SiteSettingsContext';

function HomePage() {
  return (
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
      <DynamicWhatsApp />
    </div>
  );
}

function DynamicWhatsApp() {
  const { settings } = useSiteSettings();
  if (!settings?.whatsappNumber) return null;
  return (
    <WhatsAppButton
      phone={settings.whatsappNumber}
      message="Hi, I would like to know more about your products."
    />
  );
}

function App() {
  return (
    <SiteSettingsProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/product/:id" element={<ProductDetails />} />
      </Routes>
    </SiteSettingsProvider>
  );
}

export default App;
