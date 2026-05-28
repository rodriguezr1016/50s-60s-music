import type { StylePreset } from './types'

export const STYLE_PRESETS: Record<string, StylePreset> = {
  dooWop: {
    id: 'dooWop',
    name: 'Doo-wop',
    key: 'C',
    scale: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
    chromatic: ['Eb', 'Gb', 'Bb'],
    progressionName: 'I-vi-IV-V',
    chords: [
      { label: 'C', notes: ['C', 'E', 'G'] },
      { label: 'Am', notes: ['A', 'C', 'E'] },
      { label: 'F', notes: ['F', 'A', 'C'] },
      { label: 'G', notes: ['G', 'B', 'D'] },
    ],
    rhythmBias: ['4n', '8n', '8n', '4n'],
    instruments: ['Electric piano lead', 'warm organ pad', 'upright bass', 'brush kit'],
    mood: 'close harmony, simple hooks, repeated phrases',
  },
  surfRock: {
    id: 'surfRock',
    name: 'Surf rock',
    key: 'E minor',
    scale: ['E', 'G', 'A', 'B', 'D'],
    chromatic: ['F', 'Bb', 'C#'],
    progressionName: 'Em-A-B7',
    chords: [
      { label: 'Em', notes: ['E', 'G', 'B'] },
      { label: 'A', notes: ['A', 'C#', 'E'] },
      { label: 'B7', notes: ['B', 'D#', 'F#', 'A'] },
      { label: 'Em', notes: ['E', 'G', 'B'] },
    ],
    rhythmBias: ['8n', '8n', '16n', '8n'],
    instruments: ['Tremolo guitar lead', 'spring-delay slap', 'electric bass', 'tight kit'],
    mood: 'bright attack, minor pentatonic runs, spy-movie chromatics',
  },
  motown: {
    id: 'motown',
    name: 'Motown',
    key: 'C',
    scale: ['C', 'D', 'E', 'G', 'A'],
    chromatic: ['Eb', 'F#', 'Bb'],
    progressionName: 'I-IV-V with blue notes',
    chords: [
      { label: 'C', notes: ['C', 'E', 'G'] },
      { label: 'F', notes: ['F', 'A', 'C'] },
      { label: 'G', notes: ['G', 'B', 'D'] },
      { label: 'F', notes: ['F', 'A', 'C'] },
    ],
    rhythmBias: ['8n', '16n', '8n', '4n'],
    instruments: ['Organ lead', 'brass-like stab', 'round bass', 'syncopated kit'],
    mood: 'short motifs, syncopation, call-and-response',
  },
}

export const DEFAULT_GESTURE = {
  handCount: 0,
  height: 0.48,
  speed: 0.18,
  horizontal: 0,
  vertical: 0,
  size: 0.38,
  sharpness: 0.08,
  direction: 'level',
  articulation: 'normal',
} as const
