import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['/node_modules/'],
          ui: ['src/components/ui/'],
          pages: ['src/pages/'],
          components: ['src/components/']
        }
      }
    }
  },
  define: {
    'window.PRODUCTION_DOMAIN': JSON.stringify('univgates.com.tr'),
    'window.IS_PREVIEW': JSON.stringify(process.env.LOVABLE_PREVIEW === 'true')
  }
}));
