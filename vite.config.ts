import { defineConfig } from 'vite';

export default defineConfig({
  // MapLibre 6 charge son worker en module ES à côté de son fichier principal :
  // le pré-empaquetage de Vite casserait ce chemin relatif.
  optimizeDeps: { exclude: ['maplibre-gl'] },
  worker: { format: 'es' },
  build: { target: 'es2022', chunkSizeWarningLimit: 1500 },
});
