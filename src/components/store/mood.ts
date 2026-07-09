/**
 * Sistema de "moods" emocionales para fragancias.
 *
 * Mientras el backend no tenga metadatos olfativos por producto, derivamos
 * de forma estable (hash del id) un mood y notas para cada perfume, de modo
 * que la experiencia sea consistente entre visitas.
 */

export interface Mood {
  key: string
  label: string
  tagline: string
  notes: [string, string, string]
}

export const MOODS: Mood[] = [
  { key: 'elegante',    label: 'Elegante',    tagline: 'Para quienes hablan sin levantar la voz',  notes: ['Bergamota', 'Iris', 'Cedro'] },
  { key: 'seductor',    label: 'Seductor',    tagline: 'Una estela que se recuerda',               notes: ['Ámbar', 'Vainilla', 'Oud'] },
  { key: 'fresco',      label: 'Fresco',      tagline: 'La energía de la mañana, todo el día',     notes: ['Limón', 'Menta', 'Vetiver'] },
  { key: 'aventurero',  label: 'Aventurero',  tagline: 'Para los que nunca se quedan quietos',     notes: ['Pimienta', 'Cuero', 'Sándalo'] },
  { key: 'romantico',   label: 'Romántico',   tagline: 'Suave, cálido, inolvidable',               notes: ['Rosa', 'Jazmín', 'Almizcle'] },
  { key: 'minimalista', label: 'Minimalista', tagline: 'Menos notas, más presencia',               notes: ['Té blanco', 'Algodón', 'Musk'] },
]

function hash(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

/** Mood estable por producto (mismo id → mismo mood). */
export function moodFor(productId: string): Mood {
  return MOODS[hash(productId) % MOODS.length]
}

/** Descripción breve estable por producto. */
const DESCRIPTIONS = [
  'Notas amaderadas con un toque especiado y moderno.',
  'Una apertura cítrica que evoluciona hacia un fondo cálido.',
  'Floral contemporáneo, limpio y de gran proyección.',
  'Intenso y envolvente, pensado para la noche.',
  'Ligero y luminoso, ideal para todos los días.',
  'Oriental sofisticado con un final dulce y profundo.',
]

export function descriptionFor(productId: string): string {
  return DESCRIPTIONS[hash(productId + 'd') % DESCRIPTIONS.length]
}
