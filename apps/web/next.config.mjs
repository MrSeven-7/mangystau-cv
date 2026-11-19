/** @type {import('next').NextConfig} */
const apiUrl = (process.env.API_URL || "http://localhost:4000")
  .replace(/\/+$/, "")
  .replace(/\/api$/i, "");

const nextConfig = {
  transpilePackages: ["@mangystau/shared"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
