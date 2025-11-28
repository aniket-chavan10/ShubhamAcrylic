const Newsletter = () => {
    return (
        <section className="bg-indigo-900 py-20 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-400 rounded-full mix-blend-overlay filter blur-3xl transform translate-x-1/2 translate-y-1/2"></div>
            </div>

            <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Join the Club</h2>
                <p className="text-indigo-200 mb-8 text-lg">Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.</p>

                <form className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto" onSubmit={(e) => e.preventDefault()}>
                    <input
                        type="email"
                        placeholder="Enter your email address"
                        className="flex-1 px-6 py-4 rounded-full bg-white/10 border border-white/20 text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-sm"
                    />
                    <button className="px-8 py-4 bg-white text-indigo-900 font-bold rounded-full hover:bg-indigo-50 transition-colors shadow-lg">
                        Subscribe
                    </button>
                </form>
            </div>
        </section>
    );
};

export default Newsletter;
