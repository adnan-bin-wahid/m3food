"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, X, Phone, ShoppingBag } from "lucide-react";
import Link from "./reference-link";
import { cn } from "./utils";

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
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const delta = currentScrollY - lastScrollYRef.current;

        setIsScrolled(currentScrollY > 20);

        // Near top of page, always keep header visible
        if (currentScrollY <= 60) {
          setIsVisible(true);
        } else if (delta > 6 && currentScrollY > 90) {
          // Scrolling DOWN -> ease up and hide
          setIsVisible(false);
          setMobileMenuOpen(false);
        } else if (delta < -6) {
          // Scrolling UP -> ease in and reveal
          setIsVisible(true);
        }

        lastScrollYRef.current = currentScrollY;
        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 w-full transition-all duration-500 will-change-transform",
        isVisible
          ? "translate-y-0 opacity-100 ease-out"
          : "-translate-y-full opacity-0 pointer-events-none ease-in",
        isScrolled
          ? "bg-[#08110c]/96 backdrop-blur-md border-b border-[#c9a24d]/30 shadow-[0_16px_40px_rgba(0,0,0,0.6)]"
          : "bg-[#08110c]/90 backdrop-blur-sm border-b border-[#c9a24d]/20",
      )}
    >
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16 h-20 flex items-center justify-between">
        {/* Brand Identity with Proper Logo */}
        <Link href="#top" className="flex items-center gap-3.5 group shrink-0">
          <div className="relative h-12 w-12 sm:h-13 sm:w-13 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shrink-0">
            <img
              src="/niyamah/logo.png"
              alt="Niyamah Attires Logo"
              className="h-full w-full object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-lg sm:text-xl font-medium tracking-tight text-[#f8f1e3] block leading-tight">
              NIYAMAH ATTIRES
            </span>
            <span className="text-[10px] font-mono tracking-[0.22em] text-[#c9a24d] uppercase block">
              নিয়ামাহ্ আতায়ারস • Dhaka
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden xl:flex items-center gap-7 2xl:gap-9 text-xs font-medium uppercase tracking-wider text-[#f8f1e3]/85">
          {NAV_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="hover:text-[#c9a24d] transition-colors flex flex-col items-center group py-1"
            >
              <span className="transition-colors group-hover:text-[#c9a24d]">{item.labelBn}</span>
              <span className="text-[9px] font-mono text-[#c9a24d]/70 -mt-0.5 transition-colors group-hover:text-[#c9a24d]">
                {item.labelEn}
              </span>
            </a>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-4 shrink-0">
          {/* Hotline badge */}
          <a
            href="tel:09613240240"
            className="hidden md:flex items-center gap-2 text-xs font-mono text-[#f8f1e3]/90 hover:text-[#c9a24d] hover:border-[#c9a24d]/50 transition-all border border-white/15 px-3.5 py-1.5 rounded-full bg-white/[0.03]"
          >
            <Phone className="h-3.5 w-3.5 text-[#c9a24d]" />
            <span>০৯৬১৩-২৪০২৪০</span>
          </a>

          {/* Direct CTA */}
          <a
            href="#order-section"
            className="inline-flex h-10 items-center gap-2 rounded-[2px] border border-[#c9a24d] bg-[#c9a24d] px-5 sm:px-6 text-xs font-semibold uppercase tracking-[0.16em] text-[#08110c] shadow-[0_4px_20px_rgba(201,162,77,0.25)] transition-all duration-300 hover:bg-[#d9b86c] hover:scale-105 active:scale-95"
          >
            <span>অর্ডার করুন</span>
            <ShoppingBag className="h-3.5 w-3.5" />
          </a>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden h-10 w-10 flex items-center justify-center rounded-full border border-white/20 text-[#f8f1e3] transition-colors hover:border-[#c9a24d]"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden w-full bg-[#08110c]/98 border-b border-[#c9a24d]/30 px-6 py-6 shadow-2xl animate-in slide-in-from-top-2">
          <nav className="flex flex-col gap-3 text-sm font-medium">
            {NAV_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between py-2.5 border-b border-white/8 text-[#f8f1e3] hover:text-[#c9a24d] transition-colors"
              >
                <span>{item.labelBn}</span>
                <span className="text-xs font-mono text-[#c9a24d]">{item.labelEn}</span>
              </a>
            ))}
            <div className="pt-3">
              <a
                href="tel:09613240240"
                className="flex items-center gap-2 text-xs font-mono text-[#c9a24d] py-1"
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
