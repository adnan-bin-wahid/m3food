import './globals.css';
import { Noto_Serif_Bengali, Playfair_Display, Caveat } from 'next/font/google';

const notoSerifBengali = Noto_Serif_Bengali({
  subsets: ['bengali'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-noto-serif-bengali'
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-playfair'
});

const caveat = Caveat({
  subsets: ['latin'],
  weight: ['500', '700'],
  display: 'swap',
  variable: '--font-caveat'
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#0c0306'
};

export const metadata = {
  title: 'Niyamah Attires — Luxury Modest Fashion & Fine Fragrance',
  description: 'Niyamah Attires — Premium modest fashion, veils, sacred Qurans, and artisanal fragrances crafted with grace and intention.',
  keywords: ['Niyamah Attires', 'niyamah-attires', 'niyamah_attires', 'modest fashion', 'hijab', 'attar', 'quran', 'bangladesh'],
  metadataBase: new URL('https://niyamah.vercel.app')
};

export default function RootLayout({ children }) {
  return (
    <html lang="bn" className={`${notoSerifBengali.variable} ${playfairDisplay.variable} ${caveat.variable}`}>
      <head>
        <link
          rel="preload"
          as="image"
          href="/niyamah/slider/mobile-version.webp"
          type="image/webp"
          fetchPriority="high"
          media="(max-width: 767px)"
        />
      </head>
      <body className={notoSerifBengali.className}>{children}</body>
    </html>
  );
}
