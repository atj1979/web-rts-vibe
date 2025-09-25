import { defineConfig } from "vite";
import fs from "fs";
import path from "path";
import mkcertPlugin from "vite-plugin-mkcert";

// Update the base path to match your repo name
const certDir = path.resolve(process.cwd(), "certs");
const certPath = path.join(certDir, "localhost.pem");
const keyPath = path.join(certDir, "localhost-key.pem");

let httpsConfig: false | { key: Buffer; cert: Buffer } = false;
if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  httpsConfig = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };
}

export default defineConfig({
  base: "/web-rts-vibe/",
  plugins: mkcertPlugin ? [mkcertPlugin()] : [],
  server: {
    // allow access over LAN; useful for testing on a headset on the same Wi-Fi
    host: true,
    https: httpsConfig || undefined,
  },
});
