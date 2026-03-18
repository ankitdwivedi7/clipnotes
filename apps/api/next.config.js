/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@clipnotes/shared"],
};

module.exports = nextConfig;
