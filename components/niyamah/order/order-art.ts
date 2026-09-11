// Catalogue IDs, prices and stock always come from the API. This map is visual only.
// Set exact product slug or variant SKU keys to use the corresponding real photograph.
export const ORDER_ART:Record<string,string>={
 // 'YOUR-VARIANT-SKU': '/niyamah/order/your-variant.png',
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
