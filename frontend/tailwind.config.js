/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#F5A623', // Primary / Brand Accent
        },
        background: {
          DEFAULT: '#FFFFFF', // Background Base
          surface: '#F7F7F9', // Surface / Muted Containers
        },
        text: {
          primary: '#000000', // Text Primary
          secondary: '#6E7682', // Text Secondary
        },
        border: {
          DEFAULT: '#6E7682', // Borders
        },
        accent: {
          DEFAULT: '#B3261E', // Accent Action (Crimson Red)
        }
      }
    },
  },
  plugins: [],
}
