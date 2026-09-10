"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, X, Phone, ShoppingBag } from "lucide-react";
import Link from "./reference-link";
import { cn } from "./utils";

const NAV_LINKS = [
  { href: "#top", labelBn: "হোম", labelEn: "Home" },
  { href: "#story", labelBn: "আমাদের বৈশিষ্ট্য", labelEn: "Story" },
  { href: "#collections", labelBn: "কালেকশন", labelEn: "Collections" },
  { href: "#fabric-guide", labelBn: "নামাজের হিজাব", labelEn: "Salat Hijab" },
  { href: "#fragrance-notes", labelBn: "পারফিউম", labelEn: "Perfume" },
  { href: "#tulip-package", labelBn: "টিউলিপ প্যাকেজ", labelEn: "Tulip Gift" },
  { href: "#craftsmanship", labelBn: "কারুশিল্প", labelEn: "Craft" },
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
          ? "bg-[#faf2f4]/95 backdrop-blur-md border-b border-[#dfc0c7]/80 shadow-[0_12px_36px_rgba(92,42,56,0.08)]"
          : "bg-[#faf2f4]/85 backdrop-blur-sm border-b border-[#ebd3d8]/60",
      )}
    >
      <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16 h-16 sm:h-20 flex items-center justify-between">
        {/* Brand Identity with Proper Logo */}
        <Link href="#top" className="flex items-center gap-2 sm:gap-3.5 group shrink-0 min-w-0">
          <div className="relative h-9 w-9 sm:h-12 sm:w-12 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shrink-0">
            <img
              src="/niyamah/logo.png"
              alt="Niyamah Attires Logo"
              className="h-full w-full object-contain filter drop-shadow-[0_2px_8px_rgba(143,77,96,0.15)]"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-serif text-[15px] sm:text-xl font-medium tracking-tight text-[#3f1c28] block leading-tight truncate">
              NIYAMAH ATTIRES
            </span>
            <span className="hidden sm:block text-[10px] font-mono tracking-[0.22em] text-[#8f4d60] uppercase font-semibold">
              নিয়ামাহ্ আতায়ারস • Dhaka
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden xl:flex items-center gap-7 2xl:gap-9 text-xs font-medium uppercase tracking-wider text-[#4a2432]/90">
          {NAV_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="hover:text-[#8f4d60] transition-colors flex flex-col items-center group py-1"
            >
              <span className="transition-colors group-hover:text-[#8f4d60] font-semibold">{item.labelBn}</span>
              <span className="text-[9px] font-mono text-[#8f4d60]/80 -mt-0.5 transition-colors group-hover:text-[#8f4d60]">
                {item.labelEn}
              </span>
            </a>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
          {/* Hotline badge */}
          <a
            href="tel:09613240240"
            className="hidden md:flex items-center gap-2 text-xs font-mono text-[#4a2432] hover:text-[#8f4d60] hover:border-[#8f4d60]/50 transition-all border border-[#dfc0c7] px-3.5 py-1.5 rounded-full bg-white/70"
          >
            <Phone className="h-3.5 w-3.5 text-[#8f4d60]" />
            <span>০৯৬১৩-২৪০২৪০</span>
          </a>

          {/* Direct CTA */}
          <a
            href="#order-section"
            className="inline-flex h-[36px] sm:h-10 items-center gap-1 sm:gap-2 rounded-full border border-[#8f4d60] bg-[#8f4d60] px-3 sm:px-6 text-[11px] sm:text-xs font-semibold uppercase tracking-wider sm:tracking-[0.16em] text-white shadow-[0_4px_20px_rgba(143,77,96,0.3)] transition-all duration-300 hover:bg-[#7a3e4f] active:scale-95 shrink-0"
          >
            <span>অর্ডার করুন</span>
            <ShoppingBag className="h-3.5 w-3.5" />
          </a>

          {/* Mobile Menu Toggle - ALWAYS VISIBLE ON MOBILE */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden h-[36px] w-[36px] sm:h-10 sm:w-10 flex items-center justify-center rounded-full border border-[#dfc0c7] bg-white/90 text-[#4a2432] transition-colors hover:border-[#8f4d60] shadow-sm shrink-0"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-4 w-4 sm:h-5 sm:w-5" /> : <Menu className="h-4 w-4 sm:h-5 sm:w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden w-full bg-[#faf2f4]/98 border-b border-[#ebd3d8] px-6 py-6 shadow-2xl animate-in slide-in-from-top-2 text-[#4a2432]">
          <nav className="flex flex-col gap-3 text-sm font-medium">
            {NAV_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between py-2.5 border-b border-[#ebd3d8]/60 text-[#4a2432] hover:text-[#8f4d60] transition-colors"
              >
                <span>{item.labelBn}</span>
                <span className="text-xs font-mono text-[#8f4d60]">{item.labelEn}</span>
              </a>
            ))}
            <div className="pt-3">
              <a
                href="tel:09613240240"
                className="flex items-center gap-2 text-xs font-mono text-[#8f4d60] py-1"
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
