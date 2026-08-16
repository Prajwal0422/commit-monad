import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Listen on all interfaces (0.0.0.0 / dual-stack) so proxies such as
    // cloudflared can reach the dev server — loopback-only binding returns
    // blank pages through tunnels.
    host: true,
    // Allow Cloudflare Quick Tunnel hostnames (e.g.
    // belt-sanyo-midi-emotional.trycloudflare.com) through Vite's host
    // check. The leading dot matches any *.trycloudflare.com subdomain.
    allowedHosts: ['.trycloudflare.com'],
  },
})
