import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0a",
        surface: "#141414",
        card: "#1a1a1a",
        border: "#2a2a2a",
        gold: "#c9a84c",
        "gold-light": "#e8c96d",
        silver: "#9e9e9e",
        bronze: "#cd7f32",
        danger: "#ef4444",
        success: "#22c55e",
        "grade-special": "#fbbf24",
        "grade-1": "#60a5fa",
        "grade-2": "#4ade80",
        "grade-3": "#9ca3af",
      },
      fontFamily: {
        sans: ["Noto Sans KR", "sans-serif"],
      },
      backgroundImage: {
        "gold-gradient":
          "linear-gradient(135deg, #c9a84c 0%, #e8c96d 50%, #c9a84c 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
