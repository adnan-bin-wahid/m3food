'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Phone,
  MessageSquare,
  ArrowLeft,
  AlertCircle,
  MapPin,
  Calendar,
  Layers,
} from 'lucide-react';
import { LuxuryFooter } from '../../components/niyamah/luxury-footer';
import '../../components/niyamah/policy-page.css';
import '../../components/niyamah/order-tracking.css';

interface OrderItem {
  name: string;
  variant: string | null;
  quantity: number;
  priceMinor: number;
}

interface ShipmentInfo {
  provider: string;
  status: string;
  consignmentId: string | null;
  trackingCode: string | null;
  providerStatus: string | null;
  trackingUrl: string | null;
  submittedAt: string | null;
}

interface TrackedOrder {
  publicId: string;
  status: string;
  customerName: string;
  maskedPhone: string;
  deliveryArea: string;
  subtotalMinor: number;
  shippingMinor: number;
  totalMinor: number;
  currency: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  shipment: ShipmentInfo | null;
}

const STATUS_MAP: Record<string, { labelBn: string; step: number; class: string }> = {
  PENDING: { labelBn: 'অর্ডার গৃহীত হয়েছে', step: 1, class: 'not-status-pending' },
  CONFIRMED: { labelBn: 'অর্ডার কনফার্মড', step: 2, class: 'not-status-confirmed' },
  PROCESSING: { labelBn: 'প্যাকেজিং চলছে', step: 3, class: 'not-status-processing' },
  SHIPPED: { labelBn: 'কুরিয়ারে হস্তান্তর', step: 4, class: 'not-status-shipped' },
  DELIVERED: { labelBn: 'ডেলিভারি সম্পন্ন', step: 5, class: 'not-status-delivered' },
  CANCELLED: { labelBn: 'অর্ডার বাতিল', step: 0, class: 'not-status-cancelled' },
};

function formatTaka(minor: number): string {
  return '৳' + (minor / 100).toLocaleString('en-BD');
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('bn-BD', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Dhaka',
  }).format(new Date(iso));
}

