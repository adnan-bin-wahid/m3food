"use client";
import { useState, useRef, type CSSProperties } from "react";
import { ReviewCard, ReviewStars, ReviewShield, ReviewArrow } from "./review-card";
import { ReviewModal } from "./review-modal";
import type { CustomerReview, ReviewSummary } from "./review-data";
import "./reviews.css";

export type ReviewShowcaseProps = {
  reviews: CustomerReview[];
  summary?: ReviewSummary;
  id?: string;
  eyebrow?: string;
  title?: string;
  accentTitle?: string;
  description?: string;
  backgroundImage?: string;
};

export function ReviewShowcase({
  reviews,
  summary,
  id = "reviews",
  eyebrow = "REAL PEOPLE, REAL STORIES",
  title = "আস্থার গল্পগুলো",
  accentTitle = "আমাদের সবচেয়ে বড় প্রাপ্তি",
  description = "নিয়ামাহ্ Attires শুধু পোশাক নয়, এটি একটি অনুভূতি। আমাদের প্রিয় গ্রাহকদের ভালোবাসা, বিশ্বাস এবং সুন্দর অভিজ্ঞতাই আমাদের পথচলার অনুপ্রেরণা।",
  backgroundImage = "/niyamah/reviews/background.png",
}: ReviewShowcaseProps) {
  const [selected, setSelected] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [modalReview, setModalReview] = useState<CustomerReview | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  if (!reviews.length) return null;
  const active = selected % reviews.length;
  const visible = Array.from(
    { length: Math.min(5, reviews.length) },
    (_, i) => reviews[(active + i) % reviews.length]
  );
  const mobileVisible = Array.from(
    { length: Math.min(4, reviews.length) },
    (_, i) => reviews[(active + i) % reviews.length]
  );

  const go = (dir: number) => {
    setDirection(dir >= 0 ? "next" : "prev");
    setSelected(n => (n + dir + reviews.length) % reviews.length);
  };
  const goTo = (index: number) => {
    setDirection(index >= active ? "next" : "prev");
    setSelected(index);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current !== null && touchEndX.current !== null) {
      const diff = touchStartX.current - touchEndX.current;
      if (Math.abs(diff) > 35) {
        if (diff > 0) {
          go(1);
        } else {
          go(-1);
        }
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <section
      id={id}
      className="nr-section"
      aria-labelledby={`${id}-title`}
      style={{ "--nr-background": `url("${backgroundImage}")` } as CSSProperties}
    >
      <div className="nr-brand" aria-hidden="true">
        <span>Niyamah</span>
        <small>ATTIRES</small>
        <em>MODESTY IS A KIND OF BEAUTY</em>
      </div>

      <div className="nr-shell">
        <header className="nr-header">
          <div className="nr-heading">
            <p className="nr-eyebrow">{eyebrow}<i /></p>
            <h2 id={`${id}-title`}>
              {title}<br />
              <span>{accentTitle}</span>
            </h2>
            <p className="nr-description">{description}</p>
          </div>

          {summary && (
            <>
              {/* Desktop Summary Box */}
              <aside className="nr-summary nr-desktop-summary" aria-label="Review summary">
                <div>
                  <ReviewStars rating={summary.rating} />
                  <p className="nr-rating">{summary.rating.toFixed(1)}<span>/5</span></p>
                  <small>আমাদের গ্রাহকদের গড় রেটিং</small>
                </div>
                <div>
                  <p className="nr-total">{summary.total}<ReviewShield /></p>
                  <span>{summary.label || "গ্রাহকের রিভিউ"}</span>
                </div>
              </aside>

              {/* Mobile Compact Trust Pill */}
              <div className="nr-mobile-trust-capsule" aria-label="Customer ratings">
                <ReviewStars rating={summary.rating} />
                <span className="nr-mt-score">{summary.rating.toFixed(1)}/5</span>
                <span className="nr-mt-sep">•</span>
                <span className="nr-mt-count">{summary.total} {summary.label || "রিভিউ"}</span>
                <ReviewShield />
              </div>
            </>
          )}
        </header>

        <div className="nr-layout">
          <aside className="nr-side-note" aria-hidden="true">
            <span />BEAUTIFUL<br />MODEST<br />CONFIDENT<br /><strong>YOU</strong><i>✧</i>
          </aside>

          {/* Desktop Cards Layout */}
          <div className="nr-cards nr-desktop-cards" key={`desktop-${reviews[active].id}`} data-direction={direction}>
            <ReviewCard
              review={visible[0]}
              featured
              onOpenModal={() => setModalReview(visible[0])}
            />
            <div className="nr-small-grid">
              {visible.slice(1).map(review => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  onOpenModal={() => setModalReview(review)}
                />
              ))}
            </div>
          </div>

          {/* Mobile 2x2 Interactive Slider Grid */}
          <div
            className="nr-mobile-grid"
            key={`mobile-${reviews[active].id}`}
            data-direction={direction}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {mobileVisible.map(review => (
              <ReviewCard
                key={review.id}
                review={review}
                compact
                onOpenModal={() => setModalReview(review)}
              />
            ))}
          </div>
        </div>

        <footer className="nr-bottom">
          <span className="nr-grateful" aria-hidden="true">Grateful<br />for you ♡</span>
          {reviews.length > 1 && (
            <nav className="nr-navigation" aria-label="Review navigation">
              <button
                type="button"
                className="nr-arrow"
                aria-label="আগের রিভিউ"
                onClick={() => go(-1)}
              >
                <ReviewArrow back />
              </button>

              <div className="nr-dots">
                {reviews.map((review, i) => (
                  <button
                    key={review.id}
                    type="button"
                    aria-label={`${review.name}-এর রিভিউ দেখুন`}
                    aria-current={i === active ? "true" : undefined}
                    onClick={() => goTo(i)}
                  />
                ))}
              </div>

              <button
                type="button"
                className="nr-arrow"
                aria-label="পরের রিভিউ"
                onClick={() => go(1)}
              >
                <ReviewArrow />
              </button>
            </nav>
          )}
          <span className="nr-values" aria-hidden="true">
            <i />✧<span>SAME VALUES<br />MORE SISTERHOOD</span>
          </span>
          <span className="nr-mobile-grateful" aria-hidden="true">
            With love & gratitude ♡
          </span>
        </footer>
      </div>

      <span className="nr-sr" role="status" aria-live="polite">
        {active + 1} / {reviews.length} — {reviews[active].name}
      </span>

      {/* Full Customer Story Modal */}
      <ReviewModal
        review={modalReview}
        onClose={() => setModalReview(null)}
      />
    </section>
  );
}
