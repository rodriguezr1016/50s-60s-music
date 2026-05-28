import { closestMidiForNote, clampMidiToRange, midiToNote, noteNameFromMidi } from './notes'
import type { Chord, GestureFeatures, MelodyEvent, RhythmValue, StylePreset } from './types'

type Random = () => number

const rhythmSeconds: Record<RhythmValue, number> = {
  '16n': 0.25,
  '8n': 0.5,
  '4n': 1,
  '2n': 2,
}

const weightedPick = <T,>(items: Array<[T, number]>, random: Random): T => {
  const total = items.reduce((sum, [, weight]) => sum + weight, 0)
  let cursor = random() * total
  for (const [item, weight] of items) {
    cursor -= weight
    if (cursor <= 0) return item
  }
  return items[items.length - 1][0]
}

export function rhythmForGesture(gesture: GestureFeatures, preset: StylePreset): RhythmValue {
  if (gesture.speed > 0.78) return '16n'
  if (gesture.speed > 0.42) return '8n'
  if (gesture.speed < 0.08 && gesture.articulation === 'legato') return '2n'
  return weightedPick(
    preset.rhythmBias.map((duration, index) => [duration, index === 0 ? 2 : 1]),
    Math.random,
  )
}

export function secondsForRhythm(duration: RhythmValue, tempo: number) {
  return rhythmSeconds[duration] * (60 / tempo)
}

export class MelodyEngine {
  private preset: StylePreset
  private random: Random
  private chordIndex = 0
  private lastMidi = 60
  private motif: number[] = []
  private motifStep = 0
  private phraseStep = 0
  private response = false

  constructor(preset: StylePreset, random: Random = Math.random) {
    this.preset = preset
    this.random = random
  }

  setPreset(preset: StylePreset) {
    this.preset = preset
    this.chordIndex = 0
    this.lastMidi = 60
    this.motif = []
    this.motifStep = 0
    this.phraseStep = 0
    this.response = false
  }

  next(gesture: GestureFeatures): MelodyEvent {
    const chord = this.preset.chords[this.chordIndex]
    const shouldRefreshMotif =
      this.motif.length === 0 ||
      this.motifStep >= this.motif.length ||
      gesture.sharpness > 0.7 ||
      (gesture.speed > 0.82 && this.random() > 0.45)

    if (shouldRefreshMotif) {
      this.motif = this.createMotif(gesture, chord)
      this.motifStep = 0
    }

    const rangeMin = 48 + Math.round(gesture.height * 12)
    const rangeMax = rangeMin + 17
    const rawMidi = this.transformMotifNote(this.motif[this.motifStep], gesture)
    const midi = this.snapToAllowedPool(clampMidiToRange(rawMidi, rangeMin, rangeMax), chord, gesture)
    const duration = this.rhythmFor(gesture)
    const velocity = Math.min(0.95, 0.36 + gesture.size * 0.42 + gesture.speed * 0.18 + gesture.sharpness * 0.18)
    const harmony = gesture.handCount > 1 ? midiToNote(this.snapToAllowedPool(midi - 3, chord, gesture)) : undefined

    this.lastMidi = midi
    this.motifStep += 1
    this.phraseStep += 1

    if (this.phraseStep % 4 === 0) {
      this.chordIndex = (this.chordIndex + 1) % this.preset.chords.length
      this.response = gesture.handCount > 1 ? !this.response : false
    }

    return {
      note: midiToNote(midi),
      midi,
      duration,
      velocity,
      articulation: gesture.articulation,
      chord,
      motif: this.motif.map((note) => midiToNote(note)),
      harmony,
      role: this.response ? 'response' : 'lead',
    }
  }

  private createMotif(gesture: GestureFeatures, chord: Chord) {
    const length = gesture.speed > 0.6 ? 5 : 4
    const motif: number[] = []
    let current = this.lastMidi

    for (let index = 0; index < length; index += 1) {
      const pool = this.notePool(chord, gesture)
      const targetNote = weightedPick(pool, this.random)
      const target = closestMidiForNote(targetNote, current)
      const interval = this.intervalFor(gesture)
      const direction = gesture.direction === 'down' ? -1 : gesture.direction === 'up' ? 1 : this.random() > 0.48 ? 1 : -1
      current = Math.round((target + current + interval * direction) / 2)
      motif.push(current)
    }

    return motif
  }

  private transformMotifNote(midi: number, gesture: GestureFeatures) {
    if (gesture.direction === 'up') return midi + Math.round(gesture.speed * 4)
    if (gesture.direction === 'down') return midi - Math.round(gesture.speed * 4)
    if (gesture.horizontal > 0.62) return midi + 2
    if (gesture.horizontal < 0.38) return midi - 2
    return midi
  }

  private rhythmFor(gesture: GestureFeatures): RhythmValue {
    if (gesture.speed > 0.78) return '16n'
    if (gesture.speed > 0.42) return '8n'
    if (gesture.speed < 0.08 && gesture.articulation === 'legato') return '2n'
    return weightedPick(
      this.preset.rhythmBias.map((duration, index) => [duration, index === 0 ? 2 : 1]),
      this.random,
    )
  }

  private intervalFor(gesture: GestureFeatures) {
    if (gesture.size > 0.7 && this.random() > 0.45) return weightedPick([[5, 1], [7, 1]], this.random)
    return weightedPick(
      [
        [1, 6],
        [2, 3],
        [0, 1],
        [4, 1],
      ],
      this.random,
    )
  }

  private notePool(chord: Chord, gesture: GestureFeatures): Array<[string, number]> {
    return [
      ...chord.notes.map((note) => [note, 7] as [string, number]),
      ...this.preset.scale.map((note) => [note, 2] as [string, number]),
      ...this.preset.chromatic.map((note) => [note, gesture.sharpness > 0.42 ? 2 : 0.7] as [string, number]),
    ]
  }

  private snapToAllowedPool(midi: number, chord: Chord, gesture?: GestureFeatures) {
    const allowedNames = new Set([
      ...chord.notes,
      ...this.preset.scale,
      ...((gesture?.sharpness ?? 0) > 0.45 ? this.preset.chromatic : []),
    ])
    const candidates = Array.from({ length: 15 }, (_, index) => midi - 7 + index)
      .filter((candidate) => allowedNames.has(noteNameFromMidi(candidate)))
      .sort((a, b) => Math.abs(a - midi) - Math.abs(b - midi))

    return candidates[0] ?? midi
  }
}
