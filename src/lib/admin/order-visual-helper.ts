import { ORDER_ART } from "../../../components/niyamah/order/order-art";

export interface ComboItemVisual {
  sku: string;
  label: string;
  bengaliName: string;
  englishName: string;
  image: string;
  category: string;
  rawText?: string;
}

export interface OrderComboVisuals {
  hijab: ComboItemVisual | null;
  perfume: ComboItemVisual | null;
  hasCombo: boolean;
}

export interface OrderItemVisual {
  id: string;
  productName: string;
  variantLabel: string | null;
  sku: string | null;
  quantity: number;
  unitPriceMinor: number;
  totalMinor: number;
  imageUrl: string;
}

export const HIJAB_VARIANTS: ComboItemVisual[] = [
  {
    sku: "NYM-SH-001",
    label: "হোয়াইট পিঙ্ক ফ্লোরাল (White Pink Floral)",
    bengaliName: "হোয়াইট পিঙ্ক ফ্লোরাল",
    englishName: "White Pink Floral",
    image: "/niyamah/variant/hejab/1.webp",
    category: "সালাত হিজাব",
  },
  {
    sku: "NYM-SH-002",
    label: "রয়্যাল ল্যাভেন্ডার (Royal Lavender)",
    bengaliName: "রয়্যাল ল্যাভেন্ডার",
    englishName: "Royal Lavender",
    image: "/niyamah/variant/hejab/2.webp",
    category: "সালাত হিজাব",
  },
  {
    sku: "NYM-SH-003",
    label: "রোজ পিঙ্ক ফ্লোরাল (Rose Pink Floral)",
    bengaliName: "রোজ পিঙ্ক ফ্লোরাল",
    englishName: "Rose Pink Floral",
    image: "/niyamah/variant/hejab/3.webp",
    category: "সালাত হিজাব",
  },
  {
    sku: "NYM-SH-004",
    label: "ল্যাভেন্ডার ব্লসম (Lavender Blossom)",
    bengaliName: "ল্যাভেন্ডার ব্লসম",
    englishName: "Lavender Blossom",
    image: "/niyamah/variant/hejab/4.webp",
    category: "সালাত হিজাব",
  },
  {
    sku: "NYM-SH-005",
    label: "আইভরি পিঙ্ক ব্লসম (Ivory Pink Blossom)",
    bengaliName: "আইভরি পিঙ্ক ব্লসম",
    englishName: "Ivory Pink Blossom",
    image: "/niyamah/variant/hejab/5.webp",
    category: "সালাত হিজাব",
  },
  {
    sku: "NYM-SH-006",
    label: "পীচ ফ্লোরাল (Peach Floral)",
    bengaliName: "পীচ ফ্লোরাল",
    englishName: "Peach Floral",
    image: "/niyamah/variant/hejab/6.webp",
    category: "সালাত হিজাব",
  },
];

export const PERFUME_VARIANTS: ComboItemVisual[] = [
  {
    sku: "NYM-PRF-001",
    label: "অরিজিনাল অর্কিড (Orchid)",
    bengaliName: "অরিজিনাল অর্কিড",
    englishName: "Orchid",
    image: "/niyamah/variant/perfume/1.webp",
    category: "রোল-অন আতর",
  },
  {
    sku: "NYM-PRF-002",
    label: "কোরাল ওশান ব্লু (Coral)",
    bengaliName: "কোরাল ওশান ব্লু",
    englishName: "Coral",
    image: "/niyamah/variant/perfume/2.webp",
    category: "রোল-অন আতর",
  },
  {
    sku: "NYM-PRF-003",
    label: "গোল্ডেন ফিয়েস্তা (Fiesta)",
    bengaliName: "গোল্ডেন ফিয়েস্তা",
    englishName: "Fiesta",
    image: "/niyamah/variant/perfume/3.webp",
    category: "রোল-অন আতর",
  },
  {
    sku: "NYM-PRF-004",
    label: "লাক্সারি অ্যাফেয়ার (Affair)",
    bengaliName: "লাক্সারি অ্যাফেয়ার",
    englishName: "Affair",
    image: "/niyamah/variant/perfume/4.webp",
    category: "রোল-অন আতর",
  },
  {
    sku: "NYM-PRF-005",
    label: "অটাম ব্লুম (Autumn)",
    bengaliName: "অটাম ব্লুম",
    englishName: "Autumn",
    image: "/niyamah/variant/perfume/5.webp",
    category: "রোল-অন আতর",
  },
  {
    sku: "NYM-PRF-006",
    label: "এমেরাল্ড ট্রপিক (Tropic)",
    bengaliName: "এমেরাল্ড ট্রপিক",
    englishName: "Tropic",
    image: "/niyamah/variant/perfume/6.webp",
    category: "রোল-অন আতর",
  },
];

