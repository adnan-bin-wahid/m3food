"use client";

import { Heart } from "lucide-react";

export function LuxuryFooter({ onManageTracking }: { onManageTracking?: () => void } = {}) {
  const handleScroll = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <footer className="relative w-full bg-[#0c0306] text-[#f8f1e3] pt-20 pb-12 border-t border-[#d97d95]/20 overflow-hidden">
      <div className="w-full max-w-[1720px] mx-auto px-6 sm:px-12 md:px-16 lg:px-24 xl:px-28 2xl:px-32">
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 pb-16 border-b border-white/10">
          {/* Brand Manifesto (5 cols) */}
          <div className="lg:col-span-5">
            <div className="flex items-center gap-3">
              <div className="relative h-11 w-11 shrink-0">
                <img
                  src="/niyamah/logo.png"
                  alt="Niyamah Attires"
                  className="h-full w-full object-contain filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]"
                />
              </div>
              <span className="font-serif text-xl font-medium tracking-tight text-[#f8f1e3]">
                NIYAMAH ATTIRES
              </span>
            </div>
            <p className="mt-4 text-xs font-mono tracking-[0.2em] text-[#e5c875] uppercase">
              নিয়ামাহ্ আতায়ারস • ঢাকা, বাংলাদেশ
            </p>
            <p className="mt-4 text-sm text-[#f8f1e3]/75 leading-relaxed max-w-md">
              মার্জিত রূপ, বিশুদ্ধ সুবাস ও আধ্যাত্মিক মর্যাদার এক অনন্য রাজকীয় আটেলিয়ার। আমাদের লক্ষ্য নারীদের শালীন পোশাক ও প্রিমিয়াম লাইফস্টাইলে এনে দেওয়া অবারিত প্রশান্তি ও আভিজাত্য।
            </p>
            <div className="mt-6 flex items-center gap-3 text-xs text-[#f8f1e3]/85">
              <span className="h-2 w-2 rounded-full bg-[#e5c875] animate-pulse" />
              <span>সারা বাংলাদেশে ক্যাশ অন ডেলিভারি (COD) চালু আছে</span>
            </div>
          </div>

          {/* Quick Links (3 cols) */}
          <div className="lg:col-span-3">
            <p className="text-xs font-mono font-semibold uppercase tracking-[0.2em] text-[#e5c875] mb-4">
              কালেকশন • Collections
            </p>
            <ul className="space-y-2.5 text-xs text-[#f8f1e3]/75">
              <li>
                <a href="#fabric-guide" onClick={handleScroll("fabric-guide")} className="hover:text-[#e5c875] transition-colors">
                  মদিনা সিল্ক ওড়না • Medina Silk
                </a>
              </li>
              <li>
                <a href="#fragrance-notes" onClick={handleScroll("fragrance-notes")} className="hover:text-[#e5c875] transition-colors">
                  খাঁটি আতর ভল্ট • Pure Attars
                </a>
              </li>
              <li>
                <a href="#collections" onClick={handleScroll("collections")} className="hover:text-[#e5c875] transition-colors">
                  সিগনেচার কালেকশন • Collections
                </a>
              </li>
              <li>
                <a href="#catalog" onClick={handleScroll("catalog")} className="hover:text-[#e5c875] transition-colors">
                  নির্বাচিত সম্ভার • Catalog
                </a>
              </li>
              <li>
                <a href="#order-section" onClick={handleScroll("order-section")} className="hover:text-[#e5c875] transition-colors">
                  ক্যাশ অন ডেলিভারি অর্ডার • Checkout
                </a>
              </li>
            </ul>
          </div>

          {/* Customer Care & Policies (4 cols) */}
          <div className="lg:col-span-4">
            <p className="text-xs font-mono font-semibold uppercase tracking-[0.2em] text-[#e5c875] mb-4">
              গ্রাহক সেবা ও সহায়তা • Customer Care
            </p>
            <ul className="space-y-2.5 text-xs text-[#f8f1e3]/75">
              <li>হটলাইন: ০৯৬১৩-২৪০২৪০ (সকাল ৯টা – রাত ১১টা)</li>
              <li>WhatsApp সহায়তা: +৮৮ ০৯৬১৩-২৪০২৪০</li>
              <li>ডেলিভারি: ঢাকার ভেতরে ১–২ দিন, বাইরে ২–৩ দিন</li>
              <li>পেমেন্ট: পার্সেল দেখে ক্যাশ অন ডেলিভারি (COD)</li>
              <li>
                <a href="/privacy" className="hover:text-[#e5c875] underline underline-offset-4">
                  গোপনীয়তা ও রিটার্ন পলিসি • Privacy & Return Policy
                </a>
              </li>
              {onManageTracking ? (
                <li>
                  <button
                    type="button"
                    onClick={onManageTracking}
                    className="hover:text-[#e5c875] underline underline-offset-4 text-left text-xs text-[#f8f1e3]/60 cursor-pointer"
                  >
                    ট্র্যাকিং অগ্রাধিকার পরিবর্তন • Manage Tracking
                  </button>
                </li>
              ) : null}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#f8f1e3]/60">
          <p>© {new Date().getFullYear()} Niyamah Attires. সর্বস্বত্ব সংরক্ষিত।</p>
          <div className="flex items-center gap-1 text-[11px]">
            <span>Crafted with</span>
            <Heart className="h-3 w-3 text-[#d97d95] fill-current mx-0.5" />
            <span>for Modest Dignity in Bangladesh</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
