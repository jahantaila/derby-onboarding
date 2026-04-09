import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        derby: {
          dark: "#0A1628",
          card: "#1A2744",
          blue: "#2093FF",
          "blue-deep": "#0026FF",
          text: "#1A1A2E",
        },
      },
    },
  },
  plugins: [],
};
export default config;
