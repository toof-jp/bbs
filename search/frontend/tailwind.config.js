/** @type {import('tailwindcss').Config} */
import typography from '@tailwindcss/typography';

export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "Hiragino Sans",
          "Noto Sans JP",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SF Mono",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      colors: {
        canvas: "var(--canvas)",
        surface: "var(--surface)",
        fill: "var(--fill)",
        "fill-strong": "var(--fill-strong)",
        separator: "var(--separator)",
        label: "var(--label)",
        "label-secondary": "var(--label-secondary)",
        "label-tertiary": "var(--label-tertiary)",
        accent: "var(--accent)",
        "accent-soft": "var(--accent-soft)",
        "accent-ring": "var(--accent-ring)",
        highlight: "var(--highlight)",
      },
    },
  },
  plugins: [
    typography,
  ],
}
