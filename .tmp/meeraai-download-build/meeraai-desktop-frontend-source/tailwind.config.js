/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ocean: "#0B1F3A",
        accent: "#2F7CF6",
        cyan: "#2ED0FF",
        graphite: "#0F172A",
        slateDeep: "#1E293B",
        steel: "#334155",
      },
      boxShadow: {
        glass: "0 20px 60px rgba(0, 0, 0, 0.35)",
      },
      borderRadius: {
        liquid: "1.4rem",
      },
      backdropBlur: {
        liquid: "30px",
      },
      animation: {
        pulseSoft: "pulseSoft 1.8s ease-in-out infinite",
        rise: "rise 300ms ease-out",
      },
      keyframes: {
        pulseSoft: {
          "0%,100%": { opacity: "0.75", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.12)" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
