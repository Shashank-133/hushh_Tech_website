import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import { readFileSync } from 'fs'
import { execSync } from 'child_process'

// Read version from package.json at build time
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

// Capture git commit hash at build time for deployment verification
let gitCommitHash = 'unknown'
try {
  gitCommitHash = execSync('git rev-parse --short HEAD').toString().trim()
} catch {
  gitCommitHash = 'unknown'
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_TIMESTAMP__: JSON.stringify(new Date().toISOString()),
    __GIT_COMMIT__: JSON.stringify(gitCommitHash),
  },
  plugins: [
    react(),
    mdx({
      jsxImportSource: 'react',
      providerImportSource: '@mdx-js/react',
      remarkPlugins: [remarkFrontmatter, remarkGfm],
      rehypePlugins: [rehypeSlug],
    }),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    target: 'es2017',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            const moduleName = id.split('node_modules/')[1].split('/')[0]
            switch (moduleName) {
              case 'react':
              case 'react-dom':
              case 'react-router-dom':
                return 'vendor-react'
              case '@chakra-ui':
              case '@emotion':
              case 'framer-motion':
                return 'vendor-ui'
              case '@supabase':
                return 'vendor-supabase'
              default:
                return 'vendor'
            }
          }
        },
      },
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.warn', 'console.info', 'console.debug'],
      },
      format: {
        comments: false,
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.mdx'],
  },
})