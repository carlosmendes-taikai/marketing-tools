import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // browser security settings on every page (the vibe coding audit checks these, so we should pass it too)
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'; form-action 'self'; upgrade-insecure-requests" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
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
