import { useState, useCallback, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { MapView } from './components/MapView'
import type {
  Lugar,
  Historia,
  Personaje,
  Mito,
  EventoParalelo,
} from './types/lugar'
import './App.css'

const PERIODS = [
  { min: -1500, max: -1200, name: 'Edad de Bronce Tardía · 1500–1200 a.C.' },
  { min: -1200, max: -1000, name: 'Edad de Hierro I · 1200–1000 a.C.' },
  { min: -1000, max: -586,  name: 'Edad de Hierro II · 1000–586 a.C.' },
  { min: -586,  max: -400,  name: 'Post-Exilio · 586–400 a.C.' },
]

function getPeriodName(year: number): string {
  return PERIODS.find(p => year >= p.min && year <= p.max)?.name ?? PERIODS[2].name
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
            {h.referencias.map(r => <span key={r} className="ref">{r}</span>)}
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
            {p.referencias.slice(0, 3).map(r => <span key={r} className="ref">{r}</span>)}
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

function Panel({ lugar, year, onClose }: { lugar: Lugar; year: number; onClose: () => void }) {
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
            <div><div className="gl">Tipo</div><div className="gv">{tipoLabel}</div></div>
          </div>
          <div className="sec-label" style={{ marginTop: 0 }}>Clima</div>
          <p className="desc">{lugar.clima}</p>
          <div className="sec-label">Geografía</div>
          <p className="desc">{lugar.descripcion_geo}</p>
          <div className="sec-label">Importancia estratégica</div>
          <p className="desc">{lugar.importancia_estrategica}</p>
          {lugar.recursos.length > 0 && (<>
            <div className="sec-label">Recursos</div>
            <ul className="resource-list">{lugar.recursos.map(r => <li key={r}>{r}</li>)}</ul>
          </>)}
          {lugar.otros_habitantes.length > 0 && (<>
            <div className="sec-label">Otros habitantes</div>
            <div className="hab-list">
              {lugar.otros_habitantes.map((h, i) => (
                <div key={h.id} className="hab-row" style={i === lugar.otros_habitantes.length - 1 ? { borderBottom: 'none' } : {}}>
                  <div className="hab-name">{h.nombre}</div>
                  <div className="hab-desc">{h.descripcion}</div>
                </div>
              ))}
            </div>
          </>)}
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
          <div className="per-banner">
            <div>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink)' }}>{getPeriodName(year)}</div>
              <div style={{ fontSize: 10, color: 'var(--gray)' }}>Cambia con el timeline</div>
            </div>
            <span className="ptag">{Math.abs(year)} a.C.</span>
          </div>
          {lugar.eventos_paralelos.map(e => <EventoCard key={e.civilizacion} e={e} />)}
        </Acc>
        
      </div></div>
      {showFade && <div className="panel-scroll-fade" />}
      <div id="panel-nav"><span className="nav-note">Mapa Interactivo AT · MVP v1</span></div>
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
      <div id="panel-nav"><span className="nav-note">Mapa Interactivo AT · MVP v1</span></div>
    </>
  )
}

async function loadJerusalen(): Promise<Lugar | null> {
  try {
    const res = await fetch('/data/jerusalen.json')
    return await res.json()
  } catch { return null }
}

export default function App() {
  const [selected, setSelected] = useState<Lugar | null>(null)
  const [year, setYear] = useState(-950)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(() => window.innerWidth >= 769)
  const [timelineActive, setTimelineActive] = useState(true)
  const [drawerTop, setDrawerTop] = useState(82)

  const topbarRef = useRef<HTMLDivElement>(null)
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
    setSelected(l)
    setMenuOpen(false)
    setDrawerOpen(true)
  }, [])

  const closeAll = () => { setDrawerOpen(false); setMenuOpen(false) }
  const openMenu = () => { setDrawerOpen(false); setMenuOpen(true) }
  const goToLastPlace = async () => {
    if (selected) {
      setMenuOpen(false)
      setDrawerOpen(true)
    } else {
      const jer = await loadJerusalen()
      if (jer) setSelected(jer)
      setMenuOpen(false)
      setDrawerOpen(true)
    }
  }
  const isMobile = window.innerWidth < 769
  const anyOpen = menuOpen || (drawerOpen && isMobile)

  const drawerStyle = { top: `${drawerTop}px` }

  return (
    <div id="app">
      <div id="topbar" ref={topbarRef}>
        <span id="topbar-title">Mapa Interactivo · Antiguo Testamento</span>
        <button id="topbar-menu-btn" onClick={openMenu} aria-label="Menú">
          <HamburgerIcon />
        </button>
      </div>
      <div id="timeline-bar" ref={timelineRef}>
        <span className="tl-label">Período</span>
        <input type="range" min={-1500} max={-400} value={year} step={10} id="timeline" onChange={e => setYear(Number(e.target.value))} disabled={!timelineActive} style={{opacity: timelineActive ? 1 : 0.35}} />
        <button id="timeline-eye" onClick={() => setTimelineActive(a => !a)} aria-label="Activar/desactivar filtro de período" title={timelineActive ? "Desactivar filtro temporal" : "Activar filtro temporal"}>{timelineActive ? "👁" : "🙈"}</button>
          <div id="period-wrap" style={{opacity: timelineActive ? 1 : 0.35}}>
          <span id="period-name">{getPeriodName(year)}</span>
          <span id="period-year">← año: {Math.abs(year)} a.C.</span>
        </div>
      </div>
      <div id="main">
        <div id="map-wrap">
          <MapView onSelectLugar={handleSelect} selectedId={selected?.id} year={year} timelineActive={timelineActive} />
        </div>
        <div id="panel" className={drawerOpen ? 'drawer-open' : ''} style={drawerStyle}>
          {selected ? (
            <Panel key={selected.id} lugar={selected} year={year} onClose={closeAll} />
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
        <div id="menu-drawer" className={menuOpen ? 'drawer-open' : ''} style={drawerStyle}>
          <MenuNav lastPlace={selected} onGoToPlace={goToLastPlace} onClose={closeAll} />
        </div>
        {anyOpen && <div id="drawer-overlay" className={window.innerWidth >= 769 ? "desktop-active" : ""} onClick={closeAll} />}
      </div>
    </div>
  )
}
