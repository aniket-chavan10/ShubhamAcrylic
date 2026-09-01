// src/pages/AboutPage.tsx
import { CheckCircle2, Factory, Sparkles, Users } from 'lucide-react';

const COLORS = {
  blue: '#2690bc',
  orange: '#d68835',
  teal: '#36b2a5',
  magenta: '#a83a7f',
};

const stats = [
  { label: 'Years of experience', value: '10+' },
  { label: 'Projects delivered', value: '1200+' },
  { label: 'Cities served', value: '40+' },
  { label: 'Product variants', value: '250+' },
];

const AboutPage = () => {
  return (
    <main id="about" className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero */}
      <section className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr] items-center">
            <div>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.24em] mb-2"
                style={{ color: COLORS.teal }}
              >
                About Creative Finishes
              </p>
              <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-4">
                Acrylic surfaces that transform everyday spaces.
              </h1>
              <p className="text-sm md:text-base text-slate-600 leading-relaxed mb-4">
                Creative Finishes specializes in premium acrylic sinks, shutters, dots and
                drawer fronts that bring a modern, seamless look to kitchens, wardrobes and
                commercial interiors.
              </p>
              <p className="text-sm md:text-base text-slate-600 leading-relaxed">
                From first design to final installation, every product is engineered for
                clarity, durability and easy maintenance so your spaces stay stunning for
                years.
              </p>
            </div>

            <div className="grid gap-4 rounded-2xl bg-slate-900 p-5 text-slate-50">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: COLORS.magenta }}>
                  <Sparkles size={20} className="text-white" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em]">
                    What we do
                  </p>
                  <p className="text-sm text-slate-200">
                    Bespoke acrylic solutions for modular kitchens, wardrobes and retail fixtures.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: COLORS.teal }}>
                  <Factory size={20} className="text-white" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em]">
                    In‑house manufacturing
                  </p>
                  <p className="text-sm text-slate-200">
                    Controlled production and finishing for consistent gloss, color and fit.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm"
              >
                <p
                  className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
                >
                  {item.label}
                </p>
                <p
                  className="mt-2 text-2xl font-bold"
                  style={{ color: COLORS.magenta }}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & values */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr] items-start">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold text-slate-900 mb-3">
              Built on clarity, durability and detail.
            </h2>
            <p className="text-sm md:text-base text-slate-600 leading-relaxed mb-4">
              Acrylic is more than a glossy surface for us – it is a material that allows
              precise edges, seamless joints and vibrant color that does not fade easily.
            </p>
            <p className="text-sm md:text-base text-slate-600 leading-relaxed mb-4">
              Each sink, shutter and drawer front passes through strict checks for flatness,
              edge finishing and protective lamination so installers can work faster and
              homeowners get a long‑lasting finish.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-100 bg-white p-4">
                <div className="mb-2 flex items-center gap-2">
                  <CheckCircle2 size={18} style={{ color: COLORS.teal }} />
                  <p className="text-sm font-semibold text-slate-900">Quality first</p>
                </div>
                <p className="text-xs text-slate-600">
                  Premium sheets, calibrated machines and experienced finishing teams for
                  repeatable results.
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-white p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Users size={18} style={{ color: COLORS.orange }} />
                  <p className="text-sm font-semibold text-slate-900">
                    Partner mindset
                  </p>
                </div>
                <p className="text-xs text-slate-600">
                  Close collaboration with architects, studios and carpenters to match
                  exact project requirements.
                </p>
              </div>
            </div>
          </div>

          {/* Brand story card */}
          <div className="rounded-2xl border border-slate-100 bg-white/90 p-6 shadow-sm">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-2"
              style={{ color: COLORS.magenta }}
            >
              Our story
            </p>
            <p className="text-sm text-slate-700 leading-relaxed mb-3">
              Creative Finishes started as a small workshop focused on high‑gloss acrylic
              shutters for local carpenters. As demand grew, we expanded into a full
              collection of sinks, doors, dots and drawer fronts with consistent quality
              and faster lead times.
            </p>
            <p className="text-sm text-slate-700 leading-relaxed">
              Today, our products are installed in homes, showrooms and retail spaces
              across India – but the mindset is still the same: treat every order as if it
              is for our own space.
            </p>
          </div>
        </div>
      </section>

      {/* Who we work with */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-slate-900 px-6 py-8 text-slate-50 md:px-10 md:py-10">
          <div className="grid gap-8 md:grid-cols-[1.4fr_1fr] items-center">
            <div>
              <h2 className="text-xl md:text-2xl font-semibold mb-3">
                Designed for professionals and homeowners.
              </h2>
              <p className="text-sm md:text-base text-slate-200 leading-relaxed mb-3">
                Whether you are a modular kitchen brand, an interior studio or a homeowner
                planning a single renovation, our team helps you pick the right acrylic
                combinations for your layout, light and usage.
              </p>
              <p className="text-sm md:text-base text-slate-200 leading-relaxed">
                Share your drawings or rough sizes and we will suggest sink models,
                shutter finishes and dot patterns that balance aesthetics, budget and
                maintenance.
              </p>
            </div>
            <div className="space-y-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                What we can help with
              </p>
              <ul className="space-y-2 text-slate-100">
                <li>• Finish selection for kitchens, wardrobes and TV units</li>
                <li>• Custom sizes and edge profiles for acrylic shutters</li>
                <li>• Coordination with your installer or modular brand</li>
                <li>• After‑sales support for cleaning and maintenance</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default AboutPage;
