"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Truck, RotateCcw, MessageSquare, Sparkles } from "lucide-react";
import "./trust-pillars.css";

interface Pillar {
  id: string;
  icon: typeof ShieldCheck;
  titleBn: string;
  subtitleBn: string;
  desc: string;
  badge: string;
  points: string[];
}

const PILLARS: Pillar[] = [
  {
    id: "p1",
    icon: ShieldCheck,
    titleBn: "১০০% খাঁটি ও পরীক্ষিত মান",
    subtitleBn: "আর্টিসানাল প্রিমিয়াম কোয়ালিটি",
    desc: "আমাদের কাপড়ের কোয়ালিটি সবসময়ই বেস্ট হবে ইনশাআল্লাহ। Pure bexi কটন সালাত হিজাব ও অ্যালকোহল মুক্ত খাঁটি পারফিউম নিজস্ব তত্ত্বাবধানে মান যাচাইকৃত।",
    badge: "প্রিমিয়াম মান",
    points: [
      "১০০% খাঁটি পিওর বেক্সি কটন ফেব্রিকের মসৃণ আরামদায়ক অভিজ্ঞতা",
      "অ্যালকোহল ও কেমিক্যাল মুক্ত দীর্ঘস্থায়ী হালাল পারফিউম",
      "প্যাকিংয়ের পূর্বে নিজস্ব দক্ষ কারিগরদের নিখুঁত ফিনিশিং চেক",
    ],
  },
  {
    id: "p2",
    icon: Truck,
    titleBn: "ক্যাশ অন ডেলিভারি (COD)",
    subtitleBn: "পার্সেল দেখে নেওয়ার পূর্ণ সুবিধা",
    desc: "ডেলিভারি ম্যানের সামনে পার্সেল খুলে যাচাই করে নিশ্চিন্তে মূল্য পরিশোধ করুন। বাংলাদেশের সকল ৬৪ জেলায় প্রযোজ্য।",
    badge: "জিরো রিস্ক",
    points: [
      "বাংলাদেশের সকল ৬৪ জেলা ও প্রত্যন্ত উপজেলায় সরাসরি হোম ডেলিভারি",
      "ডেলিভারি প্রতিনিধির সামনে পার্সেল খুলে দেখার শতভাগ নিশ্চয়তা",
      "পণ্য দেখে সম্পূর্ণ নিশ্চিত হয়ে তবেই মূল্য পরিশোধ করুন",
    ],
  },
  {
    id: "p3",
    icon: RotateCcw,
    titleBn: "৭ দিনের সহজ এক্সচেঞ্জ",
    subtitleBn: "সম্মানজনক ও ঝামেলাহীন পরিবর্তন",
    desc: "পণ্য হাতে পাওয়ার পর সাইজ, কালার বা পছন্দজনিত কোনো কারণে সন্তুষ্ট না হলে ৭ দিনের মধ্যে পরিবর্তন করার নিশ্চয়তা।",
    badge: "নিশ্চিন্ত কেনাকাটা",
    points: [
      "সাইজ বা রঙের অমিল হলে ৭ দিনের মধ্যে সহজ পরিবর্তন সুবিধা",
      "কোনো দীর্ঘসূত্রতা বা অপ্রয়োজনীয় প্রশ্ন ছাড়া সম্মানজনক সমাধান",
      "কুরিয়ার ড্রপ-অফ বা পিকআপের মাধ্যমে ঝামেলাহীন সার্ভিস",
    ],
  },
  {
    id: "p4",
    icon: MessageSquare,
    titleBn: "ভিআইপি কনসিয়ার্জ সেবা",
    subtitleBn: "ব্যক্তিগত পরামর্শ ও সার্বক্ষণিক সহায়তা",
    desc: "সাইজ পরামর্শ, উপহার চয়েস বা যেকোনো প্রশ্নের তাৎক্ষণিক উত্তর পেতে আমাদের হটলাইন ও মেসেঞ্জারে যোগাযোগ করুন।",
    badge: "সকাল ৯টা – রাত ১১টা",
    points: [
      "উপহার নির্বাচন বা সঠিক সাইজ বেছে নিতে বিশেষজ্ঞ গাইডেন্স",
      "অর্ডার ট্র্যাকিং ও ডেলিভারি সংক্রান্ত যেকোনো আপডেটে দ্রুত রেসপন্স",
      "সকাল ৯টা থেকে রাত ১১টা পর্যন্ত মেসেঞ্জার ও ফোনে সার্বক্ষণিক সেবা",
    ],
  },
];

