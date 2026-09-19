'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Fullscreen Lightbox Modal for inspecting product and variant images in high resolution.
 */
export function ImageLightboxModal({ item, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="admin-lightbox-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
    >
      <div className="admin-lightbox-content" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="admin-lightbox-close"
          onClick={onClose}
          aria-label="Close image preview"
        >
          ✕
        </button>
        <div className="admin-lightbox-media">
          <img
            src={item.image}
            alt={item.bengaliName || item.title || item.label}
            className="admin-lightbox-img"
          />
        </div>
        <div className="admin-lightbox-footer">
          <div className="admin-lightbox-info">
            {item.category ? (
              <span className="admin-lightbox-tag">{item.category}</span>
            ) : null}
            <strong className="admin-lightbox-title">
              {item.bengaliName || item.title || item.label}
            </strong>
            {item.englishName ? (
              <span className="admin-lightbox-sub">{item.englishName}</span>
            ) : null}
          </div>
          {item.sku ? <code className="admin-lightbox-sku">{item.sku}</code> : null}
        </div>
      </div>
    </div>,
    document.body
  );
}

/**
 * Customer Note Visual Cards (Sidebar) - Large, clear cards with click-to-enlarge.
 */
export function CustomerNoteVisuals({ combo }) {
  const [activeItem, setActiveItem] = useState(null);

  if (!combo?.hasCombo) return null;

  return (
    <>
      <div className="admin-note-visual-section">
        <div className="admin-note-visual-header">
          <span className="admin-note-visual-label">নির্বাচিত আইটেম (Selected Items):</span>
          <small className="admin-note-visual-hint">🔍 ক্লিক করে বড় দেখুন</small>
        </div>
        <div className="admin-note-visual-cards">
          {combo.hijab ? (
            <button
              type="button"
              className="admin-note-card-btn"
              onClick={() => setActiveItem(combo.hijab)}
              title="ক্লিক করে বড় করে দেখুন"
            >
              <div className="admin-note-card-thumb">
                <img
                  src={combo.hijab.image}
                  alt={combo.hijab.label}
                  className="admin-note-card-img"
                  loading="lazy"
                />
                <span className="admin-note-card-zoom-badge">🔍 বড় দেখুন</span>
              </div>
              <div className="admin-note-card-details">
                <span className="admin-note-card-category">{combo.hijab.category}</span>
                <strong className="admin-note-card-name">{combo.hijab.bengaliName}</strong>
                <span className="admin-note-card-sub">{combo.hijab.englishName}</span>
                <code className="admin-note-card-sku">{combo.hijab.sku}</code>
              </div>
            </button>
          ) : null}

          {combo.perfume ? (
            <button
              type="button"
              className="admin-note-card-btn"
              onClick={() => setActiveItem(combo.perfume)}
              title="ক্লিক করে বড় করে দেখুন"
            >
              <div className="admin-note-card-thumb">
                <img
                  src={combo.perfume.image}
                  alt={combo.perfume.label}
                  className="admin-note-card-img"
                  loading="lazy"
                />
                <span className="admin-note-card-zoom-badge">🔍 বড় দেখুন</span>
              </div>
              <div className="admin-note-card-details">
                <span className="admin-note-card-category">{combo.perfume.category}</span>
                <strong className="admin-note-card-name">{combo.perfume.bengaliName}</strong>
                <span className="admin-note-card-sub">{combo.perfume.englishName}</span>
                <code className="admin-note-card-sku">{combo.perfume.sku}</code>
              </div>
            </button>
          ) : null}
        </div>
      </div>

      {activeItem ? (
        <ImageLightboxModal item={activeItem} onClose={() => setActiveItem(null)} />
      ) : null}
    </>
  );
}

/**
 * Selected Combo Showcase (Main Column) - Generous cards with large photos and click-to-enlarge.
 */
