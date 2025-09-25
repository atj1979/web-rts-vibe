# Local HTTPS for WebXR development

This project supports running the Vite dev server over HTTPS using local TLS certificates (recommended for testing WebXR on headsets like Quest).

Why: Some WebXR features (especially immersive sessions) require an HTTPS context. The deployed site is already HTTPS; to test locally you can run the dev server over HTTPS.

Using the Vite plugin (recommended)

This project includes `vite-plugin-mkcert` which automatically provisions a local TLS certificate for the Vite dev server when running `npm run dev` on your machine. The plugin is the simplest option to get HTTPS for local WebXR testing.

Quick steps

1. Install dependencies locally:

```bash
npm install
```

2. Make sure mkcert is installed on your machine and its CA is trusted. Follow the mkcert installation instructions for your OS: https://github.com/FiloSottile/mkcert#installation

3. Start the dev server (the Vite plugin will create and use a local cert automatically):

```bash
npm run dev
```

4. Open the HTTPS URL on your headset browser:

https://<your-pc-ip>:5173

Notes

- The plugin will store generated certificates in Vite's internal cache (or your OS-specific temp location). If you prefer to manage certs manually, you can still place `localhost.pem` and `localhost-key.pem` into a `certs/` folder at the project root; `vite.config.ts` will use them if present.
- If the headset refuses the certificate, ensure you ran `mkcert -install` on your development machine and that the device trusts your machine's CA. Some headsets may require additional steps or may not accept local CAs; in that case use a public HTTPS tunnel such as ngrok or cloudflared.

Troubleshooting

- If `npm run dev` fails to start because `vite-plugin-mkcert` isn't installed, run `npm install` then try again.
- If you prefer programmatic generation without mkcert, consider the `devcert` package, but be aware it may require additional platform-specific setup.
