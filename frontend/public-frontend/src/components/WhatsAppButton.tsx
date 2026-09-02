// src/components/WhatsAppButton.tsx

interface WhatsAppButtonProps {
  phone: string;      // e.g. "919876543210"
  message?: string;   // optional pre-filled text
}

const WhatsAppButton = ({ phone, message }: WhatsAppButtonProps) => {
  const text = message ? encodeURIComponent(message) : '';
  const href = `https://wa.me/${phone}${text ? `?text=${text}` : ''}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-8 right-8 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/30 transition-transform duration-200 hover:scale-105"
      aria-label="Chat on WhatsApp"
    >

       <img
      src="/icons/whatsapp-icon.png"
      alt="WhatsApp"
      className="h-full w-full"
    />
    </a>
  );
};

export default WhatsAppButton;
