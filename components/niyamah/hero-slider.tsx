"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Clock3, Flower2, Gift, Leaf, Pause, Play, ShoppingBag, Sparkles, Tag } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import gsap from "gsap";
import type { HeroSlideData } from "./homepage-defaults";

const collection = [
  { id: "floral-prayer-set", name: "ফ্লোরাল সেট", category: "প্রিমিয়াম প্রেয়ার কালেকশন", title: "স্নিগ্ধতার ছোঁয়ায়", highlight: "প্রতিটি প্রার্থনা", subtitle: "ফ্লোরাল প্রেয়ার সেট", image: "slider-2-f.png", box: "306 13 698 996", size: [1328,1184], script: ["Modesty", "Looks Beautiful ♡"], card: "আমাদের প্রেয়ার কালেকশন", note: "ইবাদতের প্রতিটি মুহূর্তে প্রশান্তি", regularPrice: "৮৫০/-", discountPrice: "৮০০/-", specs: [["ম্যাটেরিয়াল","প্রিমিয়াম কটন"],["সাইজ","ফ্রি সাইজ"],["সেট","টেলিকুং, স্কার্ট ও ব্যাগ"]], features: ["নরম ও আরামদায়ক", "সুন্দর ফ্লোরাল প্রিন্ট", "মার্জিত ডিজাইন"] },
  { id: "orchid-perfume", name: "অর্কিড পারফিউম", category: "প্রিমিয়াম অ্যাটার কালেকশন", title: "অর্কিডের ঘ্রাণে", highlight: "প্রতিটি মুহূর্ত", subtitle: "নন-আলকোহলিক পারফিউম", image: "slider-1-f.png", box: "25 90 1066 1265", size: [1122,1402], script: ["More Than a Scent", "A Kinder You ♡"], card: "আমাদের অ্যাটার কালেকশন", note: "নারীত্বের এক কোমল প্রকাশ", regularPrice: "১০৫০/-", discountPrice: "৮৫০/-", specs: [["ধরণ","নন-আলকোহলিক অ্যাটার"],["ঘ্রাণ","অর্কিড ব্লুম"],["স্টাইল","সফট ফেমিনিন ফ্লোরাল"]], features: ["ফ্রেশ ফ্লোরাল", "দীর্ঘস্থায়ী", "গিফটের জন্য পারফেক্ট"] },
  { id: "blossom-tote", name: "টিউলিপ প্যাকেজ", category: "ব্লসম গিフト কালেকশন", title: "সৌন্দর্য থাকুক", highlight: "আপনার সঙ্গেই", subtitle: "টিউলিপ গিফট প্যাকেজ", image: "slider-3-f.png", box: "218 0 692 1148", size: [1080,1360], script: ["Carry Good Things", "Beautifully ♡"], card: "আমাদের গিফট কালেকশন", note: "প্রিয়জনের জন্য স্নিগ্ধ এক উপহার", regularPrice: "১৩৫০/-", discountPrice: "১২২৫/-", specs: [["ম্যাটেরিয়াল","ট্রান্সপারেন্ট পিভিসি"],["হ্যান্ডেল","ওভেন স্ট্র্যাপ"],["সেট","ব্যাগ, স্কার্ফ ও বোতল"]], features: ["ফ্লোরাল ডিজাইন", "প্রতিদিনের সঙ্গী", "গিফটের জন্য পারফেক্ট"] },
];
const icons = [Flower2, Clock3, Gift];
const specIcons = [Leaf, Flower2, Sparkles];
const bn = (n: number) => String(n).padStart(2,"0").replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[Number(d)]);

/** Foreground uses the original PNG; its viewBox aligns the physical base, not transparent padding. */
function Product({ item, thumb = false }: { item: typeof collection[number]; thumb?: boolean }) {
  return <svg className={thumb ? "nh-thumb-image" : "nh-product-image"} viewBox={item.box} preserveAspectRatio="xMidYMax meet" role="img" aria-label={item.name}>
    <image href={`/niyamah/slider/${item.image}`} width={item.size[0]} height={item.size[1]} />
  </svg>;
}

