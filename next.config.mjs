/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp']
  },
  env: {
    NEXT_PUBLIC_STORE_SLUG: process.env.NEXT_PUBLIC_STORE_SLUG || 'm3food'
  }
};

export default nextConfig;
