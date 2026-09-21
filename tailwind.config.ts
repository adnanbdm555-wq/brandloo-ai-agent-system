import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#14161C",
          light: "#1F222B",
          border: "#2A2E38",
        },
        canvas: "#F7F6F2",
        surface: "#FFFFFF",
        border: "#E6E3DC",
        muted: "#8A8778",
        indigo: {
          DEFAULT: "#3552E0",
          dark: "#2A41B8",
          light: "#EEF0FD",
        },
        amber: {
          DEFAULT: "#E7A33E",
          dark: "#C6842A",
          light: "#FCF0DC",
        },
        success: {
          DEFAULT: "#2E9B6F",
          light: "#E4F5EE",
        },
        danger: {
          DEFAULT: "#D6483B",
          light: "#FBEAE8",
        },
      },
      fontFamily: {
        display: ["Fraunces", "ui-serif", "Georgia", "serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(20, 22, 28, 0.04), 0 1px 8px rgba(20, 22, 28, 0.04)",
      },
      borderRadius: {
        xl: "0.875rem",
      },
    },
  },
  plugins: [],
};

export default config;
