import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#12231c",
        brand: {
          DEFAULT: "#147d64",
          dark: "#0f604d",
          light: "#e8f5f0",
          accent: "#1ab08d",
        },
        sand: "#f8f9f6",
      },
      boxShadow: {
        "2xs": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        soft: "0 12px 40px -8px rgba(18,35,28,0.08)",
        card: "0 4px 24px -2px rgba(18,35,28,0.06)",
        hover: "0 20px 40px -10px rgba(20,125,100,0.12)",
        modal: "0 25px 70px -15px rgba(0,0,0,0.3)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};

export default config;
