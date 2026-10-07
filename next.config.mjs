/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["@electric-sql/pglite", "pg", "@neondatabase/serverless"],
  experimental: {
    serverComponentsExternalPackages: ["@electric-sql/pglite", "pg", "@neondatabase/serverless"],
  },
};

export default nextConfig;
