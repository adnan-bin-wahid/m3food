import './globals.css';


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
    <html lang="bn">
      <body>{children}</body>
    </html>
  );
}
