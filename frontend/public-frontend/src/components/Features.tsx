import { Truck, ShieldCheck, RefreshCcw, Sparkles } from 'lucide-react';

const Features = () => {
    const features = [
        { icon: <Truck size={24} />, title: "Free Shipping", desc: "On all orders over ₹999" },
        { icon: <ShieldCheck size={24} />, title: "Secure Payment", desc: "100% protected checkout" },
        { icon: <RefreshCcw size={24} />, title: "7-Day Easy Returns", desc: "Hassle-free replacement policy" },
        { icon: <Sparkles size={24} />, title: "100% Premium Cotton", desc: "Super combed & bio-washed fabric" },
    ];

    return (
        <div className="bg-white py-12 border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {features.map((feature, idx) => (
                        <div key={idx} className="flex flex-col items-center text-center p-4">
                            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-4">
                                {feature.icon}
                            </div>
                            <h3 className="font-bold text-gray-900 mb-1">{feature.title}</h3>
                            <p className="text-sm text-gray-500">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Features;
