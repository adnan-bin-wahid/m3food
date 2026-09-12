'use client';
import { useRef, useState, useEffect } from 'react';
import { DEMO_VIDEO_REVIEWS, type VideoReview } from './video-reviews/video-review-data';
import './video-reviews/video-reviews.css';

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M8 5.14v14c0 .86.94 1.38 1.66.92l11-7a1.08 1.08 0 0 0 0-1.84l-11-7A1.08 1.08 0 0 0 8 5.14z" />
  </svg>
);

const PauseIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);

const VolumeUpIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
  </svg>
);

const VolumeMuteIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
  </svg>
);


function formatTime(sec: number) {
  if (isNaN(sec) || !isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function VideoReviewPlayer({
  review,
  index,
  total,
}: {
  review: VideoReview;
  index: number;
  total: number;
}) {
  const [message, setMessage] = useState('');
  const [started, setStarted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Reset state when review changes
    setStarted(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setMessage('');
  }, [review.id]);

  async function togglePlay() {
    if (!review.src) {
      setMessage('ভিডিও শীঘ্রই আসছে');
      return;
    }
    const v = videoRef.current;
    if (!v) return;

    if (v.paused) {
      try {
        await v.play();
        setStarted(true);
        setIsPlaying(true);
        setMessage('');
      } catch {
        setMessage('ভিডিও চালু করা যাচ্ছে না।');
      }
    } else {
      v.pause();
      setIsPlaying(false);
    }
  }

  function handleTimeUpdate() {
    const v = videoRef.current;
    if (!v) return;
    if (!isDragging) {
      setCurrentTime(v.currentTime);
    }
    if ((!duration || duration === 0) && v.duration && !isNaN(v.duration) && isFinite(v.duration)) {
      setDuration(v.duration);
    }
  }

  function handleLoadedMetadata() {
    if (videoRef.current && videoRef.current.duration && !isNaN(videoRef.current.duration)) {
      setDuration(videoRef.current.duration);
    }
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  }

  function toggleMute() {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  }


  return (
    <div className="nvr-player" ref={containerRef}>
      {review.src ? (
        <video
          ref={videoRef}
          src={review.src}
          poster={review.poster}
          playsInline
          preload="metadata"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onDurationChange={handleLoadedMetadata}
          onCanPlay={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => {
            setIsPlaying(false);
            setStarted(false);
            setCurrentTime(0);
          }}
          onError={() => setMessage('ভিডিও পাওয়া যায়নি।')}
          style={{ objectFit: review.contain ? 'contain' : 'cover' }}
          onClick={togglePlay}
        />
      ) : (
        <img
          className="nvr-poster"
          src={review.poster}
          alt={`${review.product} placeholder`}
          style={{ objectFit: review.contain ? 'contain' : 'cover' }}
        />
      )}

      {/* Initial overlay with branding, quote and center play button */}
      {!started && (
        <>
          <div className="nvr-shade" />
          <div className="nvr-brand">
            NIYAMAH<small>REAL STORIES</small>
          </div>
          <span className="nvr-count">
            {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </span>
          <div className="nvr-handwriting">
            More than
            <br />
            a product
            <br />
            A feeling ♡
          </div>
          <button
            type="button"
            className="nvr-main-play"
            onClick={togglePlay}
            aria-label="ভিডিও চালু করুন"
          >
            <PlayIcon />
          </button>
          <blockquote className="nvr-customer-quote">
            <span>“</span>
            <p>{review.quote}</p>
            <footer>— &nbsp; {review.name}</footer>
          </blockquote>
        </>
      )}

      {/* REAL Interactive Control Bar with Seeker (টানার প্রগ্রেস বার) */}
      {started && (
        <div className="nvr-controls" onClick={(e) => e.stopPropagation()}>
          {/* Seeker Slider (ভিডিও সামনে/পিছনে টানার বার) */}
          <div className="nvr-timeline">
            <input
              type="range"
              className="nvr-seek-slider"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={() => setIsDragging(false)}
              onTouchStart={() => setIsDragging(true)}
              onTouchEnd={() => setIsDragging(false)}
              aria-label="ভিডিও টাইমলাইন স্ক্রাবার"
            />
          </div>

          <div className="nvr-bar-row">
            <div className="nvr-bar-left">
              <button
                type="button"
                className="nvr-ctrl-btn"
                onClick={togglePlay}
                aria-label={isPlaying ? 'পজ করুন' : 'প্লে করুন'}
              >
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
              </button>

              <button
                type="button"
                className="nvr-ctrl-btn"
                onClick={toggleMute}
                aria-label={isMuted ? 'আনমিউট করুন' : 'মিউট করুন'}
              >
                {isMuted ? <VolumeMuteIcon /> : <VolumeUpIcon />}
              </button>

              <span className="nvr-time-text">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

          </div>
        </div>
      )}

      <p className="nvr-message" role="status">
        {message}
      </p>
    </div>
  );
}

export type VideoReviewSectionProps = {
  reviews?: VideoReview[];
  id?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
};

export function VideoReviewSection({
  reviews = DEMO_VIDEO_REVIEWS,
  id = 'video-reviews',
  eyebrow,
  title = 'তাদের চোখে',
  description = 'যারা আমাদের পণ্য ব্যবহার করেছেন, তাদের বাস্তব অভিজ্ঞতা থেকে শুনুন নিয়ামাহ্’র গল্প।',
}: VideoReviewSectionProps = {}) {
  const [selected, setSelected] = useState(0);
  const rail = useRef<HTMLDivElement>(null);
  if (!reviews.length) return null;
  const active = Math.min(selected, reviews.length - 1),
    review = reviews[active];

  function select(n: number) {
    const next = (n + reviews.length) % reviews.length;
    setSelected(next);
    const node = rail.current?.children[next] as HTMLElement | undefined;
    if (node && rail.current)
      rail.current.scrollTo({
        left: node.offsetLeft - rail.current.offsetLeft - 8,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'auto'
          : 'smooth',
      });
  }

  return (
    <section id={id} className="nvr-section" lang="bn" aria-labelledby={`${id}-title`}>
      <div className="nvr-layout">
        <header className="nvr-heading">
          {eyebrow && <p className="nvr-eyebrow">{eyebrow}</p>}
          <h2 id={`${id}-title`}>
            নিয়ামাহ্<span>{title}</span>
          </h2>
          <p className="nvr-description">{description}</p>
          <div className="nvr-values" aria-hidden="true">
            <b>❀</b>FAITH
            <br />
            MODESTY
            <br />
            BEAUTY
            <br />
            YOU
          </div>
        </header>

        <div className="nvr-feature">
          <VideoReviewPlayer
            key={review.id}
            review={review}
            index={active}
            total={reviews.length}
          />
        </div>

        <div className="nvr-selection">
          <div className="nvr-rail" ref={rail} aria-label="Customer video stories">
            {reviews.map((item, i) => (
              <button
                key={item.id}
                className={`nvr-thumb ${i === active ? 'is-active' : ''}`}
                onClick={() => select(i)}
                aria-pressed={i === active}
                aria-label={`Select ${item.name}, ${item.product}`}
              >
                <img
                  src={item.poster}
                  alt=""
                  style={{ objectFit: item.contain ? 'contain' : 'cover' }}
                />
                <span className="nvr-thumb-shade" />
                <span className="nvr-thumb-play">
                  <PlayIcon />
                </span>
                <span className="nvr-thumb-label">
                  <strong>{item.name}</strong>
                  <small>{item.product}</small>
                  <i />
                </span>
              </button>
            ))}
          </div>

          <div className="nvr-arrows">
            <button
              onClick={() => select(active - 1)}
              aria-label="Previous video story"
              disabled={reviews.length < 2}
            >
              ←
            </button>
            <button
              onClick={() => select(active + 1)}
              aria-label="Next video story"
              disabled={reviews.length < 2}
            >
              →
            </button>
          </div>
        </div>

        <footer className="nvr-editorial">
          <span>“</span>
          <blockquote>
            Their stories inspire us
            <br />
            to do better, every day.
          </blockquote>
          <p>NIYAMAH ATTIRES</p>
          <small>
            A MORE
            <br />
            MEANINGFUL
            <br />
            YOU
          </small>
        </footer>
      </div>
    </section>
  );
}

export type { VideoReview } from './video-reviews/video-review-data';
