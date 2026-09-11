import Link from 'next/link';
import { CURRENT_PRIVACY_POLICY_VERSION } from '../../src/lib/privacy/consent';

export const metadata = {
  title: 'গোপনীয়তা নীতি — Niyamah Attires',
  description: 'Niyamah Attires landing page-এর তথ্য সংগ্রহ, order processing এবং analytics preference সম্পর্কিত নীতি।'
};

export default function PrivacyPage() {
  return (
    <main className="privacy-page">
      <div className="privacy-shell">
        <Link className="privacy-back" href="/">← Niyamah-এ ফিরে যান</Link>
        <header className="privacy-hero">
          <span>গোপনীয়তা ও তথ্য ব্যবহার</span>
          <h1>আপনার তথ্য কীভাবে<br />ব্যবহার করা হয়</h1>
          <p>নীতি সংস্করণ: {CURRENT_PRIVACY_POLICY_VERSION}</p>
        </header>

        <section className="privacy-card">
          <h2>১. অর্ডারের জন্য প্রয়োজনীয় তথ্য</h2>
          <p>অর্ডার গ্রহণ ও ডেলিভারি পরিচালনার জন্য নাম, ফোন নম্বর, ঠিকানা, জেলা, পণ্য, পরিমাণ এবং অর্ডারের সময় সংরক্ষণ করা হয়। Account তৈরি করা বাধ্যতামূলক নয়।</p>
        </section>

        <section className="privacy-card">
          <h2>২. First-party anonymous measurement</h2>
          <p>Landing page-এর performance ও conversion flow বোঝার জন্য page view, product view, section view, CTA view/click, scroll-depth milestone, add-to-cart এবং checkout activity-এর privacy-reduced first-party measurement ব্যবহার করা হয়। Optional analytics অনুমতি না থাকলে visitor ও session identity শুধু বর্তমান browser session-এর জন্য রাখা হয়; durable cross-session visitor ID তৈরি করা হয় না।</p>
          <p>এই privacy-reduced mode-এ UTM source/medium/campaign, landing page ও referrer-এর মতো campaign context রাখা হতে পারে, কিন্তু fbclid/gclid সংরক্ষণ করা হয় না। Request-এর raw IP, hashed IP বা user-agent fingerprint context first-party analytics session-এ সংরক্ষণ করা হয় না। Form field value, customer name, phone, email বা address generic interaction analytics metadata-তে পাঠানো হয় না।</p>
        </section>

        <section className="privacy-card">
          <h2>৩. Optional external analytics ও advertising</h2>
          <p>আপনি optional analytics অনুমতি দিলে durable pseudonymous visitor ID ও consented session ID ব্যবহার করা হতে পারে এবং configured Meta Pixel, Meta Conversions API, Google Analytics 4, Google Tag Manager ও Microsoft Clarity activate হতে পারে। এই mode-এ campaign delivery/attribution-এর জন্য fbclid/gclid এবং সীমিত request context ব্যবহার করা হতে পারে।</p>
          <p>Browser ও server Meta event একই event ID ব্যবহার করে duplicate conversion কমানোর চেষ্টা করে। Meta CAPI delivery-এর সময় IP address ও user agent transientভাবে ব্যবহার হতে পারে; raw IP first-party analytics table-এ সংরক্ষণ করা হয় না।</p>
          <p>Store-এ Microsoft Clarity configured থাকলে optional analytics অনুমতির পর Clarity session replay, click/scroll heatmap এবং interaction diagnostics-এর জন্য load হতে পারে। Effy-এর consented pseudonymous visitor/session ID correlation-এর জন্য ব্যবহার করা হয়; customer phone/email Clarity custom identifier হিসেবে পাঠানো হয় না। Order form explicitভাবে masked থাকে।</p>
          <p>“শুধু First-party” বেছে নিলে Meta, Google ও Clarity-এর optional browser analytics/advertising destination চালু হয় না, Meta CAPI consent-gated থাকে এবং durable consented tracking keys সরিয়ে দেওয়া হয়। Privacy-reduced first-party measurement বর্তমান session-এ চালু থাকে যাতে landing-page performance সম্পূর্ণ অদৃশ্য না হয়।</p>
        </section>

        <section className="privacy-card">
          <h2>৪. Marketing communication</h2>
          <p>Email, SMS বা WhatsApp-এ promotional update শুধু সংশ্লিষ্ট optional consent নির্বাচন করলে পাঠানো যাবে। Checkout form-এ যোগাযোগের তথ্য ও consent দেওয়া হলে order complete না হওয়া পর্যন্ত সীমিত abandoned-checkout recovery signal সংরক্ষণ করা হতে পারে। এই marketing অনুমতি order fulfilment message-এর থেকে আলাদা এবং order দেওয়ার শর্ত নয়।</p>
        </section>

        <section className="privacy-card">
          <h2>৫. Third-party delivery</h2>
          <p>Store configuration ও optional analytics/tracking choice অনুযায়ী Meta Pixel, Meta Conversions API, Google Analytics 4, Google Tag Manager এবং Microsoft Clarity ব্যবহার করা হতে পারে। Meta CAPI-তে প্রয়োজন হলে email/phone normalized ও SHA-256 hashed অবস্থায় এবং browser request context-এর সীমিত signal পাঠানো হয়। Server-only access token browser-এ প্রকাশ করা হয় না। Microsoft Clarity visual replay/heatmap-এর জন্য page interaction data process করতে পারে; order form masked থাকে। Steadfast বা অন্য configured courier integration ব্যবহার করলে delivery সম্পন্ন করার জন্য নাম, ফোন, delivery address, order reference, COD amount এবং item summary-এর মতো প্রয়োজনীয় সীমিত তথ্য courier provider-এর সাথে share করা হতে পারে। Courier API credentials server-only থাকে।</p>
        </section>

        <section className="privacy-card">
          <h2>৬. আপনার পছন্দ ও যোগাযোগ</h2>
          <p>Landing page footer-এর “Tracking preference পরিবর্তন” ব্যবহার করে optional external analytics choice আবার নির্বাচন করা যাবে। Order confirmation-এর signed “Marketing preferences” link থেকে Email, SMS ও WhatsApp consent আলাদাভাবে পরিবর্তন বা সব optional marketing থেকে unsubscribe করা যাবে। তথ্য বা marketing consent সংক্রান্ত অনুরোধের জন্য <a href="mailto:support@niyamah.com">support@niyamah.com</a> বা আমাদের হটলাইন ০৯৬১৩-২৪০২৪০-এ যোগাযোগ করুন।</p>
        </section>

        <footer className="privacy-footer">
          <Link href="/">Landing page-এ ফিরে preference নির্বাচন করুন</Link>
        </footer>
      </div>
    </main>
  );
}
