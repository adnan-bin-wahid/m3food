export type CuratedDropProduct = {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  image: string;
  description: string;
  price?: number;
  href: string;
};

// Replace href with a live product/order route when integrating your catalogue.
export const CURATED_DROP_PRODUCTS: CuratedDropProduct[] = [
  { id: "orchid-perfume", name: "অর্কিড পারফিউম", nameEn: "Orchid Perfume", category: "A SCENT OF GRACE", image: "/niyamah/curated-drop/prod-1.png", description: "মৃদু সুবাস, আভিজাত্যের প্রতিচ্ছবি।", price: 850, href: "#order" },
  { id: "floral-prayer-set", name: "সালাত হিজাব", nameEn: "Floral Prayer Set", category: "WRAPPED IN SERENITY", image: "/niyamah/curated-drop/prod-2.png", description: "ইবাদতের প্রতিটি মুহূর্তে, কোমল প্রশান্তি।", price: 800, href: "#order" },
  { id: "tulip-gift-package", name: "টিউলিপ গিফট প্যাকেজ", nameEn: "Tulip Gift Package", category: "A GESTURE OF LOVE", image: "/niyamah/curated-drop/prod-3.png", description: "ভালোবাসার মানুষকে, যত্নে বেছে দেওয়া।", price: 1225, href: "#order" },
];

// Set this to your actual campaign deadline. Example: 1 October 2026, Bangladesh time.
// One fixed deadline for every visitor; it never restarts on refresh.
export const CURATED_DROP_ENDS_AT = "2026-10-01T00:00:00+06:00";
