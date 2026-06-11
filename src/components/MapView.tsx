import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Lugar } from '../types/lugar'

const LUGAR_IDS = ['jerusalen', 'egipto', 'mesopotamia', 'canaan', 'sinai'] as const

// Pin único tamaño — sin jerarquía visual
const PIN = { r: 6, fill: '#3C3C3C', stroke: '#fff', labelSize: 9 }

// Paleta aprobada por diseñadora
const TERRITORY_COLORS: Record<string, string> = {
  'Egypt':                   '#C9A84C',
  'Assyria':                 '#8B3A3A',
  'Babylonia':               '#C0522A',
  'Hittites':                '#8B6914',
  'Elam':                    '#7A4A6A',
  'Israel':                  '#8B6A26',
  'Judah':                   '#B8963E',
  'Canaan':                  '#6B8E23',
  'Arameans':                '#8A7B6F',
  'Philistines':             '#8B7355',
  'Phoenicia':               '#4A7A8B',
  'Persia':                  '#A0522D',
  'Media':                   '#7A4A2E',
  'Urartu':                  '#6B4A8B',
  'Arabian pastoral nomads': '#6B6054',
  'Greek city-states':       '#3B6B8B',

  // Nombres adicionales detectados en world_bc1500 / world_bc1000 / world_bc500
  'Achaemenid Empire':                     '#A0522D',
  'Kingdom of David and Solomon':          '#8B6A26',
  'state societies and Aramaean kingdoms': '#8B6914',
  'Cimerians':                             '#6B6054',
  'Iranian pastoralists':                  '#8A7B6F',
  'Saharan pastoral nomads':               '#6B6054',
  'Illyrians':                             '#8A7B6F',
  'Blemmyes':                              '#6B6054',
  'Thrace':                                '#6B4A8B',
  'Kush':                                  '#7A4A6A',
  'Meroe':                                 '#7A4A6A',
  'Bell-shaped burials culture':           '#3B6B8B',
  'Karasuk culture':                       '#4A7A8B',
  'Urnfield cultures':                     '#3B6B8B',
  'Dravidians':                            '#4A7A8B',
  'Phrygians':                             '#8A7B6F',

  'default':                 '#8B7355',
}

// Categoría política por territorio
const TERRITORY_TYPE: Record<string, string> = {
  'Egypt':                   'Imperio',
  'Assyria':                 'Imperio',
  'Babylonia':               'Imperio',
  'Persia':                  'Imperio',
  'Hittites':                'Imperio',
  'Media':                   'Imperio',
  'Israel':                  'Reino',
  'Judah':                   'Reino',
  'Elam':                    'Reino',
  'Urartu':                  'Reino',
  'Canaan':                  'Región cultural',
  'Philistines':             'Región cultural',
  'Phoenicia':               'Región cultural',
  'Greek city-states':       'Región cultural',
  'Arameans':                'Zona tribal',
  'Arabian pastoral nomads': 'Zona tribal',

  // Nombres adicionales detectados en world_bc1500 / world_bc1000 / world_bc500
  'Achaemenid Empire':                     'Imperio',
  'Kingdom of David and Solomon':          'Reino',
  'state societies and Aramaean kingdoms': 'Zona tribal',
  'Cimerians':                             'Zona tribal',
  'Iranian pastoralists':                  'Zona tribal',
  'Saharan pastoral nomads':               'Zona tribal',
  'Illyrians':                             'Zona tribal',
  'Blemmyes':                              'Zona tribal',
  'Thrace':                                'Región cultural',
  'Kush':                                  'Reino',
  'Meroe':                                 'Reino',
  'Bell-shaped burials culture':           'Región cultural',
  'Karasuk culture':                       'Región cultural',
  'Urnfield cultures':                     'Región cultural',
  'Dravidians':                            'Región cultural',
  'Phrygians':                             'Zona tribal',
}

