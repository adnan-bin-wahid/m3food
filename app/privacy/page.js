import Link from 'next/link';
import { CURRENT_PRIVACY_POLICY_VERSION } from '../../src/lib/privacy/consent';

export const metadata = {
  title: 'গোপনীয়তা নীতি — M3Food',
  description: 'M3Food landing page-এর তথ্য সংগ্রহ, order processing এবং analytics preference সম্পর্কিত নীতি।'
};

export default function PrivacyPage() {
  return (
    <main className="privacy-page">
      <div className="privacy-shell">
        <Link className="privacy-back" href="/">← M3Food-এ ফিরে যান</Link>
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
          <h2>২. Analytics tracking</h2>
          <p>আপনি অনুমতি দিলে একটি pseudonymous visitor ID ও session ID ব্যবহার করে page view, product view, order intent এবং checkout শুরু করার activity সংরক্ষণ করা হয়। UTM values, referrer, fbclid/gclid এবং hashed IP campaign performance বুঝতে ব্যবহৃত হতে পারে। Raw IP analytics table-এ রাখা হয় না।</p>
          <p>“শুধু প্রয়োজনীয়” বেছে নিলে behavioural analytics event পাঠানো হয় না এবং durable visitor/session tracking key সরিয়ে দেওয়া হয়। তবুও অর্ডার সম্পন্ন করার জন্য একটি অস্থায়ী server linkage তৈরি হতে পারে, যাতে order transaction ঠিকভাবে সংরক্ষিত থাকে।</p>
        </section>

        <section className="privacy-card">
          <h2>৩. Marketing communication</h2>
          <p>SMS বা WhatsApp-এ promotional update শুধু order form-এর optional consent নির্বাচন করলে পাঠানো যাবে। এই অনুমতি order fulfilment message-এর থেকে আলাদা এবং order দেওয়ার শর্ত নয়।</p>
        </section>

        <section className="privacy-card">
          <h2>৪. Third-party delivery</h2>
          <p>বর্তমান batch first-party database collection নিয়ন্ত্রণ করে। Meta, Google বা অন্য third-party marketing destination আলাদা configuration ও consent gate ছাড়া enable করা হবে না। Courier integration হলে delivery-এর জন্য প্রয়োজনীয় সীমিত তথ্য courier provider-এর সাথে share করা হতে পারে।</p>
        </section>

        <section className="privacy-card">
          <h2>৫. আপনার পছন্দ ও যোগাযোগ</h2>
          <p>Landing page footer-এর “Tracking preference পরিবর্তন” ব্যবহার করে analytics choice আবার নির্বাচন করা যাবে। তথ্য বা marketing consent সংক্রান্ত অনুরোধের জন্য <a href="mailto:m3foodchuijhal@gmail.com">m3foodchuijhal@gmail.com</a>-এ যোগাযোগ করুন।</p>
        </section>

        <footer className="privacy-footer">
          <Link href="/">Landing page-এ ফিরে preference নির্বাচন করুন</Link>
        </footer>
      </div>
    </main>
  );
}
