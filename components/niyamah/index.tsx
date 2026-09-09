'use client';

import { MotionConfig } from 'framer-motion';
import { LuxuryHeader } from './luxury-header';
import { HeroSlider } from './hero-slider';
import { FlashSaleSection } from './flash-sale-section';
import { BrandStorySection } from './brand-story';
import { FeaturedCollectionsSection } from './featured-collections';
import { HijabShowcaseSection } from './hijab-showcase';
import { AttarShowcaseSection } from './attar-showcase';
import { ProductDiscoverySection } from './product-discovery';
import { SocialProofSection } from './social-proof';
import { TrustPillarsSection } from './trust-pillars';
import { LuxuryOrderSection } from './luxury-order-section';
import { FaqSection } from './faq-section';
import { LuxuryFooter } from './luxury-footer';
import { HOMEPAGE_DEFAULTS } from './homepage-defaults';
import './niyamah.css';
import './hero-polish.css';

export {
  LuxuryHeader,
  HeroSlider,
  FlashSaleSection,
  BrandStorySection,
  FeaturedCollectionsSection,
  HijabShowcaseSection,
  AttarShowcaseSection,
  ProductDiscoverySection,
  SocialProofSection,
  TrustPillarsSection,
  LuxuryOrderSection,
  FaqSection,
  LuxuryFooter,
  HOMEPAGE_DEFAULTS,
};

export default function NiyamahSections() {
  return (
    <div className="niyamah-copy w-full" lang="bn" data-track-section="niyamah">
      <MotionConfig reducedMotion="user">
        <HeroSlider slides={HOMEPAGE_DEFAULTS.hero} />
        <FlashSaleSection />
        <BrandStorySection />
        <FeaturedCollectionsSection />
        <HijabShowcaseSection />
        <AttarShowcaseSection />
        <ProductDiscoverySection />
        <SocialProofSection />
        <TrustPillarsSection />
      </MotionConfig>
    </div>
  );
}
