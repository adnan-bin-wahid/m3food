import './globals.css';


export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#f7faed'
};

export const metadata = {
  title: 'M3Food — চুইঝাল মিষ্টি মসলা',
  description: 'খুলনার ঐতিহ্যবাহী চুইঝাল দিয়ে তৈরি M3Food চুইঝাল মিষ্টি মসলার আধুনিক বাংলা ল্যান্ডিং পেজ।',
  keywords: ['M3Food', 'চুইঝাল', 'চুইঝাল মিষ্টি মসলা', 'খুলনা', 'বাংলাদেশ'],
  metadataBase: new URL('https://m3food.com')
};

export default function RootLayout({ children }) {
  return (
    <html lang="bn">
      <body>{children}</body>
    </html>
  );
}
