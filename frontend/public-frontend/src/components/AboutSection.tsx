import { ShieldCheck, Award, HeartHandshake, Zap } from 'lucide-react';
import { useSiteSettings } from '../context/SiteSettingsContext';

const AboutSection = () => {
    const { settings } = useSiteSettings();
    const companyName = settings?.companyName || 'Shubham Acrylic';

    return (
        <section id="about" className="py-12 sm:py-20 bg-white border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
                    {/* Left side: Images collage */}
                    <div className="relative">
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            <img
                                src="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop"
                                alt="T-Shirt Craftsmanship"
                                className="rounded-2xl shadow-lg w-full h-40 sm:h-64 object-cover transform hover:scale-105 transition-transform duration-300"
                            />
                            <img
                                src="https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&auto=format&fit=crop"
                                alt="Streetwear T-Shirt"
                                className="rounded-2xl shadow-lg w-full h-40 sm:h-64 object-cover mt-4 sm:mt-8 transform hover:scale-105 transition-transform duration-300"
                            />
                        </div>
                        <div className="absolute -bottom-4 -left-4 sm:-bottom-6 sm:-left-6 bg-indigo-600 text-white p-4 sm:p-6 rounded-2xl shadow-xl hidden sm:block">
                            <div className="text-2xl sm:text-3xl font-extrabold">100%</div>
                            <div className="text-xs sm:text-sm font-medium text-indigo-100">Organic Cotton</div>
                        </div>
                    </div>

                    {/* Right side: Content */}
                    <div className="space-y-4 sm:space-y-6">
                        <div>
                            <span className="text-sm text-indigo-600 font-bold uppercase tracking-wider">Our Story</span>
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 mt-2">
                                Redefining Streetwear & Everyday Apparel
                            </h2>
                        </div>

                        <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
                            At <strong>{companyName}</strong>, we believe t-shirts are more than just everyday clothing—they are a canvas for self-expression. Founded with a passion for quality and design, we craft premium graphic, oversized, and essential t-shirts engineered for unmatched comfort and long-lasting durability.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2">
                            <div className="flex items-start gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <Award className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 shrink-0 mt-1" />
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm sm:text-base">240 GSM Fabrics</h4>
                                    <p className="text-xs text-gray-500 mt-1">Heavyweight cotton offering structured boxy fits.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 shrink-0 mt-1" />
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm sm:text-base">HD DTG Prints</h4>
                                    <p className="text-xs text-gray-500 mt-1">Crack-resistant eco-friendly vibrant inks.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 shrink-0 mt-1" />
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm sm:text-base">Bio-Washed Finish</h4>
                                    <p className="text-xs text-gray-500 mt-1">Pre-shrunk fabric ensuring zero shrinkage.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <HeartHandshake className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 shrink-0 mt-1" />
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm sm:text-base">Ethically Made</h4>
                                    <p className="text-xs text-gray-500 mt-1">100% sustainable manufacturing practices.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AboutSection;
