"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { CURATED_DROP_PRODUCTS, type CuratedDropProduct } from "./curated-drop-data";
import "./curated-drop.css";
import { CURATED_DROP_ENDS_AT } from "./curated-drop-data";

function Arrow({ back = false }: { back?: boolean }) {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={back ? { transform: "rotate(180deg)" } : undefined}><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function Flower() {
  return <svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><g stroke="currentColor" strokeWidth=".8">{Array.from({ length: 8 }, (_, i) => <ellipse key={i} cx="24" cy="14" rx="4" ry="10" transform={`rotate(${i * 45} 24 24)`} />)}<circle cx="24" cy="24" r="3" /></g></svg>;
}
function DropCountdown() {
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    const deadline = Date.parse(CURATED_DROP_ENDS_AT);
    const update = () => setRemaining(Number.isFinite(deadline) ? Math.max(0, Math.floor((deadline - Date.now()) / 1000)) : 0);
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);
  const values = remaining === null ? [null, null, null, null] : [Math.floor(remaining / 86400), Math.floor(remaining / 3600) % 24, Math.floor(remaining / 60) % 60, remaining % 60];
  return <aside className="ncd-countdown" aria-label="Seasonal drop countdown">
    <p>SEASONAL DROP ENDS IN</p>
    <div className="ncd-countdown-row"><Flower /><div className="ncd-countdown-units" role="timer" aria-live="off">{["DAYS", "HOURS", "MINS", "SECS"].map((label, i) => <span key={label}><strong>{values[i] === null ? "—" : String(values[i]).padStart(2, "0")}</strong><small>{label}</small></span>)}</div></div>
    {remaining === 0 && <span className="ncd-countdown-ended">THIS DROP HAS ENDED</span>}
  </aside>;
}
const number = (i: number) => String(i + 1).padStart(2, "0");

