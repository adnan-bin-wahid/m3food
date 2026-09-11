export interface PerfumeVariation {
  id: string;
  name: string;
  subtitle?: string;
  price: string;
  priceNum: number;
  originalPrice: string;
  thumb: string;
  bottleImage: string;
  glowColor: string;
  description: string;
  longevity: string;
  purity: string;
  fabricSafety: string;
}

export const PERFUME_VARIATIONS: PerfumeVariation[] = [
  {
    id: "orchid-bloom",
    name: "অর্কিড ব্লুম পারফিউম",
    subtitle: "(গোলাপি অর্কিড নির্যাস)",
    price: "৳৮৫০/-",
    priceNum: 850,
    originalPrice: "৳১০৫০/-",
    thumb: "/niyamah/variant/perfume/1.png",
    bottleImage: "/niyamah/variant/perfume/1.png",
    glowColor: "rgba(223, 125, 149, 0.4)",
    description:
      "১০০% অ্যালকোহল মুক্ত খাঁটি অর্কিড নির্যাস, মিষ্টি ও কোমল ফুলের এক মোহনীয় রাজকীয় আবেশ যা জুমার নামাজ ও দৈনন্দিন ইবাদতে এনে দেয় পরম প্রশান্তি।",
    longevity: "১৬+ ঘণ্টা",
    purity: "১০০% হালাল",
    fabricSafety: "দাগহীন সুরক্ষা",
  },
  {
    id: "coral-ocean",
    name: "কোরাল ওশান পারফিউম",
    subtitle: "(সতেজ ওশান ব্লু নোট)",
    price: "৳৮৫০/-",
    priceNum: 850,
    originalPrice: "৳১০৫০/-",
    thumb: "/niyamah/variant/perfume/2.png",
    bottleImage: "/niyamah/variant/perfume/2.png",
    glowColor: "rgba(45, 140, 240, 0.4)",
    description:
      "কোরাল ওশান ব্লু-এর এক অপূর্ব প্রশান্তিদায়ক সুরভি। মনকে নিবিষ্ট করতে এবং ইবাদতের মুহূর্তে গভীর ধ্যানমগ্নতা ও শীতল স্নিগ্ধতা আনতে অতুলনীয়।",
    longevity: "১৮+ ঘণ্টা",
    purity: "১০০% হালাল",
    fabricSafety: "দাগহীন সুরক্ষা",
  },
  {
    id: "golden-fiesta",
    name: "গোল্ডেন ফিয়েস্তা পারফিউম",
    subtitle: "(উষ্ণ অ্যাম্বার ও ফ্রুট)",
    price: "৳৮৫০/-",
    priceNum: 850,
    originalPrice: "৳১০৫০/-",
    thumb: "/niyamah/variant/perfume/3.png",
    bottleImage: "/niyamah/variant/perfume/3.png",
    glowColor: "rgba(229, 200, 117, 0.4)",
    description:
      "আভিজাত্যের প্রতীক বিশুদ্ধ গোল্ডেন অ্যাম্বার ও প্রাকৃতিক নির্যাস। আত্মিক প্রশান্তি ও ব্যক্তিত্বের মর্যাদা বাড়াতে অতুলনীয় এক রাজকীয় সুবাস।",
    longevity: "২৪+ ঘণ্টা",
    purity: "১০০% হালাল",
    fabricSafety: "দাগহীন সুরক্ষা",
  },
  {
    id: "luxury-affair",
    name: "লাক্সারি অ্যাফেয়ার পারফিউম",
    subtitle: "(রিচ উডি ও ভ্যানিলা নোট)",
    price: "৳৮৫০/-",
    priceNum: 850,
    originalPrice: "৳১০৫০/-",
    thumb: "/niyamah/variant/perfume/4.png",
    bottleImage: "/niyamah/variant/perfume/4.png",
    glowColor: "rgba(200, 130, 80, 0.4)",
    description:
      "ব্রোঞ্জ ও গোল্ডেন শেডের রিচ উডি নোট ও মিষ্টি ভ্যানিলা কম্বিনেশন। দীর্ঘস্থায়ী সুবাস যা শরীর ও কাপড়ে কোনো দাগ ছাড়াই ছড়িয়ে দেয় আভিজাত্য।",
    longevity: "২০+ ঘণ্টা",
    purity: "১০০% হালাল",
    fabricSafety: "দাগহীন সুরক্ষা",
  },
];
