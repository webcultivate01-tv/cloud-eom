/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* ── Cloud Graphics brand ─────────────────────────────────────
           Sampled off the logo mark itself: the cloud gradient runs from
           #008cd0 (bright azure, left edge) to #0f435d (deep petrol, right),
           with #0672a7 as the dominant mid-tone. 600 is the signature
           colour; 700/800 carry buttons and their hovers. */
        brand: {
          50:  "#eff8fd",
          100: "#daeffa",
          200: "#b0def4",
          300: "#6fc3e9",
          400: "#29a3dc",
          500: "#0288cb",
          600: "#0672a7",
          700: "#0a5b82",
          800: "#0c4a69",
          900: "#0f435d",
          950: "#082c3e",
        },
        /* Alias — keeps `primary-*` markup pointed at the brand. */
        primary: {
          50:  "#eff8fd",
          100: "#daeffa",
          200: "#b0def4",
          300: "#6fc3e9",
          400: "#29a3dc",
          500: "#0288cb",
          600: "#0672a7",
          700: "#0a5b82",
          800: "#0c4a69",
          900: "#0f435d",
          950: "#082c3e",
        },
      },
      fontFamily: {
        sans: ["Inter", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
        display: ["Playfair Display", "Georgia", "Times New Roman", "serif"],
      },
      boxShadow: {
        card:        "0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
        "card-hover":"0 4px 16px -2px rgb(0 0 0 / 0.1), 0 2px 8px -2px rgb(0 0 0 / 0.06)",
        "glow":      "0 0 0 3px rgb(6 114 167 / 0.20)",
        "glow-sm":   "0 0 0 2px rgb(6 114 167 / 0.16)",
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        ping2: {
          "75%, 100%": { transform: "scale(2)", opacity: "0" },
        },
        slideInLeft: {
          from: { transform: "translateX(-100%)" },
          to:   { transform: "translateX(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in-up":    "fadeInUp 0.25s ease-out",
        "ping2":         "ping2 1.5s cubic-bezier(0,0,0.2,1) infinite",
        "slide-in-left": "slideInLeft 0.25s cubic-bezier(0.22, 1, 0.36, 1)",
        "shimmer":       "shimmer 1.6s infinite",
      },
    },
  },
  plugins: [],
}
