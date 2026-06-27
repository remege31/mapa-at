import { useState, useCallback, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { MapView } from './components/MapView'
import type {
  Lugar,
  Historia,
  Personaje,
  Mito,
  EventoParalelo,
  RutaSeleccionada,
} from './types/lugar'
import { EVENTOS_PARALELOS_GLOBAL } from './data/eventosParalelos'
import { PERSONAJE_COLORS, DEFAULT_COLOR } from './data/rutaColors'
import './App.css'

type SearchResult =
  | { kind: 'lugar'; data: Lugar }
  | { kind: 'ruta'; data: RutaSeleccionada }
  | { kind: 'territorio'; nombreES: string; nombreEN: string }

const TERRITORY_SEARCH_LIST: { nombreEN: string; nombreES: string }[] = [
  { nombreEN: 'Egypt',                          nombreES: 'Egipto' },
  { nombreEN: 'Assyria',                        nombreES: 'Asiria' },
  { nombreEN: 'Babylonia',                      nombreES: 'Mesopotamia / Babilonia' },
  { nombreEN: 'Hittites',                       nombreES: 'Hititas' },
  { nombreEN: 'Elam',                           nombreES: 'Elam' },
  { nombreEN: 'Israel',                         nombreES: 'Israel (reino)' },
  { nombreEN: 'Judah',                          nombreES: 'Judá (reino)' },
  { nombreEN: 'Canaan',                         nombreES: 'Canaán' },
  { nombreEN: 'Arameans',                       nombreES: 'Arameos' },
  { nombreEN: 'Philistines',                    nombreES: 'Filisteos' },
  { nombreEN: 'Phoenicia',                      nombreES: 'Fenicia' },
  { nombreEN: 'Persia',                         nombreES: 'Persia' },
  { nombreEN: 'Media',                          nombreES: 'Media' },
  { nombreEN: 'Urartu',                         nombreES: 'Urartu' },
  { nombreEN: 'Arabian pastoral nomads',        nombreES: 'Pastores nómadas árabes' },
  { nombreEN: 'Greek city-states',              nombreES: 'Ciudades-estado griegas' },
  { nombreEN: 'Achaemenid Empire',              nombreES: 'Imperio aqueménida' },
  { nombreEN: 'Kingdom of David and Solomon',   nombreES: 'Reino unido de Israel' },
  { nombreEN: 'Kush',                           nombreES: 'Reino de Kush' },
]

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
            <span className="ml">Ref:</span>
            {h.referencias.map(r => <a key={r} className="ref" href={`https://www.biblegateway.com/passage/?search=${encodeURIComponent(r)}&version=RVR1960`} target="_blank" rel="noopener noreferrer">{r}</a>)}
          </div>
        )}
      </div>
    </div>
  )
}

