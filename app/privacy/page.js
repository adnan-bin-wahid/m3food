import { LegalLayout } from '../../components/niyamah/legal-layout';
import { CURRENT_PRIVACY_POLICY_VERSION } from '../../src/lib/privacy/consent';
import { Shield, Eye, Lock, Cookie, Database, Globe, Share2, HelpCircle } from 'lucide-react';

export const metadata = {
  title: 'গোপনীয়তা নীতিমালা (Privacy Policy) — Niyamah Attires',
  description: 'নিয়ামাহ অ্যাটায়ার্স গ্রাহকের তথ্যের সুরক্ষা, কুকিজ, অ্যানালিটিক্স এবং অর্ডার প্রসেসিং সম্পর্কিত বিস্তারিত নীতি।'
};

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="গোপনীয়তা নীতিমালা"
      subtitle="আপনার ব্যক্তিগত তথ্যের নিরাপত্তা ও সুরক্ষায় নিয়ামাহ অ্যাটায়ার্স সর্বদাই প্রতিশ্রুতিবদ্ধ।"
      badge="Privacy & Security Policy"
      activeTab="privacy"
    >
      {/* Intro / Who We Are */}
      <section className="nlp-card">
        <div className="nlp-card-header">
          <Globe className="nlp-card-icon" aria-hidden="true" />
          <h2>১. আমাদের পরিচিতি (Who We Are)</h2>
        </div>
        <p>
          আমাদের অফিশিয়াল ওয়েবসাইটের ঠিকানা: <strong>https://niyamahbd.com</strong> (নিয়ামাহ অ্যাটায়ার্স — ঢাকা, বাংলাদেশ)। আমাদের লক্ষ্য নারীদের শালীন পোশাক ও প্রিমিয়াম লাইফস্টাইল পণ্য পৌঁছে দেওয়া।
        </p>
        <p style={{ fontSize: '12px', color: '#d7bb8c', marginTop: '8px' }}>
          নীতি সংস্করণ: <strong>{CURRENT_PRIVACY_POLICY_VERSION}</strong>
        </p>
      </section>

      {/* Order Processing Data */}
      <section className="nlp-card">
        <div className="nlp-card-header">
          <Lock className="nlp-card-icon" aria-hidden="true" />
          <h2>২. অর্ডারের জন্য প্রয়োজনীয় তথ্য</h2>
        </div>
        <p>
          ক্যাশ অন ডেলিভারিতে অর্ডার গ্রহণ ও সফল ডেলিভারি পরিচালনার জন্য গ্রাহকের নাম, মোবাইল ফোন নম্বর, ডেলিভারি ঠিকানা, জেলা, নির্বাচিত পণ্য ও পরিমাণ সংরক্ষণ করা হয়। আমাদের সাইটে কেনাকাটার জন্য কোনো বাধ্যতামূলক ইউজার অ্যাকাউন্ট তৈরি করতে হয় না।
        </p>
      </section>

      {/* Cookies */}
      <section className="nlp-card">
        <div className="nlp-card-header">
          <Cookie className="nlp-card-icon" aria-hidden="true" />
          <h2>৩. কুকিজ ও সেশন ডেটা (Cookies)</h2>
        </div>
        <p>
          সাইট ব্যবহারকালে আপনার সুবিধার্থে এবং শপিং কার্ট ও চেকআউট সেশন সচল রাখার জন্য কুকিজ ব্যবহার করা হয়।
        </p>
        <ul className="nlp-list">
          <li><strong>অর্ডার সেশন কুকি:</strong> অর্ডার প্রক্রিয়া চলাকালীন আপনার নির্বাচিত প্যাকেজ ও ভ্যারিয়েন্ট সংরক্ষণ রাখে।</li>
          <li><strong>প্রেফারেন্স কুকি:</strong> অ্যানালিটিক্স ও ট্র্যাকিং সম্পর্কিত আপনার সম্মতি বা অসম্মতি সংরক্ষণ করে যাতে পরবর্তীতে বারবার জিজ্ঞাসা না করা হয়।</li>
          <li>আপনি চাইলে যেকোনো সময় আপনার ব্রাউজারের সেটিংস থেকে কুকিজ মুছে ফেলতে পারেন।</li>
        </ul>
      </section>

      {/* Analytics Disclosures */}
      <section className="nlp-card">
        <div className="nlp-card-header">
          <Eye className="nlp-card-icon" aria-hidden="true" />
          <h2>৪. First-party anonymous measurement</h2>
        </div>
        <p>
          ল্যান্ডিং পেজের কর্মক্ষমতা, ইউজার এক্সপেরিয়েন্স ও গতি নিশ্চিত করার জন্য পেজ ভিউ, সেকশন ভিউ, স্ক্রল ডেপথ ও বাটন ইন্টারঅ্যাকশনের privacy-reduced first-party মেজারমেন্ট ব্যবহার করা হয়।
        </p>
        <p>
          এই পদ্ধতিতে কোনো ব্যক্তিগত তথ্য (PII যেমন নাম, ফোন নম্বর, ইমেইল বা ডেলিভারি ঠিকানা) অ্যানালিটিক্সে পাঠানো হয় না এবং ফর্ম ফিল্ডের মান সম্পূর্ণ গোপন রাখা হয়।
        </p>
      </section>

      {/* Optional External Analytics */}
      <section className="nlp-card">
        <div className="nlp-card-header">
          <Share2 className="nlp-card-icon" aria-hidden="true" />
          <h2>৫. Optional external analytics ও advertising</h2>
        </div>
        <p>
          গ্রাহক যদি স্বেচ্ছায় অপশনাল অ্যানালিটিক্সে সম্মতি প্রদান করেন, তবেই কেবল Meta Pixel, Conversions API, Google Analytics এবং Microsoft Clarity সক্রিয় হতে পারে।
        </p>
        <p>
          আপনি &ldquo;শুধু First-party&rdquo; নির্বাচন করলে কোনো এক্সটার্নাল ট্র্যাকিং টুল আপনার ডেটা সংগ্রহ করবে না। অর্ডারের গোপনীয়তা এবং গ্রাহকের অধিকার এখানে সর্বোচ্চ অগ্রাধিকার পায়।
        </p>
      </section>

      {/* Marketing Communication */}
      <section className="nlp-card">
        <div className="nlp-card-header">
          <Database className="nlp-card-icon" aria-hidden="true" />
          <h2>৬. Marketing communication</h2>
        </div>
        <p>
          এসএমএস, ফোন বা হোয়াটসঅ্যাপে অফার বা প্রচারণামূলক কোনো মেসেজ শুধুমাত্র গ্রাহকের স্পষ্ট সম্মতির ভিত্তিতে পাঠানো হয়। সাধারণ অর্ডার সংক্রান্ত আপডেট (যেমন: অর্ডার নিশ্চিতকরণ ও কুরিয়ার ট্র্যাকিং) শুধুমাত্র পণ্য ডেলিভারির সুবিধার্থেই ব্যবহৃত হয়।
        </p>
      </section>

      {/* Third Party Delivery */}
      <section className="nlp-card">
        <div className="nlp-card-header">
          <Shield className="nlp-card-icon" aria-hidden="true" />
          <h2>৭. Third-party delivery</h2>
        </div>
        <p>
          পার্সেল গ্রাহকের নিকট দ্রুত ও নিরাপদে পৌঁছে দেওয়ার লক্ষ্যে অনুমোদিত কুরিয়ার সার্ভিস (যেমন Steadfast Courier) এর সাথে গ্রাহকের নাম, মোবাইল নাম্বার, ঠিকানা এবং COD অ্যামাউন্টের মতো প্রয়োজনীয় তথ্য শেয়ার করা হয়। কুরিয়ার পার্টনাররা এই তথ্য শুধুমাত্র পার্সেল বিলিকরণের কাজেই ব্যবহার করার জন্য চুক্তিবদ্ধ।
        </p>
      </section>

      {/* Embedded Content & External Links */}
      <section className="nlp-card">
        <div className="nlp-card-header">
          <HelpCircle className="nlp-card-icon" aria-hidden="true" />
          <h2>৮. অন্যান্য ওয়েবসাইটের এমবেডেড কনটেন্ট (Embedded Content)</h2>
        </div>
        <p>
          আমাদের সাইটে প্রদর্শিত কোনো ভিডিও বা সোশ্যাল মিডিয়া রিভিউ অন্য কোনো প্ল্যাটফর্ম (যেমন Facebook বা YouTube) থেকে এমবেড করা থাকতে পারে। এ ধরনের কনটেন্ট সরাসরি সংশ্লিষ্ট প্ল্যাটফর্মের প্রাইভেসি নিয়মনীতি দ্বারা পরিচালিত হয়।
        </p>
      </section>

      {/* User Rights & Preferences */}
      <section className="nlp-card">
        <div className="nlp-card-header">
          <Lock className="nlp-card-icon" aria-hidden="true" />
          <h2>৯. আপনার অধিকার ও যোগাযোগ (What Rights You Have)</h2>
        </div>
        <p>
          আমাদের কাছে সংরক্ষিত আপনার অর্ডারের তথ্য সংশোধন বা মুছে ফেলার অনুরোধের জন্য গ্রাহক যেকোনো সময় আমাদের অফিসিয়াল হটলাইন <strong>+880 1760-982072</strong> অথবা ইমেইলে যোগাযোগ করতে পারেন।
        </p>
        <p>
          ল্যান্ডিং পেজের ফুটার থেকে <strong>&ldquo;ট্র্যাকিং অগ্রাধিকার পরিবর্তন • Manage Tracking&rdquo;</strong> অপশনে ক্লিক করে যেকোনো সময় আপনার কুকি সেটিংস আপডেট করতে পারবেন।
        </p>
      </section>
    </LegalLayout>
  );
}
