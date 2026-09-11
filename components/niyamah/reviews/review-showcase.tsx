"use client";
import { useState, type CSSProperties } from "react";
import { ReviewCard, ReviewStars, ReviewShield, ReviewArrow } from "./review-card";
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
export function ReviewShowcase({ reviews, summary, id = "reviews", eyebrow = "REAL PEOPLE, REAL STORIES", title = "আস্থার গল্পগুলো", accentTitle = "আমাদের সবচেয়ে বড় প্রাপ্তি", description = "নিয়ামাহ্ Attires শুধু পোশাক নয়, এটি একটি অনুভূতি। আমাদের প্রিয় গ্রাহকদের ভালোবাসা, বিশ্বাস এবং সুন্দর অভিজ্ঞতাই আমাদের পথচলার অনুপ্রেরণা।", backgroundImage = "/niyamah/reviews/background.png" }: ReviewShowcaseProps) {
  const [selected, setSelected] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  if (!reviews.length) return null;
  const active = selected % reviews.length;
  const visible = Array.from({ length: Math.min(5, reviews.length) }, (_, i) => reviews[(active + i) % reviews.length]);
  const go = (dir: number) => {
    setDirection(dir >= 0 ? "next" : "prev");
    setSelected(n => (n + dir + reviews.length) % reviews.length);
  };
  const goTo = (index: number) => {
    setDirection(index >= active ? "next" : "prev");
    setSelected(index);
  };
  return <section id={id} className="nr-section" aria-labelledby={`${id}-title`} style={{ "--nr-background": `url("${backgroundImage}")` } as CSSProperties}>
    <div className="nr-brand" aria-hidden="true"><span>Niyamah</span><small>ATTIRES</small><em>MODESTY IS A KIND OF BEAUTY</em></div>
    <div className="nr-shell">
      <header className="nr-header"><div className="nr-heading"><p className="nr-eyebrow">{eyebrow}<i /></p><h2 id={`${id}-title`}>{title}<br /><span>{accentTitle}</span></h2><p className="nr-description">{description}</p></div>
        {summary && <aside className="nr-summary" aria-label="Review summary"><div><ReviewStars rating={summary.rating} /><p className="nr-rating">{summary.rating.toFixed(1)}<span>/5</span></p><small>আমাদের গ্রাহকদের গড় রেটিং</small></div><div><p className="nr-total">{summary.total}<ReviewShield /></p><span>{summary.label || "গ্রাহকের রিভিউ"}</span></div></aside>}
      </header>
      <div className="nr-layout"><aside className="nr-side-note" aria-hidden="true"><span />BEAUTIFUL<br />MODEST<br />CONFIDENT<br /><strong>YOU</strong><i>✧</i></aside><div className="nr-cards" key={reviews[active].id} data-direction={direction}><ReviewCard review={visible[0]} featured /><div className="nr-small-grid">{visible.slice(1).map(review => <ReviewCard key={review.id} review={review} />)}</div></div></div>
      <footer className="nr-bottom"><span className="nr-grateful" aria-hidden="true">Grateful<br />for you ♡</span>{reviews.length > 1 && <nav className="nr-navigation" aria-label="Review navigation"><button type="button" className="nr-arrow" aria-label="আগের রিভিউ" onClick={() => go(-1)}><ReviewArrow back /></button><div className="nr-dots">{reviews.map((review, i) => <button key={review.id} type="button" aria-label={`${review.name}-এর রিভিউ দেখুন`} aria-current={i === active ? "true" : undefined} onClick={() => goTo(i)} />)}</div><button type="button" className="nr-arrow" aria-label="পরের রিভিউ" onClick={() => go(1)}><ReviewArrow /></button></nav>}<span className="nr-values" aria-hidden="true"><i />✧<span>SAME VALUES<br />MORE SISTERHOOD</span></span></footer>
    </div><span className="nr-sr" role="status" aria-live="polite">{active + 1} / {reviews.length} — {reviews[active].name}</span>
  </section>;
}
