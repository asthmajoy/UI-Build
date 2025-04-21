/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    // Consider adding these for more comprehensive class scanning
    "./public/index.html",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Example of custom color palette
        // 'brand-primary': '#3B82F6',
        // 'brand-secondary': '#10B981',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'pulse': 'pulse 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulse: {
          '0%': { transform: 'scale(0.95)', boxShadow: '0 0 0 0 rgba(99, 102, 241, 0.7)' },
          '70%': { transform: 'scale(1)', boxShadow: '0 0 0 5px rgba(99, 102, 241, 0)' },
          '100%': { transform: 'scale(0.95)', boxShadow: '0 0 0 0 rgba(99, 102, 241, 0)' },
        },
      },
      // Additional theme extensions
      // fontFamily: {
      //   'sans': ['Inter', 'system-ui', 'sans-serif'],
      // },
      // boxShadow: {
      //   'custom': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      // },
    },
  },
  variants: {
    extend: {
      // Extend variants if needed
      // opacity: ['disabled'],
      // backgroundColor: ['active'],
    }
  },
  plugins: [
    require('@tailwindcss/typography'),
    // Consider additional plugins
    // require('@tailwindcss/forms'),
    // require('@tailwindcss/aspect-ratio'),
  ],
}