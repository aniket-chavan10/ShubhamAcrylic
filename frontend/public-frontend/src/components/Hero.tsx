const Hero = () => {
    return (
        <div id="home" className="relative bg-slate-900 text-white pt-24 pb-16 md:pt-32 md:pb-24">
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-black opacity-90"></div>
            </div>
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
                    Premium T-Shirt Collections <br className="hidden md:block" />
                    <span className="text-indigo-400">Crafted for Modern Style</span>
                </h1>
                <p className="max-w-2xl text-lg md:text-xl text-gray-300 mb-10">
                    Discover trending oversized tees, graphic prints, classic polos, and custom personalized t-shirts. 
                    Made from 100% super-combed organic cotton.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <a href="#products" className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg">
                        Explore T-Shirts
                    </a>
                    <a href="#contact" className="px-8 py-3 bg-transparent border border-white hover:bg-white hover:text-slate-900 rounded-lg font-semibold transition-all">
                        Custom Orders
                    </a>
                </div>
            </div>
        </div>
    );
};

export default Hero;
