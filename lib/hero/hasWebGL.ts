/**
 * Verifica se il browser può creare un contesto WebGL (2 preferito, fallback 1).
 * Solo lato client (es. in useEffect).
 *
 * WHY: il risultato è cached a livello modulo — chiamate ripetute (React
 * StrictMode double-invoke, hydration race) non creano canvas aggiuntivi
 * nel DOM né re-eseguono il check sul driver GPU.
 */

let _cached: boolean | null = null

export function hasWebGL(): boolean {
  if (_cached !== null) return _cached
  if (typeof document === 'undefined') {
    _cached = false
    return false
  }
  try {
    const canvas = document.createElement('canvas')
    const gl =
      canvas.getContext('webgl2', {
        failIfMajorPerformanceCaveat: false,
        alpha: true,
      }) ||
      canvas.getContext('webgl', {
        failIfMajorPerformanceCaveat: false,
        alpha: true,
      })
    _cached = !!gl
    // WHY: rimuovi il canvas subito — non viene aggiunto al DOM in modo
    // visibile, ma rimuoverlo esplicitamente evita riferimenti orphan.
    canvas.remove()
  } catch {
    _cached = false
  }
  return _cached
}
