import { useEffect, useState } from 'react';
import { Carousel } from 'react-responsive-carousel';
import "react-responsive-carousel/lib/styles/carousel.min.css";
import api from '../services/api';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { getImageUrl } from '../utils/imageUtils';

const HeroCarousel = () => {
    const [banners, setBanners] = useState<any[]>([]);
    const { settings } = useSiteSettings();

    const companyName = settings?.companyName || 'Astitva Creations';

    useEffect(() => {
        const loadBanners = async () => {
            try {
                const response = await api.get('/banners/public');
                setBanners(response.data);
            } catch (error) {
                console.error("Failed to load banners", error);
            }
        };
        loadBanners();
    }, []);

    if (banners.length === 0) {
        return (
            <div className="relative h-64 sm:h-80 md:h-96 bg-gradient-to-r from-indigo-700 to-indigo-900 flex items-center justify-center">
                <div className="text-center px-4">
                    <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-4">
                        Welcome to {companyName}
                    </h1>
                    <p className="text-lg sm:text-xl text-indigo-100">Bespoke Acrylic Signages, Display Stands & Custom Crafts</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative">
            <Carousel
                showArrows={true}
                showThumbs={false}
                autoPlay={true}
                infiniteLoop={true}
                showStatus={false}
                interval={5000}
                swipeable={true}
                emulateTouch={true}
            >
                {banners.map((banner) => (
                    <div key={banner.id || banner._id} className="relative h-64 sm:h-80 md:h-[500px]">
                        <img
                            src={getImageUrl(banner.imageUrl)}
                            alt={banner.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/75 to-black/30 flex items-center">
                            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-left">
                                <div className="max-w-2xl">
                                    {banner.title && (
                                        <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold text-white mb-2 sm:mb-4 drop-shadow-lg">
                                            {banner.title}
                                        </h1>
                                    )}
                                    {banner.subtitle && (
                                        <p className="text-base sm:text-xl md:text-2xl text-gray-100 mb-4 sm:mb-8 drop-shadow-md">
                                            {banner.subtitle}
                                        </p>
                                    )}
                                    {banner.link && (
                                        <a
                                            href={banner.link}
                                            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 sm:py-4 sm:px-8 rounded-lg shadow-xl transition-all transform hover:scale-105 text-sm sm:text-base"
                                        >
                                            Shop Collection
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </Carousel>
        </div>
    );
};

export default HeroCarousel;
