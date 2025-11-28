import { Instagram, Twitter, Facebook } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-gray-900 text-gray-300 py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                    <div className="col-span-1 md:col-span-1">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">S</div>
                            <span className="font-bold text-2xl text-white">SHUBHAM</span>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed mb-6">
                            Designing the future of retail with a curated selection of premium acrylic products for the modern lifestyle.
                        </p>
                        <div className="flex gap-4">
                            {[Instagram, Twitter, Facebook].map((Icon, i) => (
                                <a key={i} href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all">
                                    <Icon size={18} />
                                </a>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-6">Shop</h4>
                        <ul className="space-y-4 text-sm">
                            {['New Arrivals', 'Best Sellers', 'Acrylic Sheets', 'Furniture', 'Sale'].map(link => (
                                <li key={link}><Link to="#" className="hover:text-indigo-400 transition-colors">{link}</Link></li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-6">Support</h4>
                        <ul className="space-y-4 text-sm">
                            {['Help Center', 'Shipping & Returns', 'Size Guide', 'Contact Us', 'FAQ'].map(link => (
                                <li key={link}><Link to="#" className="hover:text-indigo-400 transition-colors">{link}</Link></li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-6">Company</h4>
                        <ul className="space-y-4 text-sm">
                            {['About Us', 'Careers', 'Press', 'Blog', 'Terms of Service'].map(link => (
                                <li key={link}><Link to="#" className="hover:text-indigo-400 transition-colors">{link}</Link></li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
                    <p>&copy; 2024 Shubham Acrylic. All rights reserved.</p>
                    <div className="flex gap-6 mt-4 md:mt-0">
                        <a href="#" className="hover:text-gray-300">Privacy Policy</a>
                        <a href="#" className="hover:text-gray-300">Terms of Use</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
