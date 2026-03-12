import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./content/**/*.{md,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Cyfrin brand colors
        cyfrin: {
          primary: '#004DFF',
          light: '#004DFF',
          dark: '#004DFF',
        },
        // Product colors
        codehawks: {
          primary: '#FF4405',
          light: '#FF692E',
          dark: '#E62E05',
        },
        updraft: {
          primary: '#66C61C',
          light: '#85E13A',
          dark: '#4CA30D',
        },
        solodit: {
          primary: '#9E77ED',
          light: '#B692F6',
          dark: '#7F56D9',
        },
        battlechain: {
          primary: '#FFFFFF',
          light: '#F5F5F5',
          dark: '#E8E8E8',
        },
        profiles: {
          primary: '#004DFF',
          light: '#004DFF',
          dark: '#004DFF',
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      animation: {
        'grid-move': 'gridMove 20s linear infinite',
        'float': 'float 8s ease-in-out infinite',
        'particle-float': 'particleFloat 15s linear infinite',
        'logo-pulse': 'logoPulse 3s ease-in-out infinite',
        'border-rotate': 'borderRotate 3s linear infinite',
      },
      keyframes: {
        gridMove: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '50px 50px' },
        },
        float: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(30px, -30px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
        },
        particleFloat: {
          '0%': { transform: 'translateY(100vh) scale(0)', opacity: '0' },
          '10%': { opacity: '0.6' },
          '90%': { opacity: '0.6' },
          '100%': { transform: 'translateY(-100px) scale(1)', opacity: '0' },
        },
        logoPulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
        },
        borderRotate: {
          '0%': { filter: 'hue-rotate(0deg)' },
          '100%': { filter: 'hue-rotate(360deg)' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
export default config;
