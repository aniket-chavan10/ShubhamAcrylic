import { Instagram, Twitter, Facebook, Youtube } from 'lucide-react';
import { useSiteSettings } from '../context/SiteSettingsContext';

const Footer = () => {
    const { settings, getLogoUrl } = useSiteSettings();

    const companyName = settings?.companyName || 'Astitva Creations';
    const logoUrl = getLogoUrl();
    const currentYear = new Date().getFullYear();

    const handleNavClick = (e: React.MouseEvent, sectionId: string) => {
        e.preventDefault();
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <footer className="bg-gray-900 text-gray-300 py-10 sm:py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12">
                    <div className="col-span-2 sm:col-span-2 md:col-span-1">
                        <div className="flex items-center gap-2 mb-4 sm:mb-6">
                            {logoUrl ? (
                                <img
                                    src={logoUrl}
                                    alt={`${companyName} logo`}
                                    className="w-9 h-9 rounded-lg object-contain bg-white p-0.5"
                                />
                            ) : (
                                <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                                    {companyName.charAt(0)}
                                </div>
                            )}
                            <span className="font-bold text-xl sm:text-2xl text-white uppercase tracking-wider">{companyName}</span>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed mb-4 sm:mb-6">
                            Crafting premium bespoke acrylic signages, display stands, cast acrylic panels, and custom engraved trophies.
                        </p>
                        <div className="flex gap-3 sm:gap-4">
                            {settings?.instagramUrl && (
                                <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all">
                                    <Instagram size={18} />
                                </a>
                            )}
                            {settings?.twitterUrl && (
                                <a href={settings.twitterUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all">
                                    <Twitter size={18} />
                                </a>
                            )}
                            {settings?.facebookUrl && (
                                <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all">
                                    <Facebook size={18} />
                                </a>
                            )}
                            {settings?.youtubeUrl && (
                                <a href={settings.youtubeUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all">
                                    <Youtube size={18} />
                                </a>
                            )}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-4 sm:mb-6 text-sm sm:text-base">Products</h4>
                        <ul className="space-y-3 sm:space-y-4 text-sm">
                            {[
                                { name: 'Acrylic Signages', id: 'products' },
                                { name: 'Display Stands', id: 'products' },
                                { name: 'Acrylic Sheets', id: 'products' },
                                { name: 'Corporate Trophies', id: 'products' },
                                { name: 'Laser Cut Crafts', id: 'products' },
                            ].map(link => (
                                <li key={link.name}>
                                    <a href={`#${link.id}`} onClick={(e) => handleNavClick(e, link.id)} className="hover:text-indigo-400 transition-colors">
                                        {link.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-4 sm:mb-6 text-sm sm:text-base">Quick Links</h4>
                        <ul className="space-y-3 sm:space-y-4 text-sm">
                            {[
                                { name: 'Home', id: 'home' },
                                { name: 'Our Products', id: 'products' },
                                { name: 'About Us', id: 'about' },
                                { name: 'Contact & Enquiry', id: 'contact' },
                            ].map(link => (
                                <li key={link.name}>
                                    <a href={`#${link.id}`} onClick={(e) => handleNavClick(e, link.id)} className="hover:text-indigo-400 transition-colors">
                                        {link.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-4 sm:mb-6 text-sm sm:text-base">Support & Legal</h4>
                        <ul className="space-y-3 sm:space-y-4 text-sm">
                            <li><a href="#contact" onClick={(e) => handleNavClick(e, 'contact')} className="hover:text-indigo-400 transition-colors">Get a Quote</a></li>
                            <li><a href="#about" onClick={(e) => handleNavClick(e, 'about')} className="hover:text-indigo-400 transition-colors">About {companyName}</a></li>
                            <li><a href="#contact" onClick={(e) => handleNavClick(e, 'contact')} className="hover:text-indigo-400 transition-colors">Help & FAQ</a></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-800 mt-8 sm:mt-12 pt-6 sm:pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 gap-4">
                    <p>&copy; {currentYear} {companyName}. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
