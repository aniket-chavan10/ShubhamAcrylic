import { useEffect, useState } from 'react';
import { Carousel } from 'react-responsive-carousel';
import "react-responsive-carousel/lib/styles/carousel.min.css";
import api from '../services/api';

const HeroCarousel = () => {
    const [banners, setBanners] = useState<any[]>([]);

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
            <div className="relative h-96 bg-gradient-to-r from-blue-600 to-blue-800 flex items-center justify-center">
                <div className="text-center px-4">
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">Welcome to Shubham Acrylic</h1>
                    <p className="text-xl text-blue-100">Premium Acrylic Solutions</p>
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
            >
                {banners.map((banner) => (
                    <div key={banner._id} className="relative h-96 md:h-[500px]">
                        <img
                            src={banner.imageUrl}
                            alt={banner.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30 flex items-center">
                            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                                <div className="max-w-2xl">
                                    {banner.title && (
                                        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
                                            {banner.title}
                                        </h1>
                                    )}
                                    {banner.subtitle && (
                                        <p className="text-xl md:text-2xl text-gray-100 mb-8 drop-shadow-md">
                                            {banner.subtitle}
                                        </p>
                                    )}
                                    {banner.link && (
                                        <a
                                            href={banner.link}
                                            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg shadow-xl transition-all transform hover:scale-105"
                                        >
                                            Explore Products
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
