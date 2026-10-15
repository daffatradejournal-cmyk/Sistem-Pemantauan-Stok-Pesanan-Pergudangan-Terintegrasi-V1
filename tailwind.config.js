/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#12131A',
        darkSidebar: '#181922',
        darkCard: '#1E202B',
        darkCardHover: '#262938',
        darkBorder: '#282B3A',
        lightBg: '#F4F6F9',
        lightSidebar: '#FFFFFF',
        lightCard: '#FFFFFF',
        lightCardHover: '#F8FAFC',
        lightBorder: '#E2E8F0',
        brandBlue: '#3B6EF6',
        brandAmber: '#F5A623',
        brandGreen: '#10B981',
        brandPurple: '#A855F7',
        brandRed: '#EF4444',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
}
