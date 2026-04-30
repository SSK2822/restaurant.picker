/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sun: {
          50: "#FFF8E7",
          100: "#FFEFC2",
          200: "#FFE08A",
          300: "#FFCB52",
          400: "#FFB02B",
          500: "#F39305",
          600: "#D87508",
          700: "#A8550B",
          800: "#7A3D0F",
          900: "#522810",
        },
        bird: {
          50: "#FFF1F0",
          100: "#FFD9D6",
          200: "#FFB1AB",
          300: "#FF7E76",
          400: "#FF534A",
          500: "#E83A30",
          600: "#B92A23",
        },
      },
      fontFamily: {
        display: ["'Fraunces'", "Georgia", "serif"],
        sans: ["'Inter'", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        cozy: "0 8px 24px -8px rgba(168, 85, 11, 0.25)",
        pop: "0 12px 32px -8px rgba(232, 58, 48, 0.45)",
      },
    },
  },
  plugins: [],
};
