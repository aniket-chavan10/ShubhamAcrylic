import LegalPage from './LegalPage';
import { useSiteSettings } from '../context/SiteSettingsContext';

const TermsConditions = () => {
  const { settings } = useSiteSettings();
  const brand = settings?.companyName || 'Astitva Creations';
  return (
    <LegalPage eyebrow="Legal" title="Terms & conditions" intro={`Please read these terms before placing an order with ${brand}.`}>
      <div>
        <h2>Orders</h2>
        <ul>
          <li>Orders placed on the website are confirmed once our team has reviewed your design and contacted you about payment.</li>
          <li>Prices shown in the design studio are calculated from the selected garment, print placements, size and quantity. Final pricing for bulk or special requests will be confirmed by our team.</li>
          <li>We may decline or cancel an order if the artwork is unsuitable for printing or breaks these terms.</li>
        </ul>
      </div>
      <div>
        <h2>Your artwork</h2>
        <ul>
          <li>You confirm that you own, or have permission to use, every image, logo and text you upload.</li>
          <li>We will not print content that is offensive, unlawful or infringes someone else's trademark or copyright.</li>
          <li>Low-resolution images may print less sharply than they appear on screen. We will let you know if we spot a problem.</li>
        </ul>
      </div>
      <div>
        <h2>Colours & sizing</h2>
        <p>On-screen mockups are a guide. Fabric and print colours can vary slightly from what you see on your display, and print placement may vary by a small margin between sizes.</p>
      </div>
      <div>
        <h2>Returns</h2>
        <p>Because every piece is printed to order, custom items cannot be returned or exchanged unless they arrive damaged or with a printing defect. Please contact us within 48 hours of delivery with photos if there is an issue.</p>
      </div>
    </LegalPage>
  );
};

export default TermsConditions;
