/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp']
  },
  env: {
    NEXT_PUBLIC_STORE_SLUG: process.env.NEXT_PUBLIC_STORE_SLUG || 'niyamah-attires',
    NEXT_PUBLIC_META_PIXEL_ID: process.env.NEXT_PUBLIC_META_PIXEL_ID || process.env.META_PIXEL_ID || ''
  }
};

export default nextConfig;
