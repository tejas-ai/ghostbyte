import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import fs from 'node:fs'

/**
 * Stamping plugin to ensure __SW_BUILD_ID__ inside public/sw.js is transformed
 * in dist/sw.js upon build completion, rotating caches cleanly across deploys.
 */
function stampServiceWorker(buildId: string): Plugin {
  return {
    name: 'stamp-service-worker',
    closeBundle() {
      const distSwPath = path.resolve(import.meta.dirname, 'dist', 'sw.js');
      if (fs.existsSync(distSwPath)) {
        let content = fs.readFileSync(distSwPath, 'utf8');
        content = content.replace(/const BUILD_ID = [^;]+;/, `const BUILD_ID = ${JSON.stringify(buildId)};`);
        const assetsDir = path.resolve(import.meta.dirname, 'dist', 'assets');
        const assetUrls = fs.existsSync(assetsDir)
          ? fs.readdirSync(assetsDir)
              .filter((name) => !name.endsWith('.map'))
              .sort()
              .map((name) => `/assets/${name}`)
          : [];
        const precache = ['/', '/index.html', '/manifest.webmanifest', ...assetUrls];
        content = content.replace(
          /const PRECACHE_URLS = \[[\s\S]*?\];/,
          `const PRECACHE_URLS = ${JSON.stringify(precache, null, 2)};`,
        );
        fs.writeFileSync(distSwPath, content, 'utf8');
      }
    },
  };
}

/**
 * Ensures Vite local dev server runs with React Refresh preamble by relaxing CSP
 * strictly in development mode, while maintaining strict script-src 'self' in production.
 */
function devCspPlugin(isDev: boolean): Plugin {
  return {
    name: 'dev-csp-plugin',
    transformIndexHtml(html) {
      if (isDev) {
        return html.replace(
          "script-src 'self';",
          "script-src 'self' 'unsafe-inline';"
        );
      }
      return html;
    },
  };
}

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';
  // Stamp the SW cache name so it rotates on every deploy.
  const buildId = process.env.VITE_BUILD_ID || Date.now().toString(36);

  return {
    base: '/',
    define: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      __SW_BUILD_ID__: JSON.stringify(buildId),
    },
    build: {
      sourcemap: isDev ? 'inline' : false,
      minify: !isDev,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            // lucide-react must come before the generic react check because
            // its path contains the substring 'react'.
            if (/node_modules\/lucide-react\//.test(id)) return 'vendor-icons';
            if (/node_modules\/react(-dom)?\//.test(id)) return 'vendor-react';
            if (/node_modules\/utif\//.test(id)) return 'vendor-utif';
            return 'vendor-core';
          },
        },
      },
    },
    plugins: [react(), devCspPlugin(isDev), stampServiceWorker(buildId)],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: parseInt(process.env.PORT || '3000'),
      strictPort: false,
    },
    preview: {
      host: '0.0.0.0',
      port: parseInt(process.env.PORT || '3000'),
    },
  };
});
