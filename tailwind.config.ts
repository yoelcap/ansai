import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: "#f5f1ea",
          dark: "#ece5d8",
        },
        ink: {
          DEFAULT: "#1a1a1a",
          soft: "#2a2a2a",
        },
        forest: {
          DEFAULT: "#1f3a2e",
          dark: "#142821",
          light: "#2d5544",
        },
        terra: {
          DEFAULT: "#c4663d",
          light: "#d97e54",
        },
        gold: "#c9a961",
        muted: "#6b6660",
        line: "#d8d2c4",
        paper: "#fdfbf6",
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      animation: {
        "slide-up": "slideUp 0.7s ease backwards",
        "pulse-slow": "pulse 2s ease-in-out infinite",
        "spin-slow": "spin 8s linear infinite",
      },
      keyframes: {
        slideUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
