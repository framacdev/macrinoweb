import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // WHY: SVGR via Turbopack — importa gli .svg come componenti React inline
  // (vedi components/sections/TechMarquee.tsx). `prefixIds` è CRUCIALE: prefissa
  // id e classi per file così, con più SVG inline nello stesso DOM (e duplicati
  // dal carosello), i riferimenti url(#…) non collidono tra loghi diversi
  // (es. php e next.js usano entrambi #a). `inlineStyles` (in preset-default)
  // elimina i <style> globali (es. Cursor). removeViewBox:false preserva lo scaling.
  turbopack: {
    rules: {
      '*.svg': {
        loaders: [
          {
            loader: '@svgr/webpack',
            options: {
              svgoConfig: {
                plugins: [
                  {
                    name: 'preset-default',
                    params: { overrides: { removeViewBox: false } },
                  },
                  'prefixIds',
                ],
              },
            },
          },
        ],
        as: '*.js',
      },
    },
  },
}

export default nextConfig
