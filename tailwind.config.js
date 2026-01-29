/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sidebar: "#474D4F",
        "sidebar-active": "#60B570",
        "header-bar": "#68BCE1",
        "filter-bar": "#D2D8DA",
        "btn-secondary": "#E0E0E0",
        "green-primary": "#69A68D",
        "green-accent": "#82CB97",
        "orange-inactive": "#F9AD52",
      },
    },
  },
  plugins: [],
};
