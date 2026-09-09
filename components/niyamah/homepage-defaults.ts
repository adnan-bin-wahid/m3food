/**
 * Client-safe: types + default values only — NO database or Node.js imports.
 * Storefront components import from here. Server-only DB logic lives in homepage-content.ts.
 */

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type HeroThemeName = "cream" | "emerald" | "gold" | "dark";

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

export interface HeroSlideData {
  id: string;
  status?: "active" | "draft";
  eyebrow: string;
  title: string;
  highlight: string;
  subtitle: string;
  titleLine1?: string;
  titleLine2?: string;
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
      id: "barakah",
      status: "active",
      eyebrow: "পবিত্র কুরআন সংগ্রহ • Sacred Quran",
      title: "Bring Barakah",
      highlight: "দৈনন্দিন জীবনে বরকত ও নূর",
      titleLine1: "Bring Barakah",
      titleLine2: "দৈনন্দিন জীবনে বরকত ও নূর",
      subheading: "কালার-কোডেড তাজবীদ কুরআন • Tajweed Edition",
      subtitle:
        "সহজ তিলাওয়াত ও হিফজের জন্য বিশেষ কালার-কোডেড কুরআন শরিফ। উন্নত বাঁধাই ও প্রিন্ট, সারা বাংলাদেশে ক্যাশ অন ডেলিভারি।",
      description:
        "সহজ তিলাওয়াত ও হিফজের জন্য বিশেষ কালার-কোডেড কুরআন শরিফ। উন্নত বাঁধাই ও প্রিন্ট, সারা বাংলাদেশে ক্যাশ অন ডেলিভারি।",
      badge: "ক্যাশ অন ডেলিভারি • COD Available",
      ctaPrimary: { label: "কুরআন কালেকশন দেখুন • Shop Quran", href: "/category/quran" },
      primaryButtonText: "কুরআন কালেকশন দেখুন • Shop Quran",
      primaryButtonLink: "/category/quran",
      ctaSecondary: { label: "উপহার বক্স দেখুন • Gift Box", href: "/category/gift-box" },
      productName: "প্রিমিয়াম কুরআন • Sacred Quran",
      metadataLine: "তাজবীদ সংস্করণ / New Edition 2026",
      cardName: "কুরআন শরিফ",
      shortName: "কুরআন শরিফ",
      productImage: "/niyamah/hero/hero-quran.png",
      productImageAlt: "প্রিমিয়াম কালার কোডেড কুরআন শরিফ",
      bigWord1: "BARAKAH",
      bigWord2: "DAILY",
      theme: "dark",
      infoItems: [
        { label: "ডেলিভারি", value: "১–৩ দিন" },
        { label: "পেমেন্ট", value: "হাতে পেয়ে মূল্য পরিশোধ (COD)" },
        { label: "সহায়তা", value: "WhatsApp ও ফোন সাপোর্ট" },
      ],
      colors: {
        purple: "#123d2d",
        lightBlue: "#f1ead9",
        green: "#0b4a34",
        infoGreen: "#073827",
        white: "#f1ead9",
        orange: "#f1ead9",
        accent: "#c6a05d",
        shadow: "rgba(4, 36, 25, 0.22)",
      },
      rightGradient: "from-[#EAF4D5] via-[#FAF7EE] to-[#EFE6D2]",
      decoration: "Quran",
      popularLinks: [
        { label: "তাজবীদ কুরআন", href: "/category/quran" },
        { label: "বাংলা অনুবাদ কুরআন", href: "/category/bengali-quran" },
        { label: "রয়েল গিফট বক্স", href: "/category/gift-box" },
        { label: "জায়নামাজ ও তাসবিহ", href: "/category/prayer-mat" },
      ],
    },
    {
      id: "hijab",
      status: "active",
      eyebrow: "মদিনা সিল্ক ওড়না • The Silk Atelier",
      title: "Medina Silk Veils",
      highlight: "মার্জিত রূপ ও অনন্য সৌন্দর্য",
      titleLine1: "Medina Silk Veils",
      titleLine2: "মার্জিত রূপ ও অনন্য সৌন্দর্য",
      subheading: "প্রিমিয়াম মদিনা সিল্ক • Haute Hijab",
      subtitle:
        "১০০% অপেক ও মার্জিত সিল্ক ওড়না। নন-স্লিপ গ্রিপ এবং শ্বাসপ্রশ্বাসযোগ্য প্রাকৃতিক তন্তু, যা সারাদিনের ব্যবহারে দেয় সর্বোচ্চ স্বস্তি।",
      description:
        "১০০% অপেক ও মার্জিত সিল্ক ওড়না। নন-স্লিপ গ্রিপ এবং শ্বাসপ্রশ্বাসযোগ্য প্রাকৃতিক তন্তু, যা সারাদিনের ব্যবহারে দেয় সর্বোচ্চ স্বস্তি।",
      badge: "খাঁটি মদিনা সিল্ক • Pure Medina Silk",
      ctaPrimary: { label: "সিল্ক ওড়না দেখুন • Shop Veils", href: "/category/hijab" },
      primaryButtonText: "সিল্ক ওড়না দেখুন • Shop Veils",
      primaryButtonLink: "/category/hijab",
      ctaSecondary: { label: "ফেব্রিক গাইড • Fabric Guide", href: "#fabric-guide" },
      productName: "মদিনা সিল্ক হিজাব • Medina Silk",
      metadataLine: "সিজনাল মনোগ্রাফ / Monograph 2026",
      cardName: "সিল্ক হিজাব",
      shortName: "সিল্ক ওড়না",
      productImage: "/niyamah/editorial/hijab-drape.jpg",
      productImageAlt: "মডেল পরিহিত প্রিমিয়াম মদিনা সিল্ক হিজাব",
      bigWord1: "MEDINA",
      bigWord2: "SILK",
      theme: "emerald",
      infoItems: [
        { label: "ফেব্রিক", value: "প্রিমিয়াম মদিনা সিল্ক" },
        { label: "ড্র্যাপ", value: "নন-স্লিপ ও মার্জিত" },
        { label: "মান", value: "১০০% অপেক পর্দা" },
      ],
      rightGradient: "from-[#123d2a] via-[#0d281c] to-[#071710]",
      decoration: "Silk",
    },
    {
      id: "attar",
      status: "active",
      eyebrow: "আভিজাত্যের সুবাস • Artisanal Perfumery",
      title: "The Attar Vault",
      highlight: "খাঁটি উদ ও রাজকীয় অ্যাম্বার",
      titleLine1: "The Attar Vault",
      titleLine2: "খাঁটি উদ ও রাজকীয় অ্যাম্বার",
      subheading: "অ্যালকোহল-মুক্ত এক্সট্রেইট • Pure Oil Extrait",
      subtitle:
        "প্রাচীন ও নিখুঁত পদ্ধতিতে পরিশ্রুত ১০০% খাঁটি প্রাকৃতিক আতর। চামড়ায় দীর্ঘস্থায়ী রাজকীয় সুবাস ছড়ায় ১৬ ঘণ্টারও বেশি সময়।",
      description:
        "প্রাচীন ও নিখুঁত পদ্ধতিতে পরিশ্রুত ১০০% খাঁটি প্রাকৃতিক আতর। চামড়ায় দীর্ঘস্থায়ী রাজকীয় সুবাস ছড়ায় ১৬ ঘণ্টারও বেশি সময়।",
      badge: "১০০% খাঁটি বোটানিক্যাল অয়েল",
      ctaPrimary: { label: "আতর সংগ্রহ দেখুন • Explore Attars", href: "/category/attar" },
      primaryButtonText: "আতর সংগ্রহ দেখুন • Explore Attars",
      primaryButtonLink: "/category/attar",
      ctaSecondary: { label: "সুগন্ধি নোটস • Fragrance Notes", href: "#fragrance-notes" },
      productName: "খাঁটি আতর • Artisanal Attar",
      metadataLine: "স্মল ব্যাচ এক্সট্রেইট / Small Batch",
      cardName: "খাঁটি আতর",
      shortName: "আতর ভল্ট",
      productImage: "/niyamah/editorial/perfume-flacon.jpg",
      productImageAlt: "আর্টিসানাল স্কয়ার অ্যাম্বার গ্লাস আতর বোতল",
      bigWord1: "ATTAR",
      bigWord2: "SILLAGE",
      theme: "dark",
      infoItems: [
        { label: "উপাদান", value: "কম্বোডিয়ান খাঁটি উদ" },
        { label: "স্থায়িত্ব", value: "১৬+ ঘণ্টা দীর্ঘস্থায়ী" },
        { label: "ফর্মুলা", value: "সম্পূর্ণ অ্যালকোহল মুক্ত" },
      ],
      rightGradient: "from-[#3d2712] via-[#261709] to-[#140b04]",
      decoration: "Oud",
    },
    {
      id: "gift",
      status: "active",
      eyebrow: "প্রিয়জনের জন্য উপহার • Meaningful Islamic Gifts",
      title: "Royal Gift Boxes",
      highlight: "ভালোবাসা ও শ্রদ্ধার স্মারক",
      titleLine1: "Royal Gift Boxes",
      titleLine2: "ভালোবাসা ও শ্রদ্ধার স্মারক",
      subheading: "রেডি-টু-গিফট প্রিমিয়াম বক্স",
      subtitle:
        "পবিত্র কুরআন, সুদৃশ্য কাঠের বক্স, ক্রিস্টাল তাসবিহ ও সুরভিত আতরের সমন্বয়ে তৈরি প্রিমিয়াম গিফট সেট—মা-বাবা ও প্রিয়জনের জন্য সেরা উপহার।",
      description:
        "পবিত্র কুরআন, সুদৃশ্য কাঠের বক্স, ক্রিস্টাল তাসবিহ ও সুরভিত আতরের সমন্বয়ে তৈরি প্রিমিয়াম গিফট সেট—মা-বাবা ও প্রিয়জনের জন্য সেরা উপহার।",
      badge: "উপহারের জন্য প্রস্তুত • Ready to Gift",
      ctaPrimary: { label: "গিফট বক্স দেখুন • Shop Gift Sets", href: "/category/gift-box" },
      primaryButtonText: "গিফট বক্স দেখুন • Shop Gift Sets",
      primaryButtonLink: "/category/gift-box",
      ctaSecondary: { label: "কাস্টমাইজ উপহার • Custom Box", href: "#gift-builder" },
      productName: "রয়েল গিফট বক্স • Islamic Gift Box",
      metadataLine: "এক্সক্লুসিভ কালেকশন / Gift Edition",
      cardName: "গিফট বক্স",
      shortName: "গিফট বক্স",
      productImage: "/niyamah/hero/hero-gift-box.png",
      productImageAlt: "ইসলামিক গিফট বক্স কুরআন ও তাসবিহ সহ",
      bigWord1: "ROYAL",
      bigWord2: "GIFTS",
      theme: "dark",
      infoItems: [
        { label: "প্যাকেজিং", value: "রয়েল ভেলভেট ও উডেন বক্স" },
        { label: "ডেলিভারি", value: "সারা বাংলাদেশে এক্সপ্রেস" },
        { label: "সহায়তা", value: "WhatsApp সাপোর্ট" },
      ],
      colors: {
        purple: "#123d2d",
        lightBlue: "#f1ead9",
        green: "#0d5138",
        infoGreen: "#073827",
        white: "#f1ead9",
        orange: "#f1ead9",
        accent: "#c6a05d",
        shadow: "rgba(4, 36, 25, 0.22)",
      },
      rightGradient: "from-[#EAF4D5] via-[#FAF7EE] to-[#EFE6D2]",
      decoration: "Gift",
      popularLinks: [
        { label: "মা-বাবার জন্য উপহার", href: "/products?intent=parents" },
        { label: "শিক্ষকের জন্য উপহার", href: "/products?intent=teacher" },
        { label: "বিয়ে ও সুন্নতে খতনা", href: "/products?intent=wedding" },
      ],
    },
    {
      id: "prayer",
      status: "active",
      eyebrow: "ইবাদতের অনুষঙ্গ • Daily Worship Essentials",
      title: "Prayer Mats & Tasbih",
      highlight: "নম্রতা ও প্রশান্তির জায়নামাজ",
      titleLine1: "Prayer Mats & Tasbih",
      titleLine2: "নম্রতা ও প্রশান্তির জায়নামাজ",
      subheading: "সফট ভেলভেট জায়নামাজ ও তাসবিহ সেট",
      subtitle:
        "অতিরিক্ত নরম মেমোরি ফোম প্রযুক্তির ভেলভেট জায়নামাজ ও ক্রিস্টাল তাসবিহ। দীর্ঘ সময় রুকু ও সেজদায় হাঁটু ও পায়ে প্রশান্তির অনুভূতি।",
      description:
        "অতিরিক্ত নরম মেমোরি ফোম প্রযুক্তির ভেলভেট জায়নামাজ ও ক্রিস্টাল তাসবিহ। দীর্ঘ সময় রুকু ও সেজদায় হাঁটু ও পায়ে প্রশান্তির অনুভূতি।",
      badge: "প্রিমিয়াম কোয়ালিটি • Premium Quality",
      ctaPrimary: { label: "জায়নামাজ দেখুন • Shop Prayer Mats", href: "/category/prayer-mat" },
      primaryButtonText: "জায়নামাজ দেখুন • Shop Prayer Mats",
      primaryButtonLink: "/category/prayer-mat",
      ctaSecondary: { label: "তাসবিহ দেখুন • Shop Tasbih", href: "/category/tasbih" },
      productName: "জায়নামাজ ও তাসবিহ • Prayer Essentials",
      metadataLine: "প্রিমিয়াম কালেকশন / Daily Salah",
      cardName: "জায়নামাজ",
      shortName: "জায়নামাজ",
      productImage: "/niyamah/hero/hero-prayer-mat.png",
      productImageAlt: "ভাঁজ করা প্রিমিয়াম জায়নামাজ ও তাসবিহ",
      bigWord1: "SALAH",
      bigWord2: "DHIKR",
      theme: "emerald",
      infoItems: [
        { label: "মেটেরিয়াল", value: "হাই-ডেনসিটি ভেলভেট" },
        { label: "কুশনিং", value: "অর্থোপেডিক ফোম সাপোর্ট" },
        { label: "ওয়্যারেন্টি", value: "১০০% সন্তুষ্টির নিশ্চয়তা" },
      ],
      colors: {
        purple: "#123d2d",
        lightBlue: "#f1ead9",
        green: "#0b4a34",
        infoGreen: "#073827",
        white: "#f1ead9",
        orange: "#f1ead9",
        accent: "#c6a05d",
        shadow: "rgba(4, 36, 25, 0.22)",
      },
      rightGradient: "from-[#EAF4D5] via-[#FAF7EE] to-[#EFE6D2]",
      decoration: "Prayer",
      popularLinks: [
        { label: "ক্রিস্টাল তাসবিহ", href: "/category/tasbih" },
        { label: "ট্রাভেল জায়নামাজ", href: "/category/prayer-mat" },
        { label: "কুরআন রেহেল", href: "/products?q=quran-stand" },
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
