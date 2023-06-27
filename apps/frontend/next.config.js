module.exports = {
  reactStrictMode: true,
  transpilePackages: ["ui"],
  experimental: {
    appDir: true,
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },
};
