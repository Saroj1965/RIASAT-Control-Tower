/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["@electric-sql/pglite", "pg", "@neondatabase/serverless"],
  },
};

export default nextConfig;
