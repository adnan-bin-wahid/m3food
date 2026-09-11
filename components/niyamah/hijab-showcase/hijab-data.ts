export interface HijabVariation {
  id: string;
  name: string;
  subtitle?: string;
  price: string;
  priceNum: number;
  thumb: string;
  stageImage: string;
  description: string;
  frontLength: string;
  backLength: string;
  fabric: string;
}

export const HIJAB_VARIATIONS: HijabVariation[] = [
  {
    id: "floral-pink",
    name: "ফ্লোরাল সালাত হিজাব",
    subtitle: "(গোলাপি প্রিন্ট)",
    price: "৳৮০০/-",
    priceNum: 800,
    thumb: "/niyamah/hijab-showcase/thumb-floral.png",
    stageImage: "/niyamah/hijab-showcase/stage-card-floral.png",
    description:
      "নিচে কুচি দিয়ে চমৎকার ফ্রিল ফ্লোরাল ডিজাইন। থুতনিতে ও মাথায় রয়েছে আলাদা কাপড়, ফলে দুই সাইড থেকে কানের চুল কোনোভাবেই বের হবে না।",
    frontLength: "৪৩ ইঞ্চি",
    backLength: "৫২ ইঞ্চি",
    fabric: "Pure Bexi কটন",
  },
  {
    id: "pink-border",
    name: "পিঙ্ক বর্ডার কটন হিজাব",
    subtitle: "",
    price: "৳৮০০/-",
    priceNum: 800,
    thumb: "/niyamah/hijab-showcase/thumb-pink-border.png",
    stageImage: "/niyamah/hijab-showcase/stage-card-pink-border.png",
    description:
      "মাখনের মতো নরম ও বাতাস চলাচলকারী প্রিমিয়াম সুতি কাপড়। দীর্ঘক্ষণ নামাজে দাঁড়িয়ে বা সেজদায় থাকলেও মাথা থেকে পিছলে পড়ে না।",
    frontLength: "৪৩ ইঞ্চি",
    backLength: "৫২ ইঞ্চি",
    fabric: "Pure Bexi কটন",
  },
  {
    id: "dark-lace",
    name: "ডার্ক লেইস সালাত হিজাব",
    subtitle: "",
    price: "৳৮০০/-",
    priceNum: 800,
    thumb: "/niyamah/hijab-showcase/thumb-dark-lace.png",
    stageImage: "/niyamah/hijab-showcase/stage-card-dark-lace.png",
    description:
      "নামাজের সময় আরও বেশি মনোযোগ ও আরামের জন্য তৈরি, প্রিমিয়াম Bexi কটনের এই সালাত হিজাবটি আপনাকে দেবে স্নিগ্ধতা, আরাম এবং পরিপূর্ণ কভারেজ।",
    frontLength: "৪৩ ইঞ্চি",
    backLength: "৫২ ইঞ্চি",
    fabric: "Pure Bexi কটন",
  },
  {
    id: "miriam-border",
    name: "মিরিয়াম বর্ডার হিজাব",
    subtitle: "",
    price: "৳৮০০/-",
    priceNum: 800,
    thumb: "/niyamah/hijab-showcase/thumb-miriam.png",
    stageImage: "/niyamah/hijab-showcase/stage-card-miriam.png",
    description:
      "দৈনন্দিন তাহাজ্জুদ, ফরজ নামাজ বা ইবাদতের জন্য সেরা চয়েস। মার্জিত ফিনিশিং ও নিখুঁত সেলাই যা দীর্ঘ ব্যবহারে নতুনের মতো থাকে।",
    frontLength: "৪৩ ইঞ্চি",
    backLength: "৫২ ইঞ্চি",
    fabric: "Pure Bexi কটন",
  },
];
