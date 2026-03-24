import { defineConfig, Plugin } from 'vite';

// type="module" と crossorigin を除去するプラグイン
// → dist/index.html を file:// でそのまま開けるようにする
function removeModulePlugin(): Plugin {
  return {
    name: 'remove-module-type',
    transformIndexHtml(html: string): string {
      return html
        .replace(/ type="module"/g, '')
        .replace(/ crossorigin/g, '');
    },
  };
}

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        // IIFEフォーマット: file:// で開いてもES Moduleエラーが出ない
        format: 'iife',
        name: 'TensenSenran',
        inlineDynamicImports: true,
        entryFileNames: 'assets/game.js',
      },
    },
  },
  plugins: [removeModulePlugin()],
  server: {
    port: 3000,
  },
});
