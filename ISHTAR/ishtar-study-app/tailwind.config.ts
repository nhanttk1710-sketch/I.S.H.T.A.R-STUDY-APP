import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: { extend: {
    colors: { brand: { 50: "#eff8ff", 100: "#dbeefe", 200: "#b9e1fd", 500: "#58aee8", 600: "#338fd1", 700: "#2874ae" } },
    boxShadow: { soft: "0 8px 30px rgba(15, 23, 42, .045)" }
  }},
  plugins: [require("tailwindcss-animate")]
};
export default config;