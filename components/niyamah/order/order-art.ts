// Catalogue IDs, prices and stock always come from the API. This map is visual only.
// Set exact product slug or variant SKU keys to use the corresponding real photograph.
export const ORDER_ART: Record<string, string> = {
  // Hejab variants (1 to 6)
  'NYM-SH-001': '/niyamah/variant/hejab/1.png',
  'NYM-SH-002': '/niyamah/variant/hejab/2.png',
  'NYM-SH-003': '/niyamah/variant/hejab/3.png',
  'NYM-SH-004': '/niyamah/variant/hejab/4.png',
  'NYM-SH-005': '/niyamah/variant/hejab/5.png',
  'NYM-SH-006': '/niyamah/variant/hejab/6.png',

  // Perfume variants (1 to 6)
  'NYM-PRF-001': '/niyamah/variant/perfume/1.png',
  'NYM-PRF-002': '/niyamah/variant/perfume/2.png',
  'NYM-PRF-003': '/niyamah/variant/perfume/3.png',
  'NYM-PRF-004': '/niyamah/variant/perfume/4.png',
  'NYM-PRF-005': '/niyamah/variant/perfume/5.png',
  'NYM-PRF-006': '/niyamah/variant/perfume/6.png',

  // Tulip Gift Package
  'NYM-TLP-001': '/niyamah/order/prod-3.png',
};
export function orderArt(product:{name:string;slug?:string},sku?:string){
 if(sku&&ORDER_ART[sku])return ORDER_ART[sku];
 if(product.slug&&ORDER_ART[product.slug])return ORDER_ART[product.slug];
 const text=(product.name+' '+(product.slug||'')).toLowerCase();
 if(/perfume|attar|orchid|পারফিউম|আতর/.test(text))return '/niyamah/order/prod-1.png';
 if(/gift|tulip|গিফট|উপহার/.test(text))return '/niyamah/order/prod-3.png';
 if(/hijab|salat|salah|prayer|হিজাব|নামাজ/.test(text))return '/niyamah/order/prod-2.png';
 return '/niyamah/order/placeholder.svg';
}
export const DISTRICTS='ঢাকা,ফরিদপুর,গাজীপুর,গোপালগঞ্জ,কিশোরগঞ্জ,মাদারীপুর,মানিকগঞ্জ,মুন্সিগঞ্জ,নারায়ণগঞ্জ,নরসিংদী,রাজবাড়ী,শরীয়তপুর,টাঙ্গাইল,চট্টগ্রাম,বান্দরবান,ব্রাহ্মণবাড়িয়া,চাঁদপুর,কুমিল্লা,কক্সবাজার,ফেনী,খাগড়াছড়ি,লক্ষ্মীপুর,নোয়াখালী,রাঙ্গামাটি,রাজশাহী,বগুড়া,জয়পুরহাট,নওগাঁ,নাটোর,চাঁপাইনবাবগঞ্জ,পাবনা,সিরাজগঞ্জ,খুলনা,বাগেরহাট,চুয়াডাঙ্গা,যশোর,ঝিনাইদহ,কুষ্টিয়া,মাগুরা,মেহেরপুর,নড়াইল,সাতক্ষীরা,বরিশাল,বরগুনা,ভোলা,ঝালকাঠি,পটুয়াখালী,পিরোজপুর,সিলেট,হবিগঞ্জ,মৌলভীবাজার,সুনামগঞ্জ,রংপুর,দিনাজপুর,গাইবান্ধা,কুড়িগ্রাম,লালমনিরহাট,নীলফামারী,পঞ্চগড়,ঠাকুরগাঁও,ময়মনসিংহ,জামালপুর,নেত্রকোণা,শেরপুর'.split(',');
