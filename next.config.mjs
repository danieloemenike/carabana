/** @type {import('next').NextConfig} */
const r2PublicUrl = process.env.R2_PUBLIC_URL ?? process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: r2PublicUrl
      ? [
          {
            protocol: new URL(r2PublicUrl).protocol.replace(":", ""),
            hostname: new URL(r2PublicUrl).hostname,
            pathname: "/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