// Traducción al español de los nombres de territorios (cobertura completa)
const TERRITORY_NAMES_ES: Record<string, string> = {
  'Egypt':                   'Egipto',
  'Assyria':                 'Asiria',
  'Babylonia':               'Babilonia',
  'Hittites':                'Hititas',
  'Elam':                    'Elam',
  'Israel':                  'Israel',
  'Judah':                   'Judá',
  'Canaan':                  'Canaán',
  'Arameans':                'Arameos',
  'Philistines':             'Filisteos',
  'Phoenicia':               'Fenicia',
  'Persia':                  'Persia',
  'Media':                   'Media',
  'Urartu':                  'Urartu',
  'Arabian pastoral nomads': 'Pastores nómadas árabes',
  'Greek city-states':       'Ciudades-estado griegas',

  'Achaemenid Empire':                     'Imperio aqueménida',
  'Kingdom of David and Solomon':          'Reino unido de Israel',
  'state societies and Aramaean kingdoms': 'Reinos arameos',
  'Cimerians':                             'Cimerios',
  'Iranian pastoralists':                  'Pastores nómadas iranios',
  'Saharan pastoral nomads':               'Pastores nómadas del Sahara',
  'Illyrians':                             'Ilirios',
  'Blemmyes':                              'Blemios',
  'Thrace':                                'Tracia',
  'Kush':                                  'Reino de Kush',
  'Meroe':                                 'Reino de Meroë',
  'Bell-shaped burials culture':           'Cultura del vaso campaniforme',
  'Karasuk culture':                       'Cultura de Karasuk',
  'Urnfield cultures':                     'Cultura de los campos de urnas',
  'Dravidians':                            'Drávidas',
  'Phrygians':                             'Frigios',
}

function getTerritoryColor(name: string): string {
  for (const key of Object.keys(TERRITORY_COLORS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) {
      return TERRITORY_COLORS[key]
    }
  }
  return TERRITORY_COLORS['default']
}

function getTerritoryType(name: string): string {
  for (const key of Object.keys(TERRITORY_TYPE)) {
    if (name.toLowerCase().includes(key.toLowerCase())) {
      return TERRITORY_TYPE[key]
    }
  }
  return ''
}

function getTerritoryNameES(name: string): string {
  for (const key of Object.keys(TERRITORY_NAMES_ES)) {
    if (name.toLowerCase().includes(key.toLowerCase())) {
      return TERRITORY_NAMES_ES[key]
    }
  }
  return name
}

const GEOJSON_BY_PERIOD: Record<string, string> = {
  bronce_tardio: 'https://raw.githubusercontent.com/aourednik/historical-basemaps/master/geojson/world_bc1500.geojson',
  hierro_1:      'https://raw.githubusercontent.com/aourednik/historical-basemaps/master/geojson/world_bc1000.geojson',
  hierro_2:      'https://raw.githubusercontent.com/aourednik/historical-basemaps/master/geojson/world_bc1000.geojson',
  post_exilio:   'https://raw.githubusercontent.com/aourednik/historical-basemaps/master/geojson/world_bc500.geojson',
}

const REGION_BOUNDS = {
  minLat: 20, maxLat: 42,
  minLng: 25, maxLng: 55,
}

function isInRegion(feature: GeoJSON.Feature): boolean {
  try {
    const geom = feature.geometry
    if (geom.type === 'Polygon') {
      const coords = geom.coordinates[0]
      return coords.some(([lng, lat]) =>
        lat >= REGION_BOUNDS.minLat && lat <= REGION_BOUNDS.maxLat &&
        lng >= REGION_BOUNDS.minLng && lng <= REGION_BOUNDS.maxLng
      )
    }
    if (geom.type === 'MultiPolygon') {
      return geom.coordinates.some(poly =>
        poly[0].some(([lng, lat]) =>
          lat >= REGION_BOUNDS.minLat && lat <= REGION_BOUNDS.maxLat &&
          lng >= REGION_BOUNDS.minLng && lng <= REGION_BOUNDS.maxLng
        )
      )
    }
  } catch { /* ignorar */ }
  return false
}

function getPolygonCenter(feature: GeoJSON.Feature): [number, number] | null {
  try {
    const geom = feature.geometry
    let coords: number[][] = []
    if (geom.type === 'Polygon') {
      coords = geom.coordinates[0]
    } else if (geom.type === 'MultiPolygon') {
      // Usar el polígono más grande
      let maxLen = 0
      for (const poly of geom.coordinates) {
        if (poly[0].length > maxLen) {
          maxLen = poly[0].length
          coords = poly[0]
        }
      }
    }
    if (!coords.length) return null
    const lngSum = coords.reduce((s, c) => s + c[0], 0)
    const latSum = coords.reduce((s, c) => s + c[1], 0)
    return [latSum / coords.length, lngSum / coords.length]
  } catch { return null }
}