export function HeroSlider({ slides, autoPlayMs = 8500, className = "" }: { slides: HeroSlideData[]; autoPlayMs?: number; className?: string }) {
  const [current, setCurrent] = useState(1);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const heroRef = useRef<HTMLElement | null>(null);
  const touch = useRef<number | null>(null);
  const reduced = useReducedMotion();
  const item = collection[current];
  const href = slides.find(slide => slide.id === item.id)?.primaryButtonLink || "#order-section";
  const go = (index: number) => { setDirection(index > current ? 1 : -1); setCurrent((index + collection.length) % collection.length); };

  useEffect(() => {
    if (paused || hovered || reduced || autoPlayMs <= 0) return;
    const timer = window.setInterval(() => { if (!document.hidden) { setDirection(1); setCurrent(index => (index + 1) % collection.length); } }, autoPlayMs);
    return () => window.clearInterval(timer);
  }, [paused, hovered, reduced, autoPlayMs, current]);

  // GSAP Cinematic Timeline Orchestration
  useEffect(() => {
    if (reduced || !heroRef.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // 0s: Background slowly appears with soft fade
      tl.fromTo(
        ".nh-scene",
        { opacity: 0.82 },
        { opacity: 1, duration: 1.6, ease: "power2.out" },
        0
      );

      // 0.5s: Product rises smoothly
      tl.fromTo(
        ".nh-product",
        { y: 45, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.95, ease: "power3.out" },
        0.5
      );

      // 1.0s: Heading reveals with letter-spacing elegance
      tl.fromTo(
        ".nh-copy h1, .nh-eyebrow, .nh-subtitle",
        { y: 22, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power2.out", stagger: 0.09 },
        1.0
      );

      // 1.5s: CTA appears with subtle back easing
      tl.fromTo(
        ".nh-order, .nh-offer",
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: "power2.out", stagger: 0.1 },
        1.5
      );

      // 2.0s: Subtle infinite floating motion begins
      tl.to(
        ".nh-product",
        {
          y: -7,
          duration: 4.8,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        },
        2.0
      );
    }, heroRef);

    return () => ctx.revert();
  }, [current, reduced]);

  // Mouse Parallax for subtle luxury 3D depth feeling
  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (reduced || !heroRef.current || window.innerWidth < 768) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    gsap.to(".nh-product", { x: x * 14, y: y * 8, duration: 0.8, ease: "power1.out", overwrite: "auto" });
  };

  const handleMouseLeave = () => {
    setHovered(false);
    if (!reduced && window.innerWidth >= 768) {
      gsap.to(".nh-product", { x: 0, y: 0, duration: 1, ease: "power2.out", overwrite: "auto" });
    }
  };

  return <section ref={heroRef} className={`nh-hero ${className}`} aria-label="নিয়ামাহ কালেকশন" aria-roledescription="carousel" lang="bn"
    onMouseMove={handleMouseMove}
    onMouseEnter={() => setHovered(true)} onMouseLeave={handleMouseLeave}
    onFocusCapture={() => setHovered(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setHovered(false); }}
    onKeyDown={event => { if (event.key === "ArrowRight") go(current+1); if (event.key === "ArrowLeft") go(current-1); }}
    onTouchStart={event => { touch.current = event.touches[0].clientX; }} onTouchEnd={event => { if (touch.current !== null) { const delta = touch.current - event.changedTouches[0].clientX; if (Math.abs(delta)>55) go(current+(delta>0?1:-1)); touch.current=null; } }}>
    
    {/* Neoclassical Arch & Marble Scene with Fixed Viewport Attachment */}
    <div className="nh-scene" aria-hidden="true" />

    {/* Floating Flower Petals - 3 Depth Planes */}
    <div className="nh-petals-layer pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Background Soft Petal */}
      <div className="nh-petal nh-petal-blur" style={{ top: "14%", left: "12%", width: "16px", height: "16px", animationDelay: "0s" }}>
        <svg viewBox="0 0 24 24" fill="#d97d95" opacity="0.6"><path d="M12 2C9 7 4 9 2 12c2 3 7 5 10 10 3-5 8-7 10-10-2-3-7-5-10-10z"/></svg>
      </div>
      {/* Midground Sharp Petals */}
      <div className="nh-petal" style={{ top: "28%", left: "34%", width: "20px", height: "20px", animationDelay: "3s" }}>
        <svg viewBox="0 0 24 24" fill="#e898ae" opacity="0.75"><path d="M12 2C8 6 3 8 2 12c3 4 8 6 10 10 4-4 9-6 10-10-1-4-6-6-10-10z"/></svg>
      </div>
      <div className="nh-petal" style={{ top: "65%", left: "22%", width: "24px", height: "24px", animationDelay: "6s" }}>
        <svg viewBox="0 0 24 24" fill="#c44d71" opacity="0.65"><path d="M12 3C9 7 5 9 3 12c2 3 6 5 9 9 3-4 7-6 9-9-2-3-6-5-9-9z"/></svg>
      </div>
      {/* Foreground Blurred Petal */}
      <div className="nh-petal nh-petal-blur" style={{ top: "42%", right: "18%", width: "28px", height: "28px", animationDelay: "1.5s" }}>
        <svg viewBox="0 0 24 24" fill="#d97d95" opacity="0.5"><path d="M12 2C7 6 3 9 2 12c3 3 7 6 10 10 3-4 7-7 10-10-1-3-5-6-10-10z"/></svg>
      </div>
    </div>

    <AnimatePresence initial={false} custom={direction} mode="wait">
      <motion.div className={`nh-slide nh-slide-${current}`} key={item.id} role="group" aria-roledescription="slide" aria-label={`${current+1} / 3 — ${item.name}`}
        custom={direction} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:reduced?0:.22}}>
        <div className="nh-script" aria-hidden="true"><span>{item.script[0]}</span><span>{item.script[1]}</span></div>
        <motion.div className="nh-product" initial={{x:reduced?0:direction*160,opacity:0}} animate={{x:0,opacity:1}} transition={{duration:reduced?0:.85,ease:[.16,1,.3,1]}}><Product item={item}/></motion.div>
        <div className="nh-copy">
          <div className="nh-eyebrow"><span className="nh-flourish" aria-hidden="true">❧</span><span>{item.category}</span></div>
          <h1><span>{item.title}</span><em>{item.highlight}</em></h1>
          <p className="nh-subtitle"><span aria-hidden="true">༺</span>{item.subtitle}<span aria-hidden="true">༻</span></p>
          <div className="nh-offer"><div className="nh-regular">রেগুলার : <s>{item.regularPrice}</s></div><div className="nh-price"><span aria-hidden="true" className="nh-price-star">✥</span><div><span>আফটার ডিসকাউন্ট:</span><strong>{item.discountPrice}</strong></div><span aria-hidden="true" className="nh-price-star">✥</span></div></div>
          <div className="nh-features">{item.features.map((label,index) => { const Icon = icons[index]; return <div key={label}><span><Icon strokeWidth={1.35}/></span><p>{label}</p></div>; })}</div>
          <a
            className="nh-order"
            href={href}
            onClick={(e) => {
              if (href.startsWith("#")) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                  target.scrollIntoView({ behavior: "smooth", block: "start" });
                } else {
                  window.location.hash = href;
                }
              }
            }}
          >
            <ShoppingBag size={23}/><span>এখনই অর্ডার করুন</span><ArrowRight size={23}/>
          </a>
          <p className="nh-trust">সুন্দর ঘ্রাণ <b>•</b> সুন্দর আপনি <b>•</b> নিয়ামাহর সাথে সর্বদা–</p>
        </div>
        <aside className="nh-card">
          <div className="nh-card-top"><span><strong>{String(current+1).padStart(2,"0")}</strong> / 03</span><span>{item.card}</span></div>
          <h2>{item.name}</h2><p className="nh-card-note">{item.note}</p>
          <dl>{item.specs.map(([label,value],index) => { const Icon=specIcons[index]; return <div key={label}><dt><Icon size={21}/>{label}</dt><dd><span>–</span>{value}</dd></div>; })}<div className="nh-card-price"><dt><Tag size={21}/>অফার মূল্য</dt><dd><span>:</span><strong>{item.discountPrice}</strong></dd></div></dl>
          <p className="nh-card-script">Beauty in<br/><span>Every Moment ♡</span></p>
        </aside>
      </motion.div>
    </AnimatePresence>
    <button className="nh-arrow nh-prev" aria-label="আগের স্লাইড" onClick={() => go(current-1)}><ArrowLeft/></button>
    <button className="nh-arrow nh-next" aria-label="পরের স্লাইড" onClick={() => go(current+1)}><ArrowRight/></button>
    <div className="nh-navigation"><button className="nh-pause" aria-label={paused?"স্লাইড চালু করুন":"স্লাইড থামান"} onClick={() => setPaused(!paused)}>{paused?<Play size={13}/>:<Pause size={13}/>}</button><div className="nh-thumbnails">{collection.map((entry,index) => <button key={entry.id} className={`nh-thumb ${current===index?"is-active":""}`} aria-label={`${bn(index+1)} ${entry.name}`} aria-pressed={current===index} onClick={() => go(index)}><Product item={entry} thumb/><span><small>{bn(index+1)}</small>{entry.name}</span></button>)}</div></div>
  </section>;
}