export function TrustPillarsSection() {
  const [activePillar, setActivePillar] = useState<Pillar | null>(null);

  useEffect(() => {
    if (!activePillar) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActivePillar(null);
    };
    document.addEventListener("keydown", handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [activePillar]);

  return (
    <section id="trust" className="ntp-section" lang="bn">
      <div className="ntp-pattern" aria-hidden="true" />

      <div className="ntp-container">
        {/* Section Header */}
        <header className="ntp-header">
          <div>
            <div className="ntp-eyebrow">
              <span className="ntp-eyebrow-line" />
              <p>কেন নিয়ামাহ্ আতায়ারস • বিশ্বস্ততার ৪টি স্তম্ভ</p>
            </div>
            <h2 className="ntp-title">
              আমাদের ৪টি মূল অঙ্গীকার, <br className="hidden md:inline" />
              <span>প্রতিটি ধাপে আপনার পূর্ণ আস্থা</span>
            </h2>
          </div>
          <p className="ntp-subtitle">
            অনলাইনে কেনাকাটায় আপনার শতভাগ সুরক্ষা, পণ্যের খাঁটি মান ও মানসিক প্রশান্তি নিশ্চিত করাই আমাদের প্রধান দায়িত্ব।
          </p>
        </header>

        {/* 4 Pillars Grid (Mobile: 2x2 compact; Desktop: 4 cols) */}
        <div className="ntp-grid">
          {PILLARS.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <motion.article
                key={pillar.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: idx * 0.08 }}
                onClick={() => setActivePillar(pillar)}
                className="ntp-card"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActivePillar(pillar);
                  }
                }}
              >
                <div className="ntp-card-body-wrap">
                  <div className="ntp-card-top">
                    <div className="ntp-card-icon">
                      <Icon className="h-5 w-5 md:h-6 md:w-6" />
                    </div>
                    <span className="ntp-card-badge">{pillar.badge}</span>
                  </div>

                  <h3 className="ntp-card-title">{pillar.titleBn}</h3>
                  <p className="ntp-card-subtitle">{pillar.subtitleBn}</p>

                  <div className="ntp-card-highlights">
                    {pillar.points.map((pt, i) => (
                      <div key={i} className="ntp-card-highlight">
                        <span className="ntp-card-check">✓</span>
                        <span className="ntp-card-highlight-text">{pt}</span>
                      </div>
                    ))}
                  </div>

                  <p className="ntp-card-desc">{pillar.desc}</p>
                </div>

                <div className="ntp-card-footer">
                  <div className="ntp-card-footer-left">
                    <span className="ntp-card-dot" />
                    <span>গ্রাহক সুরক্ষায় দায়বদ্ধ</span>
                  </div>
                  <span className="ntp-card-more">বিস্তারিত ❯</span>
                </div>
              </motion.article>
            );
          })}
        </div>

        {/* Mobile Reassurance Bar */}
        <div className="ntp-bottom-bar" aria-hidden="true">
          <Sparkles className="w-3.5 h-3.5" />
          <span>৬৪ জেলায় হোম ডেলিভারি • পার্সেল খুলে যাচাই • ৭ দিনের সহজ এক্সচেঞ্জ</span>
        </div>
      </div>

      {/* Interactive Pillar Detail Modal */}
      {activePillar && (
        <div
          className="ntp-modal-backdrop"
          onClick={() => setActivePillar(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="ntp-modal-title"
        >
          <div className="ntp-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="ntp-modal-close"
              onClick={() => setActivePillar(null)}
              aria-label="বন্ধ করুন"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="ntp-modal-header">
              <div className="ntp-modal-icon-box">
                <activePillar.icon className="w-6 h-6" />
              </div>
              <div className="ntp-modal-title-group">
                <h3 id="ntp-modal-title" className="ntp-modal-title">
                  {activePillar.titleBn}
                </h3>
                <p className="ntp-modal-subtitle">{activePillar.subtitleBn}</p>
              </div>
            </div>

            <div className="ntp-modal-body">
              <p>{activePillar.desc}</p>

              <div className="ntp-modal-points">
                {activePillar.points.map((pt, i) => (
                  <div key={i} className="ntp-modal-point">
                    <span className="ntp-modal-point-dot" />
                    <span>{pt}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="ntp-modal-footer">
              <span className="ntp-modal-badge">{activePillar.badge}</span>
              <a
                href="#order"
                className="ntp-modal-action-btn"
                onClick={() => setActivePillar(null)}
              >
                <span>নিশ্চিন্তে অর্ডার করুন</span>
                <span>➔</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
