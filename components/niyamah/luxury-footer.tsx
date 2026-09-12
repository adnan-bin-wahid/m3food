"use client";

import React, { useEffect, useState } from "react";
import {
  Sparkles,
  Flower2,
  Droplets,
  Gift,
  BookOpen,
  Truck,
  ShoppingBag,
  PhoneCall,
  MessageSquare,
  Clock,
  Banknote,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import "./luxury-footer.css";

interface LuxuryFooterProps {
  onManageTracking?: () => void;
}

export function LuxuryFooter({ onManageTracking }: LuxuryFooterProps = {}) {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", checkScroll, { passive: true });
    checkScroll();
    return () => window.removeEventListener("scroll", checkScroll);
  }, []);

  const handleScrollTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (id === "top") {
      if (typeof window !== "undefined" && (window as any).__lenis) {
        (window as any).__lenis.scrollTo(0, { duration: 1.2 });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    const target = document.getElementById(id);
    if (target) {
      if (typeof window !== "undefined" && (window as any).__lenis) {
        (window as any).__lenis.scrollTo(target, { offset: -60, duration: 1.2 });
      } else {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const scrollToTop = () => {
    if (typeof window !== "undefined" && (window as any).__lenis) {
      (window as any).__lenis.scrollTo(0, { duration: 1.2 });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer className="nlf-footer" aria-label="Footer">
      <div className="nlf-shell">
        {/* Top 3-Column Grid */}
        <div className="nlf-grid">
          {/* Column 1: Brand Info */}
          <div className="nlf-col-brand">
            <a
              href="#top"
              onClick={handleScrollTo("top")}
              className="nlf-brand-logo"
              aria-label="Niyamah Attires"
            >
              <div className="nlf-brand-lockup">
                <div className="nlf-logo-badge">
                  <img
                    src="/niyamah/logo.png"
                    alt="Niyamah Attires Logo"
                    className="nlf-logo-img"
                    width={48}
                    height={48}
                  />
                </div>
                <div className="nlf-brand-names">
                  <span className="nlf-brand-title">NIYAMAH ATTIRES</span>
                  <span className="nlf-brand-subtitle">নিয়ামাহ্ আতায়ারস • Dhaka</span>
                </div>
              </div>
            </a>
            <h3 className="nlf-tagline">নিয়ামাহ আতায়ার্স • ঢাকা, বাংলাদেশ</h3>
            <p className="nlf-desc">
              মডেস্ট রূপ, বিশুদ্ধ সূচনা ও আধুনিক মর্যাদায় এক অনন্য রাজকীয় আতায়ার্স। আমাদের লক্ষ্য নারীদের শালীন পোশাক ও প্রিমিয়াম লাইফস্টাইল পণ্য ও আভিজাত্য।
            </p>
            <div className="nlf-cod-badge">
              <span className="nlf-cod-dot" aria-hidden="true" />
              <span>সারা বাংলাদেশে ক্যাশ অন ডেলিভারি (COD) চালু আছে</span>
            </div>
          </div>

          {/* Column 2: Collections */}
          <div className="nlf-col-bordered">
            <h4 className="nlf-col-title">কালেকশন • COLLECTIONS</h4>
            <ul className="nlf-links">
              <li>
                <a
                  href="#fabric-guide"
                  onClick={handleScrollTo("fabric-guide")}
                  className="nlf-link"
                >
                  <Sparkles className="nlf-item-icon" aria-hidden="true" />
                  <span>নামাজের হিজাব (Pure bexi কটন)</span>
                </a>
              </li>
              <li>
                <a
                  href="#fabric-guide"
                  onClick={handleScrollTo("fabric-guide")}
                  className="nlf-link"
                >
                  <Flower2 className="nlf-item-icon" aria-hidden="true" />
                  <span>Salat Hijab</span>
                </a>
              </li>
              <li>
                <a
                  href="#fragrance-notes"
                  onClick={handleScrollTo("fragrance-notes")}
                  className="nlf-link"
                >
                  <Droplets className="nlf-item-icon" aria-hidden="true" />
                  <span>Halal Perfume</span>
                </a>
              </li>
              <li>
                <a
                  href="#collections"
                  onClick={handleScrollTo("collections")}
                  className="nlf-link"
                >
                  <Gift className="nlf-item-icon" aria-hidden="true" />
                  <span>Tulip Gift Package</span>
                </a>
              </li>
              <li>
                <a
                  href="#catalog"
                  onClick={handleScrollTo("catalog")}
                  className="nlf-link"
                >
                  <BookOpen className="nlf-item-icon" aria-hidden="true" />
                  <span>Catalog</span>
                </a>
              </li>
              <li>
                <a
                  href="#order-section"
                  onClick={handleScrollTo("order-section")}
                  className="nlf-link"
                >
                  <Truck className="nlf-item-icon" aria-hidden="true" />
                  <span>ক্যাশ অন ডেলিভারি অর্ডার</span>
                </a>
              </li>
              <li>
                <a
                  href="#order-section"
                  onClick={handleScrollTo("order-section")}
                  className="nlf-link"
                >
                  <ShoppingBag className="nlf-item-icon" aria-hidden="true" />
                  <span>Checkout</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Care */}
          <div className="nlf-col-bordered">
            <h4 className="nlf-col-title">গ্রাহক সেবা ও সহায়তা • CUSTOMER CARE</h4>
            <ul className="nlf-care-list">
              <li className="nlf-care-item">
                <PhoneCall className="nlf-care-icon" aria-hidden="true" />
                <div className="nlf-care-content">
                  হটলাইন:{" "}
                  <a href="tel:01613240240" className="nlf-care-link">
                    ০১৬১৩-২৪০২৪০
                  </a>{" "}
                  (সকাল ৯টা – রাত ৯টা)
                </div>
              </li>
              <li className="nlf-care-item">
                <MessageSquare className="nlf-care-icon" aria-hidden="true" />
                <div className="nlf-care-content">
                  WhatsApp সহায়তা:{" "}
                  <a
                    href="https://wa.me/8801613240240"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="nlf-care-link"
                  >
                    +৮৮ ০১৬১৩-২৪০২৪০
                  </a>
                </div>
              </li>
              <li className="nlf-care-item">
                <Clock className="nlf-care-icon" aria-hidden="true" />
                <div className="nlf-care-content">
                  ডেলিভারি: ঢাকা (৩-৭ দিন), বাইরে (৩-৮ দিন)
                </div>
              </li>
              <li className="nlf-care-item">
                <Banknote className="nlf-care-icon" aria-hidden="true" />
                <div className="nlf-care-content">
                  পেমেন্ট: ক্যাশ অন ডেলিভারি (COD)
                </div>
              </li>
              <li className="nlf-care-item">
                <ShieldCheck className="nlf-care-icon" aria-hidden="true" />
                <div className="nlf-care-content">
                  <a href="/privacy" className="nlf-care-link">
                    প্রাইভেসি ও রিটার্ন পলিসি
                  </a>
                </div>
              </li>
              {onManageTracking ? (
                <li className="nlf-care-item">
                  <SlidersHorizontal className="nlf-care-icon" aria-hidden="true" />
                  <div className="nlf-care-content">
                    <button
                      type="button"
                      onClick={onManageTracking}
                      className="nlf-btn-link"
                    >
                      ট্র্যাকিং অগ্রাধিকার পরিবর্তন • Manage Tracking
                    </button>
                  </div>
                </li>
              ) : null}
            </ul>
          </div>
        </div>

        {/* Center Horizontal Divider Line with Floral Emblem */}
        <div className="nlf-divider-wrap" aria-hidden="true">
          <div className="nlf-divider-line-left" />
          <div className="nlf-emblem-badge">
            <img
              src="/niyamah/footer-divider-flower.svg"
              alt=""
              className="nlf-emblem-img"
              width={26}
              height={26}
            />
          </div>
          <div className="nlf-divider-line-right" />
        </div>

        {/* Bottom Bar */}
        <div className="nlf-bottom">
          <p className="nlf-copyright">
            © {new Date().getFullYear()} Niyamah Attires. সর্বস্বত্ব সংরক্ষিত।
          </p>
          <p className="nlf-motto">
            MODESTY &bull; BEAUTY &bull; FAITH &bull; ALWAYS WITH YOU
          </p>
          <p className="nlf-made-with">
            Made with <span className="nlf-heart">♡</span> in Bangladesh
          </p>
        </div>
      </div>

      {/* Floating Scroll to Top Button (Matches mockup 4-pointed sparkle) */}
      <button
        type="button"
        onClick={scrollToTop}
        className={`nlf-scroll-top ${showScrollTop ? "is-visible" : ""}`}
        aria-label="Scroll to top"
        title="উপরে যান"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {/* 4-pointed diamond star / sparkle matching the mockup */}
          <path d="M12 3L14.2 9.8L21 12L14.2 14.2L12 21L9.8 14.2L3 12L9.8 9.8L12 3Z" fill="currentColor" fillOpacity="0.85" />
        </svg>
      </button>
    </footer>
  );
}
