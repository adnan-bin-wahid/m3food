export interface TulipPackageItem {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  thumb: string;
}

export const TULIP_PACKAGE_ITEMS: TulipPackageItem[] = [
  {
    id: "bexi-hijab",
    title: "প্রিমিয়াম Bexi কটন সালাত হিজাব",
    subtitle: "নরম, আরামদায়ক, প্রতিদিনের জন্য পারফেক্ট।",
    badge: "Pure Bexi Cotton",
    thumb: "/niyamah/tulip-showcase/thumb-bexi-hijab.png",
  },
  {
    id: "perfume",
    title: "নরম অ্যালকোহলমুক্ত পারফিউম",
    subtitle: "সৌম্য, দীর্ঘস্থায়ী, মন মাতানো সুগন্ধ।",
    badge: "Soft Floral Scent",
    thumb: "/niyamah/tulip-showcase/thumb-perfume.png",
  },
  {
    id: "tulip-bag",
    title: "সিগনেচার টিউলিপ গিফট ব্যাগ",
    subtitle: "সুন্দর, প্রিমিয়াম ও উপহারের জন্য প্রস্তুত।",
    badge: "Exclusive Packaging",
    thumb: "/niyamah/tulip-showcase/thumb-bag.png",
  },
];

export interface TulipTrustItem {
  id: string;
  title: string;
  subtitle: string;
  icon: "card" | "truck" | "gift";
}

export const TULIP_TRUST_ITEMS: TulipTrustItem[] = [
  {
    id: "cod",
    title: "দেশে পেমেন্ট (COD)",
    subtitle: "নিরাপদ ও সহজ",
    icon: "card",
  },
  {
    id: "delivery",
    title: "সারা দেশে দ্রুত ডেলিভারি",
    subtitle: "আপনার দুয়ারে",
    icon: "truck",
  },
  {
    id: "ready",
    title: "উপহারের জন্য প্রস্তুত",
    subtitle: "ভালোবাসা পৌঁছে দিন",
    icon: "gift",
  },
];
