export type ReviewAvatar = {
  src: string;
  // Optional image region for the bundled reference portraits. For a normal
  // customer photo, supply only src and omit crop.
  crop?: { x: number; y: number; size: number; width: number; height: number };
};
export type CustomerReview = {
  id: string;
  name: string;
  location: string;
  text: string;
  rating: number;
  verified?: boolean;
  avatar?: ReviewAvatar;
  product?: { name: string; image?: string; href: string };
  signature?: string;
};
export type ReviewSummary = { rating: number; total: string; label?: string };
const portrait = (x: number, y: number, size: number): ReviewAvatar => ({
  src: "/niyamah/reviews/demo-portraits.png",
  crop: { x, y, size, width: 1672, height: 941 },
});

// DEMO CONTENT ONLY. Replace reviews and summary with real customer data
// before publishing. No review schema or SEO rating markup is generated.
export const DEMO_REVIEW_SUMMARY: ReviewSummary = { rating: 4.9, total: "2,986+", label: "যাচাইকৃত রিভিউ" };
export const DEMO_REVIEWS: CustomerReview[] = [
  { id: "demo-samiya", name: "সামিয়া ইসলাম", location: "ঢাকা", rating: 5, verified: true,
    text: "আল্লাহর হুকুম মেনে পর্দায় চলার পথে নিয়ামাহ্ আমার জন্য সত্যিই বিশেষ হয়ে উঠেছে। কাপড়ের কোয়ালিটি, ফিট, আর কমফোর্ট—সবকিছুই অসাধারণ। নামাজের সময় এদের হিজাব ব্যবহার করে আমি সত্যি স্বস্তি পাই। জাযাকাল্লাহু খাইর ♡",
    avatar: portrait(355, 585, 116), product: { name: "নামাজের হিজাব", image: "/niyamah/reviews/prod-2.png", href: "#order" }, signature: "Comfort\nin Worship ♡" },
  { id: "demo-nusrat", name: "নুসরাত জাহান", location: "চট্টগ্রাম", rating: 5, verified: true,
    text: "কোয়ালিটি এত ভালো যে বারবার অর্ডার করতে ইচ্ছা করে। ডিজাইন সিম্পল কিন্তু খুবই এলিগ্যান্ট। নিয়ামাহ্ সত্যিই বিশ্বাসের একটি নাম!",
    avatar: portrait(882, 372, 82), product: { name: "প্রেয়ার হিজাব", image: "/niyamah/reviews/prod-2.png", href: "#order" }, signature: "Made for\nyour moments ♡" },
  { id: "demo-rabeya", name: "রাবেয়া আক্তার", location: "সিলেট", rating: 5, verified: true,
    text: "টিউলিপ প্যাকেজটা আমার জন্য একটি পারফেক্ট গিফট ছিল। প্যাকেজিং থেকে শুরু করে প্রতিটি প্রোডাক্ট—সবই এত সুন্দর ও যত্নশীল!",
    avatar: portrait(1248, 372, 82), product: { name: "টিউলিপ প্যাকেজ", image: "/niyamah/reviews/prod-3.png", href: "#order" }, signature: "A little gift,\na lot of love ♡" },
  { id: "demo-tanjila", name: "তানজিলা হক", location: "রাজশাহী", rating: 5, verified: true,
    text: "বাইরেও, ইবাদতেও—সব জায়গায় নিয়ামাহ্ আমাকে কনফিডেন্ট রাখে। কাপড়টা এতটাই আরামদায়ক!",
    avatar: portrait(882, 622, 82), product: { name: "দৈনন্দিন হিজাব", image: "/niyamah/reviews/prod-2.png", href: "#order" }, signature: "Beauty in\neveryday grace ♡" },
  { id: "demo-farha", name: "ফারহা তাসনিম", location: "খুলনা", rating: 5, verified: true,
    text: "পারফিউমটা অসাধারণ! ঘ্রাণটা খুবই সফট আর লং-লাস্টিং। সত্যি বলছি, এটা এখন আমার প্রতিদিনের সঙ্গী!",
    avatar: portrait(1248, 622, 82), product: { name: "অর্কিড পারফিউম", image: "/niyamah/reviews/prod-1.png", href: "#order" }, signature: "A scent\nto remember ♡" },
];
