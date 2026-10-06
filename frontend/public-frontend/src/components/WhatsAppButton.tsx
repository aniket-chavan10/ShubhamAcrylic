import { waLink } from '../utils/format';

interface WhatsAppButtonProps {
    phone: string;
    message?: string;
}

const WhatsAppIcon = ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden="true">
        <path d="M16.04 3C8.86 3 3.03 8.82 3.03 15.99c0 2.29.6 4.53 1.74 6.5L3 29l6.68-1.75a12.97 12.97 0 0 0 6.36 1.62h.01c7.17 0 13-5.82 13-12.99C29.05 8.82 23.21 3 16.04 3Zm0 23.68h-.01a10.8 10.8 0 0 1-5.5-1.5l-.4-.24-3.96 1.04 1.06-3.86-.26-.4a10.74 10.74 0 0 1-1.65-5.73c0-5.96 4.85-10.8 10.82-10.8a10.8 10.8 0 0 1 10.8 10.81c0 5.96-4.85 10.8-10.9 10.8Zm5.93-8.09c-.33-.16-1.93-.95-2.23-1.06-.3-.11-.52-.16-.74.17-.22.32-.85 1.06-1.04 1.28-.19.22-.38.24-.71.08-.33-.16-1.38-.51-2.63-1.62a9.9 9.9 0 0 1-1.82-2.26c-.19-.33-.02-.5.14-.66.15-.15.33-.38.49-.57.16-.19.22-.33.33-.54.11-.22.05-.41-.03-.57-.08-.16-.74-1.78-1.01-2.44-.27-.64-.54-.55-.74-.56h-.63c-.22 0-.57.08-.87.41-.3.32-1.14 1.11-1.14 2.71s1.17 3.15 1.33 3.36c.16.22 2.3 3.5 5.57 4.91.78.34 1.39.54 1.86.69.78.25 1.49.21 2.05.13.63-.09 1.93-.79 2.2-1.55.27-.76.27-1.41.19-1.55-.08-.13-.3-.21-.63-.38Z" />
    </svg>
);

export { WhatsAppIcon };

const WhatsAppButton = ({ phone, message = 'Hi! I would like to know more about your custom apparel.' }: WhatsAppButtonProps) => (
    <a
        href={waLink(phone, message)}
        target="_blank"
        rel="noopener noreferrer"
        className="group fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-[#25D366] p-3.5 text-white shadow-lg shadow-black/20 transition hover:pr-5 sm:bottom-6 sm:right-6"
        aria-label="Chat on WhatsApp"
    >
        <WhatsAppIcon className="h-6 w-6" />
        <span className="hidden max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold transition-all duration-300 group-hover:max-w-40 sm:inline">
            Chat with us
        </span>
    </a>
);

export default WhatsAppButton;
