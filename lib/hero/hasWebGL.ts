/**
 * Verifica se il browser può creare un contesto WebGL (2 preferito, fallback 1).
 * Solo lato client (es. in useEffect).
 */
export function hasWebGL(): boolean {
  if (typeof document === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    const gl2 = canvas.getContext('webgl2', {
      failIfMajorPerformanceCaveat: false,
      alpha: true,
    })
    if (gl2) return true
    const gl1 = canvas.getContext('webgl', {
      failIfMajorPerformanceCaveat: false,
      alpha: true,
    })
    return !!gl1
  } catch {
    return false
  }
}
