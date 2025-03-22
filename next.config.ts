/** @type {import('next').NextConfig} */
import NextPWA from 'next-pwa';

const withPWA = NextPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV !== 'production' // Disable PWA in development mode
});

const nextConfig = {
  /* config options here */
};

export default withPWA(nextConfig);
