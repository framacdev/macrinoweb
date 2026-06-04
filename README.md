# macrinoweb

Portfolio personale di **Francesco Macrino**, Web Developer — [macrinoweb.com](https://macrinoweb.com).

Il sito è esso stesso il campione di lavoro: l'hero è un ribbon WebGL (Three.js)
che scorre sopra un sistema visivo calmo e theme-adaptive ("Still Surface, Deep
Current"). Il design è il prodotto.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** strict
- **Three.js** + @react-three/fiber + @react-three/postprocessing (hero ribbon)
- **Framer Motion** (animazioni UI)
- **Tailwind CSS 4** (layout/responsività) + inline style objects (logica complessa)
- **next-themes** (dark/light, class-based)
- **sharp** (ottimizzazione immagini, generazione OG)

## Sviluppo

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # build di produzione
npm run lint       # eslint
```

## Script

```bash
node scripts/generate-og-image.mjs      # rigenera public/og-image.png (1200×630)
```

`/ribbon-capture` (solo in dev) cattura i poster del ribbon ai vari breakpoint.

## Struttura

```
app/            route App Router + metadata (robots, sitemap, layout, JSON-LD)
components/     hero (canvas WebGL), layout (header), sezioni, ui
lib/            costanti runtime, metadati sito, config hero (shader, qualità, controlli)
public/         poster del ribbon, texture, og-image
scripts/        ottimizzazione texture, generazione OG
```

## Deploy

Vercel. Lingua del sito: italiano.

## License

© 2026 Francesco Macrino. All rights reserved.
This repository is public for portfolio purposes only.
See [LICENSE](./LICENSE) for details.

L'hero ribbon è una reimplementazione, derivata e estesa, della tecnica del
ribbon WebGL di [Stripe](https://stripe.com), e usa codice shader di terzi
(simplex noise di Gustavson/Quilez, shaping functions di Inigo Quilez,
hueShift CC0). Crediti completi in [LICENSE](./LICENSE) e nei sorgenti
`lib/hero/`.
