import { useState } from 'react';
import { Phone, Mail, Menu, X } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

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

    return (
        <nav className="bg-white shadow-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    {/* Logo */}
                    <Link to="/" onClick={(e) => handleNavClick(e, 'home')} className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                            S
                        </div>
                        <div>
                            <span className="font-bold text-2xl text-gray-900 block leading-none">Shubham Tees</span>
                            <span className="text-sm text-indigo-600 font-medium">Online T-Shirt Store</span>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-8">
                        <a 
                            href="#home" 
                            onClick={(e) => handleNavClick(e, 'home')} 
                            className="text-gray-700 hover:text-indigo-600 font-medium transition-colors cursor-pointer"
                        >
                            Home
                        </a>
                        <a 
                            href="#products" 
                            onClick={(e) => handleNavClick(e, 'products')} 
                            className="text-gray-700 hover:text-indigo-600 font-medium transition-colors cursor-pointer"
                        >
                            Products
                        </a>
                        <a 
                            href="#about" 
                            onClick={(e) => handleNavClick(e, 'about')} 
                            className="text-gray-700 hover:text-indigo-600 font-medium transition-colors cursor-pointer"
                        >
                            About
                        </a>
                        <a 
                            href="#contact" 
                            onClick={(e) => handleNavClick(e, 'contact')} 
                            className="text-gray-700 hover:text-indigo-600 font-medium transition-colors cursor-pointer"
                        >
                            Contact
                        </a>
                    </div>

                    {/* Contact Info */}
                    <div className="hidden lg:flex items-center space-x-6 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                            <Phone size={16} className="text-indigo-600" />
                            <span className="font-medium">+91 98765 43210</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                            <Mail size={16} className="text-indigo-600" />
                            <span className="font-medium">info@shubhamtees.com</span>
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden text-gray-700"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-gray-50 border-t">
                    <div className="px-4 py-4 space-y-3">
                        <a 
                            href="#home" 
                            onClick={(e) => handleNavClick(e, 'home')} 
                            className="block py-2 text-gray-700 font-medium hover:text-indigo-600 cursor-pointer"
                        >
                            Home
                        </a>
                        <a 
                            href="#products" 
                            onClick={(e) => handleNavClick(e, 'products')} 
                            className="block py-2 text-gray-700 font-medium hover:text-indigo-600 cursor-pointer"
                        >
                            Products
                        </a>
                        <a 
                            href="#about" 
                            onClick={(e) => handleNavClick(e, 'about')} 
                            className="block py-2 text-gray-700 font-medium hover:text-indigo-600 cursor-pointer"
                        >
                            About
                        </a>
                        <a 
                            href="#contact" 
                            onClick={(e) => handleNavClick(e, 'contact')} 
                            className="block py-2 text-gray-700 font-medium hover:text-indigo-600 cursor-pointer"
                        >
                            Contact
                        </a>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
