/** @type {import("next").NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: process.env.GITHUB_PAGES === 'true' ? '/lifeos' : undefined,
  assetPrefix: process.env.GITHUB_PAGES === 'true' ? '/lifeos/' : undefined,
  images: {
    unoptimized: true,
  },
  transpilePackages: ['@lifeos/engine']
};
export default nextConfig;
