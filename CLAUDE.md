# macrinoweb — Portfolio Personale di Francesco Macrino

## Contesto Progetto
Portfolio personale di un frontend developer.
Target primario: responsabili di selezione tecnica. Target secondario: clienti freelance.
Progetto pubblico — puoi usare Claude Code, Cline o qualsiasi AI tool.

## Stack Tecnologico
- Next.js 16.2.4 App Router + TypeScript 5 strict
- React 19 + React DOM 19
- Three.js 0.184 + @react-three/fiber 9 + @react-three/drei 10
- @react-three/postprocessing 3 (effetti visivi 3D)
- Framer Motion 12 (animazioni UI)
- Tailwind CSS 4 + @tailwindcss/postcss
- next-themes (dark/light mode)
- leva (debug panel per scene 3D)
- lucide-react (icone)
- sharp (ottimizzazione immagini)
- Porta dev: 3000

## Design System (fonte di verità: DESIGN.md + PRODUCT.md alla root)
<!-- DESIGN.md = verità visiva (estratta dal codice reale, formato Google Stitch).
     PRODUCT.md = verità strategica (register, utenti, anti-reference, principi). -->
<!-- design-system/macrinoweb/ rimossa: il MASTER.md auto-generato era stale. -->
- Register: brand — il design È il prodotto, qualità visiva prima di tutto
- Tema: acqua, fluidità, profondità — evocato, mai esplicitato nel copy
- Palette attuale: bg #FFFFFE / bgDark #0f1e2d / text #094067 (dark #f1f6ff) /
  primary #2273D4 / accent #3da9fc / body #4a6a94 (dark #a7bcd9)
- Font attuale: Sora (headings) + Nunito Sans (body) + JetBrains Mono (solo badge/mono)
- Dark/light mode via next-themes, class-based (.dark su <html>)
- Stili: inline style objects per logica complessa,
  Tailwind solo per layout/responsività
- Colori a runtime in lib/constants.ts (costante C); il resto della palette
  vive nelle CSS variables di globals.css (cambiano tema prima dell'hydration)

## Problemi aperti
- I CTA hero ("Iniziamo" → #contatti, "Vedi i progetti" → #portfolio) puntano
  a sezioni non ancora costruite: intenzionale finché le pagine non esistono.
- Le pagine /chi-sono, /portfolio, /contatti sono stub (solo <h1>): da popolare.

## Architettura
- App Router con Server Components by default
- 'use client' solo per componenti interattivi
- Canvas Three.js isolato in componenti Client separati
- SEO: app/robots.ts + app/sitemap.ts (route metadata), JSON-LD Person e
  metadati OG in app/layout.tsx; stringhe del sito in lib/site.ts (single source)
- Script custom:
  - scripts/optimize-ribbon-texture.mjs (assets/textures/ribbon3.png → public .webp)
  - scripts/generate-og-image.mjs (compone public/og-image.png 1200×630 dal poster)
- Cattura poster ribbon: route dev /ribbon-capture (frame congelato, PNG+WebP)

## Convenzioni Codice
- TypeScript strict — no any, usa unknown + type guard
- Custom hooks per logica stateful e animazioni riutilizzabili
- No useEffect per derived state — usa useMemo
- Conventional commits obbligatori (feat/fix/chore/refactor/style)
- Commento // WHY: per ogni scelta architettuale non ovvia
- Commenti in italiano, terminologia tecnica in inglese

## Three.js / R3F
- NON usare THREE.CapsuleGeometry (r142+) — usa CylinderGeometry
- NON usare THREE.OrbitControls da @react-three/fiber — importa da drei
- Dispose manuale di geometrie e materiali nei cleanup useEffect
- useFrame per animazioni, mai setInterval/setTimeout in scene 3D

## Performance
- Lazy loading componenti 3D con dynamic() e ssr:false (HeroCanvas)
- TechMarquee lazy via dynamic() (SSR attivo, chunk separato)
- Web Vitals target: LCP < 2.5s, CLS < 0.1, INP < 200ms

## Accessibilità
- Skip-link globale (layout) → #contenuto sui <main> (tabIndex -1)
- Focus da tastiera visibile: :focus-visible globale in globals.css
- prefers-reduced-motion: ribbon congelato, entrata hero a solo crossfade, LED fisso

## Skills Attive
- impeccable (pbakaus) — design language, critica, polish
- ui-ux-pro-max (nextlevelbuilder) — design intelligence, font, palette

## Note
- Lingua sito: italiano
- Deploy target: Vercel
- Repository: github.com/framacdev/macrinoweb