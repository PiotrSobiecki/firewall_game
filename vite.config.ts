/// <reference types="vitest/config" />
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  // host: true → dev server nasłuchuje na LAN (telefon w tej samej sieci Wi-Fi
  // otwiera http://<IP-komputera>:5173, np. http://192.168.0.189:5173)
  server: { host: true },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/main.ts", "src/scenes/**"],
    },
  },
});
