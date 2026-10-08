import { Link } from 'react-router-dom';
import { Facebook, Instagram, Mail, MapPin, Phone, Twitter, Youtube } from 'lucide-react';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { BrandMark } from './Navbar';

const Footer = () => {
    const { settings } = useSiteSettings();
    const companyName = settings?.companyName || 'Astitva Creations';
    const year = new Date().getFullYear();

    const socials = [
        { href: settings?.instagramUrl, icon: Instagram, label: 'Instagram' },
        { href: settings?.facebookUrl, icon: Facebook, label: 'Facebook' },
        { href: settings?.twitterUrl, icon: Twitter, label: 'X / Twitter' },
        { href: settings?.youtubeUrl, icon: Youtube, label: 'YouTube' },
    ].filter(s => s.href);

    return (
        <footer className="bg-ink text-white">
            <div className="container-x py-16 sm:py-20">
                <div className="flex flex-col gap-10 border-b border-white/10 pb-14 lg:flex-row lg:items-end lg:justify-between">
                    <h2 className="max-w-2xl font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
                        Your idea. <span className="text-accent">Our ink.</span> Worn everywhere.
                    </h2>
                    <Link to="/#quote" className="btn-accent self-start px-8 py-4 text-base lg:self-auto">Get a printing quote</Link>
                </div>

                <div className="grid gap-10 pt-14 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-4">
                        <BrandMark light />
                        <p className="max-w-xs text-sm leading-relaxed text-white/60">
                            Custom printed hoodies, oversized tees and polos — made to order with premium fabrics and long-lasting prints.
                        </p>
                        {socials.length > 0 && (
                            <div className="flex gap-2 pt-2">
                                {socials.map(({ href, icon: Icon, label }) => (
                                    <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label}
                                        className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-white/70 transition hover:border-accent hover:bg-accent hover:text-white">
                                        <Icon className="h-4 w-4" />
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <h3 className="eyebrow text-white/40">Shop</h3>
                        <ul className="mt-4 space-y-3 text-sm text-white/75">
                            <li><Link className="hover:text-accent" to="/customize/hoodie">Custom Hoodies</Link></li>
                            <li><Link className="hover:text-accent" to="/customize/oversized-tee">Oversized Tees</Link></li>
                            <li><Link className="hover:text-accent" to="/customize/polo">Polo T-Shirts</Link></li>
                            <li><Link className="hover:text-accent" to="/shop">Ready Collection</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="eyebrow text-white/40">Company</h3>
                        <ul className="mt-4 space-y-3 text-sm text-white/75">
                            <li><Link className="hover:text-accent" to="/about">About us</Link></li>
                            <li><Link className="hover:text-accent" to="/contact">Contact & bulk orders</Link></li>
                            <li><Link className="hover:text-accent" to="/privacy">Privacy policy</Link></li>
                            <li><Link className="hover:text-accent" to="/terms">Terms & conditions</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="eyebrow text-white/40">Get in touch</h3>
                        <ul className="mt-4 space-y-3 text-sm text-white/75">
                            {settings?.phone && (
                                <li><a href={`tel:${settings.phone}`} className="flex items-center gap-2.5 hover:text-accent"><Phone className="h-4 w-4 text-white/40" />{settings.phone}</a></li>
                            )}
                            {settings?.email && (
                                <li><a href={`mailto:${settings.email}`} className="flex items-center gap-2.5 break-all hover:text-accent"><Mail className="h-4 w-4 shrink-0 text-white/40" />{settings.email}</a></li>
                            )}
                            {settings?.address && (
                                <li className="flex gap-2.5"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-white/40" /><span className="whitespace-pre-line">{settings.address}</span></li>
                            )}
                        </ul>
                    </div>
                </div>
            </div>
            <div className="border-t border-white/10">
                <div className="container-x flex flex-col gap-2 py-6 text-xs text-white/40 sm:flex-row sm:justify-between">
                    <p>© {year} {companyName}. All rights reserved.</p>
                    <p>Printed with care in India.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
