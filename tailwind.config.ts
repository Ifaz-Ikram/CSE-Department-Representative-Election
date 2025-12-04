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
        navy: {
          DEFAULT: '#0a1628',
          dark: '#050d18',
          light: '#0f1f38',
        },
        cyan: {
          DEFAULT: '#00d9ff',
          light: '#33e1ff',
          dark: '#00aad4',
        },
        yellow: {
          accent: '#ffd700',
        },
      },
      backgroundImage: {
        'circuit-pattern': "url('/circuit-pattern.svg')",
      },
    },
  },
  plugins: [],
};
export default config;
