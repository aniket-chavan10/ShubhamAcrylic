import { lazy, Suspense } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { SiteSettingsProvider } from './context/SiteSettingsContext';
import MainLayout from './components/MainLayout';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductDetails from './pages/ProductDetails';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsConditions from './pages/TermsConditions';

// fabric.js is only needed in the design studio, so load it on demand
const CustomizePage = lazy(() => import('./pages/CustomizePage'));

const PageLoader = () => (
  <div className="grid min-h-[70vh] place-items-center">
    <Loader2 className="h-8 w-8 animate-spin text-accent" />
  </div>
);

const NotFound = () => (
  <div className="container-x grid min-h-[60vh] place-items-center text-center">
    <div>
      <p className="font-display text-8xl font-extrabold text-accent">404</p>
      <h1 className="mt-2 font-display text-2xl font-bold">This page went out of print.</h1>
      <Link to="/" className="btn-primary mt-6">Back to home</Link>
    </div>
  </div>
);

function App() {
  return (
    <SiteSettingsProvider>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/customize/:garmentKey?" element={<Suspense fallback={<PageLoader />}><CustomizePage /></Suspense>} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsConditions />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </SiteSettingsProvider>
  );
}

export default App;
