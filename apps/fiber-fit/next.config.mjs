/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["postgres", "@electric-sql/pglite"],
  },
};

export default nextConfig;
