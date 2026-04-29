/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2d5a27',
          light: '#4a7c44',
          dark: '#1e3d1a',
        },
        accent: {
          DEFAULT: '#f4b400',
          light: '#ffd700',
        },
        background: {
          main: '#f9fbf9',
          card: '#ffffff',
          footer: '#1a1a1a',
        },
        text: {
          main: '#2d2d2d',
          muted: '#6b7280',
          light: '#9ca3af',
        },
        border: '#e5e7eb',
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
      },
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '1.5rem',
          lg: '2rem',
        },
      },
    },
  },
  plugins: [],
}