export function OrderComboShowcase({ combo }) {
  const [activeItem, setActiveItem] = useState(null);

  if (!combo?.hasCombo) return null;

  const packageItem = {
    image: '/niyamah/order/prod-3.webp',
    title: 'টিউলিপ গিফট সেট',
    bengaliName: 'টিউলিপ প্যাকেজ (লাক্সারি গিফট সেট)',
    englishName: 'Signature Box & Bag Included',
    sku: 'NYM-TLP-001',
    category: 'উপহার প্যাকেজ',
  };

  return (
    <>
      <div className="admin-combo-section">
        <div className="admin-combo-header">
          <span className="admin-combo-icon">🛍️</span>
          <div>
            <strong>কাস্টমারের নির্বাচিত সেট (Selected Combo Items)</strong>
            <small>অর্ডারের প্যাকেজে গ্রাহক যে হিজাব ও পারফিউম পছন্দ করেছেন (ছবিতে ক্লিক করে বড় দেখুন)</small>
          </div>
        </div>
        <div className="admin-combo-grid">
          {combo.hijab ? (
            <div
              className="admin-combo-card admin-combo-card-clickable"
              onClick={() => setActiveItem(combo.hijab)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setActiveItem(combo.hijab)}
              title="ক্লিক করে বড় করে দেখুন"
            >
              <div className="admin-combo-card-media">
                <img
                  src={combo.hijab.image}
                  alt={combo.hijab.label}
                  className="admin-combo-card-img"
                />
                <span className="admin-combo-card-tag">{combo.hijab.category}</span>
                <span className="admin-combo-card-zoom-hint">🔍 বড় করে দেখুন</span>
              </div>
              <div className="admin-combo-card-body">
                <strong className="admin-combo-card-title">{combo.hijab.bengaliName}</strong>
                <span className="admin-combo-card-subtitle">{combo.hijab.englishName}</span>
                <code className="admin-combo-card-sku">{combo.hijab.sku}</code>
              </div>
            </div>
          ) : null}

          {combo.perfume ? (
            <div
              className="admin-combo-card admin-combo-card-clickable"
              onClick={() => setActiveItem(combo.perfume)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setActiveItem(combo.perfume)}
              title="ক্লিক করে বড় করে দেখুন"
            >
              <div className="admin-combo-card-media">
                <img
                  src={combo.perfume.image}
                  alt={combo.perfume.label}
                  className="admin-combo-card-img"
                />
                <span className="admin-combo-card-tag">{combo.perfume.category}</span>
                <span className="admin-combo-card-zoom-hint">🔍 বড় করে দেখুন</span>
              </div>
              <div className="admin-combo-card-body">
                <strong className="admin-combo-card-title">{combo.perfume.bengaliName}</strong>
                <span className="admin-combo-card-subtitle">{combo.perfume.englishName}</span>
                <code className="admin-combo-card-sku">{combo.perfume.sku}</code>
              </div>
            </div>
          ) : null}

          <div
            className="admin-combo-card admin-combo-card-pkg admin-combo-card-clickable"
            onClick={() => setActiveItem(packageItem)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setActiveItem(packageItem)}
            title="ক্লিক করে বড় করে দেখুন"
          >
            <div className="admin-combo-card-media">
              <img
                src={packageItem.image}
                alt={packageItem.title}
                className="admin-combo-card-img"
              />
              <span className="admin-combo-card-tag">{packageItem.category}</span>
              <span className="admin-combo-card-zoom-hint">🔍 বড় করে দেখুন</span>
            </div>
            <div className="admin-combo-card-body">
              <strong className="admin-combo-card-title">{packageItem.title}</strong>
              <span className="admin-combo-card-subtitle">{packageItem.englishName}</span>
              <code className="admin-combo-card-sku">{packageItem.sku}</code>
            </div>
          </div>
        </div>
      </div>

      {activeItem ? (
        <ImageLightboxModal item={activeItem} onClose={() => setActiveItem(null)} />
      ) : null}
    </>
  );
}

/**
 * Clickable Order Line Item Thumbnail
 */
export function OrderItemThumbnail({ item, imageUrl }) {
  const [isOpen, setIsOpen] = useState(false);

  const previewItem = {
    image: imageUrl,
    title: item.productName,
    bengaliName: item.productName,
    englishName: item.variantLabel || item.sku || '',
    sku: item.sku || '',
    category: 'অর্ডার আইটেম',
  };

  return (
    <>
      <button
        type="button"
        className="admin-item-thumb-btn"
        onClick={() => setIsOpen(true)}
        title="ক্লিক করে ছবি বড় দেখুন"
      >
        <img
          src={imageUrl}
          alt={item.productName}
          className="admin-item-thumb-img"
          loading="lazy"
        />
        <span className="admin-item-thumb-zoom">🔍</span>
      </button>

      {isOpen ? (
        <ImageLightboxModal item={previewItem} onClose={() => setIsOpen(false)} />
      ) : null}
    </>
  );
}
