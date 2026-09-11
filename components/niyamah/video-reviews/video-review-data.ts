export type VideoReview = {
  id: string;
  name: string;
  product: string;
  quote: string;
  poster: string;
  src?: string;
  contain?: boolean;
};

export const DEMO_VIDEO_REVIEWS: VideoReview[] = [
  {
    id: 'salah-hijab-review',
    name: 'সাদিয়া ইসলাম',
    product: 'সালাত হিজাব',
    quote: 'কাপড়ের মান আর সেলাই এককথায় অসাধারণ। নামাজ পড়ার জন্য একদম পারফেক্ট!',
    poster: '/niyamah/videos/poster-rev2.jpg',
    src: '/niyamah/videos/rev2.mp4',
  },
  {
    id: 'fabric-detail-review',
    name: 'মারিয়াম সুলতানা',
    product: 'পিঙ্ক ফ্লোরাল হিজাব',
    quote: 'হাতে পেয়ে বুঝলাম ফেব্রিকটা কতটা নরম ও আরামদায়ক। লেইস ডিটেইলিং খুব সুন্দর!',
    poster: '/niyamah/videos/poster-3.jpg',
    src: '/niyamah/videos/3.mp4',
  },
  {
    id: 'gift-package-review',
    name: 'ফারহানা রহমান',
    product: 'টিউলিপ গিফট প্যাকেজ',
    quote: 'প্রিয়জনকে উপহার দেওয়ার জন্য এর চেয়ে মার্জিত ও সুন্দর কিছু হতে পারে না।',
    poster: '/niyamah/videos/poster-rev1.jpg',
    src: '/niyamah/videos/rev1.mp4',
  },
  {
    id: 'customer-feedback-review',
    name: 'কাস্টমার ফিডব্যাক',
    product: 'নিয়ামাহ্ কালেকশন',
    quote: 'গ্রাহকদের শত শত সন্তুষ্টি আর ভালোবাসায় আমাদের নিয়ামাহ্ পরিবার।',
    poster: '/niyamah/videos/poster-4.jpg',
    src: '/niyamah/videos/4.mp4',
  },
];
