import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const DATA_DIR = '/Users/rebeca/Documents/Claude/mapa-at/public/data'
const FILES = ['jerusalen.json', 'egipto.json', 'mesopotamia.json', 'canaan.json', 'sinai.json']

function normalize(value) {
  if (!value) return ['hierro_2']
  const v = value.toLowerCase()

  const bronce = v.includes('bronce') || v.includes('éxodo') || v.includes('exodo')
  const hierro1 = v.includes('hierro i') && !v.includes('hierro ii') || v.includes('hierro 1')
  const hierro1b = v.includes('hierro i y ii') || v.includes('hierro i —') || v.includes('hierro i-') || v.includes('bronce tardío — hierro')
  const hierro2 = v.includes('hierro ii') || v.includes('hierro 2')
  const postexilio = v.includes('post') || v.includes('exilio')

  const result = []
  if (bronce) result.push('bronce_tardio')
  if (hierro1 || hierro1b) result.push('hierro_1')
  if (hierro2) result.push('hierro_2')
  if (postexilio) result.push('post_exilio')

  // deduplicar manteniendo orden
  const unique = [...new Set(result)]
  return unique.length > 0 ? unique : ['hierro_2']
}

for (const file of FILES) {
  const path = join(DATA_DIR, file)
  const data = JSON.parse(readFileSync(path, 'utf8'))

  if (Array.isArray(data.eventos_paralelos)) {
    data.eventos_paralelos = data.eventos_paralelos.map(e => ({
      ...e,
      periodo_at: normalize(e.periodo_at)
    }))
  }

  writeFileSync(path, JSON.stringify(data, null, 2), 'utf8')
  console.log(`✅ ${file} — normalizado`)
}

console.log('\nListo. Verifica con:')
console.log('grep -A 1 "periodo_at" public/data/jerusalen.json | head -20')
