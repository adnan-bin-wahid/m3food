"use client";

import { useState } from "react";
import { Menu, X, Phone, ShoppingBag } from "lucide-react";
import Link from "./reference-link";

const NAV_LINKS = [
  { href: "#top", labelBn: "হোম", labelEn: "Home" },
  { href: "#story", labelBn: "আমাদের দর্শন", labelEn: "Story" },
  { href: "#collections", labelBn: "কালেকশন", labelEn: "Collections" },
  { href: "#fabric-guide", labelBn: "সিল্ক ওড়না", labelEn: "Hijab" },
  { href: "#fragrance-notes", labelBn: "আতর ভল্ট", labelEn: "Attar" },
  { href: "#catalog", labelBn: "পণ্য সম্ভার", labelEn: "Shop" },
  { href: "#reviews", labelBn: "রিভিউ", labelEn: "Reviews" },
  { href: "#trust", labelBn: "প্রতিশ্রুতি", labelEn: "Trust" },
];

export function LuxuryHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-[#123d2a]/95 backdrop-blur-md border-b border-[#c9a24d]/25 text-[#f8f1e3] transition-all">
      <div className="w-full max-w-[1720px] mx-auto px-6 sm:px-12 md:px-16 lg:px-24 xl:px-28 2xl:px-32 h-20 flex items-center justify-between">
        {/* Brand Identity */}
        <Link href="#top" className="flex items-center gap-3 group">
          <div className="h-10 w-10 rounded-full border border-[#c9a24d] flex items-center justify-center bg-[#c9a24d]/15 text-[#c9a24d] font-serif font-bold text-lg transition-transform group-hover:scale-105">
            N
          </div>
          <div>
            <span className="font-serif text-lg sm:text-xl font-medium tracking-tight text-[#f8f1e3] block">
              NIYAMAH ATTIRES
            </span>
            <span className="text-[10px] font-mono tracking-[0.22em] text-[#c9a24d] uppercase block">
              নিয়ামাহ্ আতায়ারস • Dhaka
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden xl:flex items-center gap-7 text-xs font-medium uppercase tracking-wider text-[#f8f1e3]/85">
          {NAV_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="hover:text-[#c9a24d] transition-colors flex flex-col items-center"
            >
              <span>{item.labelBn}</span>
              <span className="text-[9px] font-mono text-[#c9a24d]/70 -mt-0.5">{item.labelEn}</span>
            </a>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          {/* Hotline badge */}
          <a
            href="tel:09613240240"
            className="hidden md:flex items-center gap-2 text-xs font-mono text-[#f8f1e3]/85 hover:text-[#c9a24d] transition-colors border border-white/15 px-3 py-1.5 rounded-full"
          >
            <Phone className="h-3.5 w-3.5 text-[#c9a24d]" />
            <span>০৯৬১৩-২৪০২৪০</span>
          </a>

          {/* Direct CTA */}
          <a
            href="#order-section"
            className="inline-flex h-10 items-center gap-2 rounded-[2px] border border-[#c9a24d] bg-[#c9a24d] px-5 text-xs font-semibold uppercase tracking-[0.16em] text-[#123d2a] shadow-md transition-all duration-300 hover:bg-[#d9b86c] hover:scale-105"
          >
            <span>অর্ডার করুন</span>
            <ShoppingBag className="h-3.5 w-3.5" />
          </a>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden h-10 w-10 flex items-center justify-center rounded-full border border-white/20 text-[#f8f1e3]"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden w-full bg-[#0e2c1e] border-b border-[#c9a24d]/30 px-6 py-6 animate-in slide-in-from-top-2">
          <nav className="flex flex-col gap-4 text-sm font-medium">
            {NAV_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between py-2 border-b border-white/8 text-[#f8f1e3] hover:text-[#c9a24d]"
              >
                <span>{item.labelBn}</span>
                <span className="text-xs font-mono text-[#c9a24d]">{item.labelEn}</span>
              </a>
            ))}
            <div className="pt-2">
              <a
                href="tel:09613240240"
                className="flex items-center gap-2 text-xs font-mono text-[#c9a24d]"
              >
                <Phone className="h-4 w-4" />
                <span>হটলাইন: ০৯৬১৩-২৪০২৪০</span>
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
