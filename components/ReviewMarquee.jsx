'use client';

import Image from 'next/image';

const reviews = [
  { src: '/media/review-new-01.webp', alt: 'M3Food গ্রাহক রায়হান রনির রিভিউ' },
  { src: '/media/review-new-02.webp', alt: 'M3Food গ্রাহক শাহনাজ আখতারের রিভিউ' },
  { src: '/media/review-new-03.webp', alt: 'M3Food গ্রাহক এমডি বদিউল আলমের রিভিউ' },
  { src: '/media/review-new-04.webp', alt: 'M3Food গ্রাহক তৈয়ব আহমদের রিভিউ' },
  { src: '/media/review-new-05.webp', alt: 'M3Food গ্রাহক শাহরিয়ার কবির রাতুলের রিভিউ' },
  { src: '/media/review-new-06.webp', alt: 'M3Food গ্রাহক ডিকার্টিক রবিনের রিভিউ' },
];

function ReviewCard({ review, index, duplicate = false }) {
  return (
    <article
      className={`review-motion-card review-motion-card-${index + 1}`}
      aria-hidden={duplicate ? 'true' : undefined}
    >
      <div className="review-motion-image">
        <Image
          src={review.src}
          alt={duplicate ? '' : review.alt}
          fill
          sizes="(max-width: 620px) 78vw, 330px"
        />
        <span className="review-live-badge"><i /> যাচাইকৃত গ্রাহক অভিজ্ঞতা</span>
      </div>
      <div className="review-motion-meta">
        <div><span>★★★★★</span><small>বাস্তব গ্রাহকের শেয়ার করা মতামত</small></div>
        <b>{String(index + 1).padStart(2, '0')}</b>
      </div>
    </article>
  );
}

export default function ReviewMarquee() {
  return (
    <div className="review-motion-stage review-motion-stage-single" aria-label="M3Food গ্রাহকদের চলমান রিভিউ গ্যালারি">
      <div className="review-motion-fade review-motion-fade-left" />
      <div className="review-motion-fade review-motion-fade-right" />
      <div className="review-motion-track review-motion-track-single">
        <div className="review-motion-group">
          {reviews.map((review, index) => <ReviewCard key={`a-${review.src}`} review={review} index={index} />)}
        </div>
        <div className="review-motion-group" aria-hidden="true">
          {reviews.map((review, index) => <ReviewCard key={`b-${review.src}`} review={review} index={index} duplicate />)}
        </div>
      </div>
    </div>
  );
}
