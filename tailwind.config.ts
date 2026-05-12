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
          DEFAULT: "#16a34a",
        },
        ink: "#111827",
        subtext: "#6b7280",
        border: "#e5e7eb",
        surface: "#f9fafb",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      borderRadius: {
        xl: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
