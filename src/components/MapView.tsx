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

function makeIcon(lugar: Lugar, selected: boolean): L.DivIcon {
  const cfg = PIN[lugar.jerarquia_pin] ?? PIN.secundario
  const d = cfg.r * 2
  const fill = selected ? '#8B4A26' : cfg.fill
  const labelColor = selected ? '#8B4A26' : cfg.fill === '#D4C5B0' ? '#6B6054' : cfg.fill
  const shadow = selected
    ? 'box-shadow:0 0 0 3px #8B4A26,0 2px 6px rgba(0,0,0,.35);'
    : 'box-shadow:0 1px 4px rgba(0,0,0,.25);'
  const label = lugar.id === 'jerusalen' ? `${lugar.nombre} ★` : lugar.nombre

  return L.divIcon({
    className: '',
    iconSize: [140, d + 20],
    iconAnchor: [70, cfg.r],
    html: `<div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;">
      <div style="
        width:${d}px;height:${d}px;
        border-radius:50%;
        background:${fill};
        border:2px solid ${cfg.stroke};
        ${shadow}
        transition:all .2s;
      "></div>
      <span style="
        font-size:${cfg.labelSize}px;
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

  // Keep callback ref current so markers don't capture stale closures
  useEffect(() => { cbRef.current = onSelectLugar }, [onSelectLugar])

  // Fetch all JSON data once
  useEffect(() => {
    Promise.all(
      LUGAR_IDS.map(id =>
        fetch(`/data/${id}.json`).then(r => r.json() as Promise<Lugar>)
      )
    ).then(setLugares).catch(console.error)
  }, [])

  // Initialize Leaflet map once
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
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }
    ).addTo(map)

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      markersRef.current.clear()
    }
  }, [])

  // Create or update markers when data loads or selectedId changes
  useEffect(() => {
    if (!mapRef.current || !lugares.length) return

    lugares.forEach(lugar => {
      const existing = markersRef.current.get(lugar.id)
      const icon = makeIcon(lugar, lugar.id === selectedId)

      if (existing) {
        existing.setIcon(icon)
        return
      }

      const marker = L.marker([lugar.lat, lugar.lng], {
        icon,
        zIndexOffset: lugar.jerarquia_pin === 'primario' ? 1000 : 500,
      })

      marker.on('click', () => cbRef.current(lugar))
      marker.addTo(mapRef.current!)
      markersRef.current.set(lugar.id, marker)
    })
  }, [lugares, selectedId])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', background: '#EDE8DF' }}
    />
  )
}
