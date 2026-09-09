/**
 * Client-safe: types + default values only — NO database or Node.js imports.
 * Storefront components import from here. Server-only DB logic lives in homepage-content.ts.
 */

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type HeroThemeName = "cream" | "emerald" | "gold" | "dark" | "blush";

export const HERO_THEME_PRESETS: Record<
  HeroThemeName,
  {
    label: string;
    bg: string;
    text: string;
    muted: string;
    accent: string;
    buttonBg: string;
    buttonText: string;
    panel: string;
    word: string;
    shadow: string;
  }
> = {
  blush: {
    label: "Blush Rose",
    bg: "#faf2f4",
    text: "#4a1c2a",
    muted: "rgba(106, 51, 67, 0.75)",
    accent: "#8f4d60",
    buttonBg: "#8f4d60",
    buttonText: "#ffffff",
    panel: "rgba(255, 255, 255, 0.72)",
    word: "rgba(143, 77, 96, 0.08)",
    shadow: "rgba(92, 42, 56, 0.16)",
  },
  cream: {
    label: "Cream",
    bg: "#f8f1e3",
    text: "#123d2a",
    muted: "rgba(18, 61, 42, 0.64)",
    accent: "#c9a24d",
    buttonBg: "#123d2a",
    buttonText: "#ffffff",
    panel: "rgba(255, 255, 255, 0.56)",
    word: "rgba(18, 61, 42, 0.075)",
    shadow: "rgba(18, 61, 42, 0.35)",
  },
  emerald: {
    label: "Emerald",
    bg: "#123d2a",
    text: "#f8f1e3",
    muted: "rgba(248, 241, 227, 0.68)",
    accent: "#d9b86c",
    buttonBg: "#d9b86c",
    buttonText: "#123d2a",
    panel: "rgba(248, 241, 227, 0.1)",
    word: "rgba(248, 241, 227, 0.075)",
    shadow: "rgba(0, 0, 0, 0.38)",
  },
  gold: {
    label: "Gold",
    bg: "#e8d3a3",
    text: "#18392b",
    muted: "rgba(24, 57, 43, 0.65)",
    accent: "#8a6422",
    buttonBg: "#18392b",
    buttonText: "#ffffff",
    panel: "rgba(255, 255, 255, 0.42)",
    word: "rgba(24, 57, 43, 0.08)",
    shadow: "rgba(24, 57, 43, 0.32)",
  },
  dark: {
    label: "Dark",
    bg: "#07160f",
    text: "#f8f1e3",
    muted: "rgba(248, 241, 227, 0.62)",
    accent: "#c9a24d",
    buttonBg: "#c9a24d",
    buttonText: "#07160f",
    panel: "rgba(248, 241, 227, 0.08)",
    word: "rgba(248, 241, 227, 0.07)",
    shadow: "rgba(0, 0, 0, 0.5)",
  },
};

export interface HeroFeatureBadge {
  icon: "leaf" | "flower" | "gem" | "sparkles" | "shield" | "gift";
  line1: string;
  line2: string;
}

export interface HeroVariantCard {
  id: string;
  num: string;
  name: string;
  image: string;
}

export interface HeroSlideData {
  id: string;
  status?: "active" | "draft";
  eyebrow: string;
  title: string;
  highlight: string;
  subtitle: string;
  titleLine1?: string;
  titleLine2?: string;
  titleWord1?: string;
  titleWord2?: string;
  subtitleLine?: string;
  eyebrowCategory?: string;
  eyebrowTagline?: string;
  description?: string;
  badge?: string;
  ctaPrimary: { label: string; href: string };
  primaryButtonText?: string;
  primaryButtonLink?: string;
  ctaSecondary?: { label: string; href: string };
  productName?: string;
  metadataLine?: string;
  cardName?: string;
  shortName?: string;
  subheading?: string;
  productImage?: string;
  productImageAlt?: string;
  sceneBgImage?: string;
  scriptArchNote?: string;
  scriptArchSub?: string;
  scriptCardNote?: string;
  scriptCardSub?: string;
  featureBadges?: HeroFeatureBadge[];
  cardCategory?: string;
  cardSubtitle?: string;
  cardSpecs?: { label: string; value: string }[];
  variantsList?: HeroVariantCard[];
  microTrust?: string;
  infoItems?: { label: string; value: string }[];
  bigWord1?: string;
  bigWord2?: string;
  theme?: HeroThemeName;
  colors?: {
    purple: string;
    lightBlue: string;
    green: string;
    infoGreen: string;
    white: string;
    orange: string;
    accent: string;
    shadow: string;
  };
  rightGradient: string;
  decoration: string;
  popularLinks?: { label: string; href: string }[];
}

