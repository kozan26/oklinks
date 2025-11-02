/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B0D0E",
        graphite: "#1A1C1E",
        olive: "#3A3F36",
        accent: "#43D5FF",
      },
      backgroundColor: {
        default: "#0B0D0E",
        surface: "#1A1C1E",
      },
      textColor: {
        default: "#FFFFFF",
        muted: "#A0A0A0",
      },
    },
  },
  plugins: [],
};

