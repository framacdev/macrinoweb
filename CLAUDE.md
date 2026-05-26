# macrinoweb — Portfolio Personale di Francesco Macrino

## Contesto Progetto
Portfolio personale di un frontend developer. Progetto pubblico — puoi usare Claude Code, Cline o qualsiasi AI tool.

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

## Architettura
- App Router con Server Components by default
- 'use client' solo per componenti interattivi (Three.js, Framer Motion, hooks)
- Canvas Three.js isolato in componenti Client separati
- Script custom: scripts/resize-hero-posters.mjs (ottimizzazione immagini hero)

## Convenzioni Codice
- TypeScript strict — no any, usa unknown + type guard
- Custom hooks per logica stateful e animazioni riutilizzabili
- No useEffect per derived state — usa useMemo
- Conventional commits obbligatori (feat/fix/chore/refactor/style)
- Commento // WHY: per ogni scelta architettuale non ovvia

## Three.js / R3F
- Geometrie custom preferite a primitive semplici per performance
- NON usare THREE.CapsuleGeometry (disponibile solo da r142+) — usa CylinderGeometry o SphereGeometry
- NON usare THREE.OrbitControls da @react-three/fiber — importa da drei
- Dispose manuale di geometrie e materiali nei cleanup useEffect
- useFrame per animazioni — evita setInterval o setTimeout in scene 3D

## Performance
- Lazy loading componenti 3D pesanti con dynamic() e ssr:false
- Suspense boundary attorno a Canvas per loading state
- Ottimizza texture con sharp prima di importarle
- Web Vitals target: LCP < 2.5s, CLS < 0.1, FID < 100ms

## Skills Attive
react-patterns, typescript-strict, tailwind-shadcn,
performance-web-vitals, code-review-frontend,
commit-conventional, seo-technical, ui-ux-pro-max

## Note
- Lingua sito: italiano
- Deploy target: Vercel
- Repository: github.com/framacdev/macrinoweb
