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
    thumb: "/niyamah/attar-showcase/thumb-orchid.png",
    bottleImage: "/niyamah/attar-showcase/bottle-orchid.png",
    glowColor: "rgba(223, 125, 149, 0.4)",
    description:
      "১০০% অ্যালকোহল মুক্ত খাঁটি অর্কিড নির্যাস, মিষ্টি ও কোমল ফুলের এক মোহনীয় রাজকীয় আবেশ যা জুমার নামাজ ও দৈনন্দিন ইবাদতে এনে দেয় পরম প্রশান্তি।",
    longevity: "১৬+ ঘণ্টা",
    purity: "১০০% হালাল",
    fabricSafety: "দাগহীন সুরক্ষা",
  },
  {
    id: "golden-oud",
    name: "রয়্যাল গোল্ডেন ওউদ",
    subtitle: "(কাশ্মীরি ওউদ ও চন্দন)",
    price: "৳৮৫০/-",
    priceNum: 850,
    originalPrice: "৳১০৫০/-",
    thumb: "/niyamah/attar-showcase/thumb-golden-oud.png",
    bottleImage: "/niyamah/attar-showcase/bottle-golden-oud.png",
    glowColor: "rgba(229, 200, 117, 0.4)",
    description:
      "আভিজাত্যের প্রতীক বিশুদ্ধ কাশ্মীরি ওউদ ও উষ্ণ চন্দন কাঠের সুরভিত মেলবন্ধন। আত্মিক গভীরতা ও ব্যক্তিত্বের মর্যাদা বাড়াতে অতুলনীয় এক আতর।",
    longevity: "২৪+ ঘণ্টা",
    purity: "১০০% হালাল",
    fabricSafety: "দাগহীন সুরক্ষা",
  },
  {
    id: "royal-sapphire",
    name: "রয়্যাল সাফায়ার আতর",
    subtitle: "(নীল কস্তুরী ও অ্যাম্বার)",
    price: "৳৮৫০/-",
    priceNum: 850,
    originalPrice: "৳১০৫০/-",
    thumb: "/niyamah/attar-showcase/thumb-rose-velvet.png",
    bottleImage: "/niyamah/attar-showcase/bottle-rose-velvet.png",
    glowColor: "rgba(45, 140, 240, 0.4)",
    description:
      "নীল কস্তুরী ও দুর্লভ সিডারউডের এক অপূর্ব প্রশান্তিদায়ক আবেশ। মনকে নিবিষ্ট করতে এবং ইবাদতের মুহূর্তে গভীর ধ্যানমগ্নতা আনতে অত্যন্ত কার্যকর।",
    longevity: "১৮+ ঘণ্টা",
    purity: "১০০% হালাল",
    fabricSafety: "দাগহীন সুরক্ষা",
  },
  {
    id: "emerald-musk",
    name: "এমারেল্ড মাস্ক পারফিউম",
    subtitle: "(সতেজ কুল হোয়াইট মাস্ক)",
    price: "৳৮৫০/-",
    priceNum: 850,
    originalPrice: "৳১০৫০/-",
    thumb: "/niyamah/attar-showcase/thumb-emerald-musk.png",
    bottleImage: "/niyamah/attar-showcase/bottle-emerald-musk.png",
    glowColor: "rgba(45, 180, 120, 0.4)",
    description:
      "সতেজ হোয়াইট মাস্ক ও প্রাকৃতিক পাতার এক অমায়িক ঠান্ডা স্নিগ্ধতা। তীব্র গরম বা ক্লান্তি দূর করে শরীর ও মনে এক দারুণ শীতল সতেজতা ছড়িয়ে দেয়।",
    longevity: "১৬+ ঘণ্টা",
    purity: "১০০% হালাল",
    fabricSafety: "দাগহীন সুরক্ষা",
  },
];