export function FlashSaleSection({ products = CURATED_DROP_PRODUCTS, onCollect }: {
  products?: CuratedDropProduct[];
  onCollect?: (product: CuratedDropProduct) => void;
} = {}) {
  const [selected, setSelected] = useState(0);
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const firstLayout = useRef(true);
  const active = products.length ? selected % products.length : 0;
  const select = (i: number) => setSelected((i + products.length) % products.length);

  useLayoutEffect(() => {
    const root = section.current;
    if (!root) return;
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const reveal = gsap.timeline({ paused: true });
      reveal.fromTo(root.querySelector(".ncd-backdrop"), { opacity: 0 }, { opacity: 1, duration: 1.3 }, 0);
      reveal.fromTo(root.querySelectorAll(".ncd-intro > *"), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1, stagger: .12 }, .1);
      const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { reveal.play(); observer.disconnect(); } }, { threshold: .1 });
      observer.observe(root);
      return () => observer.disconnect();
    });
    return () => media.revert();
  }, []);

  useLayoutEffect(() => {
    const el = stage.current;
    if (!el) return;
    const cards = Array.from(el.querySelectorAll<HTMLElement>(".ncd-card"));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timeline: gsap.core.Timeline | undefined;
    let frame = 0;
    const layout = (animate: boolean) => {
      timeline?.kill();
      const w = el.clientWidth;
      const mobile = window.innerWidth < 768;
      const h = mobile ? Math.min(565, w * 1.47) : el.clientHeight;
      const gap = mobile ? 14 : Math.max(14, w * .023);
      const heroWidth = mobile ? w : w * .52;
      const previewWidth = mobile ? (w - gap) / 2 : (w - heroWidth - 2 * gap) / 2;
      timeline = gsap.timeline({ defaults: { duration: animate && !reduce.matches ? .95 : 0, ease: "power3.inOut", overwrite: "auto" } });
      cards.forEach((card, index) => {
        const slot = (index - active + products.length) % products.length;
        const isActive = slot === 0;
        const x = isActive ? 0 : mobile ? (slot - 1) * (previewWidth + gap) : heroWidth + gap + (slot - 1) * (previewWidth + gap);
        const y = isActive ? 0 : mobile ? h + 24 : h * .21 + (slot - 1) * h * .025;
        timeline!.to(card, { x, y, width: isActive ? heroWidth : previewWidth, height: isActive ? h : mobile ? 228 : h * .66, opacity: isActive ? 1 : .57, zIndex: isActive ? 3 : 1 }, 0);
        timeline!.to(card.querySelector(".ncd-product"), { scale: isActive ? 1 : .85, filter: isActive ? "blur(0px)" : "blur(.35px)" }, 0);
        if (isActive && animate) timeline!.fromTo(card.querySelector(".ncd-details"), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: reduce.matches ? 0 : .5 }, reduce.matches ? 0 : .4);
      });
    };
    layout(!firstLayout.current);
    firstLayout.current = false;
    let initialResize = true;
    const observer = new ResizeObserver(() => { if (initialResize) { initialResize = false; return; } cancelAnimationFrame(frame); frame = requestAnimationFrame(() => layout(false)); });
    observer.observe(el);
    const onReducedMotion = () => layout(false);
    reduce.addEventListener("change", onReducedMotion);
    return () => { observer.disconnect(); reduce.removeEventListener("change", onReducedMotion); cancelAnimationFrame(frame); timeline?.kill(); };
  }, [active, products.length]);

  useLayoutEffect(() => {
    const root = section.current;
    if (!root) return;
    const media = gsap.matchMedia();
    media.add("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
      const product = root.querySelector('[data-active="true"] .ncd-parallax');
      const px = gsap.quickTo(product, "x", { duration: .8 });
      const py = gsap.quickTo(product, "y", { duration: .8 });
      const move = (e: PointerEvent) => { const r = root.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - .5; const y = (e.clientY - r.top) / r.height - .5; px(x * 20); py(y * 20); };
      const reset = () => { px(0); py(0); };
      root.addEventListener("pointermove", move); root.addEventListener("pointerleave", reset);
      return () => { root.removeEventListener("pointermove", move); root.removeEventListener("pointerleave", reset); };
    });
    return () => media.revert();
  }, [active]);

  if (!products.length) return null;
  return <section id="flash-sale" className="ncd" ref={section} aria-labelledby="ncd-heading" aria-roledescription="carousel" onKeyDown={e => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); select(active + (e.key === "ArrowRight" ? 1 : -1)); }
  }}>
    <div className="ncd-backdrop" aria-hidden="true" /><div className="ncd-light" aria-hidden="true" />
    <div className="ncd-composition">
      <header className="ncd-intro">
        <p className="ncd-eyebrow">LIMITED DROP <span /></p>
        <h2 id="ncd-heading" lang="bn">নির্বাচিত<br /><em>সংগ্রহ</em></h2>
        <p className="ncd-description" lang="bn">বিশুদ্ধতা, সৌন্দর্য আর আভিজাত্যের জন্য নির্বাচিত কিছু বিশেষ সৃষ্টি।</p>
        <div className="ncd-motto"><span />MODEST BEAUTY.<br />A BRIGHTER YOU.</div>
      </header>
      <div className="ncd-showcase">
        <DropCountdown />
        <div className="ncd-stage" ref={stage}>
          {products.map((product, index) => <article key={product.id} className="ncd-card" data-active={index === active} aria-label={`${number(index)} / ${products.length}: ${product.name}`}>
            <div className="ncd-card-top"><span>{product.category}</span><span>{number(index)} / {String(products.length).padStart(2, "0")}</span></div>
            <div className="ncd-art"><div className="ncd-parallax"><img className="ncd-product" src={product.image} alt={product.name} draggable={false} /></div><div className="ncd-shadow" /></div>
            <div className="ncd-details"><p className="ncd-brand">NIYAMAH · SIGNATURE COLLECTION</p><h3 lang="bn">{product.name}</h3><p className="ncd-emotion" lang="bn">{product.description}</p><div className="ncd-purchase">{product.price != null && <span className="ncd-price">৳{product.price.toLocaleString("bn-BD")}/-</span>}{onCollect ? <button type="button" className="ncd-cta" tabIndex={index === active ? 0 : -1} onClick={() => onCollect(product)}>এখনই সংগ্রহ করুন <Arrow /></button> : <a className="ncd-cta" href={product.href} tabIndex={index === active ? 0 : -1}>এখনই সংগ্রহ করুন <Arrow /></a>}</div></div>
            <div className="ncd-preview-caption" aria-hidden="true"><span>{product.nameEn}</span><small>{product.name}</small><i /></div>
            {index !== active && <button className="ncd-select" type="button" aria-label={`${product.name} দেখুন`} onClick={() => select(index)} />}
          </article>)}
        </div>
      </div>
    </div>
    <footer className="ncd-footer"><div className="ncd-signature"><Flower /><span>FAITH<br />BEAUTY<br />YOU</span></div><nav className="ncd-nav" aria-label="সংগ্রহ নির্বাচন">{products.map((p, i) => <button type="button" key={p.id} onClick={() => select(i)} aria-current={i === active ? "true" : undefined}><i /><span>{number(i)}</span><strong>{p.name}</strong><small>{p.nameEn}</small></button>)}</nav><div className="ncd-controls"><button type="button" aria-label="আগের সংগ্রহ" onClick={() => select(active - 1)}><Arrow back /></button><button type="button" aria-label="পরের সংগ্রহ" onClick={() => select(active + 1)}><Arrow /></button></div></footer>
    <span className="ncd-sr" aria-live="polite" aria-atomic="true">{products[active].name}, {active + 1} / {products.length}</span>
  </section>;
}
