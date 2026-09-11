"use client";

import { Gift, ShoppingBag, ArrowRight } from "lucide-react";
import Image from "next/image";
import { TULIP_PACKAGE_ITEMS, TULIP_TRUST_ITEMS } from "./tulip-data";
import "./tulip-showcase.css";

export function TulipShowcase() {
  const handleScrollToOrder = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("niyamah:select-product", {
          detail: {
            productSlug: "tulip-gift-package",
            sku: "NYM-GP-001",
          },
        })
      );
    }
    const target = document.getElementById("order-section");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section
      id="tulip-package"
      className="nts-section"
      aria-label="টিউলিপ গিফট প্যাকেজ"
    >
      <div className="nts-container">
        {/* ================= TOP SECTION HEADER ================= */}
        <div className="nts-header-row">
          {/* Header Left: Vertical Label + Titles */}
          <div className="nts-header-left">
            <div className="nts-vertical-badge" aria-hidden="true">
              <span>MODEST</span>
              <span>FASHION</span>
              <span>MEANINGFUL</span>
              <span>GIFTS</span>
            </div>

            <div className="nts-titles-wrap">
              <div className="nts-eyebrow">
                <span>প্রিয়জনকে ভালোবাসার শ্রেষ্ঠ হাদিয়া</span>
                <span className="nts-star">✦</span>
                <span className="nts-eyebrow-en">A MEANINGFUL GIFT FOR SOMEONE SPECIAL</span>
              </div>
              <h2 className="nts-main-title">টিউলিপ গিফট প্যাকেজ</h2>
              <h3 className="nts-sub-title">ভালোবাসা ও কৃতজ্ঞতার চিরন্তন উপহার</h3>
            </div>
          </div>

          {/* Header Right: Quote + Script Stamp */}
          <div className="nts-header-right">
            <div className="nts-quote-block">
              <div className="nts-quote-divider" />
              <div className="nts-quote-content">
                <p className="nts-quote-text">
                  প্রিয় মানুষের জন্য একটি যত্নশীল উপহার,<br />
                  যেখানে সৌন্দর্য, আরাম এবং অনুভূতির<br />
                  মেলবন্ধন।
                </p>
                <div className="nts-quote-dash" />
              </div>
            </div>

            <div className="nts-script-stamp" aria-hidden="true">
              <span className="nts-script-line">Modest</span>
              <span className="nts-script-line">Looks</span>
              <span className="nts-script-line">Brighter</span>
              <span className="nts-script-heart">♥</span>
            </div>
          </div>
        </div>

        {/* ================= 2-COLUMN MAIN GRID ================= */}
        <div className="nts-main-grid">
          {/* LEFT COLUMN: The Hero Stage Card */}
          <div className="nts-left-column">
            <div className="nts-hero-card">
              {/* 1. Top-Left Floating Badge */}
              <div className="nts-card-badge">
                <Gift size={13} className="nts-card-badge-icon" />
                <span>Ready-to-Gift</span>
              </div>

              {/* 2. Left Side Vertical Editorial Label */}
              <div className="nts-card-side-quote" aria-hidden="true">
                <span>SMALL</span>
                <span>GIFTS</span>
                <span>BRIGHTER</span>
                <span>HEARTS</span>
                <div className="nts-card-side-line" />
              </div>

              {/* 3. Center Product Bag & Stage Display */}
              <div className="nts-card-stage-center">
                <div className="nts-card-ambient-glow" />
                <div className="nts-card-bag-wrap">
                  <Image
                    src="/niyamah/tulip-showcase/combo-bag.png"
                    alt="টিউলিপ গিফট প্যাকেজ"
                    width={520}
                    height={650}
                    priority
                    unoptimized
                    className="nts-card-bag-img"
                  />
                  <div className="nts-card-pedestal-shadow" />
                </div>
              </div>

              {/* 4. Right Side Script Note */}
              <div className="nts-card-script-stamp" aria-hidden="true">
                <span className="nts-card-script-line">More</span>
                <span className="nts-card-script-line">than</span>
                <span className="nts-card-script-line">a gift</span>
                <div className="nts-card-script-dash" />
              </div>

              {/* 5. Bottom Pricing & Interactive CTA Dock */}
              <div className="nts-card-bottom-bar">
                <div className="nts-card-price-wrap">
                  <span className="nts-card-price-prefix">মাত্র</span>
                  <span className="nts-card-price-val">৳১২৫০/-</span>
                </div>

                <a
                  href="#order-section"
                  onClick={handleScrollToOrder}
                  className="nts-card-order-btn"
                  title="অর্ডার করুন - মাত্র ১২৫০ টাকা"
                >
                  <ShoppingBag size={16} />
                  <span>অর্ডার করুন</span>
                  <ArrowRight size={15} />
                </a>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Package Breakdown + Trust Badges */}
          <div className="nts-right-column">
            {/* Header: প্যাকেজে যা যা থাকছে + THOUGHTFULLY CURATED */}
            <div className="nts-package-header">
              <div className="nts-pkg-title-wrap">
                <h4 className="nts-pkg-title">প্যাকেজে যা যা থাকছে</h4>
                <div className="nts-pkg-line" />
              </div>
              <span className="nts-pkg-curated">THOUGHTFULLY CURATED</span>
            </div>

            {/* 3 Package Component Cards */}
            <div className="nts-items-stack">
              {TULIP_PACKAGE_ITEMS.map((item) => (
                <div key={item.id} className="nts-item-card">
                  <div className="nts-item-thumb">
                    <Image
                      src={item.thumb}
                      alt={item.title}
                      width={64}
                      height={64}
                      unoptimized
                    />
                  </div>
                  <div className="nts-item-body">
                    <h5 className="nts-item-title">{item.title}</h5>
                    {item.subtitle ? (
                      <p className="nts-item-sub">{item.subtitle}</p>
                    ) : null}
                  </div>
                  <div className="nts-item-badge">
                    <span>{item.badge}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom 3 Trust Badges Row */}
            <div className="nts-trust-row">
              {TULIP_TRUST_ITEMS.map((trust, idx) => (
                <div key={trust.id} className="nts-trust-item-wrap">
                  <div className="nts-trust-item">
                    <div className="nts-trust-icon-box">
                      {trust.icon === "card" && (
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="2" y="5" width="20" height="14" rx="2" />
                          <line x1="2" y1="10" x2="22" y2="10" />
                          <line x1="6" y1="15" x2="10" y2="15" />
                        </svg>
                      )}
                      {trust.icon === "truck" && (
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="1" y="3" width="15" height="13" rx="1" />
                          <polygon points="16 8 20 8 23 11 23 16 16 16 8" />
                          <circle cx="5.5" cy="18.5" r="2.5" />
                          <circle cx="18.5" cy="18.5" r="2.5" />
                        </svg>
                      )}
                      {trust.icon === "gift" && (
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 12 20 22 4 22 4 12" />
                          <rect x="2" y="7" width="20" height="5" />
                          <line x1="12" y1="22" x2="12" y2="7" />
                          <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                          <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                        </svg>
                      )}
                    </div>
                    <div className="nts-trust-texts">
                      <p className="nts-trust-title">{trust.title}</p>
                      {trust.subtitle ? (
                        <p className="nts-trust-sub">{trust.subtitle}</p>
                      ) : null}
                    </div>
                  </div>
                  {idx < TULIP_TRUST_ITEMS.length - 1 && (
                    <div className="nts-trust-divider" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ================= BOTTOM FOOTER BAR ================= */}
        <div className="nts-footer-bar">
          <div className="nts-footer-left">
            <span className="nts-footer-dash">—</span>
            <span className="nts-footer-tagline">MODEST CHOICES &nbsp; BRIGHTER TOMORROWS</span>
          </div>

          <div className="nts-footer-right">
            <span>WITH LOVE, ALWAYS</span>
            <span className="nts-footer-heart">♥</span>
          </div>
        </div>
      </div>
    </section>
  );
}
