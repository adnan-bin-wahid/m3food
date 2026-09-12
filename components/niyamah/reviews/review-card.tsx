import type { CustomerReview, ReviewAvatar } from "./review-data";

export function ReviewStars({ rating = 5 }: { rating?: number }) {
  const safe = Number.isFinite(rating) ? Math.max(0, Math.min(5, rating)) : 0;
  return <span className="nr-stars" role="img" aria-label={`${safe} out of 5 stars`}>{Array.from({ length: 5 }, (_, i) => <svg key={i} viewBox="0 0 24 24" aria-hidden="true" data-filled={i < Math.round(safe)}><path d="m12 2 3.05 6.18 6.82 1-4.94 4.81 1.17 6.8L12 17.58l-6.1 3.21 1.16-6.8L2.13 9.18l6.82-1Z" /></svg>)}</span>;
}
export function ReviewShield() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m12 2 8 3v6c0 5-5 9-8 11-3-2-8-6-8-11V5l8-3Z" stroke="currentColor" strokeWidth="1.5"/><path d="m8 12 3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
export function ReviewArrow({ back = false }: { back?: boolean }) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={back ? { transform: "rotate(180deg)" } : undefined}><path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
export function ReviewAvatarImg({ avatar, name }: { avatar?: ReviewAvatar; name: string }) {
  const crop = avatar?.crop;
  return <span className="nr-avatar" aria-hidden="true">{avatar ? <img src={avatar.src} alt="" loading="lazy" style={crop ? { position: "absolute", width: `${crop.width / crop.size * 100}%`, maxWidth: "none", height: `${crop.height / crop.size * 100}%`, left: `${-crop.x / crop.size * 100}%`, top: `${-crop.y / crop.size * 100}%` } : undefined} /> : <span>{name.trim().slice(0, 1)}</span>}</span>;
}
export interface ReviewCardProps {
  review: CustomerReview;
  featured?: boolean;
  compact?: boolean;
  onOpenModal?: () => void;
}

export function ReviewCard({
  review,
  featured = false,
  compact = false,
  onOpenModal,
}: ReviewCardProps) {
  if (compact) {
    return (
      <article
        className="nr-card nr-card-compact"
        onClick={onOpenModal}
        role={onOpenModal ? "button" : undefined}
        tabIndex={onOpenModal ? 0 : undefined}
        onKeyDown={(e) => {
          if (onOpenModal && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            onOpenModal();
          }
        }}
      >
        <div className="nr-compact-top">
          <ReviewAvatarImg avatar={review.avatar} name={review.name} />
          <div className="nr-compact-author">
            <div className="nr-compact-author-header">
              <h3 className="nr-compact-name">{review.name}</h3>
              {review.verified && (
                <span className="nr-compact-verified" title="যাচাইকৃত ক্রয়">
                  <ReviewShield />
                </span>
              )}
            </div>
            <div className="nr-compact-sub">
              {review.location && <span className="nr-compact-loc">{review.location}</span>}
              <ReviewStars rating={review.rating} />
            </div>
          </div>
        </div>

        <div className="nr-compact-body">
          <blockquote lang="bn">
            <p>{review.text}</p>
          </blockquote>
          <span className="nr-compact-read-more" aria-hidden="true">
            পুরোটা পড়ুন ❯
          </span>
        </div>

        {review.product && (
          <div className="nr-compact-footer">
            <a
              className="nr-compact-product"
              href={review.product.href}
              onClick={(e) => e.stopPropagation()}
            >
              {review.product.image && (
                <img src={review.product.image} alt="" loading="lazy" />
              )}
              <span>{review.product.name}</span>
            </a>
          </div>
        )}
      </article>
    );
  }

  return (
    <article
      className={`nr-card${featured ? " nr-featured" : ""}`}
      onClick={onOpenModal}
      role={onOpenModal ? "button" : undefined}
      tabIndex={onOpenModal ? 0 : undefined}
      onKeyDown={(e) => {
        if (onOpenModal && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onOpenModal();
        }
      }}
    >
      <div className="nr-card-top">
        {featured ? <span className="nr-featured-label">FEATURED REVIEW</span> : <ReviewStars rating={review.rating} />}
        {review.verified && <span className="nr-verified"><ReviewShield />যাচাইকৃত ক্রয়</span>}
      </div>
      <div className="nr-card-body">
        <blockquote lang="bn">
          <span className="nr-quote" aria-hidden="true">“</span>
          <p>{review.text}</p>
        </blockquote>
        <div className="nr-customer">
          <ReviewAvatarImg avatar={review.avatar} name={review.name} />
          <div>
            <h3>{review.name}</h3>
            <p>{review.location}</p>
            {featured && <ReviewStars rating={review.rating} />}
          </div>
        </div>
      </div>
      {review.product && (
        <div className="nr-card-footer">
          <a
            className="nr-product"
            href={review.product.href}
            onClick={(e) => e.stopPropagation()}
          >
            {review.product.image && <img src={review.product.image} alt="" loading="lazy" />}
            <span>{review.product.name}</span>
            <ReviewArrow />
          </a>
          {featured && <span className="nr-handwritten">{review.signature || "With love,\nalways ♡"}</span>}
        </div>
      )}
    </article>
  );
}
