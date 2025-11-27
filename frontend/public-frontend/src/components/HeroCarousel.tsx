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
            <div className="bg-gray-200 h-64 md:h-96 flex items-center justify-center text-gray-500">
                <p>Welcome to Shubham Acrylic</p>
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
                className="shadow-xl"
            >
                {banners.map((banner) => (
                    <div key={banner._id} className="relative h-64 md:h-[500px]">
                        <img
                            src={banner.imageUrl}
                            alt={banner.title}
                            className="w-full h-full object-cover"
                        />
                        {(banner.title || banner.subtitle) && (
                            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                                <div className="text-center text-white px-4">
                                    {banner.title && (
                                        <h2 className="text-3xl md:text-5xl font-bold mb-4 drop-shadow-lg">
                                            {banner.title}
                                        </h2>
                                    )}
                                    {banner.subtitle && (
                                        <p className="text-lg md:text-2xl mb-8 drop-shadow-md">
                                            {banner.subtitle}
                                        </p>
                                    )}
                                    {banner.link && (
                                        <a
                                            href={banner.link}
                                            className="inline-block bg-yellow-500 text-black font-bold py-3 px-8 rounded-full hover:bg-yellow-400 transition transform hover:scale-105"
                                        >
                                            Explore Now
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </Carousel>
        </div>
    );
};

export default HeroCarousel;