export interface TickerItem {
  icon: string;
  text: string;
}

export interface DiscoveryData {
  eyebrow: string;
  title: string;
  subtitle: string;
  placeholder: string;
  trending: string[];
}

export interface NeedTileData {
  label: string;
  href: string;
  icon: string;
  badge?: string;
  tone?: "default" | "accent" | "danger";
}

export interface NeedsData {
  eyebrow: string;
  title: string;
  subtitle: string;
  tiles: NeedTileData[];
}

export interface TrustItemData {
  id: string;
  icon: string;
  title: string;
  short: string;
  details: string;
}

export interface TrustData {
  eyebrow: string;
  title: string;
  subtitle: string;
  items: TrustItemData[];
}

export interface EditorialCardData {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  gradient: string;
  decoration: string;
  isDark?: boolean;
}

export interface EditorialData {
  eyebrow: string;
  title: string;
  subtitle: string;
  cards: EditorialCardData[];
}

export interface TestimonialData {
  id: string;
  name: string;
  rating: number;
  body: string;
  location?: string;
  purchasedItem?: string;
}

export interface TestimonialsData {
  items: TestimonialData[];
}

export interface WhatsAppData {
  phoneNumber: string;
  defaultMessage: string;
  ctaTitle: string;
  ctaSubtitle: string;
  ctaPrimaryLabel: string;
  ctaSecondaryLabel: string;
  ctaSecondaryHref: string;
  enabled: boolean;
}

export interface FlashSaleData {
  enabled: boolean;
  title: string;
  hoursFromNow: number;
}

export type HomepageContent = {
  hero: HeroSlideData[];
  ticker: { items: TickerItem[] };
  discovery: DiscoveryData;
  needs: NeedsData;
  trust: TrustData;
  editorial: EditorialData;
  testimonials: TestimonialsData;
  whatsapp: WhatsAppData;
  flashSale: FlashSaleData;
};

// ─────────────────────────────────────────────
// Defaults
// ─────────────────────────────────────────────

