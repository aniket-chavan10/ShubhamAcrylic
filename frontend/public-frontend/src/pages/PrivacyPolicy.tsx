// src/pages/PrivacyPolicy.tsx
const PrivacyPolicy = () => {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold text-slate-900 mb-4">
          Privacy Policy
        </h1>
        <p className="text-sm text-slate-600 mb-6">
          This page explains how Creative Finishes collects and uses basic
          enquiry details from visitors to this website.
        </p>

        <section className="space-y-4 text-sm text-slate-700 bg-white rounded-2xl border border-slate-200 p-6">
          <p>
            When you submit the enquiry form, we collect your name, email,
            mobile number and project message so that our team can respond to
            you.
          </p>
          <p>
            Your details are used only for communication related to your enquiry
            and ongoing project discussions. They are not sold or shared with
            third‑party marketing companies.
          </p>
          <p>
            Basic website analytics may be used to understand how visitors use
            the site (for example, which pages are viewed most often) so we can
            improve our content and services.
          </p>
          <p>
            If you would like your contact information to be updated or removed
            from our records, please email{' '}
            <span className="font-medium">info@shubham.com</span>.
          </p>
        </section>
      </div>
    </main>
  );
};

export default PrivacyPolicy;
