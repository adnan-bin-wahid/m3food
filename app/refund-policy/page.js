import { LegalLayout } from '../../components/niyamah/legal-layout';
import { ShieldAlert, CheckCircle2, RotateCw, Truck, Phone } from 'lucide-react';

export const metadata = {
  title: 'রিটার্ন ও রিফান্ড পলিসি (Refund Policy) — Niyamah Attires',
  description: 'নিয়ামাহ অ্যাটায়ার্স মূল্য ফেরত, পণ্য পরিবর্তন এবং ডেলিভারির সময় চেক করার নীতিমালা।'
};

export default function RefundPolicyPage() {
  return (
    <LegalLayout
      title="রিটার্ন ও রিফান্ড পলিসি"
      subtitle="আমাদের পণ্য ডেলিভারি, মূল্য ফেরত এবং ডেলিভারির সময় চেক ও পরিবর্তনের সুনির্দিষ্ট নির্দেশিকা।"
      badge="Refund & Return Policy"
      activeTab="refund"
    >
      {/* Primary Highlight Card: Bangla Policy */}
      <section className="nlp-highlight-card">
        <div className="nlp-card-header">
          <ShieldAlert className="nlp-card-icon" style={{ color: '#e2cb9d' }} aria-hidden="true" />
          <h2>মূল্য ফেরত নীতিমালা (বাংলা)</h2>
          <span className="nlp-highlight-badge">অত্যন্ত গুরুত্বপূর্ণ</span>
        </div>
        <p style={{ fontSize: '15px', color: '#f5e6dd', marginBottom: '14px' }}>
          <strong>আসসালামু আলাইকুম,</strong>
        </p>
        <ul className="nlp-list">
          <li style={{ fontSize: '15px', fontWeight: 600 }}>
            ভালো করে চেক ও নিশ্চিত হয়ে অর্ডার কনফার্ম করবেন।
          </li>
          <li style={{ fontSize: '15px', fontWeight: 600 }}>
            অর্ডার কনফার্ম হওয়ার পর অনাকাঙ্ক্ষিতভাবে ক্যান্সেল করা যাবে না।
          </li>
          <li style={{ fontSize: '15px', fontWeight: 600, color: '#f3dfd2' }}>
            ডেলিভারির সময় কুরিয়ার প্রতিনিধির উপস্থিতিতে অবশ্যই প্যাকেজটি ভালো করে চেক করে নিবেন প্লিজ।
          </li>
          <li style={{ fontSize: '15px', fontWeight: 600, color: '#e2cb9d' }}>
            ডেলিভারির সময় চেক করে কোনো অসুবিধা বা ত্রুটি পাওয়া গেলে আমরা অবশ্যই চেঞ্জ করে দিবো ইনশাআল্লাহ।
          </li>
        </ul>
      </section>

      {/* English Policy Section */}
      <section className="nlp-card">
        <div className="nlp-card-header">
          <RotateCw className="nlp-card-icon" aria-hidden="true" />
          <h2>Money Refund Policy (English)</h2>
        </div>
        <p style={{ fontStyle: 'italic', marginBottom: '12px' }}>
          <strong>Assalamu Alaikum,</strong>
        </p>
        <ul className="nlp-list">
          <li>Check and carefully confirm the order before placing it.</li>
          <li>Orders cannot be canceled once confirmed and dispatched.</li>
          <li>Please inspect the package at the time of delivery before the delivery personnel leaves.</li>
          <li>If there is any issue or defect found upon delivery inspection, we will definitely replace/change it Insha Allah.</li>
        </ul>
      </section>

      {/* Cash on Delivery (COD) Assurance */}
      <section className="nlp-card">
        <div className="nlp-card-header">
          <Truck className="nlp-card-icon" aria-hidden="true" />
          <h2>ক্যাশ অন ডেলিভারি (COD) সুবিধা</h2>
        </div>
        <p>
          নিয়ামাহ দিচ্ছে ঘরে বসেই যেকোনো পণ্য পছন্দের সুযোগ। কোনো প্রকার অগ্রিম পেমেন্ট ছাড়াই সারা বাংলাদেশে ক্যাশ অন ডেলিভারিতে অর্ডার গ্রহণ করা হয়। পণ্য সরাসরি হাতে পেয়ে দেখে মূল্য পরিশোধ করুন।
        </p>
      </section>

      {/* Step by Step Exchange Process */}
      <section className="nlp-card">
        <div className="nlp-card-header">
          <CheckCircle2 className="nlp-card-icon" aria-hidden="true" />
          <h2>পণ্য পরিবর্তন ও সমস্যা সমাধানের ধাপসমূহ</h2>
        </div>
        <ul className="nlp-list">
          <li>
            <strong>১. ডেলিভারির মুহূর্তে যাচাই:</strong> ডেলিভারিম্যান উপস্থিত থাকা অবস্থায় পার্সেল খুলে সঠিক পণ্য ও অক্ষত অবস্থা দেখে নিন।
          </li>
          <li>
            <strong>২. তাৎক্ষণিক রিপোর্ট:</strong> কোনো ত্রুটি বা অমিল থাকলে ডেলিভারিম্যানকে বিদায় না দিয়ে সরাসরি আমাদের অফিসিয়াল নাম্বারে কল করুন: <strong>+880 1760-982072</strong>।
          </li>
          <li>
            <strong>৩. দ্রুত রিপ্লেসমেন্ট:</strong> তাৎক্ষণিক অভিযোগ নিশ্চিত হলে দ্রুততম সময়ের মধ্যে রিপ্লেসমেন্ট পার্সেল কুরিয়ারে প্রেরণ করা হবে।
          </li>
        </ul>
      </section>

      {/* Direct Contact Card */}
      <section className="nlp-card">
        <div className="nlp-card-header">
          <Phone className="nlp-card-icon" aria-hidden="true" />
          <h2>যোগাযোগ ও অভিযোগ কেন্দ্র</h2>
        </div>
        <p>রিফান্ড বা পরিবর্তন সম্পর্কিত যেকোনো অনুসন্ধানে সরাসরি যোগাযোগ করুন:</p>
        <ul className="nlp-list">
          <li><strong>হটলাইন:</strong> +880 1760-982072 (প্রতিদিন সকাল ৯টা – রাত ৯টা)</li>
          <li><strong>WhatsApp:</strong> +880 1760-982072</li>
          <li><strong>অফিস ঠিকানা:</strong> ঢাকা, বাংলাদেশ</li>
        </ul>
      </section>
    </LegalLayout>
  );
}