export const HOMEPAGE_DEFAULTS = {
  hero: [
    {
      id: "floral-prayer-set",
      status: "active",
      eyebrowCategory: "MODEST WEAR",
      eyebrowTagline: "FOR A MORE BEAUTIFUL YOU",
      eyebrow: "MODEST WEAR • FOR A MORE BEAUTIFUL YOU",
      titleWord1: "Grace",
      titleWord2: "in Every Step",
      title: "Grace",
      highlight: "in Every Step",
      titleLine1: "Grace",
      titleLine2: "in Every Step",
      subtitleLine: "TIMELESS MODESTY, BEAUTIFULLY YOURS",
      subtitle: "TIMELESS MODESTY, BEAUTIFULLY YOURS",
      subheading: "ফ্লোরাল প্রেয়ার সেট • Signature Collection",
      description:
        "প্রিমিয়াম কটন ও নিখুঁত ফ্লোরাল প্রিন্টের মেলবন্ধনে তৈরি বিলাসবহুল নামাজের সেট। ইবাদতের প্রতিটি মুহূর্তে আপনাকে দেবে স্নিগ্ধ প্রশান্তি ও মার্জিত রূপ।",
      badge: "স্বাক্ষরিত কালেকশন • Signature Collection",
      scriptArchNote: "Modesty",
      scriptArchSub: "Looks Beautiful ♡",
      featureBadges: [
        { icon: "leaf", line1: "SOFT &", line2: "COMFORTABLE" },
        { icon: "flower", line1: "BEAUTIFUL", line2: "FLORAL PRINT" },
        { icon: "gem", line1: "ELEGANT", line2: "& MODEST" },
      ],
      ctaPrimary: { label: "SHOP NOW", href: "#order-section" },
      primaryButtonText: "SHOP NOW",
      primaryButtonLink: "#order-section",
      ctaSecondary: { label: "কালেকশন দেখুন • View All", href: "#catalog" },
      microTrust: "WEAR GOODNESS  •  SPREAD BEAUTY  •  BE YOU",
      productName: "Floral Prayer Set",
      cardCategory: "01 / 05",
      cardSubtitle: "SIGNATURE COLLECTION",
      metadataLine: "MODEST WEAR",
      cardSpecs: [
        { label: "Material", value: "Premium Cotton" },
        { label: "Size", value: "All Sizes (Free Size)" },
        { label: "Color", value: "Pink Floral" },
        { label: "What's Included", value: "Telekung + Skirt + Bag" },
      ],
      scriptCardNote: "Modesty",
      scriptCardSub: "is a form of beauty ♡",
      cardName: "Floral Prayer Set",
      shortName: "Floral Set",
      productImage: "/niyamah/slider/slider-2.png",
      sceneBgImage: "/niyamah/slider/global-bg.png",
      productImageAlt: "Floral Prayer Set on Luxury Marble Pedestal",
      bigWord1: "MODESTY",
      bigWord2: "BEAUTY",
      theme: "blush",
      infoItems: [
        { label: "ম্যাটেরিয়াল", value: "১০০% প্রিমিয়াম কটন" },
        { label: "সাইজ", value: "ফ্রি সাইজ (সকলের জন্য)" },
        { label: "প্যাকেজ", value: "টেলিকুং + স্কার্ট + ব্যাগ" },
      ],
      variantsList: [
        { id: "v1", num: "01", name: "Floral Set", image: "/niyamah/slider/slider-2.png" },
        { id: "v2", num: "02", name: "Sage Green", image: "/niyamah/slider/slider-2.png" },
        { id: "v3", num: "03", name: "Cream Blush", image: "/niyamah/slider/slider-2.png" },
        { id: "v4", num: "04", name: "Classic Black", image: "/niyamah/slider/slider-2.png" },
        { id: "v5", num: "05", name: "Dusty Rose", image: "/niyamah/slider/slider-2.png" },
      ],
      colors: {
        purple: "#4a1c2a",
        lightBlue: "#faf2f4",
        green: "#8f4d60",
        infoGreen: "#5c2a38",
        white: "#ffffff",
        orange: "#faf2f4",
        accent: "#8f4d60",
        shadow: "rgba(92, 42, 56, 0.16)",
      },
      rightGradient: "from-[#faf2f4] via-[#f7e8ec] to-[#f2d9e0]",
      decoration: "Floral",
      popularLinks: [
        { label: "ফ্লোরাল প্রেয়ার সেট", href: "#order-section" },
        { label: "মদিনা সিল্ক হিজাব", href: "#fabric-guide" },
        { label: "আর্টিসানাল আতর", href: "#fragrance-notes" },
      ],
    },
    {
      id: "orchid-arome",
      status: "active",
      eyebrowCategory: "HAUTE PARFUMERIE",
      eyebrowTagline: "PURE OIL EXTRAIT DE PARFUM",
      eyebrow: "আভিজাত্যের সুবাস • Artisanal Perfumery",
      titleWord1: "Orchid",
      titleWord2: "by AROME",
      title: "Orchid by AROME",
      highlight: "বিশুদ্ধ সুবাস ও আভিজাত্য",
      titleLine1: "Orchid",
      titleLine2: "by AROME",
      subtitleLine: "EXQUISITE FLORAL ESSENCE, TIMELESS SCENT",
      subtitle: "EXQUISITE FLORAL ESSENCE, TIMELESS SCENT",
      subheading: "অ্যালকোহল-মুক্ত এক্সট্রেইট • Pure Oil Extrait",
      description:
        "প্রাচীন ও নিখুঁত পদ্ধতিতে পরিশ্রুত ১০০% খাঁটি প্রাকৃতিক অর্কিড আতর। চামড়ায় দীর্ঘস্থায়ী রাজকীয় সুবাস ছড়ায় ১৬ ঘণ্টারও বেশি সময়।",
      badge: "১০০% খাঁটি বোটানিক্যাল অয়েল",
      scriptArchNote: "Botanical",
      scriptArchSub: "Pure Essence ♡",
      featureBadges: [
        { icon: "sparkles", line1: "100% PURE", line2: "BOTANICAL" },
        { icon: "shield", line1: "16+ HOURS", line2: "LONGEVITY" },
        { icon: "gem", line1: "ALCOHOL-FREE", line2: "EXTRAIT" },
      ],
      ctaPrimary: { label: "EXPLORE SCENT", href: "#order-section" },
      primaryButtonText: "EXPLORE SCENT",
      primaryButtonLink: "#order-section",
      ctaSecondary: { label: "সুগন্ধি নোটস • Notes", href: "#fragrance-notes" },
      microTrust: "ARTISANAL CRAFT  •  ETHICAL LUXURY  •  RARE BLEND",
      productName: "Orchid by AROME",
      cardCategory: "02 / 05",
      cardSubtitle: "ARTISANAL COLLECTION",
      metadataLine: "EXTRAIT DE PARFUM",
      cardSpecs: [
        { label: "Volume", value: "100ml Pure Extrait" },
        { label: "Formula", value: "Alcohol-Free Oil" },
        { label: "Key Notes", value: "Orchid & Taif Rose" },
        { label: "Longevity", value: "16+ Hours Sillage" },
      ],
      scriptCardNote: "Serenity",
      scriptCardSub: "is a memory that lingers ♡",
      cardName: "খাঁটি আতর",
      shortName: "Orchid Arome",
      productImage: "/niyamah/slider/slider-1.png",
      sceneBgImage: "/niyamah/slider/global-bg.png",
      productImageAlt: "Orchid by AROME Artisanal Luxury Perfume",
      bigWord1: "ORCHID",
      bigWord2: "AROME",
      theme: "blush",
      infoItems: [
        { label: "উপাদান", value: "খাঁটি অর্কিড ও তায়েফ গোলাপ" },
        { label: "স্থায়িত্ব", value: "১৬+ ঘণ্টা দীর্ঘস্থায়ী" },
        { label: "ফর্মুলা", value: "সম্পূর্ণ অ্যালকোহল মুক্ত" },
      ],
      variantsList: [
        { id: "v1", num: "01", name: "Floral Set", image: "/niyamah/slider/slider-2.png" },
        { id: "v2", num: "02", name: "Orchid Arome", image: "/niyamah/slider/slider-1.png" },
        { id: "v3", num: "03", name: "Gift Tote Set", image: "/niyamah/slider/slider-3.png" },
        { id: "v4", num: "04", name: "Royal Amber", image: "/niyamah/slider/slider-1.png" },
        { id: "v5", num: "05", name: "White Musk", image: "/niyamah/slider/slider-1.png" },
      ],
      colors: {
        purple: "#4a1c2a",
        lightBlue: "#faf2f4",
        green: "#8f4d60",
        infoGreen: "#5c2a38",
        white: "#ffffff",
        orange: "#faf2f4",
        accent: "#8f4d60",
        shadow: "rgba(92, 42, 56, 0.16)",
      },
      rightGradient: "from-[#faf2f4] via-[#f7e8ec] to-[#f2d9e0]",
      decoration: "Orchid",
    },
    {
      id: "telekung-tote-gift",
      status: "active",
      eyebrowCategory: "BESPOKE GIFTING",
      eyebrowTagline: "MEANINGFUL BLESSINGS FOR LOVED ONES",
      eyebrow: "প্রিয়জনের জন্য উপহার • Meaningful Islamic Gifts",
      titleWord1: "Cherished",
      titleWord2: "Moments",
      title: "Cherished Moments",
      highlight: "ভালোবাসা ও শ্রদ্ধার অনুপম উপহার",
      titleLine1: "Cherished",
      titleLine2: "Moments",
      subtitleLine: "THOUGHTFUL GIFTS FOR YOUR LOVED ONES",
      subtitle: "THOUGHTFUL GIFTS FOR YOUR LOVED ONES",
      subheading: "রেডি-টু-গিফট প্রিমিয়াম বক্স ও টোট",
      description:
        "সুদৃশ্য ফ্লোরাল টোট ব্যাগ ও প্রিমিয়াম প্রেয়ার সেটের রাজকীয় সমন্বয়—মা-বোন ও প্রিয়জনের জন্য ঈদ, বিয়ে ও বিশেষ দিনের শ্রেষ্ঠ হাদিয়া।",
      badge: "উপহারের জন্য প্রস্তুত • Ready to Gift",
      scriptArchNote: "Cherished",
      scriptArchSub: "Gifts of Grace ♡",
      featureBadges: [
        { icon: "gift", line1: "READY-TO-GIFT", line2: "LUXURY TOTE" },
        { icon: "flower", line1: "COMPLETE", line2: "PRAYER SET" },
        { icon: "gem", line1: "ELEGANT", line2: "GIFT CARD" },
      ],
      ctaPrimary: { label: "GIFT NOW", href: "#order-section" },
      primaryButtonText: "GIFT NOW",
      primaryButtonLink: "#order-section",
      ctaSecondary: { label: "কাস্টমাইজ উপহার • Custom Box", href: "#gift-builder" },
      microTrust: "ELEGANT PACKAGING  •  NATIONWIDE COD  •  1-3 DAYS",
      productName: "Telekung & Tote Set",
      cardCategory: "03 / 05",
      cardSubtitle: "CURATED COLLECTION",
      metadataLine: "ROYAL GIFT EDITION",
      cardSpecs: [
        { label: "Package", value: "Floral Tote & Bag" },
        { label: "Contents", value: "Prayer Set + Bag" },
        { label: "Occasion", value: "Eid, Hajj & Daily Gifts" },
        { label: "Delivery", value: "1–3 Days Nationwide COD" },
      ],
      scriptCardNote: "A Gift",
      scriptCardSub: "of prayer is an eternal blessing ♡",
      cardName: "গিফট টোট সেট",
      shortName: "Gift Tote Set",
      productImage: "/niyamah/slider/slider-3-product.png",
      sceneBgImage: "/niyamah/slider/global-bg.png",
      productImageAlt: "Telekung and Floral Tote Luxury Gift Set",
      bigWord1: "CHERISHED",
      bigWord2: "MOMENTS",
      theme: "blush",
      infoItems: [
        { label: "প্যাকেজিং", value: "ফ্লোরাল টোট ও গিফট বক্স" },
        { label: "উপহার", value: "ঈদ ও হাদিয়ার জন্য নিখুঁত" },
        { label: "ডেলিভারি", value: "সারা দেশে ক্যাশ অন ডেলিভারি" },
      ],
      variantsList: [
        { id: "v1", num: "01", name: "Floral Set", image: "/niyamah/slider/slider-2.png" },
        { id: "v2", num: "02", name: "Sage Green", image: "/niyamah/slider/slider-2.png" },
        { id: "v3", num: "03", name: "Gift Tote Set", image: "/niyamah/slider/slider-3.png" },
        { id: "v4", num: "04", name: "Classic Black", image: "/niyamah/slider/slider-2.png" },
        { id: "v5", num: "05", name: "Dusty Rose", image: "/niyamah/slider/slider-2.png" },
      ],
      colors: {
        purple: "#4a1c2a",
        lightBlue: "#faf2f4",
        green: "#8f4d60",
        infoGreen: "#5c2a38",
        white: "#ffffff",
        orange: "#faf2f4",
        accent: "#8f4d60",
        shadow: "rgba(92, 42, 56, 0.16)",
      },
      rightGradient: "from-[#faf2f4] via-[#f7e8ec] to-[#f2d9e0]",
      decoration: "Gift",
      popularLinks: [
        { label: "মা-বাবার জন্য উপহার", href: "#order-section" },
        { label: "বিয়ে ও হাদিয়া সেট", href: "#order-section" },
      ],
    },
  ] satisfies HeroSlideData[],

  ticker: {
    items: [
      { icon: "card", text: "সারা বাংলাদেশে ক্যাশ অন ডেলিভারি (Cash on Delivery Available)" },
      { icon: "message", text: "হটলাইন ও অর্ডার সহায়তা: ০৯৬১৩-২৪০২৪০ · WhatsApp Concierge" },
      { icon: "truck", text: "১–৩ কার্যদিবসে দ্রুততম হোম ডেলিভারি (Nationwide Express)" },
      { icon: "refresh", text: "৭ দিনের সহজ রিটার্ন ও এক্সচেঞ্জ গ্যারান্টি (7-Day Return)" },
      { icon: "shield", text: "১০০% খাঁটি ও গুণগত মানসম্পন্ন ইসলামিক পণ্য (Verified Quality)" },
    ] satisfies TickerItem[],
  },

  discovery: {
    eyebrow: "দ্রুত অনুসন্ধান • Quick Finder",
    title: "আপনার কাঙ্ক্ষিত পণ্যটি খুঁজুন",
    subtitle: "পবিত্র কুরআন, সিল্ক ওড়না, খাঁটি আতর, গিফট বক্স এবং ইবাদতের সামগ্রী।",
    placeholder: "কুরআন, মদিনা সিল্ক, আতর, জায়নামাজ, গিফট বক্স খুঁজুন…",
    trending: [
      "কালার-কোডেড কুরআন",
      "মদিনা সিল্ক ওড়না",
      "কম্বোডিয়ান খাঁটি উদ",
      "রয়েল গিফট বক্স",
      "মেমোরি ফোম জায়নামাজ",
      "ক্রিস্টাল তাসবিহ",
    ],
  } satisfies DiscoveryData,

  needs: {
    eyebrow: "মার্জিত কেনাকাটা • Curated Collections",
    title: "প্রয়োজন অনুযায়ী নির্বাচন করুন",
    subtitle: "কুরআন তিলাওয়াত, মার্জিত পর্দা, সুরভিত আতর ও প্রিয়জনকে উপহারের জন্য সেরা সংগ্রহ।",
    tiles: [
      { label: "পবিত্র কুরআন শরিফ", href: "/category/quran", icon: "book", tone: "accent", badge: "জনপ্রিয়" },
      { label: "মদিনা সিল্ক ওড়না", href: "/category/hijab", icon: "sparkles", tone: "accent", badge: "নতুন" },
      { label: "খাঁটি আতর ভল্ট", href: "/category/attar", icon: "heart" },
      { label: "রয়েল গিফট বক্স", href: "/category/gift-box", icon: "gift", tone: "accent", badge: "উপহার" },
      { label: "জায়নামাজ ও তাসবিহ", href: "/category/prayer-mat", icon: "sparkles" },
      { label: "বাংলা অনুবাদ কুরআন", href: "/category/bengali-quran", icon: "book" },
      { label: "সকল পণ্য সম্ভার", href: "/products", icon: "bag" },
    ],
  } satisfies NeedsData,

  trust: {
    eyebrow: "কেন নিয়ামাহ্ • Why Niyamah Attires",
    title: "আমাদের ৪টি মূল অঙ্গীকার",
    subtitle: "প্রতিটি পণ্যের বিশুদ্ধতা ও আপনার সন্তুষ্টিই আমাদের সর্বোচ্চ অগ্রাধিকার।",
    items: [
      {
        id: "cod",
        icon: "card",
        title: "ক্যাশ অন ডেলিভারি",
        short: "পণ্য দেখে মূল্য পরিশোধ",
        details:
          "ডেলিভারি ম্যানের কাছ থেকে পার্সেল খুলে যাচাই করে তারপর মূল্য পরিশোধ করার পূর্ণ সুবিধা। বাংলাদেশের যেকোনো জেলা ও উপজেলায় প্রযোজ্য।",
      },
      {
        id: "delivery",
        icon: "truck",
        title: "এক্সপ্রেস হোম ডেলিভারি",
        short: "১–৩ কার্যদিবসে ডেলিভারি",
        details:
          "ঢাকার ভেতরে ২৪–৪৮ ঘণ্টার মধ্যে এবং ঢাকার বাইরে ১–৩ দিনের মধ্যে নির্ভরযোগ্য কুরিয়ারের মাধ্যমে নিরাপদে আপনার দোরগোড়ায় পৌঁছে দেওয়া হয়।",
      },
      {
        id: "returns",
        icon: "refresh",
        title: "৭ দিনের সহজ এক্সচেঞ্জ",
        short: "নিশ্চিন্ত কেনাকাটা",
        details:
          "পণ্য হাতে পাওয়ার পর সাইজ, কালার বা কোনো কারণে সন্তুষ্ট না হলে ৭ দিনের মধ্যে সহজেই এক্সচেঞ্জ বা রিটার্ন করার নিশ্চয়তা।",
      },
      {
        id: "secure",
        icon: "shield",
        title: "১০০% খাঁটি ও পরীক্ষিত",
        short: "আর্টিসানাল কোয়ালিটি",
        details:
          "আমাদের প্রতিটি সিল্ক ফেব্রিক, আতর অয়েল ও কুরআন শরিফ নিজস্ব তত্ত্বাবধানে যাচাইকৃত। কোনো ধরনের নকল বা নিম্নমানের পণ্যের সুযোগ নেই।",
      },
      {
        id: "support",
        icon: "message",
        title: "ভিআইপি কনসিয়ার্জ সেবা",
        short: "হটলাইন ও WhatsApp",
        details:
          "সকাল ৯টা থেকে রাত ১১টা পর্যন্ত সাইজ নির্বাচন, আতরের ঘ্রাণ পছন্দ বা গিফট কাস্টমাইজেশনে আমাদের এক্সপার্ট টিম আপনাকে তাৎক্ষণিক সহায়তা প্রদান করে।",
      },
      {
        id: "verified",
        icon: "star",
        title: "বাস্তব গ্রাহক মূল্যায়ন",
        short: "৪.৯★ রেটিং (২,৭৪৫+ রিভিউ)",
        details:
          "আমাদের প্রতিটি রিভিউ আসল ও ভেরিফায়েড ক্রেতাদের বাস্তব প্রতিক্রিয়া। গ্রাহকদের বিশ্বাস ও ভালোবাসাই আমাদের পথ চলার শক্তি।",
      },
    ],
  } satisfies TrustData,

  editorial: {
    eyebrow: "আমাদের দর্শন ও ঐতিহ্য • The Brand Manifesto",
    title: "প্রতিটি সুতোয় মর্যাদা, প্রতিটি সুবাসে প্রশান্তি",
    subtitle: "Grace in Every Thread & Note — পবিত্রতা, নান্দনিকতা ও আভিজাত্যের মিলনমেলা।",
    cards: [
      {
        eyebrow: "দ্য সিল্ক আটেলিয়ার • Haute Hijab",
        title: "মদিনা সিল্ক ওড়না",
        description:
          "শ্বাসপ্রশ্বাসযোগ্য প্রাকৃতিক তন্তু, ১০০% অপেক পর্দা ও মাখনের মতো মসৃণ ড্র্যাপের সমন্বয়ে তৈরি রাজকীয় ওড়না।",
        href: "/category/hijab",
        cta: "সিল্ক কালেকশন দেখুন",
        gradient: "from-[#EAF4D5] via-[#FAF7EE] to-[#EFE6D2]",
        decoration: "SILK",
      },
      {
        eyebrow: "দ্য আতর ভল্ট • Artisanal Extrait",
        title: "বিশুদ্ধ আতর ও সুবাস",
        description:
          "কম্বোডিয়ান খাঁটি উদ, তাইফ গোলাপ ও রাজকীয় অ্যাম্বারের নির্যাস—সম্পূর্ণ অ্যালকোহল মুক্ত ও দীর্ঘস্থায়ী।",
        href: "/category/attar",
        cta: "আতর সংগ্রহ দেখুন",
        gradient: "from-[#043D25] via-[#0A4D2E] to-[#11160F]",
        decoration: "ATTAR",
        isDark: true,
      },
      {
        eyebrow: "পবিত্র কুরআন সংগ্রহ • Sacred Library",
        title: "কালার-কোডেড কুরআন",
        description:
          "সহজ তাজবীদ ও শুদ্ধ তিলাওয়াতের জন্য বিশেষ হরফের বিন্যাস, প্রিমিয়াম পেপার ও রাজকীয় বাইন্ডিং।",
        href: "/category/quran",
        cta: "কুরআন শরিফ দেখুন",
        gradient: "from-[#EAF4D5] via-[#FAF7EE] to-[#EFE6D2]",
        decoration: "QURAN",
      },
    ],
  } satisfies EditorialData,

  testimonials: {
    items: [
      {
        id: "t1",
        name: "সাদিয়া ইসলাম",
        rating: 5,
        body: "মদিনা সিল্ক ওড়নাটি হাতে পেয়ে সত্যিই মুগ্ধ হয়েছি। ফেব্রিকটি অত্যন্ত আরামদায়ক, মাথা থেকে পিছলে পড়ে না এবং রঙটি ছবিতে যেমন দেখেছি বাস্তবেও ঠিক তেমনই সুন্দর।",
        location: "ধানমন্ডি, ঢাকা",
        purchasedItem: "Medina Silk Hijab • Emerald",
      },
      {
        id: "t2",
        name: "তানভীর আহমেদ",
        rating: 5,
        body: "কম্বোডিয়ান উদ আতরটির ঘ্রাণ অসাধারণ আভিজাত্যপূর্ণ। কাপড়ে পরার পর পুরো দিন সুবাস ছিল। প্যাকেজিং এবং দ্রুত ডেলিভারির জন্য নিয়ামাহ্ টিমকে ধন্যবাদ।",
        location: "জিইসি মোড়, চট্টগ্রাম",
        purchasedItem: "Cambodian Oud Extrait",
      },
      {
        id: "t3",
        name: "ফাতেমা তুজ জোহরা",
        rating: 5,
        body: "আমার মায়ের জন্মদিনে রয়েল গিফট বক্সটি উপহার দিয়েছিলাম। কুরআন শরিফ ও জায়নামাজের কোয়ালিটি দেখে মা খুব খুশি হয়েছেন। ক্যাশ অন ডেলিভারিতে চেক করে নেওয়ার সুবিধাও ছিল।",
        location: "উপশহর, সিলেট",
        purchasedItem: "Royal Islamic Gift Box",
      },
    ],
  } satisfies TestimonialsData,

  whatsapp: {
    phoneNumber: "8809613240240",
    defaultMessage: "আসসালামু আলাইকুম, নিয়ামাহ্ আতায়ারস থেকে পণ্য অর্ডার ও তথ্য জানতে চাই।",
    ctaTitle: "অর্ডার করতে কোনো সহায়তা প্রয়োজন?",
    ctaSubtitle:
      "সাইজ নির্বাচন, আতরের নোটস, উপহার বক্স কাস্টমাইজেশন বা ক্যাশ অন ডেলিভারি সম্পর্কে যেকোনো প্রশ্নে আমাদের WhatsApp কনসিয়ার্জে নক করুন।",
    ctaPrimaryLabel: "WhatsApp-এ বার্তা পাঠান",
    ctaSecondaryLabel: "অর্ডার ট্র্যাক করুন",
    ctaSecondaryHref: "#order-section",
    enabled: true,
  } satisfies WhatsAppData,

  flashSale: {
    enabled: true,
    title: "লিমিটেড সিজনাল ড্রপ • The Curated Drop",
    hoursFromNow: 48,
  } satisfies FlashSaleData,
} as const;

export type HomepageBlockKey = keyof typeof HOMEPAGE_DEFAULTS;
export const HOMEPAGE_BLOCK_KEYS = Object.keys(HOMEPAGE_DEFAULTS) as HomepageBlockKey[];
