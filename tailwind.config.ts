import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0d3b2e",
          50: "#f0fdf4",
          600: "#0d3b2e",
          700: "#0a2d23",
        },
        accent: {
          DEFAULT: "#22c55e",
        },
        ink: "#0f172a",
        subtext: "#64748b",
        border: "#e5e7eb",
        surface: "#f9fafb",
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "Plus Jakarta Sans",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      borderRadius: {
        xl: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
