import { useState } from 'react';
import { Phone, Mail, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const Navbar = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <nav className="bg-white shadow-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                            S
                        </div>
                        <div>
                            <span className="font-bold text-2xl text-gray-900 block leading-none">Shubham</span>
                            <span className="text-sm text-blue-600 font-medium">Acrylic Solutions</span>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-8">
                        <Link to="/" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Home</Link>
                        <a href="#products" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Products</a>
                        <a href="#about" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">About</a>
                        <a href="#contact" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Contact</a>
                    </div>

                    {/* Contact Info */}
                    <div className="hidden lg:flex items-center space-x-6 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                            <Phone size={16} className="text-blue-600" />
                            <span className="font-medium">+91 98765 43210</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                            <Mail size={16} className="text-blue-600" />
                            <span className="font-medium">info@shubham.com</span>
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
                        <Link to="/" className="block py-2 text-gray-700 font-medium hover:text-blue-600">Home</Link>
                        <a href="#products" className="block py-2 text-gray-700 font-medium hover:text-blue-600">Products</a>
                        <a href="#about" className="block py-2 text-gray-700 font-medium hover:text-blue-600">About</a>
                        <a href="#contact" className="block py-2 text-gray-700 font-medium hover:text-blue-600">Contact</a>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
