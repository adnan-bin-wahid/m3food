"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle, ShieldCheck } from "lucide-react";

export interface FaqItem {
  q: string;
  qEn?: string;
  a: string;
}

const DEFAULT_FAQS: FaqItem[] = [
  {
    q: "নিয়ামাহ্ আতায়ারস-এর মদিনা সিল্ক ওড়নার মান কেমন?",
    qEn: "What is the quality of Medina Silk Hijabs?",
    a: "আমাদের প্রতিটি মদিনা সিল্ক ওড়না ১০০% অপেক (সম্পূর্ণ অস্বচ্ছ), মসৃণ অথচ নন-স্লিপ গ্রিপযুক্ত এবং সর্বোচ্চ বাতাস চলাচলযোগ্য (breathable)। এতে কোনো কৃত্রিম পলিয়েস্টার শিরিং নেই, তাই সারাদিন পরলেও আরামদায়ক থাকে।"
  },
  {
    q: "সারা বাংলাদেশে কি ক্যাশ অন ডেলিভারি (COD) সুবিধা আছে?",
    qEn: "Is Cash on Delivery available across Bangladesh?",
    a: "হ্যাঁ, বাংলাদেশের সকল ৬৪ জেলা এবং প্রতিটি উপজেলায় ক্যাশ অন ডেলিভারি সুবিধা রয়েছে। সবচেয়ে বড় সুবিধা হলো, ডেলিভারি এজেন্টের সামনে পার্সেল খুলে যাচাই করে তারপর আপনি মূল্য পরিশোধ করবেন।"
  },
  {
    q: "ডেলিভারি পেতে কত দিন সময় লাগে?",
    qEn: "How long does delivery take?",
    a: "ঢাকার মেট্রো এলাকার ভেতরে ২৪ থেকে ৪৮ ঘণ্টার মধ্যে এবং ঢাকার বাইরে ১ থেকে ৩ কার্যদিবসের মধ্যে স্টিডফাস্ট এক্সপ্রেস কুরিয়ারের মাধ্যমে নিরাপদে আপনার ঠিকানায় পৌঁছে দেওয়া হয়।"
  },
  {
    q: "পণ্য পছন্দ না হলে কি রিটার্ন বা পরিবর্তন (Exchange) করা যাবে?",
    qEn: "Can I return or exchange if not satisfied?",
    a: "নিশ্চয়ই। পার্সেল হাতে পাওয়ার পর ৭ দিনের মধ্যে যেকোনো পণ্য সম্পূর্ণ সহজ ও সম্মানজনক শর্তে এক্সচেঞ্জ বা রিটার্ন করতে পারবেন। কোনো হিডেন চার্জ বা জটিলতা নেই।"
  },
  {
    q: "আতরগুলো কি অ্যালকোহল মুক্ত এবং কতক্ষণ স্থায়ী হয়?",
    qEn: "Are the attars alcohol-free and long-lasting?",
    a: "আমাদের প্রতিটি আতর ১০০% বিশুদ্ধ, প্রাকৃতিক এবং অ্যালকোহল-মুক্ত বোটানিক্যাল এসেন্স দিয়ে তৈরি। এটি ত্বকে বা কাপড়ে ব্যবহারের জন্য সম্পূর্ণ নিরাপদ এবং ১৬ ঘণ্টারও বেশি সময় মনোমুগ্ধকর সুবাস ধরে রাখে।"
  },
  {
    q: "কুরআন শরিফ বা উপহার বক্সে কি নাম কাস্টমাইজেশন করা যায়?",
    qEn: "Can name customization be added to gift boxes?",
    a: "হ্যাঁ, বিয়ে, আকিকা বা প্রিয়জনের উপহারের জন্য আমাদের প্রিমিয়াম গোল্ড ফয়েল নাম খোদাই ও গিফট রিবন প্যাকেজিংয়ের সুবিধা রয়েছে। অর্ডারের পর আমাদের কনসিয়ার্জ টিম আপনার সাথে যোগাযোগ করে নেবে।"
  }
];

