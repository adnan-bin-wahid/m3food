'use client';
import { MotionConfig } from 'framer-motion';
import { HeroSlider } from './hero-slider';
import { FlashSaleSection } from './flash-sale-section';
import { HOMEPAGE_DEFAULTS } from './homepage-defaults';
import './niyamah.css';
import './hero-polish.css';
export default function NiyamahSections() {
 return <div className="niyamah-copy" lang="en" data-track-section="niyamah"><MotionConfig reducedMotion="user"><HeroSlider slides={HOMEPAGE_DEFAULTS.hero} /><FlashSaleSection /></MotionConfig></div>;
}
