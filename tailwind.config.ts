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
        "toast-enter": "toastEnter 0.3s ease forwards",
        "toast-exit": "toastExit 0.25s ease forwards",
        "toast-progress": "toastProgress 4s linear forwards",
      },
      keyframes: {
        slideUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        toastEnter: {
          from: { opacity: "0", transform: "translateX(calc(100% + 1rem))" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        toastExit: {
          from: { opacity: "1", transform: "translateX(0)" },
          to: { opacity: "0", transform: "translateX(calc(100% + 1rem))" },
        },
        toastProgress: {
          from: { width: "100%" },
          to: { width: "0%" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