export function FaqSection({ faqs = DEFAULT_FAQS }: { faqs?: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="w-full bg-[#08110c] text-[#f8f1e3] py-24 border-t border-[#c9a24d]/20 relative overflow-hidden">
      {/* Background Subtle Ambience */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#c9a24d]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-[1720px] mx-auto px-6 sm:px-12 md:px-16 lg:px-24 xl:px-28 2xl:px-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Header column (4 cols) */}
          <div className="lg:col-span-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#c9a24d]/40 bg-[#c9a24d]/10 px-4 py-1.5 text-xs font-mono uppercase tracking-[0.2em] text-[#c9a24d] mb-5">
              <HelpCircle className="h-3.5 w-3.5" />
              <span>সাধারণ জিজ্ঞাসা • FAQ</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-[#f8f1e3] leading-[1.2]">
              অর্ডারের পূর্বে<br />
              <span className="italic text-[#c9a24d] font-normal">যা জেনে নেওয়া জরুরি</span>
            </h2>

            <p className="mt-5 text-sm sm:text-base text-[#f8f1e3]/70 leading-relaxed max-w-lg">
              নিয়ামাহ্ আতায়ারস-এর পণ্যের খাঁটি মান, ডেলিভারি নিশ্চয়তা, রিটার্ন ও পেমেন্ট ব্যবস্থা নিয়ে সর্বাধিক জিজ্ঞাসিত প্রশ্নের বিস্তারিত উত্তর।
            </p>

            <div className="mt-8 p-5 rounded-lg border border-[#c9a24d]/25 bg-[#123d2a]/40 backdrop-blur-sm max-w-md">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-[#c9a24d] shrink-0" />
                <div>
                  <h4 className="font-serif text-sm font-semibold text-[#f8f1e3]">
                    সরাসরি কথা বলতে চান?
                  </h4>
                  <p className="text-xs text-[#f8f1e3]/70 mt-0.5">
                    আমাদের কাস্টমার কেয়ার প্রতিনিধি সকাল ৯টা থেকে রাত ১১টা পর্যন্ত সক্রিয়।
                  </p>
                </div>
              </div>
              <a
                href="tel:09613240240"
                className="mt-4 block w-full text-center py-2 rounded border border-[#c9a24d] bg-[#c9a24d]/15 text-xs font-mono font-semibold uppercase tracking-wider text-[#c9a24d] hover:bg-[#c9a24d] hover:text-[#123d2a] transition-colors"
              >
                কল করুন: ০৯৬১৩-২৪০২৪০
              </a>
            </div>
          </div>

          {/* Accordion column (7 cols) */}
          <div className="lg:col-span-7 space-y-3.5">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              const num = String(index + 1).padStart(2, "0");

              return (
                <div
                  key={faq.q}
                  className={`border rounded-lg transition-all duration-300 ${
                    isOpen
                      ? "border-[#c9a24d]/60 bg-[#123d2a]/50 shadow-lg shadow-black/20"
                      : "border-white/10 bg-[#0d1c14]/40 hover:border-[#c9a24d]/30"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="w-full text-left px-6 py-5 flex items-start justify-between gap-4 cursor-pointer"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-start gap-3.5">
                      <span className="font-mono text-xs font-bold text-[#c9a24d] pt-0.5">
                        {num}
                      </span>
                      <div>
                        <h3 className="font-serif text-base sm:text-lg font-medium text-[#f8f1e3]">
                          {faq.q}
                        </h3>
                        {faq.qEn && (
                          <span className="text-[11px] font-mono text-[#c9a24d]/75 block mt-0.5">
                            {faq.qEn}
                          </span>
                        )}
                      </div>
                    </div>
                    <div
                      className={`h-7 w-7 rounded-full border border-white/20 flex items-center justify-center shrink-0 text-[#c9a24d] transition-transform duration-300 ${
                        isOpen ? "rotate-180 border-[#c9a24d] bg-[#c9a24d]/10" : ""
                      }`}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-6 pt-1 text-sm text-[#f8f1e3]/80 leading-relaxed border-t border-white/5">
                      <p className="pl-7">{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
