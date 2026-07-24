import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
// import react from '@vitejs/plugin-react' // uncomment if this is a React project

export default defineConfig({
  plugins: [
    tailwindcss(),
    // react(),
  ],
});
