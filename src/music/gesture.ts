import type { Articulation, Direction, GestureFeatures } from './types'

export type Point = {
  x: number
  y: number
  z?: number
}

export type GestureSnapshot = {
  features: GestureFeatures
  center: Point
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

export function extractGestureFeatures(
  hands: Point[][],
  previous?: GestureSnapshot,
  deltaMs = 33,
): GestureSnapshot {
  if (!hands.length) {
    return {
      center: previous?.center ?? { x: 0.5, y: 0.5 },
      features: {
        handCount: 0,
        height: previous?.features.height ?? 0.5,
        speed: 0,
        horizontal: 0,
        vertical: 0,
        size: previous?.features.size ?? 0.35,
        sharpness: 0,
        direction: 'level',
        articulation: 'normal',
      },
    }
  }

  const points = hands.flat()
  const center = {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
  }
  const minX = Math.min(...points.map((point) => point.x))
  const maxX = Math.max(...points.map((point) => point.x))
  const minY = Math.min(...points.map((point) => point.y))
  const maxY = Math.max(...points.map((point) => point.y))
  const previousCenter = previous?.center ?? center
  const horizontal = center.x - previousCenter.x
  const vertical = previousCenter.y - center.y
  const seconds = Math.max(0.016, deltaMs / 1000)
  const distance = Math.hypot(horizontal, vertical)
  const speed = clamp01(distance / seconds / 2.8)
  const previousSpeed = previous?.features.speed ?? speed
  const sharpness = clamp01(Math.abs(speed - previousSpeed) * 2.2)
  const size = clamp01(Math.hypot(maxX - minX, maxY - minY) * 1.7)

  let direction: Direction = 'level'
  if (Math.abs(vertical) > 0.018 || Math.abs(horizontal) > 0.03) {
    direction = vertical > Math.abs(horizontal) * 0.45 ? 'up' : vertical < -Math.abs(horizontal) * 0.45 ? 'down' : 'level'
  }

  let articulation: Articulation = 'normal'
  if (sharpness > 0.48 || speed > 0.72) {
    articulation = 'staccato'
  } else if (speed < 0.18 && sharpness < 0.2) {
    articulation = 'legato'
  }

  return {
    center,
    features: {
      handCount: hands.length,
      height: clamp01(1 - center.y),
      speed,
      horizontal: clamp01((horizontal + 0.18) / 0.36),
      vertical: clamp01((vertical + 0.18) / 0.36),
      size,
      sharpness,
      direction,
      articulation,
    },
  }
}
