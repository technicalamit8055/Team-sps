import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";
import legacy from "@vitejs/plugin-legacy";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // The Baileys WhatsApp server runs as its own long-lived process
      // (npm run server). Proxying keeps the SPA on a single origin in dev.
      "/api/whatsapp": {
        target: process.env.WHATSAPP_SERVER_URL || "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      // Without this the service worker is generated but never registered, so
      // Chrome never fires `beforeinstallprompt` and "Install app" is unavailable
      // on every Android device. Injecting the registration script keeps
      // src/main.tsx free of PWA wiring.
      injectRegister: "script-defer",
      // Only small, always-needed files belong here. favicon.png (846KB) and
      // team-logo.png (846KB) are deliberately left out of the precache and
      // served/cached on demand instead.
      includeAssets: [
        "favicon.ico",
        "apple-touch-icon.png",
        "pwa-144x144.png",
        "offline.html",
      ],
      manifest: {
        id: "/",
        name: "Team SPS - Master OS & Citizen Platform",
        short_name: "Team SPS",
        description: "सुरज प्रताप एवं Team SPS की आधिकारिक डिजिटल प्रणाली - Master OS, Janta Portal & Victory OS",
        theme_color: "#000080",
        background_color: "#FFFFFF",
        display: "standalone",
        orientation: "any",
        start_url: "/login?source=pwa",
        scope: "/",
        categories: ["productivity", "government", "utilities"],
        icons: [
          {
            src: "/pwa-64x64.png",
            sizes: "64x64",
            type: "image/png",
          },
          {
            src: "/pwa-144x144.png",
            sizes: "144x144",
            type: "image/png",
          },
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
        ],
        shortcuts: [
          {
            name: "Master OS Control Plane",
            short_name: "Master OS",
            description: "केंद्रीय कार्यक्षेत्र और कार्यकर्ता नियंत्रण",
            url: "/master",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }],
          },
          {
            name: "Election Command (Victory OS)",
            short_name: "Election OS",
            description: "चुनाव वॉर रूम और बूथ प्रबंधन",
            url: "/election",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }],
          },
          {
            name: "Samiti & Chanda Manager",
            short_name: "Samiti",
            description: "दुर्गा पूजा समिति एवं चंदा संग्रह",
            url: "/samiti",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }],
          },
          {
            name: "Janta Portal",
            short_name: "Janta Portal",
            description: "जनता शिकायत एवं सेवा पोर्टल",
            url: "/janta",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }],
          },
        ],
      },
      workbox: {
        // Keep the install-time precache small. Low-RAM devices (e.g. a 2016
        // Galaxy Tab A, ~1.5GB) crash the WebAPK when the service worker tries
        // to fetch and store several MB in one go on first launch.
        globPatterns: ["**/*.{js,css,html}", "pwa-*.png", "favicon.ico"],
        // Never precache both bundle variants: a device uses one or the other.
        // Legacy chunks are fetched on demand by the browsers that need them.
        globIgnores: [
          "**/*-legacy-*.js",
          "**/polyfills-legacy-*.js",
          // Heavy, rarely-used chunks. Precaching these would undo the code
          // splitting above by re-downloading them on the first launch anyway;
          // runtime caching still stores them the first time they are used.
          "**/pdf-vendor-*.js",
          "**/charts-vendor-*.js",
          // Recharts only loads with the analytics tab, which collectors
          // (the majority of users) cannot even open.
          "**/FinancialOverview-*.js",
          "**/receipt_clean_v3.png",
        ],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            // The chunks deliberately left out of the precache above. Cached
            // on first use so a second visit (and offline use) is instant.
            urlPattern: /\/assets\/(pdf-vendor|charts-vendor|FinancialOverview)-[^/]+\.js$/,
            handler: "CacheFirst",
            options: {
              cacheName: "lazy-chunk-cache",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/ylbczxvtiyzughykhbtj\.supabase\.co\/rest\/v1\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
              networkTimeoutSeconds: 5,
            },
          },
          {
            urlPattern: /^https:\/\/ylbczxvtiyzughykhbtj\.supabase\.co\/storage\/v1\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "supabase-storage-cache",
              expiration: {
                maxEntries: 150,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Images are no longer precached (see globPatterns). Cache them as
            // they are actually viewed so offline use still works, without a
            // multi-MB fetch storm at install time.
            urlPattern: ({ request }) => request.destination === "image",
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "image-cache",
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
    legacy({
      targets: ["chrome >= 61", "android >= 5", "ios >= 11", "safari >= 11"],
      modernPolyfills: true,
      renderLegacyChunks: true,
    }),
  ].filter(Boolean),
  build: {
    target: "es2015",
    cssTarget: "chrome61",
    // terser squeezes noticeably more out of these bundles than esbuild, and
    // strips the console/debugger noise that used to ship to production.
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 2,
      },
    },
    cssCodeSplit: true,
    sourcemap: false,
    // Gzip-sizing every chunk is pure build-time cost; nothing reads it here.
    reportCompressedSize: false,
    // pdf-vendor (jspdf + html2canvas) is legitimately large but is fetched
    // only when a receipt is exported, so it should not trip the warning.
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // Split shared vendor code away from route code only some users open.
        // Without this everything landed in one ~2MB chunk that had to be
        // downloaded and parsed before the first paint on every route.
        // Only split out chunks that are genuinely independent of React's
        // module-init order. Grouping arbitrary React-dependent libraries into
        // a separate "vendor" chunk let it evaluate before react-vendor and
        // blew up on `React.createContext` at startup, so anything not listed
        // here deliberately stays with the entry chunk.
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return undefined;
          const m = (id.split("node_modules/").pop() ?? "").replace(/\\/g, "/");

          // Leaf libraries with no React dependency: safe to isolate, and each
          // is only pulled in by a feature many users never reach.
          if (/^(jspdf|html2canvas|dompurify|canvg|raf|rgbcolor)([/]|$)/.test(m)) {
            return "pdf-vendor";
          }
          if (/^(papaparse|qrcode)([/]|$)/.test(m)) return "data-vendor";
          if (/^(d3-|internmap|delaunator|robust-predicates|victory-vendor)/.test(m)) {
            return "charts-vendor";
          }
          if (m.startsWith("@supabase")) return "supabase-vendor";

          return undefined;
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