function makeIcon(
  lugar: Lugar,
  selected: boolean,
  zoom: number,
  showPulse: boolean,
  showTooltip: boolean,
  dimmed: boolean
): L.DivIcon {
  const zoomScale = Math.max(0.6, Math.min(1.6, (zoom - 3) / 4))
  const r = Math.round(PIN.r * zoomScale)
  const labelSize = Math.max(7, Math.round(PIN.labelSize * zoomScale))
  const d = r * 2

  const fill = selected ? '#8B4A26' : PIN.fill
  const labelColor = selected ? '#8B4A26' : PIN.fill
  const shadow = selected
    ? 'box-shadow:0 0 0 3px #8B4A26,0 2px 6px rgba(0,0,0,.35);'
    : 'box-shadow:0 1px 4px rgba(0,0,0,.25);'
  const label = lugar.id === 'jerusalen' ? `${lugar.nombre} ★` : lugar.nombre
  const opacity = dimmed ? '0.25' : '1'

  const pulseHtml = showPulse ? `
    <div style="
      position:absolute;top:50%;left:50%;
      transform:translate(-50%,-50%);
      width:${d + 16}px;height:${d + 16}px;
      border-radius:50%;
      border:2px solid #8B4A26;
      animation:pulse-ring 1.8s ease-out infinite;
      pointer-events:none;
    "></div>` : ''

  const tooltipHtml = showTooltip ? `
    <div style="
      position:absolute;bottom:${d + 22}px;left:50%;
      transform:translateX(-50%);
      background:#3C3C3C;color:#F5F0E8;
      font-size:10px;font-family:system-ui,sans-serif;
      padding:4px 8px;border-radius:6px;
      white-space:nowrap;pointer-events:none;
      box-shadow:0 2px 6px rgba(0,0,0,0.3);
    ">Toca para explorar
      <div style="
        position:absolute;bottom:-5px;left:50%;
        transform:translateX(-50%);
        width:0;height:0;
        border-left:5px solid transparent;
        border-right:5px solid transparent;
        border-top:5px solid #3C3C3C;
      "></div>
    </div>` : ''

  return L.divIcon({
    className: '',
    iconSize: [d + 120, d + 60],
    iconAnchor: [(d + 120) / 2, r],
    html: `
      <style>
        @keyframes pulse-ring {
          0%   { transform:translate(-50%,-50%) scale(0.8); opacity:0.8; }
          100% { transform:translate(-50%,-50%) scale(1.8); opacity:0; }
        }
      </style>
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;cursor:pointer;opacity:${opacity};">
        ${tooltipHtml}
        ${pulseHtml}
        <div style="
          width:${d}px;height:${d}px;
          border-radius:50%;
          background:${fill};
          border:2px solid ${PIN.stroke};
          ${shadow}
          transition:all .2s;
          position:relative;z-index:1;
        "></div>
        <span style="
          font-size:${labelSize}px;font-weight:500;
          color:${labelColor};font-family:system-ui,sans-serif;
          white-space:nowrap;margin-top:2px;
          text-shadow:0 0 4px #F5F0E8,0 0 8px #F5F0E8,0 0 12px #F5F0E8;
        ">${label}</span>
      </div>`,
  })
}

interface MapViewProps {
  onSelectLugar: (lugar: Lugar) => void
  selectedId?: string
  periodId?: string
  territoriosActive?: boolean
}

