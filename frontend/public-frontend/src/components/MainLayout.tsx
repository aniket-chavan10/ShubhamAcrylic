import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import WhatsAppButton from './WhatsAppButton';
import ScrollToTop from './ScrollToTop';
import { useSiteSettings } from '../context/SiteSettingsContext';

const MainLayout = () => {
  const { settings } = useSiteSettings();
  const { pathname } = useLocation();
  // The design studio has its own WhatsApp link and a sticky checkout bar on mobile
  const showWhatsApp = Boolean(settings?.whatsappNumber) && !pathname.startsWith('/customize');

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-paper">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      {showWhatsApp && <WhatsAppButton phone={settings!.whatsappNumber!} />}
    </div>
  );
};

export default MainLayout;
