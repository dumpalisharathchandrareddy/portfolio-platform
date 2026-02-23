import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",          // ✅ important for strict matching
        pathname: "/**",
      },
    ],
  },

  reactCompiler: true,
};

export default nextConfig;