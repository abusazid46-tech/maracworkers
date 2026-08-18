const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  transpilePackages: [
    "@the-wings/api-client",
    "@the-wings/types",
    "@the-wings/validation",
    "@the-wings/ui"
  ],
  images: {
    unoptimized: true
  },
  ...(basePath
    ? {
        basePath,
        assetPrefix: basePath
      }
    : {})
};

export default nextConfig;
