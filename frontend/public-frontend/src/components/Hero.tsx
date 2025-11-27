const Hero = () => {
    return (
        <div id="home" className="relative bg-slate-900 text-white pt-24 pb-16 md:pt-32 md:pb-24">
            <div className="absolute inset-0 overflow-hidden">
                {/* Placeholder for background image or gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-slate-900 opacity-90"></div>
            </div>
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
                    Premium Acrylic Solutions <br className="hidden md:block" />
                    <span className="text-blue-400">Designed for Excellence</span>
                </h1>
                <p className="max-w-2xl text-lg md:text-xl text-gray-300 mb-10">
                    We specialize in high-quality acrylic products for businesses and homes.
                    Custom designs, durable materials, and precision crafting.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <a href="#products" className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg">
                        Explore Products
                    </a>
                    <a href="#contact" className="px-8 py-3 bg-transparent border border-white hover:bg-white hover:text-slate-900 rounded-lg font-semibold transition-all">
                        Get a Quote
                    </a>
                </div>
            </div>
        </div>
    );
};

export default Hero;