export default function OrderTrackingPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [orders, setOrders] = useState<TrackedOrder[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = query.trim();
    if (clean.length < 4) {
      setErrorMsg('দয়া করে সঠিক ফোন নম্বর অথবা অর্ডার আইডি দিন (কমপক্ষে ৪টি অক্ষর/সংখ্যা)।');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setHasSearched(true);

    try {
      const res = await fetch('/api/v1/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: clean }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'অর্ডার ট্র্যাক করতে সমস্যা হয়েছে। দয়া করে একটু পর চেষ্টা করুন।');
        setOrders([]);
      } else {
        setOrders(data.orders || []);
      }
    } catch {
      setErrorMsg('সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি। অনুগ্রহ করে ইন্টারনেট সংযোগ পরীক্ষা করুন।');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

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

      {/* Main Track Shell */}
      <main className="not-track-shell">
        {/* Breadcrumb Navigation */}
        <nav className="nlp-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">হোম</Link>
          <span aria-hidden="true">/</span>
          <span style={{ color: '#ffffff' }}>পার্সেল ট্র্যাকিং</span>
        </nav>

        {/* Hero & Search Card */}
        <section className="not-hero-card">
          <div className="not-badge">
            <Truck size={14} />
            <span>পার্সেল ট্র্যাকিং • Live Order Tracking</span>
          </div>
          <h1 className="not-hero-title">আপনার অর্ডারের বর্তমান অবস্থা জানুন</h1>
          <p className="not-hero-sub">
            অর্ডার করার সময় ব্যবহৃত ফোন নম্বর (যেমন: 017xxxxxxxx) অথবা ইনভয়েসে পাওয়া অর্ডার রেফারেন্স আইডি দিয়ে সহজেই পার্সেল ট্র্যাক করুন।
          </p>

          <form className="not-search-form" onSubmit={handleSearch}>
            <div className="not-search-input-wrap">
              <Search className="not-search-icon" size={18} />
              <input
                type="text"
                className="not-search-input"
                placeholder="ফোন নম্বর বা অর্ডার আইডি লিখুন..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={loading}
              />
            </div>
            <button type="submit" className="not-search-btn" disabled={loading}>
              {loading ? (
                <>
                  <Clock size={16} className="animate-spin" />
                  <span>অনুসন্ধান হচ্ছে…</span>
                </>
              ) : (
                <>
                  <Search size={16} />
                  <span>অর্ডার ট্র্যাক করুন</span>
                </>
              )}
            </button>
          </form>

          {errorMsg && (
            <div style={{
              marginTop: '20px',
              padding: '12px 20px',
              background: 'rgba(239, 68, 68, 0.16)',
              border: '1px solid rgba(239, 68, 68, 0.38)',
              borderRadius: '12px',
              color: '#fca5a5',
              fontSize: '14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}
        </section>

        {/* Orders Results */}
        {hasSearched && !loading && (
          <section>
            {orders.length > 0 ? (
              orders.map((order) => {
                const statusMeta = STATUS_MAP[order.status] || {
                  labelBn: order.status,
                  step: 1,
                  class: 'not-status-pending',
                };
                const currentStep = statusMeta.step;

                return (
                  <article key={order.publicId} className="not-order-card">
                    {/* Header */}
                    <div className="not-card-header">
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h2 className="not-order-ref">{order.publicId}</h2>
                          <span style={{ fontSize: '12px', color: 'rgba(243, 223, 210, 0.65)' }}>({order.paymentMethod})</span>
                        </div>
                        <p className="not-order-date">
                          <Calendar size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
                          অর্ডার সময়: {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <span className={`not-status-pill ${statusMeta.class}`}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
                        {statusMeta.labelBn}
                      </span>
                    </div>

                    {/* Stepper Timeline (if not cancelled) */}
                    {order.status !== 'CANCELLED' && (
                      <div className="not-stepper" aria-label="Order progress">
                        <div className={`not-step ${currentStep >= 1 ? 'is-done' : ''} ${currentStep === 1 ? 'is-current' : ''}`}>
                          <div className="not-step-circle">
                            {currentStep > 1 ? <CheckCircle2 size={20} /> : <Package size={18} />}
                          </div>
                          <span className="not-step-label">১. অর্ডার প্লেসড</span>
                        </div>

                        <div className={`not-step ${currentStep >= 2 ? 'is-done' : ''} ${currentStep === 2 ? 'is-current' : ''}`}>
                          <div className="not-step-circle">
                            {currentStep > 2 ? <CheckCircle2 size={20} /> : <Clock size={18} />}
                          </div>
                          <span className="not-step-label">২. কনফার্মেশন</span>
                        </div>

                        <div className={`not-step ${currentStep >= 3 ? 'is-done' : ''} ${currentStep === 3 ? 'is-current' : ''}`}>
                          <div className="not-step-circle">
                            {currentStep > 3 ? <CheckCircle2 size={20} /> : <Layers size={18} />}
                          </div>
                          <span className="not-step-label">৩. প্যাকেজিং</span>
                        </div>

                        <div className={`not-step ${currentStep >= 4 ? 'is-done' : ''} ${currentStep === 4 ? 'is-current' : ''}`}>
                          <div className="not-step-circle">
                            {currentStep > 4 ? <CheckCircle2 size={20} /> : <Truck size={18} />}
                          </div>
                          <span className="not-step-label">৪. কুরিয়ারে হস্তান্তর</span>
                        </div>

                        <div className={`not-step ${currentStep >= 5 ? 'is-done' : ''} ${currentStep === 5 ? 'is-current' : ''}`}>
                          <div className="not-step-circle">
                            <CheckCircle2 size={20} />
                          </div>
                          <span className="not-step-label">৫. ডেলিভার্ড</span>
                        </div>
                      </div>
                    )}

                    {/* Steadfast Courier Integration Box */}
                    {order.shipment && (
                      <div className="not-courier-box">
                        <div className="not-courier-info">
                          <span className="not-courier-badge">
                            <Truck size={12} />
                            ডেলিভারি পার্টনার
                          </span>
                          <h3 className="not-courier-code">
                            Steadfast Courier · ট্র্যাকিং কোড: <strong>{order.shipment.trackingCode || 'প্রক্রিয়াধীন'}</strong>
                          </h3>
                          {order.shipment.consignmentId && (
                            <p className="not-courier-sub">
                              কনসাইনমেন্ট আইডি: #{order.shipment.consignmentId}
                            </p>
                          )}
                        </div>

                        {order.shipment.trackingUrl && (
                          <a
                            href={order.shipment.trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="not-courier-btn"
                          >
                            <span>স্টিডফাস্টে লাইভ লোকেশন দেখুন</span>
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    )}

                    {/* Details: Items & Delivery Info */}
                    <div className="not-details-grid">
                      {/* Products list */}
                      <div className="not-sub-panel">
                        <h3>
                          <Package size={14} />
                          অর্ডারের পণ্যসমূহ
                        </h3>
                        {order.items.map((item, idx) => (
                          <div key={idx} className="not-item-row">
                            <div>
                              <strong>{item.name}</strong>
                              {item.variant ? <div style={{ fontSize: '12px', color: 'rgba(243, 223, 210, 0.65)' }}>ভ্যারিয়েন্ট: {item.variant}</div> : null}
                            </div>
                            <div>
                              <span>{item.quantity} পিস</span>
                            </div>
                          </div>
                        ))}

                        <div className="not-item-row" style={{ marginTop: '8px', color: 'rgba(243, 223, 210, 0.7)' }}>
                          <span>ডেলিভারি চার্জ</span>
                          <span>{formatTaka(order.shippingMinor)}</span>
                        </div>

                        <div className="not-total-row">
                          <span>সর্বমোট বকেয়া (ক্যাশ অন ডেলিভারি)</span>
                          <span>{formatTaka(order.totalMinor)}</span>
                        </div>
                      </div>

                      {/* Recipient info */}
                      <div className="not-sub-panel">
                        <h3>
                          <MapPin size={14} />
                          ডেলিভারি বিবরণ
                        </h3>
                        <div style={{ fontSize: '13.5px', lineHeight: '1.8', color: '#f3dfd2' }}>
                          <p style={{ margin: '0 0 8px' }}>
                            <strong style={{ color: '#d7bb8c' }}>প্রাপক:</strong> {order.customerName}
                          </p>
                          <p style={{ margin: '0 0 8px' }}>
                            <strong style={{ color: '#d7bb8c' }}>ফোন:</strong> {order.maskedPhone}
                          </p>
                          <p style={{ margin: '0 0 8px' }}>
                            <strong style={{ color: '#d7bb8c' }}>এরিয়া / জেলা:</strong> {order.deliveryArea}
                          </p>
                          <p style={{ margin: 0, fontSize: '12px', color: 'rgba(243, 223, 210, 0.65)' }}>
                            ডেলিভারি সংক্রান্ত যেকোনো জিজ্ঞাসায় আমাদের হেল্পলাইনে যোগাযোগ করুন।
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="not-empty-state">
                <div className="not-empty-icon">
                  <Package size={30} strokeWidth={1.75} />
                </div>
                <h2 className="not-empty-title">কোনো অর্ডার খুঁজে পাওয়া যায়নি</h2>
                <p className="not-empty-desc">
                  আপনি যে ফোন নম্বর বা আইডি দিয়েছেন সেটির সাথে কোনো অর্ডারের মিল পাওয়া যায়নি। অনুগ্রহ করে নম্বরটি সঠিকভাবে টাইপ করেছেন কিনা নিশ্চিত করুন।
                </p>
                <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <a
                    href="https://wa.me/8801760982072"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="nlp-contact-btn"
                    style={{ background: '#25D366', color: '#ffffff' }}
                  >
                    <MessageSquare size={16} />
                    <span>WhatsApp-এ সহায়তা নিন</span>
                  </a>
                  <a
                    href="tel:+8801760982072"
                    className="nlp-contact-btn"
                    style={{ background: 'linear-gradient(135deg, #e2cb9d 0%, #d7bb8c 100%)', color: '#14050a' }}
                  >
                    <Phone size={16} />
                    <span>হটলাইনে কল করুন</span>
                  </a>
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Haute-Couture Luxury Footer */}
      <LuxuryFooter />
    </div>
  );
}
