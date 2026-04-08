import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        derby: {
          blue: {
            light: "#2093FF",
            DEFAULT: "#1A6FCC",
            dark: "#0026FF",
          },
          dark: "#0A0E1A",
        },
      },
      fontFamily: {
        heading: ["var(--font-anton)", "sans-serif"],
        body: ["var(--font-open-sans)", "sans-serif"],
      },
      backgroundImage: {
        "derby-gradient": "linear-gradient(135deg, #2093FF 0%, #0026FF 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
