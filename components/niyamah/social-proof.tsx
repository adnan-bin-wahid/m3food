"use client";
import { ReviewShowcase, type ReviewShowcaseProps } from "./reviews/review-showcase";
import { DEMO_REVIEWS, DEMO_REVIEW_SUMMARY } from "./reviews/review-data";

// Drop-in replacement: the existing <SocialProofSection /> import is unchanged.
// Override any prop to reuse the section with real data or a different campaign.
export function SocialProofSection(props: Partial<ReviewShowcaseProps> = {}) {
  return <ReviewShowcase reviews={DEMO_REVIEWS} summary={DEMO_REVIEW_SUMMARY} {...props} />;
}
export { ReviewShowcase } from "./reviews/review-showcase";
export { ReviewCard } from "./reviews/review-card";
export type { CustomerReview, ReviewSummary } from "./reviews/review-data";
