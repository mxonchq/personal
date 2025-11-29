# Personal PWA starter

Minimal Next.js app using TypeScript and Tailwind CSS. The starter ships with a sidebar shell layout, light/dark theme toggle, and a custom PWA setup (manifest plus a service worker that caches core routes for offline support).

## Getting started

1. Install dependencies (Node 20+):
   ```bash
   npm install
   ```
2. Run the dev server:
   ```bash
   npm run dev
   ```
3. Build for production:
   ```bash
   npm run build && npm run start
   ```

## PWA

- Manifest lives at `public/manifest.webmanifest` with text-based SVG icons (`icon-192.svg`, `icon-512.svg`) to avoid binary assets in the repository.
- The service worker in `public/sw.js` pre-caches `/`, `/pwa`, `/settings`, and the manifest, then caches subsequent GET requests.
- Registration occurs automatically on the client via `ServiceWorkerRegister` when running on HTTPS or localhost.

## Theming & layout

- `ThemeProvider` manages light/dark mode and persists the choice in `localStorage` while respecting `prefers-color-scheme`.
- Layout primitives live under `components/layout` with a sidebar, header, and content area ready for additional routes within `app/`.
- Fonts are loaded via `next/font` (Inter + Space Grotesk) and exposed as CSS variables for Tailwind.
