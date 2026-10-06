import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { useSiteSettings } from '../context/SiteSettingsContext';

const links = [
    { to: '/', label: 'Home' },
    { to: '/shop', label: 'Shop' },
    { to: '/customize', label: 'Design Studio' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
];

export function BrandMark({ light = false }: { light?: boolean }) {
    const { settings, getLogoUrl } = useSiteSettings();
    const companyName = settings?.companyName || 'Astitva Creations';
    const logoUrl = getLogoUrl();
    return (
        <span className="flex items-center gap-2.5">
            {logoUrl ? (
                <img src={logoUrl} alt="" className={`h-9 w-9 rounded-xl object-contain ${light ? 'bg-white p-0.5' : ''}`} />
            ) : (
                <span className={`grid h-9 w-9 place-items-center rounded-xl font-display text-lg font-extrabold ${light ? 'bg-white text-ink' : 'bg-ink text-white'}`}>
                    {companyName.charAt(0)}
                </span>
            )}
            <span className={`font-display text-lg font-extrabold uppercase leading-none tracking-tight ${light ? 'text-white' : 'text-ink'}`}>
                {companyName}
            </span>
        </span>
    );
}

const Navbar = () => {
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();

    useEffect(() => setOpen(false), [location.pathname]);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled || open ? 'border-b border-line bg-paper/90 backdrop-blur-xl' : 'bg-paper'}`}>
            <div className="container-x flex h-16 items-center justify-between sm:h-[72px]">
                <Link to="/" aria-label="Home"><BrandMark /></Link>

                <nav className="hidden items-center gap-1 md:flex">
                    {links.map(l => (
                        <NavLink
                            key={l.to}
                            to={l.to}
                            end={l.to === '/'}
                            className={({ isActive }) =>
                                `rounded-full px-4 py-2 text-sm font-medium transition ${isActive ? 'bg-ink/[0.06] text-ink' : 'text-muted hover:text-ink'}`}
                        >
                            {l.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="flex items-center gap-2">
                    <Link to="/customize" className="btn-primary hidden px-5 py-2.5 sm:inline-flex">
                        Design yours <ArrowUpRight className="h-4 w-4" />
                    </Link>
                    <button
                        className="grid h-10 w-10 place-items-center rounded-full hover:bg-ink/5 md:hidden"
                        onClick={() => setOpen(o => !o)}
                        aria-label={open ? 'Close menu' : 'Open menu'}
                        aria-expanded={open}
                    >
                        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>
            </div>

            {open && (
                <nav className="container-x animate-fade-up pb-6 md:hidden">
                    <ul className="divide-y divide-line border-y border-line">
                        {links.map(l => (
                            <li key={l.to}>
                                <NavLink to={l.to} end={l.to === '/'} className={({ isActive }) => `flex items-center justify-between py-4 font-display text-2xl font-bold ${isActive ? 'text-accent' : 'text-ink'}`}>
                                    {l.label} <ArrowUpRight className="h-5 w-5" />
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                    <Link to="/customize" className="btn-accent mt-5 w-full">Start designing</Link>
                </nav>
            )}
        </header>
    );
};

export default Navbar;
