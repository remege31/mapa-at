import { useState, useCallback, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import type L from 'leaflet'
import { MapView } from './components/MapView'
import type {
  Lugar,
  Historia,
  Personaje,
  Mito,
  EventoParalelo,
  RutaSeleccionada,
  TerritorioSeleccionado,
} from './types/lugar'
import { EVENTOS_PARALELOS_GLOBAL } from './data/eventosParalelos'
import { PERSONAJE_COLORS, DEFAULT_COLOR } from './data/rutaColors'
import {
  TERRITORY_SEARCH_LIST,
  getTerritoryColor,
  getTerritoryType,
} from './data/territorios'
import { TERRITORY_INFO } from './data/territorioInfo'
import './App.css'

type SearchResult =
  | { kind: 'lugar'; data: Lugar }
  | { kind: 'ruta'; data: RutaSeleccionada }
  | { kind: 'territorio'; nombreES: string; nombreEN: string }

// ─── Guided Tour ──────────────────────────────────────────────────────────────

const TOUR_STEPS: Array<{
  label: string; title: string; text: string
  target: 'map' | 'button' | 'coords' | 'element'
  spotR: number
  lat?: number; lng?: number
  elementId?: string
}> = [
  {
    label: 'Paso 1 de 5',
    title: 'Jerusalén',
    text: 'Centro espiritual del AT. Toca cualquier pin para explorar — el panel lateral muestra historia, personajes y contexto religioso.',
    target: 'map',
    spotR: 38,
  },
  {
    label: 'Paso 2 de 5',
    title: 'Territorios · Egipto',
    text: 'Activamos la capa de Territorios — ve los imperios históricos sobre el mapa. Toca cualquier polígono para explorar en el panel.',
    target: 'coords',
    lat: 27, lng: 30.5,
    spotR: 190,
  },
  {
    label: 'Paso 3 de 5',
    title: 'Rutas · Moisés',
    text: 'Activamos la capa de Rutas — sigue los viajes de Moisés, Abraham y otros personajes trazados sobre el mapa.',
    target: 'button',
    spotR: 0,
  },
  {
    label: 'Paso 4 de 5',
    title: 'Período Post-Exilio',
    text: 'Filtra por era histórica para ver el mapa durante el retorno de los exiliados desde Babilonia (586–400 a.C.).',
    target: 'button',
    spotR: 0,
  },
  {
    label: 'Paso 5 de 5',
    title: 'Búsqueda',
    text: 'Busca cualquier lugar, ruta o territorio por nombre. Los resultados te llevan directo al mapa y al panel lateral.',
    target: 'element',
    elementId: 'topbar-search-wrap',
    spotR: 0,
  },
]

function TourOverlay({ step, onNext, onEnd, onGoTo, mapWrapRef, btnRefs, leafletMapRef }: {
  step: number
  onNext: () => void
  onEnd: () => void
  onGoTo: (s: number) => void
  mapWrapRef: React.RefObject<HTMLDivElement | null>
  btnRefs: (React.RefObject<HTMLButtonElement | null>)[]
  leafletMapRef: React.RefObject<L.Map | null>
}) {
  const [pos, setPos] = useState<{ cx: number; cy: number; r: number } | null>(null)

  useEffect(() => {
    // s definido en el scope del efecto para que compute y el body del efecto compartan la misma referencia
    const s = TOUR_STEPS[step]

    function compute() {
      if (s.target === 'map') {
        const rect = mapWrapRef.current?.getBoundingClientRect()
        if (!rect) return
        setPos({ cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2, r: s.spotR })

      } else if (s.target === 'coords' && s.lat !== undefined && s.lng !== undefined) {
        const lmap = leafletMapRef.current
        if (!lmap) return
        const point = lmap.latLngToContainerPoint([s.lat, s.lng])
        const mapRect = lmap.getContainer().getBoundingClientRect()
        setPos({ cx: mapRect.left + point.x, cy: mapRect.top + point.y, r: s.spotR })

      } else if (s.target === 'element' && s.elementId) {
        const el = document.getElementById(s.elementId)
        const rect = el?.getBoundingClientRect()
        if (!rect) return
        const r = Math.max(rect.width, rect.height) / 2 + 12
        setPos({ cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2, r })

      } else {
        // button
        const refIndex = step === 3 ? 2 : step - 1
        const rect = btnRefs[refIndex]?.current?.getBoundingClientRect()
        if (!rect) return
        const r = Math.max(rect.width, rect.height) / 2 + 10
        setPos({ cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2, r })
      }
    }

    compute()
    const tid1 = setTimeout(compute, 150)
    const tid2 = s.target === 'coords' ? setTimeout(compute, 1500) : undefined
    window.addEventListener('resize', compute)
    return () => {
      clearTimeout(tid1)
      if (tid2 !== undefined) clearTimeout(tid2)
      window.removeEventListener('resize', compute)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  if (!pos) return null
  const { cx, cy, r } = pos
  const s = TOUR_STEPS[step]
  const bw = 240
  const isCircle = s.target === 'map' || s.target === 'coords'

  const rawBx = cx - bw / 2
  const bx = Math.max(12, Math.min(rawBx, window.innerWidth - bw - 360))  // 360 = ancho panel
  const by = Math.min(cy + r + 20, window.innerHeight - 200)

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000 }} onMouseDown={e => e.stopPropagation()}>
      <style>{`
        @keyframes tour-ring {
          0%   { transform: scale(1);    opacity: 0.85; }
          100% { transform: scale(1.6);  opacity: 0; }
        }
        @keyframes tour-cursor {
          0%, 100% { transform: rotate(135deg) scale(1);    opacity: 0.95; }
          45%       { transform: rotate(135deg) scale(0.82); opacity: 0.65; }
        }
      `}</style>

      {/* Overlay semitransparente */}
      <div style={{
        position: 'fixed',
        left: cx - r,
        top: cy - r,
        width: r * 2,
        height: r * 2,
        borderRadius: isCircle ? '50%' : 8,
        boxShadow: '0 0 0 9999px rgba(20,15,10,0.42)',
        transition: 'all 0.45s cubic-bezier(0.4,0,0.2,1)',
        pointerEvents: 'none',
        zIndex: 2001,
      }} />

      {/* Anillo pulsante */}
      <div style={{
        position: 'fixed',
        left: cx - r - 8,
        top: cy - r - 8,
        width: (r + 8) * 2,
        height: (r + 8) * 2,
        borderRadius: isCircle ? '50%' : 12,
        border: '2px solid rgba(255,255,255,0.75)',
        animation: 'tour-ring 1.7s ease-out infinite',
        pointerEvents: 'none',
        zIndex: 2002,
      }} />

      {/* Cursor 45° top-right → señala hacia el elemento */}
      <div style={{
        position: 'fixed',
        left: cx + r * 0.62 - 10,
        top: cy - r * 0.62 - 22,
        fontSize: 20,
        pointerEvents: 'none',
        zIndex: 2005,
        animation: 'tour-cursor 1.4s ease-in-out infinite',
        userSelect: 'none',
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
      }}>👆</div>

      {/* Burbuja */}
      <div style={{
        position: 'fixed',
        left: bx,
        top: by,
        width: bw,
        background: '#F5F0E8',
        border: '1px solid #D4C5B0',
        borderRadius: 8,
        padding: '14px 16px',
        zIndex: 2004,
        boxShadow: '0 4px 20px rgba(0,0,0,0.22)',
        transition: 'all 0.45s cubic-bezier(0.4,0,0.2,1)',
      }}>
        {/* Flecha hacia arriba */}
        <div style={{
          position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)',
          width: 0, height: 0,
          borderLeft: '7px solid transparent',
          borderRight: '7px solid transparent',
          borderBottom: '8px solid #D4C5B0',
        }} />
        <div style={{
          position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)',
          width: 0, height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderBottom: '7px solid #F5F0E8',
        }} />

        <div style={{ fontSize: 9, fontWeight: 600, color: '#775C3C', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4 }}>
          {s.label}
        </div>
        <div style={{ fontSize: 14, color: '#3C3C3C', fontFamily: 'Georgia, serif', marginBottom: 6 }}>
          {s.title}
        </div>
        <div style={{ fontSize: 11, color: '#6B6054', lineHeight: 1.55, marginBottom: 12 }}>
          {s.text}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 5 }}>
            {TOUR_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => i !== step && onGoTo(i)}
                aria-label={`Paso ${i + 1}: ${TOUR_STEPS[i].title}`}
                aria-current={i === step ? 'step' : undefined}
                style={{
                  width: 8, height: 8, borderRadius: '50%', padding: 0, border: 'none',
                  background: i === step ? '#775C3C' : '#D4C5B0',
                  cursor: i !== step ? 'pointer' : 'default',
                  transition: 'background 0.3s, transform 0.15s',
                  flexShrink: 0,
                }}
                onMouseEnter={e => { if (i !== step) (e.target as HTMLElement).style.transform = 'scale(1.4)' }}
                onMouseLeave={e => { (e.target as HTMLElement).style.transform = 'scale(1)' }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={onEnd} style={{ fontSize: 10, color: '#A09080', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              Saltar
            </button>
            <button onClick={onNext} style={{
              fontSize: 11, fontWeight: 600, color: '#F5F0E8',
              background: '#775C3C', border: 'none',
              borderRadius: 4, padding: '4px 12px', cursor: 'pointer',
            }}>
              {step < TOUR_STEPS.length - 1 ? 'Siguiente →' : 'Listo ✓'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const PERIODS = [
  { id: 'todos',         name: 'Todos los períodos',    range: '' },
  { id: 'bronce_medio',  name: 'Edad de Bronce Media',  range: '2100–1550 a.C.' },
  { id: 'bronce_tardio', name: 'Edad de Bronce Tardía', range: '1500–1200 a.C.' },
  { id: 'hierro_1',      name: 'Edad de Hierro I',      range: '1200–1000 a.C.' },
  { id: 'hierro_2',      name: 'Edad de Hierro II',     range: '1000–586 a.C.'  },
  { id: 'post_exilio',   name: 'Post-Exilio',           range: '586–400 a.C.'   },
]

function getPeriodName(id: string): string {
  return PERIODS.find(p => p.id === id)?.name ?? PERIODS[2].name
}

function getPeriodRange(id: string): string {
  return PERIODS.find(p => p.id === id)?.range ?? PERIODS[2].range
}

function Acc({ icon, title, open, onToggle, children }: {
  icon: string; title: string; open: boolean; onToggle: () => void; children: ReactNode
}) {
  return (
    <div className="acc">
      <div className={`acc-h${open ? ' open' : ''}`} onClick={onToggle}>
        <span className="acc-title"><span>{icon}</span>{title}</span>
        <span className={`acc-ch${open ? ' open' : ''}`}>▼</span>
      </div>
      {open && <div className="acc-body">{children}</div>}
    </div>
  )
}

function HistoriaCard({ h }: { h: Historia }) {
  return (
    <div className="story-card">
      <div className="story-head">
        <div className="story-title">{h.titulo}</div>
        <div className="story-date">{h.fecha}</div>
      </div>
      <div className="story-body">
        <p className="desc">{h.descripcion}</p>
        {h.referencias.length > 0 && (
          <div className="meta">
            <span className="ml">Ref.:</span>
            {h.referencias.map(r => <a key={r} className="ref" href={`https://www.biblegateway.com/passage/?search=${encodeURIComponent(r)}&version=RVR1960`} target="_blank" rel="noopener noreferrer">{r}</a>)}
          </div>
        )}
      </div>
    </div>
  )
}

const KNOWN_PERIOD_IDS = new Set(['bronce_medio','bronce_tardio','hierro_1','hierro_2','post_exilio','todos'])

function PersonajeCard({ p }: { p: Personaje }) {
  const periodoDisplay = KNOWN_PERIOD_IDS.has(p.periodo) ? getPeriodName(p.periodo) : p.periodo
  return (
    <div className="person-card">
      <div className="person-head">
        <div className="avatar">{p.emoji}</div>
        <div>
          <div className="pname">{p.nombre}</div>
          <div className="prole">{p.rol} · {periodoDisplay}</div>
        </div>
      </div>
      <div className="story-body">
        <p className="desc">{p.descripcion}</p>
        {p.referencias.length > 0 && (
          <div className="meta">
            <span className="ml">Ref.:</span>
            {p.referencias.slice(0, 3).map(r => <a key={r} className="ref" href={`https://www.biblegateway.com/passage/?search=${encodeURIComponent(r)}&version=RVR1960`} target="_blank" rel="noopener noreferrer">{r}</a>)}
          </div>
        )}
      </div>
    </div>
  )
}

const TRADICIONES = [
  { key: 'judaismo' as const,     icon: '✡', label: 'Judaísmo' },
  { key: 'cristianismo' as const, icon: '✝', label: 'Cristianismo' },
  { key: 'islam' as const,        icon: '☪', label: 'Islam' },
]

function MitoCard({ m }: { m: Mito }) {
  return (
    <div className="myth-card">
      <div className="myth-head">
        <div className="myth-name">{m.nombre}</div>
        <div className="cb-row">
          {TRADICIONES.map(t => (
            <div key={t.key} className="cb-item">
              <div className={`cb ${m.aparece_en[t.key] ? 'cb-on' : 'cb-off'}`}>
                {m.aparece_en[t.key] ? '✓' : ''}
              </div>
              {t.label}
            </div>
          ))}
        </div>
      </div>
      {TRADICIONES.map(t => {
        const td = m[t.key]
        if (!td) return (
          <div key={t.key} className="rel-block">
            <div className="rel-name">{t.icon} {t.label}</div>
            <div className="rel-na">No aplica directamente en esta tradición.</div>
          </div>
        )
        return (
          <div key={t.key} className="rel-block">
            <div className="rel-name">{t.icon} {t.label}</div>
            <div className="rel-desc">{td.descripcion}</div>
            <div className="src">{td.fuente_primaria}</div>
            {(td.diferencias || td.similitudes) && (
              <div className="diff-row">
                {td.diferencias && <span className="diff-tag">Diferencia: {td.diferencias.slice(0, 70)}</span>}
                {td.similitudes && <span className="diff-tag">Similitud: {td.similitudes.slice(0, 70)}</span>}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function EventoCard({ e }: { e: EventoParalelo }) {
  return (
    <div className="civ-card">
      <div className="civ-head">
        <span>{e.emoji}</span>
        <span className="civ-name">{e.civilizacion}</span>
        <span className="civ-per">{e.periodo_historico}</span>
      </div>
      <div className="civ-body">
        <div className="civ-event">{e.evento}</div>
        <div className="civ-desc">{e.descripcion}</div>
      </div>
    </div>
  )
}

function HamburgerIcon() {
  return (
    <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="20" height="2" rx="1" fill="currentColor"/>
      <rect y="6" width="14" height="2" rx="1" fill="currentColor"/>
      <rect y="12" width="17" height="2" rx="1" fill="currentColor"/>
    </svg>
  )
}

function DrawerHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="drawer-header">
      <button className="drawer-close-btn" onClick={onClose} aria-label="Cerrar">✕</button>
      <span className="drawer-header-title">{title}</span>
    </div>
  )
}

function Panel({ lugar, periodId, onClose }: {
  lugar: Lugar; periodId: string; onClose: () => void
}) {
  const [openAcc, setOpenAcc] = useState(-1)
  const [showFade, setShowFade] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = bodyRef.current
    if (el) setShowFade(el.scrollHeight > el.clientHeight)
  }, [openAcc])

  const handleScroll = () => {
    const el = bodyRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 10
    setShowFade(!atBottom)
  }

  const toggle = (i: number) => setOpenAcc(prev => prev === i ? -1 : i)
  const tipoLabel = lugar.tipo === 'ciudad' ? 'Ciudad' : lugar.tipo === 'territorio' ? 'Territorio' : 'Región natural'
  const altitudLabel = typeof lugar.altitud_m === 'number' ? `${lugar.altitud_m} m` : lugar.altitud_m

  return (
    <>
      <DrawerHeader title={lugar.nombre} onClose={onClose} />
      <div className="drawer-fade-wrap"><div id="panel-body" className="panel-body-scroll" ref={bodyRef} onScroll={handleScroll}>
        <Acc icon="📍" title="Lugar" open={openAcc === 0} onToggle={() => toggle(0)}>
          <div className="grid2">
            <div><div className="gl">Altitud</div><div className="gv">{altitudLabel}</div></div>
            <div><div className="gl">Tipo</div><div className="gv">{(lugar as any).subtipo_geo ?? tipoLabel}</div></div>
          </div>
          <div className="sec-label" style={{ marginTop: 0 }}>Clima</div>
          <p className="desc">{lugar.clima}</p>
          <div className="sec-label">Geografía</div>
          <p className="desc">{lugar.descripcion_geo}</p>
          <div className="sec-label">Importancia estratégica</div>
          <p className="desc">{lugar.importancia_estrategica}</p>
          {(lugar.recursos ?? []).length > 0 && (<>
            <div className="sec-label">Recursos</div>
            <ul className="resource-list">{(lugar.recursos ?? []).map(r => <li key={r}>{r}</li>)}</ul>
          </>)}
          {(lugar.otros_habitantes ?? []).length > 0 && (<>
            <div className="sec-label">Otros habitantes</div>
            <div className="hab-list">
              {(lugar.otros_habitantes ?? []).map((h, i) => (
                <div key={h.id} className="hab-row" style={i === (lugar.otros_habitantes ?? []).length - 1 ? { borderBottom: 'none' } : {}}>
                  <div className="hab-name">{h.nombre}</div>
                  <div className="hab-desc">{h.descripcion}</div>
                </div>
              ))}
            </div>
          </>)}
          {(lugar as any).jerarquia_pin === 'sublugar' && (
            <p style={{ fontSize: '11px', color: 'var(--gray)', marginTop: '12px', fontStyle: 'italic' }}>* La ubicación del pin es aproximada. Este lugar se encontraba dentro de la ciudad de Jerusalén.</p>
          )}
          {(lugar as any).id === 'rephidim' && (
            <p style={{ fontSize: '11px', color: 'var(--gray)', marginTop: '12px', fontStyle: 'italic' }}>* Refidim es también conocido como Masá y Meribá (Éx 17:7), nombres dados al lugar tras la queja del pueblo por falta de agua.</p>
          )}
        </Acc>
        <Acc icon="📖" title="Historias" open={openAcc === 1} onToggle={() => toggle(1)}>
          {lugar.historias.length > 0 ? lugar.historias.map(h => <HistoriaCard key={h.id} h={h} />) : <p className="desc" style={{ opacity: 0.5 }}>Sin historias registradas.</p>}
        </Acc>
        <Acc icon="👤" title="Personajes" open={openAcc === 2} onToggle={() => toggle(2)}>
          {lugar.personajes.length > 0 ? lugar.personajes.map(p => <PersonajeCard key={p.id} p={p} />) : <p className="desc" style={{ opacity: 0.5 }}>Sin personajes registrados.</p>}
        </Acc>
        <Acc icon="✡" title="Contexto religioso" open={openAcc === 3} onToggle={() => toggle(3)}>
          <div className="sec-label" style={{ marginTop: 0 }}>Contexto del lugar</div>
          <div className="ctx-block">{lugar.contexto_religioso.contexto_lugar}</div>
          {lugar.contexto_religioso.religiones_presentes.length > 0 && (<>
            <div className="sec-label">Religiones presentes</div>
            <ul className="resource-list" style={{ marginBottom: 8 }}>{lugar.contexto_religioso.religiones_presentes.map(r => <li key={r}>{r}</li>)}</ul>
          </>)}
          {lugar.contexto_religioso.mitos.length > 0 && (<>
            <div className="sec-label">Mitos y perspectivas religiosas</div>
            {lugar.contexto_religioso.mitos.map(m => <MitoCard key={m.id} m={m} />)}
          </>)}
        </Acc>
        <Acc icon="🌍" title="Eventos paralelos" open={openAcc === 4} onToggle={() => toggle(4)}>
          {periodId === 'todos' ? (
            <p className="desc" style={{ opacity: 0.5, padding: '8px 0' }}>Selecciona un período histórico para ver eventos paralelos.</p>
          ) : (<>
            <div className="per-banner">
              <div>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink)' }}>{getPeriodName(periodId)}</div>
                <div style={{ fontSize: 10, color: 'var(--gray)' }}>{getPeriodRange(periodId)}</div>
              </div>
            </div>
            {EVENTOS_PARALELOS_GLOBAL
              .filter(e => e.periodo_at.includes(periodId))
              .map(e => <EventoCard key={e.civilizacion} e={e} />)}
          </>)}
        </Acc>
      </div>
      {showFade && <div className="panel-scroll-fade" />}
      </div>
      <div id="panel-nav"><span className="nav-note">Mapa Interactivo · AT</span></div>
    </>
  )
}

function MenuNav({ lastPlace, onGoToPlace, onClose }: {
  lastPlace: Lugar | null; onGoToPlace: () => void; onClose: () => void
}) {
  const displayPlace = lastPlace?.nombre ?? 'Jerusalén'
  const labelPrefix = lastPlace ? 'Última consulta:' : 'Explorar:'

  return (
    <>
      <DrawerHeader title="Menú" onClose={onClose} />
      <div id="panel-body" className="panel-body-scroll">
        <button className="menu-last-place" onClick={onGoToPlace}>
          <span className="menu-last-icon">🗺</span>
          <span className="menu-last-text">
            <em>{labelPrefix}</em>
            <strong>{displayPlace}</strong>
          </span>
          <span className="menu-last-arrow">→</span>
        </button>
        <div className="menu-section-label">El mapa</div>
        <div className="menu-list">
          <button disabled className="menu-item menu-item-disabled" aria-disabled="true">📖 Acerca del proyecto</button>
          <button disabled className="menu-item menu-item-disabled" aria-disabled="true">📚 Fuentes consultadas</button>
          <button disabled className="menu-item menu-item-disabled" aria-disabled="true">❓ Cómo usar el mapa</button>
        </div>
        <div className="menu-section-label">Información</div>
        <div className="menu-list">
          <button disabled className="menu-item menu-item-disabled" aria-disabled="true">✍ Créditos</button>
          <div className="menu-item menu-item-muted">Más mapas — próximamente</div>
        </div>
      </div>
      <div id="panel-nav"><span className="nav-note">Mapa Interactivo · AT</span></div>
    </>
  )
}

function PanelRuta({ ruta, lugares, onClose, onSelectLugar, activeViajeIdx, onNavigateViaje }: {
  ruta: RutaSeleccionada
  lugares: Lugar[]
  onClose: () => void
  onSelectLugar: (l: Lugar) => void
  activeViajeIdx: number
  onNavigateViaje: (idx: number) => void
}) {
  const lugarMap = new Map(lugares.map(l => [l.id, l]))
  const viajes = ruta.viajes
  const hasViajes = viajes && viajes.length > 1
  const viajeActual = hasViajes ? viajes[activeViajeIdx] : null
  const rutaActual = viajeActual ? viajeActual.ruta : ruta.ruta
  const refsActuales = viajeActual?.referencias?.length ? viajeActual.referencias : ruta.referencias

  return (
    <>
      <DrawerHeader title={`Ruta de ${ruta.nombre}`} onClose={onClose} />
      <div style={{ height: 3, background: ruta.color, flexShrink: 0 }} />
      <div id="panel-body" className="panel-body-scroll">

        {/* Header personaje */}
        <div className="person-head" style={{ paddingBottom: 12, borderBottom: '1px solid var(--divider, #e8e2d8)', marginBottom: 0 }}>
          <div className="avatar">{ruta.emoji || '🚶'}</div>
          <div>
            <div className="pname">{ruta.nombre}</div>
            <div className="prole" style={{ color: ruta.color }}>{ruta.rol}{ruta.rol && ruta.periodo ? ' · ' : ''}{getPeriodName(ruta.periodo)}</div>
            {getPeriodRange(ruta.periodo) && <div style={{ fontSize: 10, color: 'var(--gray)', marginTop: 2 }}>{getPeriodRange(ruta.periodo)}</div>}
          </div>
        </div>

        {/* Navegador de viajes */}
        {hasViajes && (
          <div style={{
            padding: '10px 14px', borderBottom: '1px solid var(--divider, #e8e2d8)',
            background: 'var(--surface-1, #F0EBE2)',
          }}>
            <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--gray)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4 }}>
              VIAJE {activeViajeIdx + 1} DE {viajes.length}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', flex: 1 }}>
                {viajeActual?.nombre}
              </div>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <button
                  onClick={() => onNavigateViaje(Math.max(0, activeViajeIdx - 1))}
                  disabled={activeViajeIdx === 0}
                  style={{
                    width: 26, height: 26, borderRadius: 6,
                    border: '1px solid var(--divider, #e8e2d8)',
                    background: 'var(--surface-2, #FAF5EE)',
                    cursor: activeViajeIdx === 0 ? 'default' : 'pointer',
                    fontSize: 12, color: 'var(--ink)', opacity: activeViajeIdx === 0 ? 0.3 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >←</button>
                <button
                  onClick={() => onNavigateViaje(Math.min(viajes.length - 1, activeViajeIdx + 1))}
                  disabled={activeViajeIdx === viajes.length - 1}
                  style={{
                    width: 26, height: 26, borderRadius: 6,
                    border: '1px solid var(--divider, #e8e2d8)',
                    background: 'var(--surface-2, #FAF5EE)',
                    cursor: activeViajeIdx === viajes.length - 1 ? 'default' : 'pointer',
                    fontSize: 12, color: 'var(--ink)', opacity: activeViajeIdx === viajes.length - 1 ? 0.3 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >→</button>
              </div>
            </div>
            {/* Dots de progreso */}
            <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 7 }}>
              {viajes.map((_v, i) => (
                <button
                  key={i}
                  onClick={() => onNavigateViaje(i)}
                  style={{
                    width: i === activeViajeIdx ? 14 : 5,
                    height: 5, borderRadius: 3,
                    background: i === activeViajeIdx ? ruta.color : 'var(--divider, #e8e2d8)',
                    border: 'none', padding: 0, cursor: 'pointer',
                    transition: 'width 0.2s, background 0.2s',
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {ruta.descripcion && !hasViajes && <p className="desc" style={{ marginBottom: 14, marginTop: 12 }}>{ruta.descripcion}</p>}

        {/* Timeline de paradas */}
        <div className="sec-label" style={{ marginTop: 14 }}>Paradas</div>
        <div style={{ position: 'relative', paddingLeft: 28, marginTop: 10 }}>
          <div style={{
            position: 'absolute', left: 7, top: 10, bottom: 10,
            width: 2, background: `linear-gradient(to bottom, ${ruta.color}, ${ruta.color}30)`,
            borderRadius: 1,
          }} />

          {rutaActual.map((id, i) => {
            const lugar = lugarMap.get(id)
            const isLast = i === rutaActual.length - 1
            const tipoLabel = lugar?.tipo === 'ciudad' ? 'Ciudad' : lugar?.tipo === 'territorio' ? 'Territorio' : 'Región natural'
            const tipoDisplay = (lugar as any)?.subtipo_geo ?? tipoLabel
            const importancia = lugar?.importancia_estrategica
            const snippet = importancia && importancia.length > 80 ? importancia.slice(0, 80) + '…' : importancia
            const truncated = importancia ? importancia.length > 80 : false

            return (
              <div key={id + i} style={{ position: 'relative', paddingBottom: isLast ? 4 : 16 }}>
                <div style={{
                  position: 'absolute', left: -21, top: 3,
                  width: 14, height: 14, borderRadius: '50%',
                  background: ruta.color, border: `2px solid ${ruta.color}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 8, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{i + 1}</span>
                </div>

                {lugar ? (
                  <button onClick={() => onSelectLugar(lugar)} style={{
                    background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                    fontSize: 13, fontWeight: 600, color: ruta.color,
                    textDecoration: 'underline', textDecorationColor: `${ruta.color}44`,
                    textUnderlineOffset: '2px', textAlign: 'left', fontFamily: 'inherit',
                  }}>
                    {lugar.nombre}
                  </button>
                ) : (
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{id}</div>
                )}

                {lugar && <div style={{ fontSize: 10, color: 'var(--gray)', marginTop: 1 }}>{tipoDisplay}</div>}
                {snippet && <div style={{ fontSize: 11, color: 'var(--text-secondary, #6B6560)', marginTop: 3, lineHeight: 1.45 }}>{snippet}</div>}
                {lugar && (
                  <button onClick={() => onSelectLugar(lugar)} style={{
                    background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                    fontSize: 11, color: ruta.color, fontFamily: 'inherit',
                    marginTop: 4, display: 'flex', alignItems: 'center', gap: 3,
                    opacity: truncated ? 1 : 0.7,
                  }}>
                    {truncated ? 'Leer más →' : 'Ver lugar →'}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Referencias */}
        {refsActuales.length > 0 && (
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--divider, #e8e2d8)' }}>
            <div className="sec-label">Referencias</div>
            <div className="meta" style={{ paddingBottom: 12 }}>
              {refsActuales.map(r => (
                <a key={r} className="ref" href={`https://www.biblegateway.com/passage/?search=${encodeURIComponent(r)}&version=RVR1960`} target="_blank" rel="noopener noreferrer">{r}</a>
              ))}
            </div>
          </div>
        )}
      </div>
      <div id="panel-nav"><span className="nav-note">Mapa Interactivo · AT</span></div>
    </>
  )
}

function PanelTerritorio({ territorio, onClose, lugares, onSelectLugar }: {
  territorio: TerritorioSeleccionado
  onClose: () => void
  lugares: Lugar[]
  onSelectLugar: (l: Lugar) => void
}) {
  const periodName = getPeriodName(territorio.periodo)
  const periodRange = getPeriodRange(territorio.periodo)
  const c = territorio.color
  const info = TERRITORY_INFO[territorio.nombreEN] ?? null

  // Resuelve IDs a objetos Lugar (solo los que están cargados)
  const lugaresById = new Map(lugares.map(l => [l.id, l]))
  const ciudadesList = info
    ? info.ciudades.map(id => lugaresById.get(id)).filter((l): l is Lugar => !!l)
    : []
  const naturalesList = info
    ? info.naturales.map(id => lugaresById.get(id)).filter((l): l is Lugar => !!l)
    : []

  const divider = (
    <div style={{ height: 0.5, background: 'var(--border, #D4C5B0)', margin: '14px 0' }} />
  )

  return (
    <>
      <DrawerHeader title={territorio.nombreES} onClose={onClose} />
      <div style={{ height: 3, background: c, flexShrink: 0 }} />
      <div id="panel-body" className="panel-body-scroll">
        <div style={{ padding: '16px 16px 0' }}>

          {/* Categoría */}
          {territorio.tipo && (
            <div style={{
              display: 'inline-block',
              background: `${c}22`,
              border: `1px solid ${c}66`,
              borderRadius: 4,
              padding: '3px 10px',
              fontSize: 11,
              fontWeight: 600,
              color: c,
              marginBottom: 16,
              letterSpacing: '0.04em',
            }}>
              {territorio.tipo}
            </div>
          )}

          {/* Período */}
          <div className="sec-label" style={{ marginTop: 0 }}>Período visible en el mapa</div>
          <div className="gv" style={{ fontSize: 13 }}>{periodName}</div>
          {periodRange && (
            <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 2 }}>{periodRange}</div>
          )}

          {/* Significado bíblico */}
          {info?.significado && (
            <>
              {divider}
              <div className="sec-label">Significado bíblico</div>
              <div style={{
                fontSize: 12,
                color: 'var(--gray)',
                lineHeight: 1.65,
                fontFamily: 'Georgia, serif',
                borderLeft: `2px solid ${c}66`,
                paddingLeft: 10,
              }}>
                {info.significado}
              </div>
            </>
          )}

          {/* Lugares en esta región */}
          {(ciudadesList.length > 0 || naturalesList.length > 0) && (
            <>
              {divider}
              <div className="sec-label">Lugares en esta región</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 6 }}>
                {ciudadesList.map(l => (
                  <button
                    key={l.id}
                    onClick={() => { onSelectLugar(l); onClose() }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '7px 10px',
                      background: 'var(--surface-1, #F0EBE2)',
                      border: '0.5px solid var(--border, #D4C5B0)',
                      borderRadius: 6, cursor: 'pointer',
                      fontSize: 12, color: 'var(--ink, #3C3C3C)',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{
                        display: 'inline-block', width: 7, height: 7,
                        borderRadius: '50%', background: '#6B6060', flexShrink: 0,
                      }} />
                      {l.nombre}
                    </span>
                    <span style={{ color: c, fontSize: 13, opacity: 0.85 }}>→</span>
                  </button>
                ))}
                {naturalesList.map(l => (
                  <button
                    key={l.id}
                    onClick={() => { onSelectLugar(l); onClose() }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '7px 10px',
                      background: 'var(--surface-1, #F0EBE2)',
                      border: '0.5px solid var(--border, #D4C5B0)',
                      borderRadius: 6, cursor: 'pointer',
                      fontSize: 12, color: 'var(--ink, #3C3C3C)',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{
                        display: 'inline-block', width: 7, height: 7,
                        borderRadius: 1, background: '#2E5F8A', flexShrink: 0,
                      }} />
                      {l.nombre}
                    </span>
                    <span style={{ color: c, fontSize: 13, opacity: 0.85 }}>→</span>
                  </button>
                ))}
              </div>
              {/* Leyenda */}
              <div style={{ display: 'flex', gap: 14, paddingLeft: 2, marginBottom: 4 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--gray)' }}>
                  <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#6B6060' }} />
                  Ciudad
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--gray)' }}>
                  <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: 1, background: '#2E5F8A' }} />
                  Lugar natural
                </span>
              </div>
            </>
          )}

          {/* Pueblos principales */}
          {info?.pueblos && info.pueblos.length > 0 && (
            <>
              {divider}
              <div className="sec-label">Pueblos principales</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {info.pueblos.map(p => (
                  <span key={p} style={{
                    fontSize: 11, padding: '3px 9px',
                    borderRadius: 20,
                    background: 'var(--surface-1, #F0EBE2)',
                    border: '0.5px solid var(--border, #D4C5B0)',
                    color: 'var(--gray)',
                  }}>
                    {p}
                  </span>
                ))}
              </div>
            </>
          )}

          {/* Nota fuente */}
          <div style={{
            marginTop: 20,
            marginBottom: 4,
            padding: '10px 12px',
            background: 'var(--surface-1, #F0EBE2)',
            borderRadius: 6,
            fontSize: 11,
            color: 'var(--gray)',
            lineHeight: 1.55,
          }}>
            Límites basados en <em>Historical Basemaps</em> (Ourednik, CC BY-SA). Las fronteras son aproximadas.
          </div>
        </div>
      </div>
      <div id="panel-nav"><span className="nav-note">Mapa Interactivo · AT</span></div>
    </>
  )
}

export default function App() {
  const [selected, setSelected] = useState<Lugar | null>(null)
  const [selectedRuta, setSelectedRuta] = useState<RutaSeleccionada | null>(null)
  const [selectedTerritorio, setSelectedTerritorio] = useState<TerritorioSeleccionado | null>(null)
  const [activeViajeIdx, setActiveViajeIdx] = useState(0)
  const [periodId, setPeriodId] = useState('todos')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [panelCollapsed, setPanelCollapsed] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [territoriosActive, setTerritoriosActive] = useState(false)
  const [rutasActive, setRutasActive] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [drawerTop, setDrawerTop] = useState(82)
  const [lugares, setLugares] = useState<import("./types/lugar").Lugar[]>([])

  const topbarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("/data/index.json")
      .then(r => r.json())
      .then((ids: string[]) => Promise.all(ids.map(id => fetch("/data/" + id + ".json").then(r => r.ok ? r.json() : null).catch(() => null))))
      .then(results => setLugares(results.filter(Boolean)))
      .catch(console.error)
  }, [])
  const timelineRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function measure() {
      const t = topbarRef.current?.offsetHeight ?? 38
      const tl = timelineRef.current?.offsetHeight ?? 44
      setDrawerTop(t + tl)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const handleSelect = useCallback((l: Lugar) => {
    if (l.lat && l.lng) setFlyToTarget({ lat: l.lat, lng: l.lng })
    setSelected(l)
    setSelectedRuta(null)
    setSelectedTerritorio(null)
    setMenuOpen(false)
    setDrawerOpen(true)
    setPanelCollapsed(false)
  }, [])

  const handleSelectRuta = useCallback((ruta: RutaSeleccionada) => {
    setSelectedRuta(ruta)
    setActiveViajeIdx(ruta.viajeIdx ?? 0)
    setSelected(null)
    setSelectedTerritorio(null)
    setMenuOpen(false)
    setDrawerOpen(true)
    setPanelCollapsed(false)
  }, [])

  const handleSelectTerritorio = useCallback((t: TerritorioSeleccionado) => {
    setSelectedTerritorio(t)
    setSelected(null)
    setSelectedRuta(null)
    setMenuOpen(false)
    setDrawerOpen(true)
    setPanelCollapsed(false)
  }, [])

  const closeAll = () => { setDrawerOpen(false); setMenuOpen(false); setSelectedRuta(null); setSelectedTerritorio(null); setActiveViajeIdx(0) }

  // Índice de rutas: personajes únicos con ruta o viajes
  const buildRutasIndex = (): RutaSeleccionada[] => {
    if (searchQuery.length < 2) return []
    const seen = new Set<string>()
    const result: RutaSeleccionada[] = []
    lugares.forEach(lugar => {
      ;(lugar.personajes ?? []).forEach(p => {
        const tieneRuta = (p.ruta?.length ?? 0) > 0 || (p.viajes?.length ?? 0) > 0
        if (!tieneRuta || seen.has(p.nombre)) return
        seen.add(p.nombre)
        const color = PERSONAJE_COLORS[p.nombre] ?? DEFAULT_COLOR
        const viajes = p.viajes?.length ? p.viajes : undefined
        result.push({
          nombre: p.nombre,
          emoji: p.emoji || '🚶',
          rol: p.rol,
          periodo: p.periodo,
          descripcion: p.descripcion,
          referencias: viajes ? (viajes[0].referencias ?? p.referencias) : p.referencias,
          ruta: viajes ? viajes[0].ruta : p.ruta,
          color,
          personajeId: p.nombre,
          viajeIdx: 0,
          viajeNombre: viajes?.[0]?.nombre,
          viajes,
        })
      })
    })
    return result
  }

  const q = searchQuery.toLowerCase()
  const searchResults: SearchResult[] = searchQuery.length >= 2 ? [
    ...lugares
      .filter(l => l.nombre.toLowerCase().includes(q))
      .slice(0, 4)
      .map(l => ({ kind: 'lugar' as const, data: l })),
    ...buildRutasIndex()
      .filter(r => r.nombre.toLowerCase().includes(q))
      .slice(0, 3)
      .map(r => ({ kind: 'ruta' as const, data: r })),
    ...TERRITORY_SEARCH_LIST
      .filter(t => t.nombreES.toLowerCase().includes(q) || t.nombreEN.toLowerCase().includes(q))
      .slice(0, 2)
      .map(t => ({ kind: 'territorio' as const, nombreES: t.nombreES, nombreEN: t.nombreEN })),
  ].slice(0, 8) : []

  const handleSearchSelectRuta = useCallback((ruta: RutaSeleccionada) => {
    setRutasActive(true)
    if (ruta.periodo && ruta.periodo !== 'todos') setPeriodId(ruta.periodo)
    setSelectedRuta(ruta)
    setActiveViajeIdx(ruta.viajeIdx ?? 0)
    setSelected(null)
    setMenuOpen(false)
    setDrawerOpen(true)
    setPanelCollapsed(false)
  }, [])

  const handleSearchSelectTerritorio = useCallback((nombreEN: string, nombreES: string) => {
    const periodo = periodId === 'todos' ? 'hierro_2' : periodId
    setTerritoriosActive(true)
    setPeriodId(periodo)
    handleSelectTerritorio({
      nombreEN,
      nombreES,
      tipo: getTerritoryType(nombreEN),
      color: getTerritoryColor(nombreEN),
      periodo,
    })
  }, [periodId, handleSelectTerritorio])

  const openMenu = () => { setDrawerOpen(false); setMenuOpen(true) }
  const goToLastPlace = async () => {
    if (selected) {
      setMenuOpen(false)
      setDrawerOpen(true)
    } else {
      const res = await fetch('/data/jerusalen.json').catch(() => null)
      const jer = res?.ok ? await res.json() : null
      if (jer) setSelected(jer)
      setMenuOpen(false)
      setDrawerOpen(true)
    }
  }
  const isMobile = window.innerWidth < 769
  const [flyToTarget, setFlyToTarget] = useState<{lat: number, lng: number, zoom?: number} | null>(null)
  const [tourStep, setTourStep] = useState<number | null>(null)
  const mapWrapRef = useRef<HTMLDivElement>(null)
  const postExilioRef = useRef<HTMLButtonElement>(null)
  const territoriosBtnRef = useRef<HTMLButtonElement>(null)
  const rutasBtnRef = useRef<HTMLButtonElement>(null)
  const leafletMapRef = useRef<L.Map | null>(null)

  const startTour = useCallback(() => {
    const jer = lugares.find(l => l.id === 'jerusalen')
    if (jer) {
      setFlyToTarget({ lat: jer.lat, lng: jer.lng, zoom: 9 })
      setSelected(jer)
    } else {
      setFlyToTarget({ lat: 31.7683, lng: 35.2137, zoom: 9 })
    }
    setSelectedRuta(null)
    setSelectedTerritorio(null)
    setDrawerOpen(true)
    setPanelCollapsed(false)
    setTerritoriosActive(false)
    setRutasActive(false)
    setPeriodId('todos')
    setTourStep(0)
  }, [lugares])

  const goToTourStep = useCallback((target: number) => {
    if (target < 0 || target >= TOUR_STEPS.length) { setTourStep(null); return }

    if (target === 0) {
      // Jerusalén
      const jer = lugares.find(l => l.id === 'jerusalen')
      if (jer) { setFlyToTarget({ lat: jer.lat, lng: jer.lng, zoom: 9 }); setSelected(jer) }
      else setFlyToTarget({ lat: 31.7683, lng: 35.2137, zoom: 9 })
      setTerritoriosActive(false); setRutasActive(false); setPeriodId('todos')
      setSelectedRuta(null); setSelectedTerritorio(null)
      setPanelCollapsed(false)

    } else if (target === 1) {
      // Territorios: auto-seleccionar Egipto, zoom amplio
      setTerritoriosActive(true); setRutasActive(false)
      setPeriodId('bronce_tardio')
      setFlyToTarget({ lat: 27, lng: 33, zoom: 5 })
      setSelected(null); setSelectedRuta(null)
      setSelectedTerritorio({ nombreEN: 'Egypt', nombreES: 'Egipto', tipo: 'Imperio', color: '#C9A84C', periodo: 'bronce_tardio' })
      setPanelCollapsed(false)

    } else if (target === 2) {
      // Rutas: auto-seleccionar Moisés, vista Egipto→Sinaí→Canaán
      setTerritoriosActive(true); setRutasActive(true)
      setPeriodId('bronce_tardio')
      setFlyToTarget({ lat: 30, lng: 34, zoom: 7 })
      setSelectedTerritorio(null)
      let found = false
      for (const l of lugares) {
        const mosesPer = (l.personajes ?? []).find(p => p.nombre === 'Moisés')
        if (mosesPer) {
          const viajes = mosesPer.viajes?.length ? mosesPer.viajes : undefined
          const mosesRuta: RutaSeleccionada = {
            nombre: mosesPer.nombre, emoji: mosesPer.emoji || '🚶',
            rol: mosesPer.rol, periodo: mosesPer.periodo, descripcion: mosesPer.descripcion,
            referencias: viajes ? (viajes[0].referencias ?? mosesPer.referencias) : mosesPer.referencias,
            ruta: viajes ? viajes[0].ruta : mosesPer.ruta,
            color: PERSONAJE_COLORS['Moisés'] ?? DEFAULT_COLOR,
            personajeId: mosesPer.nombre, viajeIdx: 0,
            viajeNombre: viajes?.[0]?.nombre, viajes,
          }
          setSelectedRuta(mosesRuta); setActiveViajeIdx(0); setSelected(null)
          found = true; break
        }
      }
      if (!found) { setSelectedRuta(null); setSelected(null) }
      setPanelCollapsed(false)

    } else if (target === 3) {
      // Post-exilio: mostrar hierro_2 → esperar 5s → ciclar a post_exilio
      setTerritoriosActive(true); setRutasActive(false)
      setSelectedRuta(null); setSelectedTerritorio(null); setSelected(null)
      setFlyToTarget({ lat: 32, lng: 37, zoom: 5 })
      setPeriodId('hierro_2')
      setPanelCollapsed(false)
      setTimeout(() => setPeriodId('post_exilio'), 5000)

    } else if (target === 4) {
      // Búsqueda: vista limpia, spotlight sobre el input
      setTerritoriosActive(false); setRutasActive(false)
      setSelectedRuta(null); setSelectedTerritorio(null); setSelected(null)
      setPeriodId('todos')
      setFlyToTarget({ lat: 31.7683, lng: 35.2137, zoom: 8 })
      setPanelCollapsed(false)
    }

    setTourStep(target)
  }, [lugares])

  const advanceTour = useCallback((current: number) => {
    if (current + 1 >= TOUR_STEPS.length) { setTourStep(null); return }
    goToTourStep(current + 1)
  }, [goToTourStep])

  const showOverlay = menuOpen || (drawerOpen && isMobile && !window.matchMedia('(min-width: 769px)').matches)
  const drawerStyle = { top: `${drawerTop}px` }

  return (
    <div id="app">
      <div id="topbar" ref={topbarRef}>
        <span id="topbar-title">Mapa Interactivo · Antiguo Testamento</span>
        <div id="topbar-right">
          <div id="topbar-search-wrap">
            <span id="topbar-search-icon">🔍</span>
            <input
              id="topbar-search-input"
              type="text"
              placeholder="Buscar lugar, personaje o territorio..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && searchResults.length > 0) {
                  const first = searchResults[0]
                  if (first.kind === 'lugar') { handleSelect(first.data); setSearchQuery("") }
                  else if (first.kind === 'ruta') { handleSearchSelectRuta(first.data); setSearchQuery("") }
                  else if (first.kind === 'territorio') { handleSearchSelectTerritorio(first.nombreEN, first.nombreES); setSearchQuery("") }
                }
              }}
              aria-label="Buscar lugar, personaje o territorio"
            />
            {searchResults.length > 0 && (
              <div id="search-dropdown">
                {searchResults.map((r, i) => {
                  if (r.kind === 'lugar') return (
                    <button key={r.data.id} className="search-result" onClick={() => { handleSelect(r.data); setSearchQuery("") }}>
                      <span className="search-result-name">{r.data.nombre}</span>
                      <span className="search-result-tipo">{r.data.tipo === "ciudad" ? "Ciudad" : r.data.tipo === "territorio" ? "Territorio" : "Región natural"}</span>
                    </button>
                  )
                  if (r.kind === 'ruta') return (
                    <button key={'ruta-' + r.data.nombre + i} className="search-result" onClick={() => { handleSearchSelectRuta(r.data); setSearchQuery("") }}>
                      <span className="search-result-name">{r.data.emoji} {r.data.nombre}</span>
                      <span className="search-result-tipo">Ruta · {getPeriodName(r.data.periodo)}</span>
                    </button>
                  )
                  if (r.kind === 'territorio') return (
                    <button key={'ter-' + r.nombreEN} className="search-result" onClick={() => { handleSearchSelectTerritorio(r.nombreEN, r.nombreES); setSearchQuery("") }}>
                      <span className="search-result-name">{r.nombreES}</span>
                      <span className="search-result-tipo">Territorio histórico</span>
                    </button>
                  )
                  return null
                })}
              </div>
            )}
          </div>
          <button id="topbar-menu-btn" onClick={openMenu} aria-label="Menú">
            <HamburgerIcon />
          </button>
        </div>
      </div>
      <div id="timeline-bar" ref={timelineRef}>
        <span className="tl-label">Período</span>
        <div id="period-btns">
          {PERIODS.map(p => (
            <button
              key={p.id}
              ref={p.id === 'post_exilio' ? postExilioRef : undefined}
              className={`period-btn${periodId === p.id ? ' active' : ''}`}
              aria-pressed={periodId === p.id}
              onClick={() => setPeriodId(p.id)}
              title={p.range}
            >
              <span style={{display:'flex',flexDirection:'column',alignItems:'center',gap:0}}><span>{p.name}</span>{periodId !== p.id && p.range && <span style={{fontSize:'9px',opacity:0.7,fontFamily:'system-ui,sans-serif'}}>{p.range}</span>}</span>
            </button>
          ))}
        </div>
        <div id="layers-row">
          <button ref={territoriosBtnRef} className={`layer-btn${territoriosActive ? ' active' : ''}`} aria-pressed={territoriosActive} onClick={() => setTerritoriosActive(a => !a)} title="Mostrar territorios históricos">🗺 Territorios</button>
          <button ref={rutasBtnRef} className={`layer-btn${rutasActive ? ' active' : ''}`} aria-pressed={rutasActive} onClick={() => setRutasActive(a => !a)} title="Mostrar rutas de personajes">🚶 Rutas</button>
        </div>
      </div>
      <div id="main">
        <div id="map-wrap" ref={mapWrapRef}>
          <MapView
            onSelectLugar={handleSelect}
            onSelectRuta={handleSelectRuta}
            onSelectTerritorio={handleSelectTerritorio}
            onMapReady={(map) => { leafletMapRef.current = map }}
            flyToTarget={flyToTarget}
            selectedId={selected?.id}
            periodId={periodId}
            territoriosActive={territoriosActive}
            rutasActive={rutasActive}
            selectedPersonaje={selectedRuta?.personajeId}
            selectedViajeIdx={activeViajeIdx}
            selectedTerritorio={selectedTerritorio}
          />
        </div>
        <div id="panel" className={[drawerOpen ? 'drawer-open' : '', (!isMobile && panelCollapsed) ? 'panel-collapsed' : '', tourStep !== null ? 'panel-tour-active' : ''].filter(Boolean).join(' ')} style={drawerStyle}>
          {selectedRuta ? (
            <PanelRuta ruta={selectedRuta} lugares={lugares} onClose={closeAll} onSelectLugar={handleSelect} activeViajeIdx={activeViajeIdx} onNavigateViaje={setActiveViajeIdx} />
          ) : selectedTerritorio ? (
            <PanelTerritorio territorio={selectedTerritorio} onClose={closeAll} lugares={lugares} onSelectLugar={handleSelect} />
          ) : selected ? (
            <Panel key={selected.id} lugar={selected} periodId={periodId} onClose={closeAll} />
          ) : (
            <>
              <DrawerHeader title="Mapa Interactivo · AT" onClose={closeAll} />
              <div id="panel-body" className="panel-body-scroll">
                <div style={{ padding: '16px 16px 20px', display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {/* Intro */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: 13, color: 'var(--ink)', marginBottom: 4 }}>Explora la geografía bíblica</div>
                    <div style={{ fontSize: 11, color: 'var(--gray)', lineHeight: 1.55 }}>La geografía como personaje activo en la narrativa del Antiguo Testamento.</div>
                  </div>

                  {/* Feature cards */}
                  {[
                    { icon: '📍', title: 'Lugares', desc: 'Toca un pin en el mapa o usa la búsqueda para explorar historia, personajes y contexto religioso.' },
                    { icon: '🗺', title: 'Territorios', desc: 'Activa la capa de territorios para ver los imperios: Canaán, Egipto, Asiria y más.' },
                    { icon: '🚶', title: 'Rutas', desc: 'Sigue los viajes de Abraham, Moisés, David y otros con la capa de rutas.' },
                    { icon: '⏳', title: 'Períodos', desc: 'Filtra por era histórica para ver el mapa en su contexto cronológico.' },
                  ].map(f => (
                    <div key={f.title} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      padding: '9px 10px', marginBottom: 6,
                      background: 'var(--surface-1, #EDE8DF)',
                      border: '0.5px solid var(--border, #D4C5B0)',
                      borderRadius: 6,
                    }}>
                      <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1, width: 20, textAlign: 'center' }}>{f.icon}</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>{f.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--gray)', lineHeight: 1.45 }}>{f.desc}</div>
                      </div>
                    </div>
                  ))}

                  {/* CTA tour */}
                  <button
                    onClick={startTour}
                    style={{
                      marginTop: 10,
                      width: '100%',
                      padding: '10px 14px',
                      background: '#775C3C',
                      border: 'none',
                      borderRadius: 6,
                      color: '#F5F0E8',
                      fontFamily: 'Georgia, serif',
                      fontSize: 13,
                      cursor: 'pointer',
                      letterSpacing: '0.02em',
                    }}
                  >
                    Comenzar en Jerusalén ★
                  </button>
                  <div style={{ textAlign: 'center', marginTop: 8, fontSize: 10, color: 'var(--gray)', fontStyle: 'italic' }}>
                    o toca cualquier pin en el mapa
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        <button id="panel-toggle" className={panelCollapsed ? 'collapsed' : ''} onClick={() => setPanelCollapsed(c => !c)} aria-label={panelCollapsed ? 'Abrir panel' : 'Cerrar panel'} style={{ '--toggle-top': `${drawerTop + 16}px` } as React.CSSProperties}>
          {panelCollapsed ? '◀' : '▶'}
        </button>
        <div id="menu-drawer" className={menuOpen ? 'drawer-open' : ''} style={drawerStyle}>
          <MenuNav lastPlace={selected} onGoToPlace={goToLastPlace} onClose={closeAll} />
        </div>
        {showOverlay && <div id="drawer-overlay" className={window.innerWidth >= 769 ? 'desktop-active' : ''} onClick={closeAll} />}
      </div>
      {tourStep !== null && (
        <TourOverlay
          step={tourStep}
          onNext={() => advanceTour(tourStep)}
          onEnd={() => setTourStep(null)}
          onGoTo={goToTourStep}
          mapWrapRef={mapWrapRef}
          btnRefs={[territoriosBtnRef, rutasBtnRef, postExilioRef]}
          leafletMapRef={leafletMapRef}
        />
      )}
    </div>
  )
}
