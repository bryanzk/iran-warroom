import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#f4f7f8",
        ink: "#112028",
        accent: "#0f766e",
        warning: "#b45309",
        danger: "#b91c1c"
      }
    }
  },
  plugins: []
};

export default config;
