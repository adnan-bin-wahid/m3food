'use client';
import dynamic from 'next/dynamic';
import { SmoothScroll } from './smooth-scroll';
import { LuxuryHeader } from './luxury-header';
import { HeroSlider } from './hero-slider';
import { HOMEPAGE_DEFAULTS } from './homepage-defaults';
import './niyamah.css';
import './hero-polish.css';

// Below-the-fold sections dynamically imported with { ssr: true } to eliminate initial JS cost while preserving 0 CLS and SEO
const TulipShowcaseSection = dynamic(() => import('./tulip-showcase').then((m) => m.TulipShowcaseSection), { ssr: true });
const SocialProofSection = dynamic(() => import('./social-proof').then((m) => m.SocialProofSection), { ssr: true });
const VideoReviewSection = dynamic(() => import('./video-review-section').then((m) => m.VideoReviewSection), { ssr: true });
const LuxuryOrderSection = dynamic(() => import('./luxury-order-section').then((m) => m.LuxuryOrderSection), { ssr: true });
const FaqSection = dynamic(() => import('./faq-section').then((m) => m.FaqSection), { ssr: true });
const LuxuryFooter = dynamic(() => import('./luxury-footer').then((m) => m.LuxuryFooter), { ssr: true });

// Multi-product sections dynamically imported only if activated
const WhyNiyamahSection = dynamic(() => import('./why-niyamah').then((m) => m.WhyNiyamahSection), { ssr: false });
const FlashSaleSection = dynamic(() => import('./flash-sale-section').then((m) => m.FlashSaleSection), { ssr: false });
const HijabShowcaseSection = dynamic(() => import('./hijab-showcase').then((m) => m.HijabShowcaseSection), { ssr: false });
const AttarShowcaseSection = dynamic(() => import('./attar-showcase').then((m) => m.AttarShowcaseSection), { ssr: false });
const TrustPillarsSection = dynamic(() => import('./trust-pillars').then((m) => m.TrustPillarsSection), { ssr: false });

export {
  SmoothScroll,
  LuxuryHeader,
  HeroSlider,
  WhyNiyamahSection,
  FlashSaleSection,
  HijabShowcaseSection,
  AttarShowcaseSection,
  TulipShowcaseSection,
  SocialProofSection,
  VideoReviewSection,
  TrustPillarsSection,
  LuxuryOrderSection,
  FaqSection,
  LuxuryFooter,
  HOMEPAGE_DEFAULTS,
};

export interface NiyamahSectionsProps {
  showMultiProductSections?: boolean;
}

export default function NiyamahSections({ showMultiProductSections = false }: NiyamahSectionsProps = {}) {
  return (
    <div className="niyamah-copy w-full" lang="bn" data-track-section="niyamah">
      <SmoothScroll />
      <HeroSlider slides={HOMEPAGE_DEFAULTS.hero} />
      {showMultiProductSections && <WhyNiyamahSection />}
      {showMultiProductSections && <FlashSaleSection />}
      {showMultiProductSections && <HijabShowcaseSection />}
      {showMultiProductSections && <AttarShowcaseSection />}
      <TulipShowcaseSection />
      <SocialProofSection />
      <VideoReviewSection />
      {showMultiProductSections && <TrustPillarsSection />}
    </div>
  );
}
