export type TipoLugar = 'ciudad' | 'territorio' | 'region_natural'
export type JerarquiaPin = 'primario' | 'secundario' | 'terciario'

export interface Periodo {
  desde: number
  hasta: number
  nombre: string
}

export interface Habitante {
  id: string
  nombre: string
  descripcion: string
  religion: string
  periodo: string
}

export interface Historia {
  id: string
  titulo: string
  fecha: string
  descripcion: string
  referencias: string[]
  personajes_clave: string[]
}

export interface Viaje {
  nombre: string
  ruta: string[]
  referencias?: string[]
}

export interface Personaje {
  id: string
  nombre: string
  emoji: string
  rol: string
  periodo: string
  descripcion: string
  referencias: string[]
  ruta: string[]
  viajes?: Viaje[]
}

export interface MitoTradicion {
  fuente_primaria: string
  fuente_secundaria: string
  descripcion: string
  diferencias: string | null
  similitudes: string | null
  significado_teologico: string
  posible_relacion_cultural: string | null
}

export interface Mito {
  id: string
  nombre: string
  aparece_en: {
    judaismo: boolean
    cristianismo: boolean
    islam: boolean
  }
  judaismo: MitoTradicion | null
  cristianismo: MitoTradicion | null
  islam: MitoTradicion | null
}

export interface ContextoReligioso {
  contexto_lugar: string
  religiones_presentes: string[]
  mitos: Mito[]
}

export interface EventoParalelo {
  civilizacion: string
  emoji: string
  periodo_historico: string
  periodo_at: string[]
  evento: string
  descripcion: string
}

export interface RutaSeleccionada {
  nombre: string
  emoji: string
  rol: string
  periodo: string
  descripcion: string
  referencias: string[]
  ruta: string[]
  color: string
  personajeId: string
  viajeIdx: number
  viajeNombre?: string
  viajes?: Viaje[]
}

export interface Lugar {
  id: string
  nombre: string
  tipo: TipoLugar
  lat: number
  lng: number
  frecuencia_at: number
  jerarquia_pin: JerarquiaPin
  nota_coordenadas?: string
  periodos: Periodo[]
  descripcion_geo: string
  altitud_m: number | string
  clima: string
  recursos: string[]
  importancia_estrategica: string
  otros_habitantes: Habitante[]
  historias: Historia[]
  personajes: Personaje[]
  contexto_religioso: ContextoReligioso
  periodos_at?: string[]
}
