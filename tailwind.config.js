/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "on-secondary-fixed": "#092100",
        "on-tertiary-fixed": "#121c2c",
        primary: "#468432",
        "on-secondary": "#ffffff",
        "on-surface": "#0b1c30",
        "primary-container": "#9AD872",
        "surface-dim": "#FFEF91",
        background: "#f8f9ff",
        "surface-container-lowest": "#ffffff",
        "surface-container-high": "#dce9ff",
        "surface-tint": "#468432",
        "on-tertiary": "#ffffff",
        "inverse-surface": "#213145",
        "on-secondary-container": "#468432",
        "on-surface-variant": "#544435",
        "tertiary-fixed": "#FFEF91",
        "on-primary-container": "#468432",
        "outline-variant": "#9AD872",
        "primary-fixed-dim": "#FFA02E",
        error: "#ba1a1a",
        surface: "#f8f9ff",
        "surface-container": "#e5eeff",
        "error-container": "#ffdad6",
        "inverse-on-surface": "#eaf1ff",
        "surface-container-highest": "#d3e4fe",
        "surface-bright": "#f8f9ff",
        "on-tertiary-container": "#468432",
        outline: "#9AD872",
        "on-secondary-fixed-variant": "#468432",
        "secondary-fixed-dim": "#9AD872",
        "on-background": "#0b1c30",
        "on-error-container": "#93000a",
        tertiary: "#FFEF91",
        "secondary-fixed": "#9AD872",
        "primary-fixed": "#FFEF91",
        "on-error": "#ffffff",
        "tertiary-fixed-dim": "#FFA02E",
        "tertiary-container": "#9AD872",
        "on-primary-fixed-variant": "#468432",
        "secondary-container": "#9AD872",
        secondary: "#9AD872",
        "on-primary": "#ffffff",
      },

      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px",
      },

      spacing: {
        gutter: "24px",
        xl: "80px",
        base: "8px",
        lg: "48px",
        margin: "32px",
        md: "24px",
        sm: "12px",
        xs: "4px",
      },

      fontFamily: {
        h3: ["Plus Jakarta Sans"],
        "body-md": ["Inter"],
        h2: ["Plus Jakarta Sans"],
        h1: ["Plus Jakarta Sans"],
        display: ["Plus Jakarta Sans"],
        "body-lg": ["Inter"],
        "label-md": ["Inter"],
        caption: ["Inter"],
      },

      fontSize: {
        h3: [
          "20px",
          {
            lineHeight: "1.4",
            fontWeight: "600",
          },
        ],

        "body-md": [
          "16px",
          {
            lineHeight: "1.6",
            fontWeight: "400",
          },
        ],

        h2: [
          "24px",
          {
            lineHeight: "1.3",
            fontWeight: "700",
          },
        ],

        h1: [
          "32px",
          {
            lineHeight: "1.25",
            fontWeight: "700",
          },
        ],

        display: [
          "48px",
          {
            lineHeight: "1.2",
            letterSpacing: "-0.02em",
            fontWeight: "800",
          },
        ],

        "body-lg": [
          "18px",
          {
            lineHeight: "1.6",
            fontWeight: "400",
          },
        ],

        "label-md": [
          "14px",
          {
            lineHeight: "1",
            letterSpacing: "0.05em",
            fontWeight: "600",
          },
        ],

        caption: [
          "12px",
          {
            lineHeight: "1.4",
            fontWeight: "500",
          },
        ],
      },
    },
  },
  plugins: [],
};