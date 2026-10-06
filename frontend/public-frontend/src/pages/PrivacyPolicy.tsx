import LegalPage from './LegalPage';
import { useSiteSettings } from '../context/SiteSettingsContext';

const PrivacyPolicy = () => {
  const { settings } = useSiteSettings();
  const brand = settings?.companyName || 'Astitva Creations';
  return (
    <LegalPage eyebrow="Legal" title="Privacy policy" intro={`How ${brand} collects and uses your information when you browse, enquire or order on this website.`}>
      <div>
        <h2>What we collect</h2>
        <ul>
          <li>Order details: your name, mobile number, email address and delivery address.</li>
          <li>The artwork and text you upload in the design studio, and the preview images of your design.</li>
          <li>Enquiry and review details you submit through our forms.</li>
          <li>Basic technical information such as your IP address, used to prevent spam and abuse.</li>
        </ul>
      </div>
      <div>
        <h2>Email verification</h2>
        <p>Before an order is placed we send a one-time code to your email address. This confirms the order is genuine and protects us and our customers from fake requests. The code is valid for a short time and is not used for anything else.</p>
      </div>
      <div>
        <h2>How we use it</h2>
        <ul>
          <li>To print, pack and deliver your order and to contact you about it (including on WhatsApp if you message us).</li>
          <li>To reply to enquiries and prepare quotes.</li>
          <li>To keep records required for invoicing and accounting.</li>
        </ul>
        <p className="mt-3">We do not sell or rent your personal information. Your artwork is used only to produce your order.</p>
      </div>
      <div>
        <h2>Your choices</h2>
        <p>To update or delete your information, contact us{settings?.email ? <> at <a className="font-semibold text-ink underline" href={`mailto:${settings.email}`}>{settings.email}</a></> : ' using the details on our contact page'}.</p>
      </div>
    </LegalPage>
  );
};

export default PrivacyPolicy;
