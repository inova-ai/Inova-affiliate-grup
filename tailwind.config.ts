import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Playfair Display", "serif"]
      },
      colors: {
        gold: {
          300: "#f5d77b",
          400: "#e9c35a",
          500: "#c99b2e",
          600: "#9e761d"
        }
      },
      boxShadow: {
        gold: "0 0 60px rgba(201,155,46,.18)"
      }
    }
  },
  plugins: []
};
export default config;
