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
          deep: "#07291f",
        },
        accent: {
          DEFAULT: "#22c55e",
          deep: "#16a34a",
          soft: "#f0fdf4",
          border: "#bbf7d0",
          text: "#166534",
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
        serif: [
          "Quilge",
          "Playfair Display",
          "DM Serif Display",
          "Georgia",
          "Times New Roman",
          "serif",
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
