import { ShieldCheck, Award, HeartHandshake, Zap } from 'lucide-react';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { getImageUrl } from '../utils/imageUtils';

const AboutSection = () => {
    const { settings } = useSiteSettings();
    const companyName = settings?.companyName || 'Astitva Creations';

    const subtitle = settings?.aboutSubtitle || 'OUR BRAND STORY';
    const title = settings?.aboutTitle || 'Crafting Premium Custom Apparel & T-Shirt Designs';
    const description = settings?.aboutDescription || `At ${companyName}, we transform organic cotton and premium fabrics into high-impact oversized t-shirts, custom graphic tees, hoodies, and corporate merchandise. Engineered with state-of-the-art screen printing, DTG precision, and bio-wash softness.`;

    const image1 = getImageUrl(settings?.aboutImage1 || 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&auto=format&fit=crop');
    const image2 = getImageUrl(settings?.aboutImage2 || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop');

    const feature1Title = settings?.feature1Title || 'Heavyweight Cotton';
    const feature1Desc = settings?.feature1Desc || '180 to 350 GSM pre-shrunk combed cotton for maximum durability.';

    const feature2Title = settings?.feature2Title || 'Precision DTG & Screen Printing';
    const feature2Desc = settings?.feature2Desc || 'Vibrant, crack-resistant eco-friendly prints with high detail.';

    const feature3Title = settings?.feature3Title || 'Bio-Washed & Pre-Shrunk';
    const feature3Desc = settings?.feature3Desc || 'Ultra-soft fabric feel with zero color fading or shrinkage.';

    const feature4Title = settings?.feature4Title || 'Custom Apparel & Bulk Orders';
    const feature4Desc = settings?.feature4Desc || 'Bespoke oversized fits, custom embroidery, and corporate branding.';

    return (
        <section id="about" className="py-12 sm:py-20 bg-white border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
                    {/* Left side: Images collage */}
                    <div className="relative">
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            <img
                                src={image1}
                                alt="Custom T-Shirt Printing"
                                className="rounded-2xl shadow-lg w-full h-40 sm:h-64 object-cover transform hover:scale-105 transition-transform duration-300"
                            />
                            <img
                                src={image2}
                                alt="Custom Hoodies & Apparel"
                                className="rounded-2xl shadow-lg w-full h-40 sm:h-64 object-cover mt-4 sm:mt-8 transform hover:scale-105 transition-transform duration-300"
                            />
                        </div>
                        <div className="absolute -bottom-4 -left-4 sm:-bottom-6 sm:-left-6 bg-indigo-600 text-white p-4 sm:p-6 rounded-2xl shadow-xl hidden sm:block">
                            <div className="text-2xl sm:text-3xl font-extrabold">100%</div>
                            <div className="text-xs sm:text-sm font-medium text-indigo-100">Super Combed Cotton</div>
                        </div>
                    </div>

                    {/* Right side: Content */}
                    <div className="space-y-4 sm:space-y-6">
                        <div>
                            <span className="text-sm text-indigo-600 font-bold uppercase tracking-wider">{subtitle}</span>
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 mt-2">
                                {title}
                            </h2>
                        </div>

                        <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
                            {description}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2">
                            <div className="flex items-start gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <Award className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 shrink-0 mt-1" />
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm sm:text-base">{feature1Title}</h4>
                                    <p className="text-xs text-gray-500 mt-1">{feature1Desc}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 shrink-0 mt-1" />
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm sm:text-base">{feature2Title}</h4>
                                    <p className="text-xs text-gray-500 mt-1">{feature2Desc}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 shrink-0 mt-1" />
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm sm:text-base">{feature3Title}</h4>
                                    <p className="text-xs text-gray-500 mt-1">{feature3Desc}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <HeartHandshake className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 shrink-0 mt-1" />
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm sm:text-base">{feature4Title}</h4>
                                    <p className="text-xs text-gray-500 mt-1">{feature4Desc}</p>
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
