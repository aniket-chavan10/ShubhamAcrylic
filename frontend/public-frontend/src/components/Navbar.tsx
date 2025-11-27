import { useState } from 'react';
import { Search, ShoppingCart, Menu, X, User } from 'lucide-react';
import { Link } from 'react-router-dom';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    return (
        <nav className="bg-slate-900 text-white sticky top-0 z-50 shadow-md">
            {/* Top Bar */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 gap-4">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link to="/" className="text-2xl font-bold text-white tracking-tight">
                            Shubham<span className="text-yellow-500">Acrylic</span>
                        </Link>
                    </div>

                    {/* Search Bar (Desktop) */}
                    <div className="hidden md:flex flex-1 max-w-2xl mx-4">
                        <div className="relative w-full flex">
                            <select className="bg-gray-100 text-gray-700 text-sm rounded-l-md px-2 border-r border-gray-300 focus:outline-none">
                                <option>All</option>
                                <option>Acrylic Sheets</option>
                                <option>Furniture</option>
                                <option>Decor</option>
                            </select>
                            <input
                                type="text"
                                className="w-full px-4 py-2 text-gray-900 focus:outline-none"
                                placeholder="Search for products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <button className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 px-4 rounded-r-md flex items-center justify-center">
                                <Search size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Right Icons */}
                    <div className="hidden md:flex items-center space-x-6">
                        <div className="flex flex-col leading-tight cursor-pointer hover:text-yellow-500">
                            <span className="text-xs text-gray-300">Hello, Sign in</span>
                            <span className="font-bold text-sm flex items-center gap-1">
                                Account <User size={14} />
                            </span>
                        </div>
                        <div className="flex flex-col leading-tight cursor-pointer hover:text-yellow-500">
                            <span className="text-xs text-gray-300">Returns</span>
                            <span className="font-bold text-sm">& Orders</span>
                        </div>
                        <div className="flex items-center gap-1 cursor-pointer hover:text-yellow-500">
                            <div className="relative">
                                <ShoppingCart size={28} />
                                <span className="absolute -top-1 -right-1 bg-yellow-500 text-slate-900 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                    0
                                </span>
                            </div>
                            <span className="font-bold text-sm mt-2">Cart</span>
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-gray-300 hover:text-white focus:outline-none"
                        >
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Search & Menu */}
            {isOpen && (
                <div className="md:hidden bg-slate-800 pb-4 px-4">
                    <div className="py-2">
                        <div className="flex">
                            <input
                                type="text"
                                className="w-full px-4 py-2 rounded-l-md text-gray-900 focus:outline-none"
                                placeholder="Search..."
                            />
                            <button className="bg-yellow-500 text-slate-900 px-4 rounded-r-md">
                                <Search size={20} />
                            </button>
                        </div>
                    </div>
                    <div className="space-y-2 mt-2">
                        <Link to="/" className="block text-gray-300 hover:text-white py-2">Home</Link>
                        <a href="#products" className="block text-gray-300 hover:text-white py-2">Products</a>
                        <a href="#contact" className="block text-gray-300 hover:text-white py-2">Contact Us</a>
                    </div>
                </div>
            )}

            {/* Secondary Nav (Categories) */}
            <div className="bg-slate-800 text-white text-sm py-2 px-4 hidden md:flex gap-6 overflow-x-auto">
                <button className="flex items-center gap-1 font-bold hover:text-yellow-500">
                    <Menu size={16} /> All
                </button>
                <a href="#" className="hover:text-yellow-500 whitespace-nowrap">Today's Deals</a>
                <a href="#" className="hover:text-yellow-500 whitespace-nowrap">Customer Service</a>
                <a href="#" className="hover:text-yellow-500 whitespace-nowrap">Registry</a>
                <a href="#" className="hover:text-yellow-500 whitespace-nowrap">Gift Cards</a>
                <a href="#" className="hover:text-yellow-500 whitespace-nowrap">Sell</a>
            </div>
        </nav>
    );
};

export default Navbar;
