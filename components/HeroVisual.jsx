'use client';

import Image from 'next/image';
import { useRef } from 'react';

export default function HeroVisual() {
  const stageRef = useRef(null);

  function onMove(event) {
    const node = stageRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    node.style.setProperty('--rx', `${-y * 4.5}deg`);
    node.style.setProperty('--ry', `${x * 7}deg`);
    node.style.setProperty('--mx', `${x * 18}px`);
    node.style.setProperty('--my', `${y * 14}px`);
  }

  function onLeave() {
    const node = stageRef.current;
    if (!node) return;
    node.style.setProperty('--rx', '0deg');
    node.style.setProperty('--ry', '0deg');
    node.style.setProperty('--mx', '0px');
    node.style.setProperty('--my', '0px');
  }

  return (
    <div className="hero-stage-shell">
      <div className="hero-stage hero-stage-premium" ref={stageRef} onPointerMove={onMove} onPointerLeave={onLeave} aria-label="M3Food চুইঝাল মিষ্টি মসলার প্রিমিয়াম পণ্য ভিজ্যুয়াল">
        <div className="hero-organic-halo" />
        <div className="hero-orbit hero-orbit-a" />
        <div className="hero-orbit hero-orbit-b" />
        <span className="hero-leaf-float leaf-float-1">✦</span>
        <span className="hero-leaf-float leaf-float-2">●</span>
        <span className="hero-leaf-float leaf-float-3">✦</span>
        <div className="hero-product-cutout">
          <Image
            src="/media/hero-premium-transparent.png"
            alt="M3Food চুইঝাল মিষ্টি মসলা, পণ্য ও পরিবেশনের প্রিমিয়াম ভিজ্যুয়াল"
            fill
            priority
            sizes="(max-width: 900px) 94vw, 48vw"
            className="hero-cutout-image"
          />
        </div>
        <div className="flavor-chip chip-sweet"><span className="chip-icon">✦</span><div><b>মিষ্টি</b><small>প্রথম অনুভূতি</small></div></div>
        <div className="flavor-chip chip-heat"><span className="chip-icon">⌁</span><div><b>ঝাল</b><small>চুইঝালের ঝাঁঝ</small></div></div>
        <div className="flavor-chip chip-cool"><span className="chip-icon">❄</span><div><b>সতেজ</b><small>শেষের অনুভূতি</small></div></div>
        <div className="hero-price-pill"><span>বিশেষ অফার</span><del>৳১,৮৯০</del><b>৳১,২৫০</b></div>
      </div>
    </div>
  );
}
