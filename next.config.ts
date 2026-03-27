/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",      // Allows images with HTTPS protocol
        hostname: "**",         // Accepts images from any hostname
        pathname: "/**",        // Accepts images from any path
      },
    ],
  },
};

export default nextConfig;
