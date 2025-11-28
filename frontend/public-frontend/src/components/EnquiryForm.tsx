import { useState } from 'react';
import { createEnquiry } from '../services/api';
import { Mail, Phone, MessageSquare, Send } from 'lucide-react';

const EnquiryForm = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        mobileNo: '',
        message: ''
    });
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
        if (!formData.mobileNo.trim()) newErrors.mobileNo = 'Mobile number is required';
        else if (!/^\d{10}$/.test(formData.mobileNo)) newErrors.mobileNo = 'Enter valid 10-digit number';
        if (!formData.message.trim()) newErrors.message = 'Message is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setStatus('loading');
        try {
            await createEnquiry(formData);
            setStatus('success');
            setFormData({ name: '', email: '', mobileNo: '', message: '' });
            setTimeout(() => setStatus('idle'), 3000);
        } catch (error) {
            setStatus('error');
            setTimeout(() => setStatus('idle'), 3000);
        }
    };

    return (
        <section id="contact" className="py-12 bg-white border-t border-gray-200">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Get in Touch</h2>
                    <p className="text-gray-600">Have questions? We'd love to hear from you.</p>
                </div>

                {status === 'success' && (
                    <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded">
                        Thank you! We'll get back to you soon.
                    </div>
                )}
                {status === 'error' && (
                    <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
                        Something went wrong. Please try again.
                    </div>
                )}

                <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl p-6 shadow-sm">
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none text-gray-900"
                                placeholder="Your name"
                            />
                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none text-gray-900"
                                placeholder="your@email.com"
                            />
                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Mobile Number</label>
                        <input
                            type="tel"
                            value={formData.mobileNo}
                            onChange={(e) => setFormData({ ...formData, mobileNo: e.target.value })}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none text-gray-900"
                            placeholder="10-digit mobile number"
                        />
                        {errors.mobileNo && <p className="text-red-500 text-xs mt-1">{errors.mobileNo}</p>}
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Message</label>
                        <textarea
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none text-gray-900"
                            placeholder="How can we help you?"
                        />
                        {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <Send size={18} />
                        {status === 'loading' ? 'Sending...' : 'Send Message'}
                    </button>
                </form>

                <div className="mt-8 grid md:grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <Phone className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-gray-900">Phone</p>
                        <p className="text-sm text-gray-600">+91 98765 43210</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <Mail className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-gray-900">Email</p>
                        <p className="text-sm text-gray-600">info@shubham.com</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <MessageSquare className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-gray-900">Support</p>
                        <p className="text-sm text-gray-600">Mon-Sat, 9AM-6PM</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default EnquiryForm;
