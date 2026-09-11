"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { PERFUME_VARIATIONS } from "./attar-data";
import "./attar-showcase.css";

export function AttarShowcase() {
  const [selectedId, setSelectedId] = useState<string>("orchid-bloom");

  const currentIndex = PERFUME_VARIATIONS.findIndex((v) => v.id === selectedId);
  const activeIndex = currentIndex >= 0 ? currentIndex : 0;
  const currentItem = PERFUME_VARIATIONS[activeIndex]!;

  const handlePrev = () => {
    const nextIdx = (activeIndex - 1 + PERFUME_VARIATIONS.length) % PERFUME_VARIATIONS.length;
    setSelectedId(PERFUME_VARIATIONS[nextIdx]!.id);
  };

  const handleNext = () => {
    const nextIdx = (activeIndex + 1) % PERFUME_VARIATIONS.length;
    setSelectedId(PERFUME_VARIATIONS[nextIdx]!.id);
  };

  const handleOrderScroll = (e: React.MouseEvent) => {
    e.preventDefault();
    const skuMap: Record<string, string> = {
      "orchid-bloom": "NYM-PRF-001",
      "coral-ocean": "NYM-PRF-002",
      "golden-fiesta": "NYM-PRF-003",
      "luxury-affair": "NYM-PRF-004",
    };
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("niyamah:select-product", {
          detail: {
            productSlug: "non-alcoholic-orchid-perfume",
            sku: skuMap[selectedId] || "NYM-PRF-001",
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
      id="fragrance-notes"
      className="nas-section"
      aria-label="নন আলকোহলিক পারফিউম কালেকশন"
    >
      <div className="nas-container">
        {/* ================= TOP EYEBROW BAR ================= */}
        <div className="nas-eyebrow-bar">
          <div className="nas-eyebrow-left">
            <span className="nas-eyebrow-phrase">AN ELEGANT FRAGRANCE RITUAL</span>
            <span className="nas-eyebrow-tagline">
              <span>—</span>
              <span>PURITY</span>
              <span>•</span>
              <span>ELEGANCE</span>
              <span>•</span>
              <span>TRANQUILITY</span>
              <span>—</span>
            </span>
          </div>

          <div className="nas-eyebrow-right">
            <span className="nas-brand-title">NIYAMAH</span>
            <span className="nas-brand-subtitle">ATTIRES</span>
            <div className="nas-brand-line" />
          </div>
        </div>

        {/* ================= 2-COLUMN BALANCED MAIN GRID (SWAPPED) ================= */}
        <div className="nas-columns-grid">
          {/* LEFT COLUMN: Main Heading + Variations Selector + Action Card */}
          <div className="nas-left-column">
            <div className="nas-heading-block">
              <h2 className="nas-main-heading-1">
                নন আলকোহলিক পারফিউম,
              </h2>
              <h3 className="nas-main-heading-2">
                পবিত্রতার সুবাসে মন শান্ত করার অনুভূতি
              </h3>
              <p className="nas-subheading">
                ১০০% অ্যালকোহল মুক্ত খাঁটি অর্কিড ও ওউদ নির্যাস, যা জুমার নামাজ, তাহাজ্জুদ ও দৈনন্দিন ইবাদতের প্রতিটি মুহূর্তে এনে দেয় এক পরম সুরভিত প্রশান্তি।
              </p>
            </div>

            {/* Variations Header */}
            <div className="nas-variations-header">
              <p className="nas-variations-title">
                আপনার পছন্দের সুবাসটি নির্বাচন করুন
              </p>
              <div className="nas-variations-eyebrow">
                <span>ROYAL FRAGRANCE</span>
                <span>•</span>
                <span>SACRED PURITY</span>
                <span className="nas-variations-line" />
              </div>
            </div>

            {/* 2x2 Variations Grid */}
            <div className="nas-variations-grid">
              {PERFUME_VARIATIONS.map((item) => {
                const isSelected = item.id === selectedId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={`nas-variation-card ${isSelected ? "nas-active" : ""}`}
                    aria-pressed={isSelected}
                  >
                    <div className="nas-var-thumb">
                      <Image
                        src={item.thumb}
                        alt={item.name}
                        width={44}
                        height={44}
                        unoptimized
                      />
                    </div>
                    <div className="nas-var-info">
                      <p className="nas-var-name">{item.name}</p>
                      {item.subtitle ? (
                        <p className="nas-var-sub">{item.subtitle}</p>
                      ) : null}
                    </div>
                    <div className="nas-var-radio">
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
            <div className="nas-action-card">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentItem.id}
                  initial={{ opacity: 0.85, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0.85, y: -3 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="nas-action-header">
                    <h3 className="nas-action-title">{currentItem.name}</h3>
                    <div className="nas-action-price-wrap">
                      <span className="nas-action-price">{currentItem.price}</span>
                      <span className="nas-action-orig-price">{currentItem.originalPrice}</span>
                    </div>
                  </div>

                  <p className="nas-action-desc">{currentItem.description}</p>
                </motion.div>
              </AnimatePresence>

              {/* Exact Horizontal Mid Divider */}
              <div className="nas-action-mid-divider" />

              {/* 4 Feature Checklist Grid with Gold Icons */}
              <div className="nas-action-features">
                {/* Feature 1 */}
                <div className="nas-feat-item">
                  <svg
                    className="nas-feat-icon"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                  </svg>
                  <span>১০০% অ্যালকোহল মুক্ত হালাল সুবাস</span>
                </div>

                {/* Feature 2 */}
                <div className="nas-feat-item">
                  <svg
                    className="nas-feat-icon"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>১৬+ ঘণ্টা দীর্ঘস্থায়ী মিষ্টি আবেশ</span>
                </div>

                {/* Feature 3 */}
                <div className="nas-feat-item">
                  <svg
                    className="nas-feat-icon"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2l2.4 7.2L22 10l-6 4.8 2.3 7.2L12 17.5 5.7 22l2.3-7.2L2 10l7.6-.8z" />
                  </svg>
                  <span>কাপড়ে কোনো দাগ ফেলে না</span>
                </div>

                {/* Feature 4 */}
                <div className="nas-feat-item">
                  <svg
                    className="nas-feat-icon"
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
                  <span>নামাজ ও ইবাদতে শতভাগ নিরাপদ</span>
                </div>
              </div>

              {/* Action Bottom Row: CTA Button + Divider + Delivery Trust Badge */}
              <div className="nas-action-bottom">
                <a
                  href="#order-section"
                  onClick={handleOrderScroll}
                  className="nas-order-btn"
                >
                  <span>পারফিউম অর্ডার করুন</span>
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

                <div className="nas-action-divider" />

                <div className="nas-delivery-badge">
                  <svg
                    className="nas-delivery-icon"
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
                  <div className="nas-delivery-texts">
                    <p className="nas-delivery-title">পণ্য হাতে পেয়ে দেখে নিন</p>
                    <p className="nas-delivery-sub">তারপর পরিশোধ করুন</p>
                  </div>

                  <div className="nas-action-watermark">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L13.5 9.5L21 11L13.5 12.5L12 20L10.5 12.5L3 11L10.5 9.5L12 2Z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: 3 Benefits + 3D Visual Stage Card */}
          <div className="nas-right-column">
            {/* Top 3 Benefits Row */}
            <div className="nas-benefits-row">
              {/* Benefit 1 */}
              <div className="nas-benefit-item">
                <div className="nas-benefit-icon-box">
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
                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                  </svg>
                </div>
                <h4 className="nas-benefit-title">
                  ১০০% অ্যালকোহল মুক্ত<br />সম্পূর্ণ হালাল
                </h4>
              </div>

              <div className="nas-benefit-divider" />

              {/* Benefit 2 */}
              <div className="nas-benefit-item">
                <div className="nas-benefit-icon-box">
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
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <h4 className="nas-benefit-title">
                  ১৬+ ঘণ্টা স্থায়িত্ব<br />সারাদিন মিষ্টি সুবাস
                </h4>
              </div>

              <div className="nas-benefit-divider" />

              {/* Benefit 3 */}
              <div className="nas-benefit-item">
                <div className="nas-benefit-icon-box">
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
                    <path d="M12 3l1.5 5.5L19 10l-4.5 3.5L16 19l-4-3-4 3 1.5-5.5L5 10l5.5-1.5z" />
                  </svg>
                </div>
                <h4 className="nas-benefit-title">
                  কাপড়ে দাগমুক্ত<br />পোশাকের সুরক্ষা
                </h4>
              </div>
            </div>

            {/* 3D Visual Stage Card */}
            <div className="nas-stage-card">
              {/* Corner Callout Texts */}
              <div className="nas-stage-top-left">
                <p className="nas-stl-line">PURITY</p>
                <p className="nas-stl-line">IN EVERY</p>
                <p className="nas-stl-line">DROP</p>
                <div className="nas-stl-divider" />
              </div>

              <div className="nas-stage-top-right">
                <p className="nas-str-script">Soul of</p>
                <p className="nas-str-script">the Scent</p>
              </div>

              {/* Ambient Spotlight Ray & Glow behind bottle */}
              <div
                className="nas-stage-ambient-glow"
                style={{
                  background: `radial-gradient(circle at 50% 48%, ${currentItem.glowColor} 0%, transparent 68%)`,
                }}
              />

              {/* Animated Bottle Display */}
              <div className="nas-stage-bottle-wrapper">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentItem.id}
                    initial={{ opacity: 0.8, scale: 0.94, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0.8, scale: 0.94, y: -12 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="nas-stage-bottle-inner"
                  >
                    <Image
                      src={currentItem.bottleImage}
                      alt={currentItem.name}
                      width={440}
                      height={440}
                      priority
                      unoptimized
                      className="nas-stage-bottle-img"
                    />
                  </motion.div>
                </AnimatePresence>
                {/* Oval Pedestal Shadow */}
                <div className="nas-stage-pedestal-shadow" />
              </div>

              {/* Bottom 3-Stat Glass Capsule Pill */}
              <div className="nas-stage-stat-capsule">
                <div className="nas-stat-item">
                  <span className="nas-stat-label">স্থায়িত্ব</span>
                  <span className="nas-stat-val">{currentItem.longevity}</span>
                </div>
                <div className="nas-stat-divider" />
                <div className="nas-stat-item">
                  <span className="nas-stat-label">বিশুদ্ধতা</span>
                  <span className="nas-stat-val">{currentItem.purity}</span>
                </div>
                <div className="nas-stat-divider" />
                <div className="nas-stat-item">
                  <span className="nas-stat-label">ব্যবহার</span>
                  <span className="nas-stat-val">{currentItem.fabricSafety}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= BOTTOM NAVIGATION BAR ================= */}
        <div className="nas-bottom-bar">
          <div className="nas-nav-left">
            <span className="nas-nav-counter">
              02 / 04
            </span>
            <div className="nas-nav-line" />
            <div className="nas-nav-categories">
              <span className="nas-nav-cat">HIJAB</span>
              <span className="nas-nav-cat nas-active">PERFUME</span>
              <span className="nas-nav-cat">TOTE</span>
              <span className="nas-nav-cat">GIFT PACKAGE</span>
            </div>
          </div>

          <div className="nas-nav-right">
            <div className="nas-nav-arrows">
              <button
                type="button"
                onClick={handlePrev}
                className="nas-arrow-btn"
                aria-label="পূর্ববর্তী সুবাস"
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
                className="nas-arrow-btn"
                aria-label="পরবর্তী সুবাস"
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

            <div className="nas-nav-separator" />

            <div className="nas-brand-taglines">
              <div className="nas-tagline-item">
                <span>A ROYAL FRAGRANCE</span>
                <span className="nas-tagline-dash" />
                <span style={{ fontSize: "11px" }}>✤</span>
              </div>
              <div className="nas-tagline-item">
                <span>A SACRED CALM</span>
                <span className="nas-tagline-dash" />
                <span style={{ fontSize: "11px" }}>✤</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
