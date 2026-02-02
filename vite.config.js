import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        tailwindcss(),
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.jsx'],
            refresh: true,
        }),
        react(),
    ],
    build: {
        outDir: '/home/hasib2020/samity.creativeitbari.com/public/build',   // 👈 build যাবে public/build এ
        emptyOutDir: true,
    },
    base: '/build/', // 👈 খুব important (asset path ঠিক রাখে)
});
