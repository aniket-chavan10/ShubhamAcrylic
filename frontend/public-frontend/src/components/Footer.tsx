import { Instagram, Twitter, Facebook, Youtube } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSiteSettings } from '../context/SiteSettingsContext';

const Footer = () => {
    const { settings, getLogoUrl } = useSiteSettings();

    const companyName = settings?.companyName || 'Shubham Acrylic';
    const logoUrl = getLogoUrl();
    const currentYear = new Date().getFullYear();

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
                                    className="w-8 h-8 rounded-lg object-contain"
                                />
                            ) : (
                                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                                    {companyName.charAt(0)}
                                </div>
                            )}
                            <span className="font-bold text-xl sm:text-2xl text-white uppercase">{companyName}</span>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed mb-4 sm:mb-6">
                            Crafting high-quality graphic, oversized, and custom printed t-shirts made from 100% super-combed organic cotton.
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
                        <h4 className="text-white font-bold mb-4 sm:mb-6 text-sm sm:text-base">Shop</h4>
                        <ul className="space-y-3 sm:space-y-4 text-sm">
                            {['Graphic Tees', 'Oversized Tees', 'Polo Shirts', 'Custom Prints', 'New Arrivals'].map(link => (
                                <li key={link}><a href="#products" className="hover:text-indigo-400 transition-colors">{link}</a></li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-4 sm:mb-6 text-sm sm:text-base">Support</h4>
                        <ul className="space-y-3 sm:space-y-4 text-sm">
                            {['Help Center', 'Shipping & Returns', 'Size Guide', 'Contact Us', 'FAQ'].map(link => (
                                <li key={link}><Link to="#" className="hover:text-indigo-400 transition-colors">{link}</Link></li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-4 sm:mb-6 text-sm sm:text-base">Company</h4>
                        <ul className="space-y-3 sm:space-y-4 text-sm">
                            {['About Us', 'Careers', 'Press', 'Blog', 'Terms of Service'].map(link => (
                                <li key={link}><Link to="#" className="hover:text-indigo-400 transition-colors">{link}</Link></li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-800 mt-8 sm:mt-12 pt-6 sm:pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 gap-4">
                    <p>&copy; {currentYear} {companyName}. All rights reserved.</p>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-gray-300">Privacy Policy</a>
                        <a href="#" className="hover:text-gray-300">Terms of Use</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
