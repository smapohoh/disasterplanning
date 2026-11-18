import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
export default defineConfig({server:{proxy:{'/api':process.env.MOIDA_API_URL||'http://127.0.0.1:3011'}},preview:{proxy:{'/api':process.env.MOIDA_API_URL||'http://127.0.0.1:3011'}},plugins:[react(),tailwindcss()],resolve:{alias:{'@':fileURLToPath(new URL('./src',import.meta.url))}}})
