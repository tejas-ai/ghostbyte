import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

/**
 * Vite configuration — stripped to the essentials.
 *
 * The previous 342-line file was ~85% Figma Make scaffolding that
 * hard-imported .figma/make/site.json (deleting .figma/ broke the build),
 * injected duplicate <meta> tags on top of the ones already in index.html
 * (two og:title, two og:image, two twitter:image etc.), and contained an
 * unescaped Google Analytics injection path keyed off site.json.
 *
 * The manualChunks order is also fixed: 'lucide-react' contains the
 * substring 'react', so the previous code matched it in the react branch
 * and the vendor-icons chunk was never emitted. The icon branch now runs
 * first, and the framer-motion branch is removed because the package is
 * imported by nothing in the codebase.
 */
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
    plugins: [react()],
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
