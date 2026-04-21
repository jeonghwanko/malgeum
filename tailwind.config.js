/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#4A90D9",
        "primary-light": "#74B9FF",
        safe: "#10B981",
        caution: "#F59E0B",
        warn: "#EF4444",
        "bg-light": "#F5F0EB",
        "bg-dark": "#0F172A",
        "bg-dark-alt": "#1E293B",
        slate: {
          900: "#0F172A",
          800: "#1E293B",
          700: "#334155",
          600: "#475569",
          500: "#64748B",
          400: "#94A3B8",
          300: "#CBD5E1",
          200: "#E2E8F0",
          100: "#F1F5F9",
          50: "#F8FAFC",
        },
        gold: "#FFE066",
      },
      fontFamily: {
        sans: ["Pretendard Variable"],
      },
    },
  },
  plugins: [],
};
