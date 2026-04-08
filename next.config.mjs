/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Allow embedding only for the /embed route
        source: "/embed",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "frame-ancestors https://derbydigital.us https://*.derbydigital.us",
          },
        ],
      },
      {
        // Deny framing for all other routes
        source: "/((?!embed).*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'none'",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
