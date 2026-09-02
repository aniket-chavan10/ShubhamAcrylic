import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getSiteSettings } from '../services/api';
import { SiteSettings } from '../types';

interface SiteSettingsContextType {
  settings: SiteSettings | null;
  loading: boolean;
  getLogoUrl: () => string;
}

const SiteSettingsContext = createContext<SiteSettingsContextType>({
  settings: null,
  loading: true,
  getLogoUrl: () => '',
});

export const useSiteSettings = () => useContext(SiteSettingsContext);

// Derive the server base URL from the API URL (strip /api suffix)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_BASE = API_URL.replace(/\/api\/?$/, '');

export const SiteSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getSiteSettings();
        setSettings(data);
      } catch (err) {
        console.error('Failed to load site settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const getLogoUrl = (): string => {
    if (!settings?.logoUrl) return '';
    // If already a full URL, return as-is
    if (settings.logoUrl.startsWith('http')) return settings.logoUrl;
    // Otherwise prepend API base
    return `${API_BASE}${settings.logoUrl}`;
  };

  return (
    <SiteSettingsContext.Provider value={{ settings, loading, getLogoUrl }}>
      {children}
    </SiteSettingsContext.Provider>
  );
};

export default SiteSettingsContext;
