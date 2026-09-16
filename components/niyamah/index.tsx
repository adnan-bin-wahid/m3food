'use client';
import dynamic from 'next/dynamic';
import { VideoReviewSection } from './video-review-section';
import { MotionConfig } from 'framer-motion';
import { SmoothScroll } from './smooth-scroll';
import { LuxuryHeader } from './luxury-header';
import { HeroSlider } from './hero-slider';
import { TulipShowcaseSection } from './tulip-showcase';
import { SocialProofSection } from './social-proof';
import { LuxuryOrderSection } from './luxury-order-section';
import { FaqSection } from './faq-section';
import { LuxuryFooter } from './luxury-footer';
import { HOMEPAGE_DEFAULTS } from './homepage-defaults';
import './niyamah.css';
import './hero-polish.css';

// Dynamically imported sections to avoid bundle bloat and execution overhead on single-product drops
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
      <MotionConfig reducedMotion="user">
        <HeroSlider slides={HOMEPAGE_DEFAULTS.hero} />
        {showMultiProductSections && <WhyNiyamahSection />}
        {showMultiProductSections && <FlashSaleSection />}
        {showMultiProductSections && <HijabShowcaseSection />}
        {showMultiProductSections && <AttarShowcaseSection />}
        <TulipShowcaseSection />
        <SocialProofSection />
        <VideoReviewSection />
        {showMultiProductSections && <TrustPillarsSection />}
      </MotionConfig>
    </div>
  );
}
