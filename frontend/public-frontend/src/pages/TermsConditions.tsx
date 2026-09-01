// src/pages/TermsConditions.tsx
const TermsConditions = () => {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold text-slate-900 mb-4">
          Terms &amp; Conditions
        </h1>
        <p className="text-sm text-slate-600 mb-6">
          These terms outline how this website and information about Creative
          Finishes products may be used.
        </p>

        <section className="space-y-4 text-sm text-slate-700 bg-white rounded-2xl border border-slate-200 p-6">
          <p>
            Product information, images and prices shown on this website are for
            general guidance only and may change based on final design, size and
            finish selection.
          </p>
          <p>
            Orders, quotations and warranties are confirmed directly with our
            team or authorised partners; they may include additional
            specifications and commercial terms not listed on this site.
          </p>
          <p>
            By using this website you agree not to misuse any content, copy our
            branding, or attempt to disrupt the operation of the site or its
            forms.
          </p>
          <p>
            For detailed commercial terms for a specific project, please contact
            our team using the enquiry form or phone number provided on the
            Contact page.
          </p>
        </section>
      </div>
    </main>
  );
};

export default TermsConditions;
