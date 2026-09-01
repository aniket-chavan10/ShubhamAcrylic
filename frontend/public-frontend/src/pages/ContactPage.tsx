// src/pages/ContactPage.tsx
import EnquiryForm from '../components/EnquiryForm';
import { MapPin } from 'lucide-react';

const COLORS = {
  blue: '#2690bc',
  orange: '#d68835',
  teal: '#36b2a5',
  magenta: '#a83a7f',
};

const ContactPage = () => {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero */}
      <section className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-[1.4fr_1fr] items-center">
            <div>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.24em] mb-2"
                style={{ color: COLORS.teal }}
              >
                Contact us
              </p>
              <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-3">
                Let&apos;s plan your next acrylic project.
              </h1>
              <p className="text-sm md:text-base text-slate-600 leading-relaxed">
                Share your drawings, sizes or basic idea and the team will help you
                choose the right sinks, shutters, dots and drawer fronts for your
                space.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-900 text-slate-50 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full"
                  style={{ backgroundColor: COLORS.magenta }}
                >
                  <MapPin size={18} className="text-white" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em]">
                    Visit our store
                  </p>
                  <p className="text-sm text-slate-200">
                    Your store name, street address, city, state, PIN
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-300">
                Store hours: Mon–Sat, 9:00 AM – 6:00 PM  
                Call for appointments on large projects or site visits.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Form + Map */}
      <section className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] items-start">
          {/* Reuse your existing form */}
          <div className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm">
            <EnquiryForm />
          </div>

          {/* Map + contact info */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">
                Our location
              </h2>
              <p className="mb-3 text-sm text-slate-600">
                Customers and partners can visit our display studio and discuss finishes,
                sizing and installation details with our team.
              </p>

              {/* Replace src with your own Google Maps embed URL */}
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <iframe
                  title="Creative Finishes store location"
                  src="https://www.google.com/maps/embed?pb=YOUR_EMBED_CODE_HERE"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  style={{ border: 0, width: '100%', height: '260px' }}
                  allowFullScreen
                />
              </div>

              <div className="mt-3 text-xs text-slate-500">
                Paste your own Google Maps embed URL in the <code>src</code> above from
                Google Maps &gt; Share &gt; Embed a map. [web:124][web:130]
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default ContactPage;
