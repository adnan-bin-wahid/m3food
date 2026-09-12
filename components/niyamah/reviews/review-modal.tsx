"use client";

import { useEffect } from "react";
import { ReviewStars, ReviewShield, ReviewAvatarImg } from "./review-card";
import type { CustomerReview } from "./review-data";

export interface ReviewModalProps {
  review: CustomerReview | null;
  onClose: () => void;
}

export function ReviewModal({ review, onClose }: ReviewModalProps) {
  useEffect(() => {
    if (!review) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [review, onClose]);

  if (!review) return null;

  return (
    <div
      className="nr-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="nr-modal-customer-name"
    >
      <div className="nr-modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          type="button"
          className="nr-modal-close"
          onClick={onClose}
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

        {/* Modal Header: Avatar, Name, Location, Stars, Verified */}
        <div className="nr-modal-header">
          <ReviewAvatarImg avatar={review.avatar} name={review.name} />

          <div className="nr-modal-author-info">
            <div className="nr-modal-name-row">
              <h3 id="nr-modal-customer-name" className="nr-modal-name">
                {review.name}
              </h3>
              {review.verified && (
                <span className="nr-modal-verified">
                  <ReviewShield />
                  <span>যাচাইকৃত ক্রয়</span>
                </span>
              )}
            </div>

            <div className="nr-modal-sub-row">
              {review.location && (
                <span className="nr-modal-location">{review.location}</span>
              )}
              <ReviewStars rating={review.rating} />
            </div>
          </div>
        </div>

        {/* Modal Body: Full Quote Text */}
        <div className="nr-modal-body">
          <span className="nr-modal-quote-mark" aria-hidden="true">
            “
          </span>
          <blockquote lang="bn" className="nr-modal-quote">
            <p>{review.text}</p>
          </blockquote>

          {review.signature && (
            <span className="nr-modal-signature" aria-hidden="true">
              {review.signature}
            </span>
          )}
        </div>

        {/* Modal Footer: Product Info & Order CTA */}
        {review.product && (
          <div className="nr-modal-footer">
            <a
              className="nr-modal-product-card"
              href={review.product.href}
              onClick={onClose}
            >
              {review.product.image && (
                <img
                  src={review.product.image}
                  alt={review.product.name}
                  className="nr-modal-prod-img"
                />
              )}
              <div className="nr-modal-prod-meta">
                <span className="nr-modal-prod-label">ক্রয়কৃত পণ্য:</span>
                <span className="nr-modal-prod-title">
                  {review.product.name}
                </span>
              </div>
              <span className="nr-modal-prod-cta">
                <span>অর্ডার করুন</span>
                <svg
                  width="14"
                  height="14"
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
              </span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
