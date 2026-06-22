import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Lugar } from '../types/lugar'

// IDs cargados dinámicamente desde /data/index.json

// Radio base por jerarquía visual (7 / 5 / 3 px antes de aplicar zoomScale)
const PIN_RADIUS: Record<string, number> = { primario: 6, secundario: 5, terciario: 3, sublugar: 3, monte: 4, agua_mayor: 5, agua_menor: 3 }
const PIN = { fill: '#3C3C3C', stroke: '#fff', labelSize: 9 }

// Waypoints para rutas — lugares sin JSON propio en scope actual
const WAYPOINTS: Record<string, [number, number]> = {
  'ur':           [30.9628, 46.1027],
  'haran':        [36.8631, 39.0275],
  'madian':       [28.4500, 35.0000],
  'berseba':      [31.2430, 34.7993],
  'siquem':       [32.2073, 35.2860],
  'jerico':       [31.8710, 35.4440],
  'gabaon':       [31.8390, 35.1790],
  'anatot':       [31.8330, 35.2670],
  'belen':        [31.7054, 35.2103],
  'monte-efraim': [32.0500, 35.2000],
  'tabor':        [32.6860, 35.3920],
  'meguido':      [32.5840, 35.1840],
  'monte-carmelo':[32.7500, 35.0500],
}

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
  'state societies and Aramaean kingdoms': 'Reino',
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
  'Babylonia':               'Mesopotamia',
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

  'Berbers':                'Bereberes',
  'Saba':                   'Saba',
  'Ethiopian highland farmers': 'Agricultores etíopes',
  'Celtiberians':           'Celtíberos',
  'Carthaginian Empire':    'Imperio cartaginés',
  'Etrurians':              'Etruscos',
  'Rome':                   'Roma',
  'Sabini':                 'Sabinos',
  'Samnites':               'Samnitas',
  'Boii':                   'Boyos',
  'Gandhāra':               'Gandhara',
  'Hindu kingdoms':         'Reinos hindúes',
  'Zhou states':            'Estados Zhou',
  'Saharan Pastoral Nomads': 'Pastores nómadas del Sahara',
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
  dimmed: boolean,
  hideLabelOverride: boolean = false
): L.DivIcon {
  const zoomScale = Math.max(0.6, Math.min(1.6, (zoom - 3) / 4))
  const jerarquiaLugar = (lugar as any).jerarquia_pin ?? 'primario'
  const baseRadius = PIN_RADIUS[jerarquiaLugar] ?? PIN_RADIUS.primario
  const r = Math.round(baseRadius * zoomScale)
  const labelSize = Math.max(7, Math.round(PIN.labelSize * zoomScale))
  const d = r * 2

  const isAgua = jerarquiaLugar === 'agua_mayor' || jerarquiaLugar === 'agua_menor'
  const isMonte = jerarquiaLugar === 'monte'
  const fillBase = isAgua ? '#2E5F8A' : isMonte ? '#4A7C4E' : PIN.fill
  const fillSelected = isAgua ? '#1a3f5c' : isMonte ? '#2d5c32' : '#8B4A26'
  const fill = selected ? fillSelected : fillBase
  const labelColor = selected ? fillSelected : fillBase
  const shadow = selected
    ? `box-shadow:0 0 0 3px ${fillSelected},0 2px 6px rgba(0,0,0,.35);`
    : 'box-shadow:0 1px 4px rgba(0,0,0,.25);'
  const subtipoGeo = (lugar as any).subtipo_geo ?? null
  const labelBase = lugar.id === 'jerusalen' ? `${lugar.nombre} ★` : lugar.nombre
  const label = subtipoGeo ? `${subtipoGeo} ${labelBase}` : labelBase
  const hideLabel = dimmed || hideLabelOverride
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
      <div
        tabindex="${dimmed ? '-1' : '0'}"
        role="${dimmed ? 'none' : 'button'}"
        aria-label="${dimmed ? '' : 'Explorar ' + lugar.nombre}"
        aria-disabled="${dimmed ? 'true' : 'false'}"
        onkeydown="if(!${dimmed}&&(event.key==='Enter'||event.key===' ')){event.preventDefault();this.click();}"
        style="position:relative;display:flex;flex-direction:column;align-items:center;cursor:${dimmed?'default':'pointer'};opacity:${opacity};">
        ${tooltipHtml}
        ${pulseHtml}
        <div style="
          width:${d}px;height:${d}px;
          ${jerarquiaLugar === 'sublugar' ? 'border-radius:2px;' : jerarquiaLugar === 'monte' ? 'border-radius:2px;clip-path:polygon(50% 0%, 0% 100%, 100% 100%);border:none;' : 'border-radius:50%;'}
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
          visibility:${hideLabel ? 'hidden' : 'visible'};
        ">${label}</span>
      </div>`,
  })
}

interface MapViewProps {
  onSelectLugar: (lugar: Lugar) => void
  selectedId?: string
  periodId?: string
  territoriosActive?: boolean
  rutasActive?: boolean
}

export function MapView({
  onSelectLugar,
  selectedId,
  periodId = 'hierro_2',
  territoriosActive = false,
  rutasActive = false,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef(new Map<string, L.Marker>())
  const territoriosLayerRef = useRef<L.GeoJSON | null>(null)
  const labelMarkersRef = useRef<L.Marker[]>([])
  const fadeOutTimeoutRef = useRef<number | null>(null)
  const fadeInTimeoutRef = useRef<number | null>(null)
  const pendingOldRef = useRef<{ layer: L.GeoJSON | null; labels: L.Marker[] } | null>(null)
  const requestIdRef = useRef(0)
  const cbRef = useRef(onSelectLugar)
  const [lugares, setLugares] = useState<Lugar[]>([])
  const [zoom, setZoom] = useState(5)
  const [showHint, setShowHint] = useState(() => window.innerWidth < 769)

  useEffect(() => { cbRef.current = onSelectLugar }, [onSelectLugar])

  useEffect(() => {
    fetch('/data/index.json')
      .then(r => r.json() as Promise<string[]>)
      .then(ids =>
        Promise.all(
          ids.map(id =>
            fetch(`/data/${id}.json`)
              .then(r => r.ok ? r.json() as Promise<Lugar> : null)
              .catch(() => null)
          )
        )
      )
      .then(results => setLugares(results.filter(Boolean).filter((l: any) => !['mesopotamia', 'egipto', 'massah'].includes(l.id)) as Lugar[]))
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: [31.8, 35.5],
      zoom: 9,
      minZoom: 4,
      maxZoom: 19,
      zoomControl: false,
    })

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    const ZoomIndicator = L.Control.extend({
      onAdd(m: L.Map) {
        const div = L.DomUtil.create('div', 'zoom-indicator')
        div.id = 'zoom-level-indicator'
        div.textContent = String(m.getZoom())
        m.on('zoomend', () => { div.textContent = String(m.getZoom()) })
        return div
      }
    })
    new ZoomIndicator({ position: 'bottomright' }).addTo(map)

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

    const myRequestId = ++requestIdRef.current

    // Si quedó un fade-out anterior sin completar, remover esa capa/etiquetas ya
    if (fadeOutTimeoutRef.current) {
      clearTimeout(fadeOutTimeoutRef.current)
      fadeOutTimeoutRef.current = null
      if (pendingOldRef.current) {
        const { layer, labels } = pendingOldRef.current
        if (layer) map.removeLayer(layer)
        labels.forEach(m => map.removeLayer(m))
        pendingOldRef.current = null
      }
    }
    if (fadeInTimeoutRef.current) {
      clearTimeout(fadeInTimeoutRef.current)
      fadeInTimeoutRef.current = null
    }

    // Fade-out de la capa y etiquetas anteriores antes de eliminarlas
    const oldLayer = territoriosLayerRef.current
    const oldLabels = labelMarkersRef.current
    territoriosLayerRef.current = null
    labelMarkersRef.current = []

    if (oldLayer || oldLabels.length) {
      oldLayer?.setStyle({ fillOpacity: 0, opacity: 0 })
      oldLabels.forEach(m => {
        const el = m.getElement()
        if (el) el.style.opacity = '0'
      })

      pendingOldRef.current = { layer: oldLayer, labels: oldLabels }
      fadeOutTimeoutRef.current = window.setTimeout(() => {
        if (mapRef.current) {
          if (oldLayer) mapRef.current.removeLayer(oldLayer)
          oldLabels.forEach(m => mapRef.current!.removeLayer(m))
        }
        pendingOldRef.current = null
        fadeOutTimeoutRef.current = null
      }, 300)
    }

    if (!territoriosActive) return

    const url = GEOJSON_BY_PERIOD[periodId]

    fetch(`${url}?_=${periodId}`)
      .then(r => r.json())
      .then((data: GeoJSON.FeatureCollection) => {
        if (!mapRef.current) return
        if (myRequestId !== requestIdRef.current) return // respuesta obsoleta

        const filtered = {
          ...data,
          features: data.features.filter(isInRegion),
        }

        const layer = L.geoJSON(filtered, {
          interactive: false,
          style: (feature) => {
            const name: string = feature?.properties?.NAME ?? ''
            const color = getTerritoryColor(name)
            return {
              className: 'territorio-shape',
              fillColor: color,
              fillOpacity: 0,
              color: color,
              weight: 2,
              opacity: 0,
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

            const labelFontSize = zoom >= 7 ? 11 : zoom === 6 ? 9 : 7
            const showCategoria = zoom >= 6
            const categoriaFontSize = Math.max(7, labelFontSize - 2)

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
                    font-size:${labelFontSize}px;
                    font-weight:600;
                    color:${color};
                    text-transform:uppercase;
                    letter-spacing:0.06em;
                    text-shadow:0 0 4px #F5F0E8,0 0 8px #F5F0E8;
                    line-height:1.3;
                  ">${nameES}</div>
                  ${tipo && showCategoria ? `<div style="
                    font-family:system-ui,sans-serif;
                    font-size:${categoriaFontSize}px;
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
            const el = labelMarker.getElement()
            if (el) {
              el.style.transition = 'opacity 300ms ease'
              el.style.opacity = '0'
            }
            labelMarkersRef.current.push(labelMarker)
          },
        })

        layer.addTo(mapRef.current)
        layer.bringToBack()
        territoriosLayerRef.current = layer

        // Fade-in: tras un breve respiro, subir a la opacidad final
        fadeInTimeoutRef.current = window.setTimeout(() => {
          layer.setStyle({ fillOpacity: 0.18, opacity: 0.85 })
          labelMarkersRef.current.forEach(m => {
            const el = m.getElement()
            if (el) el.style.opacity = '1'
          })
          fadeInTimeoutRef.current = null
        }, 30)
      })
      .catch(console.error)

    return () => {
      if (fadeOutTimeoutRef.current) clearTimeout(fadeOutTimeoutRef.current)
      if (fadeInTimeoutRef.current) clearTimeout(fadeInTimeoutRef.current)
    }
  }, [territoriosActive, periodId, zoom])

  // ─── Marcadores ──────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !lugares.length) return

    // Collision avoidance por distancia mínima entre pins
    const ORDEN: Record<string, number> = { primario: 0, secundario: 1, terciario: 2 }
    const sorted = [...lugares].sort((a, b) => {
      const ja = (a as any).jerarquia_pin ?? 'primario'
      const jb = (b as any).jerarquia_pin ?? 'primario'
      return (ORDEN[ja] ?? 2) - (ORDEN[jb] ?? 2)
    })

    // Pins ya procesados con su posición en pantalla
    const placedPins: Array<{ x: number; y: number }> = []
    const MIN_DIST = 52 // píxeles mínimos entre pins para mostrar label

    sorted.forEach(lugar => {
      const isJerusalen = lugar.id === 'jerusalen'
      const showPulse = isJerusalen && showHint
      const showTooltip = isJerusalen && showHint

      const periodosAt: string[] = (lugar as any).periodos_at ?? []
      const dimmed = periodId !== 'todos' && !periodosAt.includes(periodId)
      const jerarquia = (lugar as any).jerarquia_pin ?? 'primario'
      const hiddenByZoom = (jerarquia === 'secundario' && zoom < 6) || (jerarquia === 'terciario' && zoom < 8) || (jerarquia === 'sublugar' && zoom < 10) || (jerarquia === 'monte' && zoom < 8) || (jerarquia === 'agua_mayor' && zoom < 7) || (jerarquia === 'agua_menor' && zoom < 9)

      if (hiddenByZoom) {
        const existing = markersRef.current.get(lugar.id)
        if (existing) {
          map.removeLayer(existing)
          markersRef.current.delete(lugar.id)
        }
        return
      }

      const pt = map.latLngToContainerPoint([lugar.lat, lugar.lng])

      const esNivel1 = jerarquia === 'primario'
      const colisiona = !dimmed && !esNivel1 && placedPins.some(p => {
        const dx = pt.x - p.x
        const dy = pt.y - p.y
        return Math.sqrt(dx * dx + dy * dy) < MIN_DIST
      })
      if (!dimmed) placedPins.push({ x: pt.x, y: pt.y })

      const icon = makeIcon(lugar, lugar.id === selectedId, zoom, showPulse, showTooltip, dimmed, colisiona)

      const existing = markersRef.current.get(lugar.id)
      if (existing) {
        map.removeLayer(existing)
        markersRef.current.delete(lugar.id)
      }

      const isSelected = lugar.id === selectedId
      const marker = L.marker([lugar.lat, lugar.lng], {
        icon,
        zIndexOffset: isSelected ? 2000 : jerarquia === 'primario' ? 1000 : jerarquia === 'secundario' ? 500 : 100,
      })

      if (!dimmed) {
        marker.on('click', () => {
          if (isJerusalen && showHint) setShowHint(false)
          cbRef.current(lugar)
        })
      }

      marker.addTo(map)
      markersRef.current.set(lugar.id, marker)
    })
  }, [lugares, selectedId, zoom, showHint, periodId])

  // ─── Rutas de personajes ─────────────────────────────────────────────────
  const rutasLayerRef = useRef<L.LayerGroup | null>(null)

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Limpiar rutas anteriores
    if (rutasLayerRef.current) {
      map.removeLayer(rutasLayerRef.current)
      rutasLayerRef.current = null
    }
    if (!rutasActive || !lugares.length) return

    const coordMap: Record<string, [number, number]> = { ...WAYPOINTS }
    lugares.forEach(l => { coordMap[l.id] = [l.lat, l.lng] })

    const PERSONAJE_COLORS = {
  'Abraham': "#C4872A",
  'Moisés': "#4A7A8B",
  'José': "#6B7A3A",
  'David': "#7A3A2A",
  'Jeremías': "#6A4A7A",
  'Daniel': "#2A4A7A",
  'Ezequiel': "#8A6A2A",
  'Elías': "#8A3A2A",
  'Miriam': "#8A5A5A",
  'Josué': "#3A6A4A",
  'Débora': "#8A7A2A",
  'Salomón': "#8B4A26"
}
    const DEFAULT_COLOR = '#8B4A26'
    const group = L.layerGroup()
    const seen = new Set()

    lugares.forEach(lugar => {
      const periodosAt: string[] = (lugar as any).periodos_at ?? []
      if (!periodosAt.includes(periodId)) return
      ;(lugar.personajes ?? []).forEach(p => {
        const key = p.nombre + ':' + (p.ruta ?? []).join(',')
        if (seen.has(key)) return
        seen.add(key)

        const pts = (p.ruta ?? [])
          .filter((id: string) => coordMap[id])
          .map((id: string) => coordMap[id] as [number, number])
        if (pts.length < 2) return

        const color = (PERSONAJE_COLORS as any)[p.nombre] ?? DEFAULT_COLOR

        L.polyline(pts, {
          color,
          weight: 2,
          opacity: 0.8,
          dashArray: '6 4',
        }).addTo(group)

        const mid = Math.floor(pts.length / 2)
        const midPt: [number,number] = pts.length % 2 === 0
          ? [(pts[mid-1][0] + pts[mid][0]) / 2, (pts[mid-1][1] + pts[mid][1]) / 2]
          : pts[mid]

        const labelIcon = L.divIcon({
          className: '',
          iconSize: [90, 20],
          iconAnchor: [45, 10],
          html: '<div style="font-family:system-ui,sans-serif;font-size:9px;font-weight:600;color:' + color + ';background:rgba(245,240,232,0.88);border:1px solid ' + color + ';border-radius:4px;padding:1px 5px;white-space:nowrap;pointer-events:none;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.15);">' + p.nombre + '</div>',
        })
        L.marker(midPt, { icon: labelIcon, interactive: false, zIndexOffset: 500 }).addTo(group)
      })
    })

    group.addTo(map)
    rutasLayerRef.current = group
  }, [rutasActive, lugares, periodId])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', background: '#EDE8DF' }}
    />
  )
}