export function MapView({
  onSelectLugar,
  selectedId,
  periodId = 'hierro_2',
  territoriosActive = false,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef(new Map<string, L.Marker>())
  const territoriosLayerRef = useRef<L.GeoJSON | null>(null)
  const labelMarkersRef = useRef<L.Marker[]>([])
  const cbRef = useRef(onSelectLugar)
  const [lugares, setLugares] = useState<Lugar[]>([])
  const [zoom, setZoom] = useState(5)
  const [showHint, setShowHint] = useState(() => window.innerWidth < 769)

  useEffect(() => { cbRef.current = onSelectLugar }, [onSelectLugar])

  useEffect(() => {
    Promise.all(
      LUGAR_IDS.map(id =>
        fetch(`/data/${id}.json`).then(r => r.json() as Promise<Lugar>)
      )
    ).then(setLugares).catch(console.error)
  }, [])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: [31, 37],
      zoom: 5,
      minZoom: 4,
      maxZoom: 10,
      zoomControl: false,
    })

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
      {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }
    ).addTo(map)

    map.on('zoomend', () => setZoom(map.getZoom()))
    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      markersRef.current.clear()
      territoriosLayerRef.current = null
    }
  }, [])

  // ─── Territorios históricos ───────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Eliminar capa y etiquetas anteriores
    if (territoriosLayerRef.current) {
      map.removeLayer(territoriosLayerRef.current)
      territoriosLayerRef.current = null
    }
    labelMarkersRef.current.forEach(m => map.removeLayer(m))
    labelMarkersRef.current = []

    if (!territoriosActive) return

    const url = GEOJSON_BY_PERIOD[periodId]

    fetch(`${url}?_=${periodId}`)
      .then(r => r.json())
      .then((data: GeoJSON.FeatureCollection) => {
        if (!mapRef.current) return

        const filtered = {
          ...data,
          features: data.features.filter(isInRegion),
        }

        const layer = L.geoJSON(filtered, {
          style: (feature) => {
            const name: string = feature?.properties?.NAME ?? ''
            const color = getTerritoryColor(name)
            return {
              fillColor: color,
              fillOpacity: 0.18,
              color: color,
              weight: 2,
              opacity: 0.85,
            }
          },
          onEachFeature: (feature, _layer) => {
            const name: string = feature.properties?.NAME ?? ''
            if (!name) return

            const center = getPolygonCenter(feature)
            if (!center) return

            const tipo = getTerritoryType(name)
            const color = getTerritoryColor(name)
            const nameES = getTerritoryNameES(name)

            const labelIcon = L.divIcon({
              className: '',
              iconSize: [120, 32],
              iconAnchor: [60, 16],
              html: `
                <div style="
                  text-align:center;
                  pointer-events:none;
                  user-select:none;
                ">
                  <div style="
                    font-family:Georgia,serif;
                    font-size:11px;
                    font-weight:600;
                    color:${color};
                    text-transform:uppercase;
                    letter-spacing:0.06em;
                    text-shadow:0 0 4px #F5F0E8,0 0 8px #F5F0E8;
                    line-height:1.3;
                  ">${nameES}</div>
                  ${tipo ? `<div style="
                    font-family:system-ui,sans-serif;
                    font-size:9px;
                    color:#6B6054;
                    text-shadow:0 0 3px #F5F0E8,0 0 6px #F5F0E8;
                    margin-top:1px;
                  ">${tipo}</div>` : ''}
                </div>`,
            })

            const labelMarker = L.marker(center, {
              icon: labelIcon,
              interactive: false,
              zIndexOffset: 200,
            })

            labelMarker.addTo(mapRef.current!)
            labelMarkersRef.current.push(labelMarker)
          },
        })

        layer.addTo(mapRef.current)
        layer.bringToBack()
        territoriosLayerRef.current = layer
      })
      .catch(console.error)
  }, [territoriosActive, periodId])

  // ─── Marcadores ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !lugares.length) return

    lugares.forEach(lugar => {
      const isJerusalen = lugar.id === 'jerusalen'
      const showPulse = isJerusalen && showHint
      const showTooltip = isJerusalen && showHint

      const periodosAt: string[] = (lugar as any).periodos_at ?? []
      const dimmed = !periodosAt.includes(periodId)

      const existing = markersRef.current.get(lugar.id)
      const icon = makeIcon(lugar, lugar.id === selectedId, zoom, showPulse, showTooltip, dimmed)

      if (existing) {
        existing.setIcon(icon)
        existing.off('click')
        if (!dimmed) {
          existing.on('click', () => {
            if (isJerusalen && showHint) setShowHint(false)
            cbRef.current(lugar)
          })
        }
        existing.setZIndexOffset(1000)
        return
      }

      const marker = L.marker([lugar.lat, lugar.lng], {
        icon,
        zIndexOffset: 1000,
      })

      if (!dimmed) {
        marker.on('click', () => {
          if (isJerusalen && showHint) setShowHint(false)
          cbRef.current(lugar)
        })
      }

      marker.addTo(mapRef.current!)
      markersRef.current.set(lugar.id, marker)
    })
  }, [lugares, selectedId, zoom, showHint, periodId])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', background: '#EDE8DF' }}
    />
  )
}
