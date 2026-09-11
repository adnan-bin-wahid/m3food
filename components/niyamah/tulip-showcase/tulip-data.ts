export interface TulipPackageItem {
  id: string;
  title: string;
  badge: string;
  thumb: string;
  subtitle?: string;
}

export const TULIP_PACKAGE_ITEMS: TulipPackageItem[] = [
  {
    id: "bexi-hijab",
    title: "প্রিমিয়াম Bexi কটন সালাত হিজাব",
    badge: "Pure Bexi Cotton",
    thumb: "/niyamah/tulip-showcase/thumb-bexi-hijab.png",
  },
  {
    id: "perfume",
    title: "নরম অ্যালকোহলমুক্ত পারফিউম",
    badge: "Soft Floral Scent",
    thumb: "/niyamah/tulip-showcase/thumb-perfume.png",
  },
  {
    id: "tulip-bag",
    title: "সিগনেচার টিউলিপ গিফট ব্যাগ",
    badge: "Exclusive Packaging",
    thumb: "/niyamah/tulip-showcase/thumb-bag.png",
  },
];

export interface TulipTrustItem {
  id: string;
  title: string;
  icon: "card" | "truck" | "gift";
  subtitle?: string;
}

export const TULIP_TRUST_ITEMS: TulipTrustItem[] = [
  {
    id: "cod",
    title: "দেশে পেমেন্ট (COD)",
    icon: "card",
  },
  {
    id: "delivery",
    title: "সারা দেশে দ্রুত ডেলিভারি",
    icon: "truck",
  },
  {
    id: "ready",
    title: "উপহারের জন্য প্রস্তুত",
    icon: "gift",
  },
];
