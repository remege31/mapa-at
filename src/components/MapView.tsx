import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Lugar } from '../types/lugar'

const LUGAR_IDS = ['jerusalen', 'egipto', 'mesopotamia', 'canaan', 'sinai'] as const

const PIN: Record<string, { r: number; fill: string; stroke: string; labelSize: number }> = {
  primario:   { r: 9,   fill: '#3C3C3C', stroke: '#fff',    labelSize: 9.5 },
  secundario: { r: 6,   fill: '#6B6054', stroke: '#fff',    labelSize: 8.5 },
  terciario:  { r: 4,   fill: '#D4C5B0', stroke: '#6B6054', labelSize: 8   },
}

function makeIcon(lugar: Lugar, selected: boolean, zoom: number, showPulse: boolean, showTooltip: boolean): L.DivIcon {
  const cfg = PIN[lugar.jerarquia_pin] ?? PIN.secundario

  // Escalar tamaño según zoom (zoom base = 5)
  const zoomScale = Math.max(0.6, Math.min(1.6, (zoom - 3) / 4))
  const r = Math.round(cfg.r * zoomScale)
  const labelSize = Math.max(7, Math.round(cfg.labelSize * zoomScale))
  const d = r * 2

  const fill = selected ? '#8B4A26' : cfg.fill
  const labelColor = selected ? '#8B4A26' : cfg.fill === '#D4C5B0' ? '#6B6054' : cfg.fill
  const shadow = selected
    ? 'box-shadow:0 0 0 3px #8B4A26,0 2px 6px rgba(0,0,0,.35);'
    : 'box-shadow:0 1px 4px rgba(0,0,0,.25);'
  const label = lugar.id === 'jerusalen' ? `${lugar.nombre} ★` : lugar.nombre

  const pulseHtml = showPulse ? `
    <div style="
      position:absolute;
      top:50%;left:50%;
      transform:translate(-50%,-50%);
      width:${d + 16}px;height:${d + 16}px;
      border-radius:50%;
      border:2px solid #8B4A26;
      animation:pulse-ring 1.8s ease-out infinite;
      pointer-events:none;
    "></div>` : ''

  const tooltipHtml = showTooltip ? `
    <div style="
      position:absolute;
      bottom:${d + 22}px;
      left:50%;
      transform:translateX(-50%);
      background:#3C3C3C;
      color:#F5F0E8;
      font-size:10px;
      font-family:system-ui,sans-serif;
      padding:4px 8px;
      border-radius:6px;
      white-space:nowrap;
      pointer-events:none;
      box-shadow:0 2px 6px rgba(0,0,0,0.3);
    ">Toca para explorar
      <div style="
        position:absolute;
        bottom:-5px;left:50%;
        transform:translateX(-50%);
        width:0;height:0;
        border-left:5px solid transparent;
        border-right:5px solid transparent;
        border-top:5px solid #3C3C3C;
      "></div>
    </div>` : ''

  return L.divIcon({
    className: '',
    iconSize: [160, d + 60],
    iconAnchor: [80, r],
    html: `
      <style>
        @keyframes pulse-ring {
          0%   { transform:translate(-50%,-50%) scale(0.8); opacity:0.8; }
          100% { transform:translate(-50%,-50%) scale(1.8); opacity:0; }
        }
      </style>
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;cursor:pointer;">
        ${tooltipHtml}
        ${pulseHtml}
        <div style="
          width:${d}px;height:${d}px;
          border-radius:50%;
          background:${fill};
          border:2px solid ${cfg.stroke};
          ${shadow}
          transition:all .2s;
          position:relative;z-index:1;
        "></div>
        <span style="
          font-size:${labelSize}px;
          font-weight:500;
          color:${labelColor};
          font-family:system-ui,sans-serif;
          white-space:nowrap;
          margin-top:2px;
          text-shadow:0 0 4px #F5F0E8,0 0 8px #F5F0E8,0 0 12px #F5F0E8;
        ">${label}</span>
      </div>`,
  })
}

interface MapViewProps {
  onSelectLugar: (lugar: Lugar) => void
  selectedId?: string
}

export function MapView({ onSelectLugar, selectedId }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef(new Map<string, L.Marker>())
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
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current || !lugares.length) return

    lugares.forEach(lugar => {
      const isJerusalen = lugar.id === 'jerusalen'
      const showPulse = isJerusalen && showHint
      const showTooltip = isJerusalen && showHint
      const existing = markersRef.current.get(lugar.id)
      const icon = makeIcon(lugar, lugar.id === selectedId, zoom, showPulse, showTooltip)

      if (existing) {
        existing.setIcon(icon)
        return
      }

      const marker = L.marker([lugar.lat, lugar.lng], {
        icon,
        zIndexOffset: lugar.jerarquia_pin === 'primario' ? 1000 : 500,
      })

      marker.on('click', () => {
        if (isJerusalen && showHint) setShowHint(false)
        cbRef.current(lugar)
      })

      marker.addTo(mapRef.current!)
      markersRef.current.set(lugar.id, marker)
    })
  }, [lugares, selectedId, zoom, showHint])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', background: '#EDE8DF' }}
    />
  )
}
