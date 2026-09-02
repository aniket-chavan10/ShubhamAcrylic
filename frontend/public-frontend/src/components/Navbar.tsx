import { useState } from 'react';
import { Phone, Mail, Menu, X } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSiteSettings } from '../context/SiteSettingsContext';

const Navbar = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { settings, getLogoUrl } = useSiteSettings();

    const companyName = settings?.companyName || 'Shubham Acrylic';
    const phone = settings?.phone || '';
    const email = settings?.email || '';
    const logoUrl = getLogoUrl();

    const handleNavClick = (e: React.MouseEvent, sectionId: string) => {
        e.preventDefault();
        setIsMobileMenuOpen(false);

        if (location.pathname !== '/') {
            navigate('/');
            setTimeout(() => {
                const element = document.getElementById(sectionId);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                } else {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }, 100);
        } else {
            const element = document.getElementById(sectionId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            } else if (sectionId === 'home') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
    };

    const navLinks = [
        { id: 'home', label: 'Home' },
        { id: 'products', label: 'Products' },
        { id: 'about', label: 'About' },
        { id: 'contact', label: 'Contact' },
    ];

    return (
        <nav className="bg-white shadow-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16 sm:h-20">
                    {/* Logo */}
                    <Link to="/" onClick={(e) => handleNavClick(e, 'home')} className="flex items-center gap-2 sm:gap-3 shrink-0">
                        {logoUrl ? (
                            <img
                                src={logoUrl}
                                alt={`${companyName} logo`}
                                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-contain shadow-lg"
                            />
                        ) : (
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl sm:text-2xl shadow-lg">
                                {companyName.charAt(0)}
                            </div>
                        )}
                        <div className="min-w-0">
                            <span className="font-bold text-lg sm:text-2xl text-gray-900 block leading-none truncate max-w-[150px] sm:max-w-[250px]">
                                {companyName}
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
                        {navLinks.map(link => (
                            <a
                                key={link.id}
                                href={`#${link.id}`}
                                onClick={(e) => handleNavClick(e, link.id)}
                                className="text-gray-700 hover:text-indigo-600 font-medium transition-colors cursor-pointer text-sm lg:text-base"
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>

                    {/* Contact Info - Desktop only */}
                    <div className="hidden lg:flex items-center space-x-4 xl:space-x-6 text-sm shrink-0">
                        {phone && (
                            <a href={`tel:${phone}`} className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors">
                                <Phone size={16} className="text-indigo-600" />
                                <span className="font-medium">{phone}</span>
                            </a>
                        )}
                        {email && (
                            <a href={`mailto:${email}`} className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors">
                                <Mail size={16} className="text-indigo-600" />
                                <span className="font-medium">{email}</span>
                            </a>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden text-gray-700 p-2 -mr-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                    >
                        {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-gray-50 border-t">
                    <div className="px-4 py-3 space-y-1">
                        {navLinks.map(link => (
                            <a
                                key={link.id}
                                href={`#${link.id}`}
                                onClick={(e) => handleNavClick(e, link.id)}
                                className="block py-3 px-3 text-gray-700 font-medium hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors text-base"
                            >
                                {link.label}
                            </a>
                        ))}

                        {/* Contact info in mobile menu */}
                        {(phone || email) && (
                            <div className="border-t border-gray-200 mt-2 pt-3 space-y-2">
                                {phone && (
                                    <a href={`tel:${phone}`} className="flex items-center gap-3 py-2 px-3 text-gray-600 hover:text-indigo-600 transition-colors">
                                        <Phone size={16} className="text-indigo-600 shrink-0" />
                                        <span className="text-sm font-medium">{phone}</span>
                                    </a>
                                )}
                                {email && (
                                    <a href={`mailto:${email}`} className="flex items-center gap-3 py-2 px-3 text-gray-600 hover:text-indigo-600 transition-colors">
                                        <Mail size={16} className="text-indigo-600 shrink-0" />
                                        <span className="text-sm font-medium">{email}</span>
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
