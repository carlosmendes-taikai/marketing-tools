import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // one official address: www and the old vercel.app address forward to mktbox.xyz
  async redirects() {
    return ["www.mktbox.xyz", "nopaywall.vercel.app"].map((host) => ({
      // /api stays put on every host: emails already sent load their social icons from there
      source: "/:path((?!api/).*)",
      has: [{ type: "host" as const, value: host }],
      destination: "https://mktbox.xyz/:path*",
      permanent: true,
    }));
  },
};

export default nextConfig;
