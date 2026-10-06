import { Link } from 'react-router-dom';
import { ArrowRight, Droplets, Layers, Sparkles, Users } from 'lucide-react';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { getImageUrl } from '../utils/imageUtils';
import MockupImage from '../customizer/MockupImage';

const AboutPage = () => {
  const { settings } = useSiteSettings();
  const brand = settings?.companyName || 'Astitva Creations';
  const features = [
    { icon: Layers, title: settings?.feature1Title, text: settings?.feature1Desc },
    { icon: Droplets, title: settings?.feature2Title, text: settings?.feature2Desc },
    { icon: Sparkles, title: settings?.feature3Title, text: settings?.feature3Desc },
    { icon: Users, title: settings?.feature4Title, text: settings?.feature4Desc },
  ].filter(f => f.title);

  return (
    <>
      <section className="container-x grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-2">
        <div>
          <p className="eyebrow">{settings?.aboutSubtitle || 'Our story'}</p>
          <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl">
            {settings?.aboutTitle || 'Crafting premium custom apparel.'}
          </h1>
          <p className="mt-6 max-w-xl whitespace-pre-line text-lg leading-relaxed text-muted">
            {settings?.aboutDescription || `${brand} prints custom hoodies, oversized tees and polo t-shirts for individuals, teams and brands.`}
          </p>
          <Link to="/customize" className="btn-accent mt-8 px-8 py-4">Design yours <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {settings?.aboutImage1 ? (
            <img src={getImageUrl(settings.aboutImage1)} alt="" className="aspect-[3/4] w-full rounded-3xl object-cover" />
          ) : (
            <div className="grid aspect-[3/4] place-items-center rounded-3xl bg-paper-deep p-6"><MockupImage garment={{ style: 'hoodie' }} color="#141414" className="w-full" /></div>
          )}
          {settings?.aboutImage2 ? (
            <img src={getImageUrl(settings.aboutImage2)} alt="" className="mt-12 aspect-[3/4] w-full rounded-3xl object-cover" />
          ) : (
            <div className="mt-12 grid aspect-[3/4] place-items-center rounded-3xl bg-ink p-6"><MockupImage garment={{ style: 'oversized-tee' }} color="#f3f1ea" className="w-full" /></div>
          )}
        </div>
      </section>

      {features.length > 0 && (
        <section className="bg-white py-16 sm:py-24">
          <div className="container-x">
            <p className="eyebrow">What we stand for</p>
            <div className="mt-10 grid gap-px overflow-hidden rounded-3xl bg-line sm:grid-cols-2 lg:grid-cols-4">
              {features.map(({ icon: Icon, title, text }) => (
                <div key={title} className="bg-white p-8">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent-soft text-accent"><Icon className="h-5 w-5" /></span>
                  <h3 className="mt-6 font-display text-lg font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="container-x py-16 sm:py-24">
        <div className="flex flex-col items-start justify-between gap-6 rounded-[2rem] bg-ink p-8 text-white sm:flex-row sm:items-center sm:p-12">
          <h2 className="max-w-xl font-display text-3xl font-bold sm:text-4xl">Planning merch for your team or event?</h2>
          <Link to="/contact" className="btn-ghost-light px-8 py-4">Get a quote</Link>
        </div>
      </section>
    </>
  );
};

export default AboutPage;
