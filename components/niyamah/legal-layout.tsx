'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Phone, ArrowLeft, ShieldCheck, FileText, RotateCcw, MessageCircle } from 'lucide-react';
import { LuxuryFooter } from './luxury-footer';
import './policy-page.css';

interface LegalLayoutProps {
  title: string;
  subtitle: string;
  badge?: string;
  activeTab: 'terms' | 'refund' | 'privacy';
  children: React.ReactNode;
}

export function LegalLayout({
  title,
  subtitle,
  badge = 'গ্রাহক অধিকার ও নীতিমালা',
  activeTab,
  children
}: LegalLayoutProps) {
  return (
    <div className="nlp-page">
      {/* Luxury Sticky Topbar */}
      <header className="nlp-topbar" role="banner">
        <div className="nlp-topbar-inner">
          <Link href="/" className="nlp-brand-link" aria-label="Niyamah Attires Home">
            <Image
              src="/niyamah/logo.png"
              alt="Niyamah Attires Logo"
              width={36}
              height={36}
              className="nlp-brand-logo"
            />
            <div className="nlp-brand-text">
              <span className="nlp-brand-title">NIYAMAH ATTIRES</span>
              <span className="nlp-brand-sub">নিয়ামাহ অ্যাটায়ার্স • ঢাকা</span>
            </div>
          </Link>

          <div className="nlp-topbar-actions">
            <Link href="/" className="nlp-back-btn">
              <ArrowLeft size={14} aria-hidden="true" />
              <span>হোমপেজে ফিরুন</span>
            </Link>
            <a href="tel:+8801760982072" className="nlp-hotline-btn" aria-label="কল করুন: +880 1760-982072">
              <Phone size={13} aria-hidden="true" />
              <span>+880 1760-982072</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Legal Shell */}
      <main className="nlp-shell">
        {/* Breadcrumb */}
        <nav className="nlp-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">হোম</Link>
          <span aria-hidden="true">/</span>
          <span>আইনি নীতিমালা</span>
          <span aria-hidden="true">/</span>
          <span style={{ color: '#fff' }}>{title}</span>
        </nav>

        {/* Hero Banner */}
        <div className="nlp-hero">
          <span className="nlp-hero-badge">{badge}</span>
          <h1>{title}</h1>
          <p className="nlp-hero-subtitle">{subtitle}</p>
        </div>

        {/* Interactive Policy Tabs Switcher */}
        <nav className="nlp-tabs" aria-label="Policy Navigation">
          <Link
            href="/terms-of-service"
            className={`nlp-tab ${activeTab === 'terms' ? 'is-active' : ''}`}
            aria-current={activeTab === 'terms' ? 'page' : undefined}
          >
            <FileText size={15} aria-hidden="true" />
            <span>শর্তাবলী (Terms)</span>
          </Link>
          <Link
            href="/refund-policy"
            className={`nlp-tab ${activeTab === 'refund' ? 'is-active' : ''}`}
            aria-current={activeTab === 'refund' ? 'page' : undefined}
          >
            <RotateCcw size={15} aria-hidden="true" />
            <span>রিটার্ন ও রিফান্ড (Refund)</span>
          </Link>
          <Link
            href="/privacy-policy"
            className={`nlp-tab ${activeTab === 'privacy' ? 'is-active' : ''}`}
            aria-current={activeTab === 'privacy' ? 'page' : undefined}
          >
            <ShieldCheck size={15} aria-hidden="true" />
            <span>গোপনীয়তা নীতি (Privacy)</span>
          </Link>
        </nav>

        {/* Policy Content */}
        <div className="nlp-content">
          {children}
        </div>

        {/* Contact Assistance Box */}
        <section className="nlp-contact-box" aria-label="Customer Support">
          <div className="nlp-contact-info">
            <h3>কোনো জিজ্ঞাসা বা সহায়তার প্রয়োজন?</h3>
            <p>আমাদের কাস্টমার কেয়ার প্রতিনিধি সকাল ৯টা থেকে রাত ৯টা পর্যন্ত আপনার সেবায় নিয়োজিত আছেন।</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <a
              href="https://wa.me/8801760982072"
              target="_blank"
              rel="noopener noreferrer"
              className="nlp-back-btn"
              style={{ padding: '12px 20px', fontSize: '13px' }}
            >
              <MessageCircle size={15} aria-hidden="true" />
              <span>WhatsApp চ্যাট</span>
            </a>
            <a href="tel:+8801760982072" className="nlp-contact-action">
              <Phone size={15} aria-hidden="true" />
              <span>হটলাইনে কল করুন</span>
            </a>
          </div>
        </section>
      </main>

      {/* Luxury Footer */}
      <LuxuryFooter />
    </div>
  );
}
