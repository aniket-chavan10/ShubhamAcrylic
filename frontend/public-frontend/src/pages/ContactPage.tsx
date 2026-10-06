import { Mail, MapPin, Phone } from 'lucide-react';
import EnquiryForm from '../components/EnquiryForm';
import { WhatsAppIcon } from '../components/WhatsAppButton';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { waLink } from '../utils/format';

const ContactPage = () => {
  const { settings } = useSiteSettings();
  const brand = settings?.companyName || 'Astitva Creations';

  const channels = [
    settings?.whatsappNumber && {
      icon: WhatsAppIcon, label: 'WhatsApp', value: 'Chat with our team',
      href: waLink(settings.whatsappNumber, `Hi ${brand}! I have a question about custom apparel.`),
    },
    settings?.phone && { icon: Phone, label: 'Call us', value: settings.phone, href: `tel:${settings.phone}` },
    settings?.email && { icon: Mail, label: 'Email', value: settings.email, href: `mailto:${settings.email}` },
  ].filter(Boolean) as { icon: React.ComponentType<{ className?: string }>; label: string; value: string; href: string }[];

  return (
    <>
      <section className="border-b border-line bg-white">
        <div className="container-x py-14 sm:py-20">
          <p className="eyebrow">Contact</p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-extrabold tracking-tight sm:text-6xl">Let's make something people want to wear.</h1>
          <p className="mt-4 max-w-xl text-muted">Questions, bulk orders or a design you need help with — send us a message and we'll get back to you.</p>
        </div>
      </section>

      <section className="container-x grid gap-10 py-14 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          {channels.map(({ icon: Icon, label, value, href }) => (
            <a key={label} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer"
              className="group flex items-center gap-4 rounded-3xl bg-white p-5 ring-1 ring-line transition hover:ring-ink">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-paper transition group-hover:bg-accent group-hover:text-white"><Icon className="h-5 w-5" /></span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold uppercase tracking-wider text-muted">{label}</span>
                <span className="block truncate font-semibold">{value}</span>
              </span>
            </a>
          ))}
          {settings?.address && (
            <div className="flex gap-4 rounded-3xl bg-white p-5 ring-1 ring-line">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-paper"><MapPin className="h-5 w-5" /></span>
              <span>
                <span className="block text-xs font-semibold uppercase tracking-wider text-muted">Visit</span>
                <span className="block whitespace-pre-line font-medium">{settings.address}</span>
              </span>
            </div>
          )}
          {settings?.googleMapsEmbed && (
            <iframe title="Map" src={settings.googleMapsEmbed} className="h-64 w-full rounded-3xl border-0 ring-1 ring-line" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          )}
        </div>
        <div className="lg:col-span-3">
          <EnquiryForm />
        </div>
      </section>
    </>
  );
};

export default ContactPage;
