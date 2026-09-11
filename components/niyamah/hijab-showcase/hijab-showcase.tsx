"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { HIJAB_VARIATIONS } from "./hijab-data";
import "./hijab-showcase.css";

export function HijabShowcase() {
  const [selectedId, setSelectedId] = useState<string>("white-pink-floral");

  const currentIndex = HIJAB_VARIATIONS.findIndex((v) => v.id === selectedId);
  const activeIndex = currentIndex >= 0 ? currentIndex : 0;
  const currentItem = HIJAB_VARIATIONS[activeIndex]!;

  const handlePrev = () => {
    const nextIdx = (activeIndex - 1 + HIJAB_VARIATIONS.length) % HIJAB_VARIATIONS.length;
    setSelectedId(HIJAB_VARIATIONS[nextIdx]!.id);
  };

  const handleNext = () => {
    const nextIdx = (activeIndex + 1) % HIJAB_VARIATIONS.length;
    setSelectedId(HIJAB_VARIATIONS[nextIdx]!.id);
  };

  const handleOrderScroll = (e: React.MouseEvent) => {
    e.preventDefault();
    const skuMap: Record<string, string> = {
      "white-pink-floral": "NYM-SH-001",
      "royal-lavender": "NYM-SH-002",
      "rose-pink-floral": "NYM-SH-003",
      "lavender-blossom": "NYM-SH-004",
    };
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("niyamah:select-product", {
          detail: {
            productSlug: "pure-bexi-cotton-salat-hijab",
            sku: skuMap[selectedId] || "NYM-SH-001",
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
      id="fabric-guide"
      className="nhs-section"
      aria-label="নামাজের হিজাব কালেকশন"
    >
      <div className="nhs-container">
        {/* ================= TOP EYEBROW BAR ================= */}
        <div className="nhs-eyebrow-bar">
          <div className="nhs-eyebrow-left">
            <span className="nhs-eyebrow-phrase">A PEACEFUL PRAYER MOMENT</span>
            <span className="nhs-eyebrow-tagline">
              <span>—</span>
              <span>FAITH</span>
              <span>•</span>
              <span>COMFORT</span>
              <span>•</span>
              <span>MODESTY</span>
              <span>—</span>
            </span>
          </div>

          <div className="nhs-eyebrow-right">
            <span className="nhs-brand-title">NIYAMAH</span>
            <span className="nhs-brand-subtitle">ATTIRES</span>
            <div className="nhs-brand-line" />
          </div>
        </div>

        {/* ================= 2-COLUMN BALANCED MAIN GRID ================= */}
        <div className="nhs-columns-grid">
          {/* LEFT COLUMN: Main Heading + 3D Stage Card */}
          <div className="nhs-left-column">
            <div className="nhs-heading-block">
              <h2 className="nhs-main-heading-1">
                নামাজের হিজাব — Pure Bexi কটন
              </h2>
              <h3 className="nhs-main-heading-2">
                প্রতি সজদায় শান্তির স্পর্শ
              </h3>
              <p className="nhs-subheading">
                আবায়ার মধ্যে খোঁজে নিন শান্তি, স্নিগ্ধতা আর নিজের জন্য একটু বেশি ভালোবাসা ।
              </p>
            </div>

            <div className="nhs-stage-card">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentItem.id}
                  initial={{ opacity: 0.85, scale: 0.99 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0.85, scale: 0.99 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="w-full h-full relative"
                >
                  <Image
                    src={currentItem.stageImage}
                    alt={currentItem.name}
                    width={884}
                    height={764}
                    priority
                    className="nhs-stage-img"
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* RIGHT COLUMN: 3 Benefits + Variations Selector + Action Card */}
          <div className="nhs-right-column">
            {/* Top 3 Benefits Row */}
            <div className="nhs-benefits-row">
              {/* Benefit 1 */}
              <div className="nhs-benefit-item">
                <div className="nhs-benefit-icon-box">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 21v-4" />
                    <path d="M12 17c-2 0-3.5-1.2-4.5-2.8C6.5 12.5 7.5 9 12 7c4.5 2 5.5 5.5 4.5 7.2-1 1.6-2.5 2.8-4.5 2.8Z" />
                    <path d="M7.5 14.5C5.5 14.3 4 12.8 4 10.8c0-2.2 1.8-3.8 4-3.8 1 0 1.9.4 2.5 1" />
                    <path d="M16.5 14.5c2-.2 3.5-1.7 3.5-3.7 0-2.2-1.8-3.8-4-3.8-1 0-1.9.4-2.5 1" />
                  </svg>
                </div>
                <h4 className="nhs-benefit-title">
                  সেরা মানের<br />Bexi কটন
                </h4>
                <p className="nhs-benefit-desc">
                  নরম, আরামদায়ক<br />এবং দীর্ঘস্থায়ী
                </p>
              </div>

              <div className="nhs-benefit-divider" />

              {/* Benefit 2 */}
              <div className="nhs-benefit-item">
                <div className="nhs-benefit-icon-box">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2.5C8 2.5 6 5.5 6 9.5c0 4 1.5 8 3 10.5 1 1.5 2 2 3 2s2-.5 3-2c1.5-2.5 3-6.5 3-10.5 0-4-2-7-6-7Z" />
                    <path d="M9.5 9c0-1.5 1-2.5 2.5-2.5s2.5 1 2.5 2.5c0 2-1 3.5-2.5 3.5S9.5 11 9.5 9Z" />
                    <path d="M9.5 15c1.5 1 3.5 1 5 0" />
                  </svg>
                </div>
                <h4 className="nhs-benefit-title">
                  আলাদা মাথা<br />এবং চিবুক কভারেজ
                </h4>
                <p className="nhs-benefit-desc">
                  সম্পূর্ণ পর্দা,<br />অধিক আত্মবিশ্বাস
                </p>
              </div>

              <div className="nhs-benefit-divider" />

              {/* Benefit 3 */}
              <div className="nhs-benefit-item">
                <div className="nhs-benefit-icon-box">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>
                <h4 className="nhs-benefit-title">
                  পাশের চুল<br />বের হবে না
                </h4>
                <p className="nhs-benefit-desc">
                  নামাজের জন্য<br />একদম উপযুক্ত
                </p>
              </div>
            </div>

            {/* Variations Header */}
            <div className="nhs-variations-header">
              <p className="nhs-variations-title">
                আপনার পছন্দের ডিজাইনটি নির্বাচন করুন
              </p>
              <div className="nhs-variations-eyebrow">
                <span>BEAUTIFUL VARIATIONS</span>
                <span>•</span>
                <span>SAME MODESTY</span>
                <span className="nhs-variations-line" />
              </div>
            </div>

            {/* 2x2 Variations Grid */}
            <div className="nhs-variations-grid">
              {HIJAB_VARIATIONS.map((item) => {
                const isSelected = item.id === selectedId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={`nhs-variation-card ${isSelected ? "nhs-active" : ""}`}
                    aria-pressed={isSelected}
                  >
                    <div className="nhs-var-thumb">
                      <Image
                        src={item.thumb}
                        alt={item.name}
                        width={44}
                        height={44}
                      />
                    </div>
                    <div className="nhs-var-info">
                      <p className="nhs-var-name">{item.name}</p>
                      {item.subtitle ? (
                        <p className="nhs-var-sub">{item.subtitle}</p>
                      ) : null}
                    </div>
                    <div className="nhs-var-radio">
                      {isSelected ? (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Action & Order Details Card */}
            <div className="nhs-action-card">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentItem.id}
                  initial={{ opacity: 0.85, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0.85, y: -3 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="nhs-action-header">
                    <h3 className="nhs-action-title">{currentItem.name}</h3>
                    <div className="nhs-action-price">{currentItem.price}</div>
                  </div>

                  <p className="nhs-action-desc">{currentItem.description}</p>
                </motion.div>
              </AnimatePresence>

              {/* Exact Horizontal Divider matching reference */}
              <div className="nhs-action-mid-divider" />

              {/* 4 Feature Checklist Grid with Gold Icons */}
              <div className="nhs-action-features">
                {/* Feature 1 */}
                <div className="nhs-feat-item">
                  <svg
                    className="nhs-feat-icon"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                  </svg>
                  <span>নরম ও আরামদায়ক কটন</span>
                </div>

                {/* Feature 2 */}
                <div className="nhs-feat-item">
                  <svg
                    className="nhs-feat-icon"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 3h12l4 6-10 12L2 9z" />
                    <path d="M11 3 8 9l4 12 4-12-3-6" />
                    <path d="M2 9h20" />
                  </svg>
                  <span>নামাজের জন্য পারফেক্ট</span>
                </div>

                {/* Feature 3 */}
                <div className="nhs-feat-item">
                  <svg
                    className="nhs-feat-icon"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  </svg>
                  <span>১০০% অস্বচ্ছ, সম্পূর্ণ কভারেজ</span>
                </div>

                {/* Feature 4 */}
                <div className="nhs-feat-item">
                  <svg
                    className="nhs-feat-icon"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                  <span>পাশের চুলও দেখা যাবে না</span>
                </div>
              </div>

              {/* Action Bottom Row: CTA Button + Divider + Delivery Trust Badge */}
              <div className="nhs-action-bottom">
                <a
                  href="#order-section"
                  onClick={handleOrderScroll}
                  className="nhs-order-btn"
                >
                  <span>সালাত হিজাব অর্ডার করুন</span>
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </a>

                <div className="nhs-action-divider" />

                <div className="nhs-delivery-badge">
                  <svg
                    className="nhs-delivery-icon"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                  <div className="nhs-delivery-texts">
                    <p className="nhs-delivery-title">পণ্য হাতে পেয়ে দেখে নিন</p>
                    <p className="nhs-delivery-sub">তারপর পরিশোধ করুন</p>
                  </div>

                  <div className="nhs-action-watermark">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L13.5 9.5L21 11L13.5 12.5L12 20L10.5 12.5L3 11L10.5 9.5L12 2Z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= BOTTOM NAVIGATION BAR ================= */}
        <div className="nhs-bottom-bar">
          <div className="nhs-nav-left">
            <span className="nhs-nav-counter">
              01 / 04
            </span>
            <div className="nhs-nav-line" />
            <div className="nhs-nav-categories">
              <span className="nhs-nav-cat nhs-active">HIJAB</span>
              <span className="nhs-nav-cat">PERFUME</span>
              <span className="nhs-nav-cat">TOTE</span>
              <span className="nhs-nav-cat">GIFT PACKAGE</span>
            </div>
          </div>

          <div className="nhs-nav-right">
            <div className="nhs-nav-arrows">
              <button
                type="button"
                onClick={handlePrev}
                className="nhs-arrow-btn"
                aria-label="পূর্ববর্তী ডিজাইন"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="nhs-arrow-btn"
                aria-label="পরবর্তী ডিজাইন"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>

            <div className="nhs-nav-separator" />

            <div className="nhs-brand-taglines">
              <div className="nhs-tagline-item">
                <span>A SMALL CHOICE</span>
                <span className="nhs-tagline-dash" />
                <span style={{ fontSize: "11px" }}>✤</span>
              </div>
              <div className="nhs-tagline-item">
                <span>A BIGGER PEACE</span>
                <span className="nhs-tagline-dash" />
                <span style={{ fontSize: "11px" }}>✤</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