function matchHijab(text: string): ComboItemVisual | null {
  const t = text.toLowerCase();
  if (t.includes("nym-sh-001") || t.includes("white pink") || t.includes("হোয়াইট পিঙ্ক")) return HIJAB_VARIANTS[0];
  if (t.includes("nym-sh-002") || t.includes("royal lavender") || t.includes("রয়্যাল ল্যাভেন্ডার")) return HIJAB_VARIANTS[1];
  if (t.includes("nym-sh-003") || t.includes("rose pink") || t.includes("রোজ পিঙ্ক")) return HIJAB_VARIANTS[2];
  if (t.includes("nym-sh-004") || t.includes("lavender blossom") || t.includes("ল্যাভেন্ডার ব্লসম")) return HIJAB_VARIANTS[3];
  if (t.includes("nym-sh-005") || t.includes("ivory") || t.includes("আইভরি")) return HIJAB_VARIANTS[4];
  if (t.includes("nym-sh-006") || t.includes("peach") || t.includes("পীচ")) return HIJAB_VARIANTS[5];
  return null;
}

function matchPerfume(text: string): ComboItemVisual | null {
  const t = text.toLowerCase();
  if (t.includes("nym-prf-001") || t.includes("orchid") || t.includes("অর্কিড")) return PERFUME_VARIANTS[0];
  if (t.includes("nym-prf-002") || t.includes("coral") || t.includes("কোরাল")) return PERFUME_VARIANTS[1];
  if (t.includes("nym-prf-003") || t.includes("fiesta") || t.includes("ফিয়েস্তা")) return PERFUME_VARIANTS[2];
  if (t.includes("nym-prf-004") || t.includes("affair") || t.includes("অ্যাফেয়ার")) return PERFUME_VARIANTS[3];
  if (t.includes("nym-prf-005") || t.includes("autumn") || t.includes("অটাম")) return PERFUME_VARIANTS[4];
  if (t.includes("nym-prf-006") || t.includes("tropic") || t.includes("ট্রপিক")) return PERFUME_VARIANTS[5];
  return null;
}

export function parseOrderCombo(
  note?: string | null,
  addressLine1?: string | null,
): OrderComboVisuals {
  const combined = `${note || ""} ${addressLine1 || ""}`;
  if (!combined.trim()) {
    return { hijab: null, perfume: null, hasCombo: false };
  }

  // Look for hijab segment first
  const hijabMatch = combined.match(/(?:হিজাব|hijab)[:\s]+([^|\]\n]+)/i);
  const rawHijab = hijabMatch ? hijabMatch[1].trim() : "";
  const hijab = rawHijab ? matchHijab(rawHijab) : matchHijab(combined);

  // Look for perfume segment
  const perfumeMatch = combined.match(/(?:পারফিউম|perfume|attar|আতর)[:\s]+([^|\]\n]+)/i);
  const rawPerfume = perfumeMatch ? perfumeMatch[1].trim() : "";
  const perfume = rawPerfume ? matchPerfume(rawPerfume) : matchPerfume(combined);

  return {
    hijab: hijab ? { ...hijab, rawText: rawHijab || undefined } : null,
    perfume: perfume ? { ...perfume, rawText: rawPerfume || undefined } : null,
    hasCombo: Boolean(hijab || perfume),
  };
}

export function resolveItemImage(item: {
  productName?: string;
  sku?: string | null;
  variantLabel?: string | null;
}): string {
  if (item.sku && ORDER_ART[item.sku]) {
    return ORDER_ART[item.sku];
  }
  const text = `${item.productName || ""} ${item.sku || ""} ${item.variantLabel || ""}`.toLowerCase();
  if (/tlp|tulip|টিউলিপ|উপহার|প্যাকেজ|গিফট/.test(text)) {
    return "/niyamah/order/prod-3.webp";
  }
  if (/sh|hijab|salat|হিজাব|নামাজ/.test(text)) {
    return "/niyamah/order/prod-2.webp";
  }
  if (/prf|perfume|attar|পারফিউম|আতর|orchid/.test(text)) {
    return "/niyamah/order/prod-1.webp";
  }
  return "/niyamah/order/prod-3.webp";
}
