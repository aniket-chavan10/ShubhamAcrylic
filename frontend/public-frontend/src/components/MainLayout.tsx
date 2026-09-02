// src/layouts/MainLayout.tsx
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import WhatsAppButton from '../components/WhatsAppButton';
import { Outlet } from 'react-router-dom';
import { useSiteSettings } from '../context/SiteSettingsContext';

const MainLayout = () => {
  const { settings } = useSiteSettings();

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
      {settings?.whatsappNumber && (
        <WhatsAppButton
          phone={settings.whatsappNumber}
          message="Hi, I would like to know more about your products."
        />
      )}
    </div>
  );
};

export default MainLayout;
