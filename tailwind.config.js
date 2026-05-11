/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          '50': 'rgb(var(--brand-50) / <alpha-value>)',
          '100': 'rgb(var(--brand-100) / <alpha-value>)',
          '200': 'rgb(var(--brand-200) / <alpha-value>)',
          '300': 'rgb(var(--brand-300) / <alpha-value>)',
          '400': 'rgb(var(--brand-400) / <alpha-value>)',
          '500': 'rgb(var(--brand-500) / <alpha-value>)',
          '600': 'rgb(var(--brand-600) / <alpha-value>)',
          '700': 'rgb(var(--brand-700) / <alpha-value>)',
          '800': 'rgb(var(--brand-800) / <alpha-value>)',
          '900': 'rgb(var(--brand-900) / <alpha-value>)',
          '950': 'rgb(var(--brand-950) / <alpha-value>)',
        },
        orange: {
          '50': 'rgb(var(--brand-50) / <alpha-value>)',
          '100': 'rgb(var(--brand-100) / <alpha-value>)',
          '200': 'rgb(var(--brand-200) / <alpha-value>)',
          '300': 'rgb(var(--brand-300) / <alpha-value>)',
          '400': 'rgb(var(--brand-400) / <alpha-value>)',
          '500': 'rgb(var(--brand-500) / <alpha-value>)',
          '600': 'rgb(var(--brand-600) / <alpha-value>)',
          '700': 'rgb(var(--brand-700) / <alpha-value>)',
          '800': 'rgb(var(--brand-800) / <alpha-value>)',
          '900': 'rgb(var(--brand-900) / <alpha-value>)',
          '950': 'rgb(var(--brand-950) / <alpha-value>)',
        },
      },
      borderRadius: {
        'xl': '0.75rem', 
        '2xl': '1rem',   
      },
      fontFamily: {
        sans: ['var(--font-manrope)', 'sans-serif'],
        'plus-jakarta': ['var(--font-plus-jakarta)', 'sans-serif'],
        manrope: ['var(--font-manrope)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