function PersonajeCard({ p }: { p: Personaje }) {
  return (
    <div className="person-card">
      <div className="person-head">
        <div className="avatar">{p.emoji}</div>
        <div>
          <div className="pname">{p.nombre}</div>
          <div className="prole">{p.rol} · {p.periodo}</div>
        </div>
      </div>
      <div className="story-body">
        <p className="desc">{p.descripcion}</p>
        {p.referencias.length > 0 && (
          <div className="meta">
            <span className="ml">Ref:</span>
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
      <div id="panel-nav"><span className="nav-note">Mapa Interactivo AT</span></div>
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
          <div className="menu-item menu-item-disabled">📖 Acerca del proyecto</div>
          <div className="menu-item menu-item-disabled">📚 Fuentes consultadas</div>
          <div className="menu-item menu-item-disabled">❓ Cómo usar el mapa</div>
        </div>
        <div className="menu-section-label">Información</div>
        <div className="menu-list">
          <div className="menu-item menu-item-disabled">✍ Créditos</div>
          <div className="menu-item menu-item-muted">Más mapas — próximamente</div>
        </div>
      </div>
      <div id="panel-nav"><span className="nav-note">Mapa Interactivo AT</span></div>
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
      <div id="panel-nav"><span className="nav-note">Mapa Interactivo AT</span></div>
    </>
  )
}

export default function App() {
  const [selected, setSelected] = useState<Lugar | null>(null)
  const [selectedRuta, setSelectedRuta] = useState<RutaSeleccionada | null>(null)
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
    setMenuOpen(false)
    setDrawerOpen(true)
    setPanelCollapsed(false)
  }, [])

  const handleSelectRuta = useCallback((ruta: RutaSeleccionada) => {
    setSelectedRuta(ruta)
    setActiveViajeIdx(ruta.viajeIdx ?? 0)
    setSelected(null)
    setMenuOpen(false)
    setDrawerOpen(true)
    setPanelCollapsed(false)
  }, [])

  const closeAll = () => { setDrawerOpen(false); setMenuOpen(false); setSelectedRuta(null); setActiveViajeIdx(0) }

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

  const handleSearchSelectTerritorio = useCallback(() => {
    setTerritoriosActive(true)
    setPeriodId(prev => prev === 'todos' ? 'hierro_2' : prev)
  }, [])

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
  const [flyToTarget, setFlyToTarget] = useState<{lat: number, lng: number} | null>(null)
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
                  else if (first.kind === 'territorio') { handleSearchSelectTerritorio(); setSearchQuery("") }
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
                    <button key={'ter-' + r.nombreEN} className="search-result" onClick={() => { handleSearchSelectTerritorio(); setSearchQuery("") }}>
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
          <button className={`layer-btn${territoriosActive ? ' active' : ''}`} aria-pressed={territoriosActive} onClick={() => setTerritoriosActive(a => !a)} title="Mostrar territorios históricos">🗺 Territorios</button>
          <button className={`layer-btn${rutasActive ? ' active' : ''}`} aria-pressed={rutasActive} onClick={() => setRutasActive(a => !a)} title="Mostrar rutas de personajes">🚶 Rutas</button>
        </div>
      </div>
      <div id="main">
        <div id="map-wrap">
          <MapView
            onSelectLugar={handleSelect}
            onSelectRuta={handleSelectRuta}
            flyToTarget={flyToTarget}
            selectedId={selected?.id}
            periodId={periodId}
            territoriosActive={territoriosActive}
            rutasActive={rutasActive}
            selectedPersonaje={selectedRuta?.personajeId}
            selectedViajeIdx={activeViajeIdx}
          />
        </div>
        <div id="panel" className={[drawerOpen ? 'drawer-open' : '', (!isMobile && panelCollapsed) ? 'panel-collapsed' : ''].filter(Boolean).join(' ')} style={drawerStyle}>
          {selectedRuta ? (
            <PanelRuta ruta={selectedRuta} lugares={lugares} onClose={closeAll} onSelectLugar={handleSelect} activeViajeIdx={activeViajeIdx} onNavigateViaje={setActiveViajeIdx} />
          ) : selected ? (
            <Panel key={selected.id} lugar={selected} periodId={periodId} onClose={closeAll} />
          ) : (
            <>
              <DrawerHeader title="Selecciona un lugar" onClose={closeAll} />
              <div id="panel-body">
                <div id="panel-empty">
                  <div style={{ fontSize: 28 }}>🗺</div>
                  <div id="panel-empty-text">Explora los lugares<br />del Antiguo Testamento</div>
                </div>
              </div>
            </>
          )}
        </div>
        <button id="panel-toggle" className={panelCollapsed ? 'collapsed' : ''} onClick={() => setPanelCollapsed(c => !c)} aria-label={panelCollapsed ? 'Abrir panel' : 'Cerrar panel'}>
          {panelCollapsed ? '◀' : '▶'}
        </button>
        <div id="menu-drawer" className={menuOpen ? 'drawer-open' : ''} style={drawerStyle}>
          <MenuNav lastPlace={selected} onGoToPlace={goToLastPlace} onClose={closeAll} />
        </div>
        {showOverlay && <div id="drawer-overlay" className={window.innerWidth >= 769 ? 'desktop-active' : ''} onClick={closeAll} />}
      </div>
    </div>
  )
}
