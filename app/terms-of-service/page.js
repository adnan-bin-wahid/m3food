import { LegalLayout } from '../../components/niyamah/legal-layout';

export const metadata = {
  title: 'শর্তাবলী ও নীতিমালা (Terms of Service) — Niyamah Attires',
  description: 'নিয়ামাহ অ্যাটায়ার্স ব্যবহারের শর্তাবলী, অর্ডার, মূল্য ও সেবামূলক নিয়মকানুন।'
};

export default function TermsOfServicePage() {
  return (
    <LegalLayout
      title="শর্তাবলী ও নীতিমালা"
      subtitle="আমাদের ওয়েবসাইট ব্যবহার, অর্ডার প্রদান ও সেবা গ্রহণের সাধারণ নিয়মাবলী ও শর্তসমূহ।"
      badge="Terms of Service"
      activeTab="terms"
    >
      {/* Introduction */}
      <section className="nlp-card">
        <div className="nlp-card-header">
          <h2>১. ভূমিকা (Introduction)</h2>
        </div>
        <p>
          Welcome to <strong>niyamah.com</strong>. It provides website features and other products and services to you when you visit or shop at niyamah.com. The terms &ldquo;We&rdquo;, &ldquo;Us&rdquo; and &ldquo;Our&rdquo; are used to refer to only Niyamah offers all information, tools, and services which are used or concerns Niyamah carrying out of business, and are publicly available at the website.
        </p>
        <p>
          By using the Site, you hereby accept these terms and conditions (including the linked information herein) and represent that you agree to comply with these terms and conditions (the &ldquo;User Agreement&rdquo;). This User Agreement is deemed effective upon your use of the Site which signifies your acceptance of these terms. If you do not agree to be bound by this User Agreement, please do not access, register with, or use this Site. This Site is owned and operated by Niyamah.
        </p>
      </section>

      {/* General Conditions */}
      <section className="nlp-card">
        <div className="nlp-card-header">
          <h2>২. সাধারণ শর্তাবলী (General Conditions)</h2>
        </div>
        <p>
          By agreeing to these Terms of Service, you represent that you are at the age of majority in your present State or Province of residence, or that you have given us your consent to allow any of your minor dependents to use this website.
        </p>
        <p>
          You may not use our products for any illegal or unauthorized purpose nor may you, in the use of the Service, violate any laws in your jurisdiction (including but not limited to copyright laws). You must not transmit any worms or viruses or any code of a destructive nature. A breach or violation of any of the Terms will result in an immediate termination of your Services.
        </p>
        <p>
          We reserve the right to refuse service to anyone for any reason at any time. You understand that your content (not including credit card information) may be transferred unencrypted across networks to adapt to technical requirements. You agree not to reproduce, duplicate, copy, sell, resell or exploit any portion of the Service without express written permission from us.
        </p>
      </section>

      {/* Privacy Reference */}
      <section className="nlp-card">
        <div className="nlp-card-header">
          <h2>৩. গোপনীয়তা নীতি (Privacy)</h2>
        </div>
        <p>
          Please review our Privacy Policy, which also governs your visit to the Site. The personal information/data provided to us by you or your use of the Site will be treated as strictly confidential, following the Privacy Policy and applicable laws and regulations of Bangladesh.
        </p>
      </section>

      {/* Business Policy & Availability */}
      <section className="nlp-card">
        <div className="nlp-card-header">
          <h2>৪. ব্যবসায়িক নীতি ও প্রাপ্যতা (Business Policy)</h2>
        </div>
        <ul className="nlp-list">
          <li>
            <strong>অনলাইন এক্সক্লুসিভ পণ্য:</strong> Products are available exclusively online through Niyamah. These products or services may have limited quantities and are subject to return or exchange only according to our Return and Replacement Policy.
          </li>
          <li>
            <strong>স্টক প্রাপ্যতা:</strong> If the product and services you have ordered are not available, Niyamah will inform you as soon as possible. Customer Care will offer similar alternatives or the option to cancel your order wholly.
          </li>
          <li>
            <strong>মূল্য পরিবর্তন:</strong> All prices are subject to change without prior notification. If any price is different from what was displayed, we will inform you before dispatching the order and you will have the option to continue with the order or cancel.
          </li>
        </ul>
      </section>

      {/* Communications */}
      <section className="nlp-card">
        <div className="nlp-card-header">
          <h2>৫. যোগাযোগ (Communications)</h2>
        </div>
        <p>
          When You use the Platform or send emails or other data, information, or communication to us, you agree and understand that You are communicating with us through electronic records and You consent to receive communications via electronic records, phone calls, SMS, or WhatsApp periodically as and when required.
        </p>
      </section>

      {/* Accuracy of Billing and Account Information */}
      <section className="nlp-card">
        <div className="nlp-card-header">
          <h2>৬. বিলিং ও অর্ডারের তথ্যের যথার্থতা (Accuracy of Billing)</h2>
        </div>
        <p>
          We reserve the right to refuse any order you place with us. We may, at our sole discretion, limit or cancel quantities purchased per person or order. If we make a change to or cancel an order, we may attempt to notify you by contacting you through the phone number or e-mail provided at the time the order was made.
        </p>
      </section>

      {/* Online Payment Rules */}
      <section className="nlp-card">
        <div className="nlp-card-header">
          <h2>৭. অনলাইন পেমেন্ট ও অফার নীতিমালা (Online Payment & Offers)</h2>
        </div>
        <ul className="nlp-list">
          <li>অনলাইন পেমেন্ট সংক্রান্ত কোনো কারিগরি সমস্যা বা ভুলের ক্ষেত্রে যাচাইপূর্বক ৫-৬ কার্যদিবসের মধ্যে সমাধান করা হবে।</li>
          <li>নির্দিষ্ট ক্যাম্পেইন ও ক্যাশব্যাক অফার শুধুমাত্র উল্লেখিত নির্ধারিত সময়সীমার মধ্যে প্রযোজ্য।</li>
          <li>ক্যাশ অন ডেলিভারি (COD) অর্ডারের ক্ষেত্রে পণ্য হাতে পেয়ে ডেলিভারিম্যানের সামনে মূল্য পরিশোধ করতে হবে।</li>
        </ul>
      </section>

      {/* Copyright & Intellectual Property */}
      <section className="nlp-card">
        <div className="nlp-card-header">
          <h2>৮. কপিরাইট ও মেধা স্বত্ব (Copyright)</h2>
        </div>
        <p>
          Unless otherwise indicated, Niyamah owns all Intellectual Property Rights to and into the Website, including, without limitation, any rights, title, and interest in and to copyright, trademarks, trade names, designs, source code, meta tags, text, content, graphics, icons, and hyperlinks. You acknowledge and agree that you shall not use, reproduce or distribute any content from the Website belonging to Niyamah without prior written authorization.
        </p>
      </section>

      {/* License to Access */}
      <section className="nlp-card">
        <div className="nlp-card-header">
          <h2>৯. ওয়েবসাইট ব্যবহারের লাইসেন্স ও আচরণবিধি (License & Conduct)</h2>
        </div>
        <p>
          We grant you a limited, revocable, and non-exclusive license to access and make personal shopping use of this Site. You agree and undertake not to perform restricted activities, including:
        </p>
        <ul className="nlp-list">
          <li>আইনবিরোধী বা অননুমোদিত কোনো উদ্দেশ্যে ওয়েবসাইট বা এর কন্টেন্ট ব্যবহার করা।</li>
          <li>অন্য কোনো ব্যক্তি বা প্রতিষ্ঠানের পরিচয় নকল করা (Impersonation)।</li>
          <li>ওয়েবসাইটের কোনো সিস্টেম, সার্ভার বা নেটওয়ার্কে ক্ষতিকর ভাইরাস বা স্ক্রিপ্ট আপলোড করার চেষ্টা করা।</li>
          <li>গণপ্রজাতন্ত্রী বাংলাদেশের প্রচলিত সাইবার ও বাণিজ্যিক আইন লঙ্ঘনকারী কোনো কার্যকলাপ করা।</li>
        </ul>
      </section>

      {/* Order Cancellation */}
      <section className="nlp-highlight-card">
        <div className="nlp-card-header">
          <h2>১০. অর্ডার বাতিলকরণ নীতিমালা (Order Cancellation)</h2>
          <span className="nlp-highlight-badge">জরুরি নোটিশ</span>
        </div>
        <p>
          অর্ডার ডেলিভারির উদ্দেশ্যে শিপমেন্ট বা কুরিয়ারে হস্তান্তর করার পূর্বে গ্রাহক আমাদের কাস্টমার কেয়ারে যোগাযোগ করে অর্ডার বাতিল করতে পারেন।
        </p>
        <p>
          ক্যাশ অন ডেলিভারি (COD) অর্ডারের ক্ষেত্রে পূর্বে কোনো অগ্রিম মূল্য গৃহীত হয় না। অগ্রিম অনলাইন পেমেন্টকৃত অর্ডারের ক্ষেত্রে অর্ডার বাতিল চূড়ান্ত হলে মূল পেমেন্ট মাধ্যমে সম্পূর্ণ টাকা রিফান্ড করা হবে।
        </p>
      </section>

      {/* Limitation of Liability */}
      <section className="nlp-card">
        <div className="nlp-card-header">
          <h2>১১. দায়বদ্ধতার সীমাবদ্ধতা (Limitation of Liability)</h2>
        </div>
        <p>
          The service and all products delivered to you through the service are provided &lsquo;as is&rsquo; and &lsquo;as available&rsquo; for your use. In no case shall Niyamah, our directors, officers, employees, or suppliers be liable for any indirect, incidental, punitive, or consequential damages arising from your use of any of the service or products.
        </p>
      </section>

      {/* Governing Law */}
      <section className="nlp-card">
        <div className="nlp-card-header">
          <h2>১২. প্রযোজ্য আইন ও বিচারিক এখতিয়ার (Governing Law)</h2>
        </div>
        <p>
          These Terms of Service and any separate agreements whereby we provide you Services shall be governed by and construed following the applicable laws governing e-commerce in Bangladesh. Any actionable legal claims or proceedings must be brought within the jurisdiction of a competent Court in Dhaka, Bangladesh.
        </p>
      </section>
    </LegalLayout>
  );
}
