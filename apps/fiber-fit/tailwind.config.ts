import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./screens/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#070807",
        panel: "#111411",
        hairline: "#1E241E",
        lime: "#D6FF3A",
        mint: "#3DFF9A",
        gold: "#E6C36A",
        blood: "#FF5A4A",
        paper: "#F3F6F1",
        fog: "#7E877C",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "sans-serif"],
        serif: ["var(--font-serif)", "Instrument Serif", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
