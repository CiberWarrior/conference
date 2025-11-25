/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Optimizacije za production
  swcMinify: true,
  // Kompajliranje za Vercel
  output: 'standalone',
  // Environment varijable koje trebaju biti dostupne u build procesu
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  // Ignoriraj Supabase Edge Functions (koriste Deno, ne Node.js)
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push({
        'https://deno.land/std@0.168.0/http/server.ts': 'commonjs https://deno.land/std@0.168.0/http/server.ts',
      })
    }
    return config
  },
  // Ignoriraj Supabase functions folder u build procesu
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
}

export default nextConfig

