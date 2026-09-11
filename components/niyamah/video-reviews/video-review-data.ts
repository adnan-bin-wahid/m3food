export type VideoReview = { id:string; name:string; product:string; quote:string; poster:string; src?:string; contain?:boolean };
const base='/niyamah/video-reviews/';
// Replace these dummy stories. Add your video path to src, e.g. '/niyamah/video-reviews/fatima.mp4'.
export const DEMO_VIDEO_REVIEWS:VideoReview[]=[
{id:'fatima',name:'Fatima A.',product:'Hijab Set',quote:'নিয়ামাহ্ শুধু একটা ব্র্যান্ড নয়, এটা আমার ইবাদতের সঙ্গী।',poster:base+'poster.png',src:''},
{id:'sabrin',name:'Sabrin T.',product:'Prayer Outfit',quote:'আরাম আর সৌন্দর্য—দুটোই একসাথে পেয়েছি।',poster:base+'prod-2.png',contain:true,src:''},
{id:'nusrat',name:'Nusrat J.',product:'Orchid Perfume',quote:'একটুখানি সুবাস, সারাদিনের ভালো লাগা।',poster:base+'prod-1.png',contain:true,src:''},
{id:'ayesha',name:'Ayesha M.',product:'Salah Dress',quote:'প্রতিটি ছোট্ট যত্ন মন ছুঁয়ে যায়।',poster:base+'prod-2.png',contain:true,src:''},
{id:'tahia',name:'Tahia R.',product:'Gift Package',quote:'প্রিয় মানুষকে দেওয়ার মতো সুন্দর একটি উপহার।',poster:base+'prod-3.png',contain:true,src:''},
{id:'mariam',name:'Mariam S.',product:'Niyamah Collection',quote:'আমার প্রতিদিনের পছন্দে নিয়ামাহ্।',poster:base+'poster.png',src:''}];
