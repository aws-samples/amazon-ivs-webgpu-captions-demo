import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import generouted from '@generouted/react-router/plugin';
import environment from 'vite-plugin-environment';
import process from 'process';
import { initApiUrl } from './src/helpers/commandLine';

// Chunk deps to reduce module size
const manualChunks = (path) =>
  path.split('/').reverse()[
    path.split('/').reverse().indexOf('node_modules') - 1
  ]; // just a hack to get the next path segment of the last node_modules in path

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  let apiUrl = env.API_URL || undefined;
  if (apiUrl === undefined) {
    await initApiUrl();
  }

  const plugins = [
    react(),
    generouted(),
    environment({
      API_URL: apiUrl,
    }),
  ];

  return {
    build: {
      sourcemap: false,
      rollupOptions: {
        output: { manualChunks },
      },
    },
    plugins,
  };
});
