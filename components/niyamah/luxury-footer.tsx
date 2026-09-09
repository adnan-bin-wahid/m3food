"use client";

import Link from "./reference-link";
import { ShieldCheck, Truck, RotateCcw, Heart } from "lucide-react";

export function LuxuryFooter({ onManageTracking }: { onManageTracking?: () => void } = {}) {
  return (
    <footer className="relative w-full bg-[#08110c] text-[#f8f1e3] pt-20 pb-12 border-t border-[#c9a24d]/20 overflow-hidden">
      <div className="w-full max-w-[1720px] mx-auto px-6 sm:px-12 md:px-16 lg:px-24 xl:px-28 2xl:px-32">
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 pb-16 border-b border-white/10">
          {/* Brand Manifesto (5 cols) */}
          <div className="lg:col-span-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full border border-[#c9a24d] flex items-center justify-center bg-[#c9a24d]/15 text-[#c9a24d] font-serif font-bold text-base">
                N
              </div>
              <span className="font-serif text-xl font-medium tracking-tight text-[#f8f1e3]">
                NIYAMAH ATTIRES
              </span>
            </div>
            <p className="mt-4 text-xs font-mono tracking-[0.2em] text-[#c9a24d] uppercase">
              নিয়ামাহ্ আতায়ারস • Dhaka, Bangladesh
            </p>
            <p className="mt-4 text-sm text-[#f8f1e3]/70 leading-relaxed max-w-md">
              মার্জিত রূপ, বিশুদ্ধ সুবাস ও আধ্যাত্মিক মর্যাদার এক অনন্য ডিজিটাল আটেলিয়ার। আমাদের লক্ষ্য নারীদের শালীন পোশাক ও প্রিমিয়াম লাইফস্টাইলে এনে দেওয়া অবারিত প্রশান্তি ও আভিজাত্য।
            </p>
            <div className="mt-6 flex items-center gap-3 text-xs text-[#f8f1e3]/80">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>সারা বাংলাদেশে ক্যাশ অন ডেলিভারি চালু আছে</span>
            </div>
          </div>

          {/* Quick Links (3 cols) */}
          <div className="lg:col-span-3">
            <p className="text-xs font-mono font-semibold uppercase tracking-[0.2em] text-[#c9a24d] mb-4">
              কালেকশন • Collections
            </p>
            <ul className="space-y-2.5 text-xs text-[#f8f1e3]/75">
              <li>
                <a href="#fabric-guide" className="hover:text-[#c9a24d] transition-colors">
                  মদিনা সিল্ক ওড়না • Medina Silk
                </a>
              </li>
              <li>
                <a href="#fragrance-notes" className="hover:text-[#c9a24d] transition-colors">
                  খাঁটি আতর ভল্ট • The Attar Vault
                </a>
              </li>
              <li>
                <a href="#collections" className="hover:text-[#c9a24d] transition-colors">
                  তাজবীদ কুরআন শরিফ • Sacred Quran
                </a>
              </li>
              <li>
                <a href="#collections" className="hover:text-[#c9a24d] transition-colors">
                  রয়েল গিফট বক্স • Islamic Gift Sets
                </a>
              </li>
              <li>
                <a href="#collections" className="hover:text-[#c9a24d] transition-colors">
                  জায়নামাজ ও তাসবিহ • Daily Prayer
                </a>
              </li>
            </ul>
          </div>

          {/* Customer Care & Policies (4 cols) */}
          <div className="lg:col-span-4">
            <p className="text-xs font-mono font-semibold uppercase tracking-[0.2em] text-[#c9a24d] mb-4">
              গ্রাহক সেবা ও সহায়তা • Customer Care
            </p>
            <ul className="space-y-2.5 text-xs text-[#f8f1e3]/75">
              <li>হটলাইন: ০৯৬১৩-২৪০২৪০ (সকাল ৯টা – রাত ১১টা)</li>
              <li>WhatsApp সহায়তা: +৮৮ ০৯৬১৩-২৪০২৪০</li>
              <li>ডেলিভারি: ঢাকার ভেতরে ১–২ দিন, বাইরে ২–৩ দিন</li>
              <li>পেমেন্ট: পণ্য হাতে পেয়ে ক্যাশ অন ডেলিভারি (COD)</li>
              <li>
                <a href="/privacy" className="hover:text-[#c9a24d] underline underline-offset-4">
                  গোপনীয়তা ও রিটার্ন পলিসি • Privacy & Return Policy
                </a>
              </li>
              {onManageTracking ? (
                <li>
                  <button
                    type="button"
                    onClick={onManageTracking}
                    className="hover:text-[#c9a24d] underline underline-offset-4 text-left text-xs text-[#f8f1e3]/60 cursor-pointer"
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
            <Heart className="h-3 w-3 text-red-400 fill-current mx-0.5" />
            <span>for Modest Dignity in Bangladesh</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
