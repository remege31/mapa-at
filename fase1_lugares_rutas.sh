#!/bin/bash
set -e
BASE="/Users/rebeca/Documents/Claude/mapa-at"
cd "$BASE"

echo "=== 1. Copiar fase_1 y fase_2 a public/data/ ==="
cp fase_1/*.json public/data/
cp fase_2/*.json public/data/
echo "JSONs en public/data: $(ls public/data/*.json | wc -l | tr -d ' ')"

echo ""
echo "=== 2. Corregir hebrón→hebron y belen→bethlehem en jerusalen.json ==="
node << 'EOF'
const fs = require('fs');
const f = 'public/data/jerusalen.json';
let c = fs.readFileSync(f, 'utf8');
c = c.replace('"hebrón"', '"hebron"');
c = c.replace('"belen"', '"bethlehem"');
fs.writeFileSync(f, c);
console.log('jerusalen.json corregido');
EOF

echo ""
echo "=== 3. Actualizar MapView.tsx ==="
node << 'EOF'
const fs = require('fs');
let c = fs.readFileSync('src/components/MapView.tsx', 'utf8');

// 3a. Reemplazar LUGAR_IDS con los 49 lugares
const OLD_IDS = "const LUGAR_IDS = ['jerusalen', 'egipto', 'mesopotamia', 'canaan', 'sinai'] as const";
const NEW_IDS = `const LUGAR_IDS = [
  // MVP original
  'jerusalen', 'egipto', 'mesopotamia', 'canaan', 'sinai',
  // fase_1
  'ammon', 'babylon', 'bethel', 'bethlehem', 'damascus', 'dan',
  'gath', 'gibeah', 'gibeon', 'hebron', 'jericho', 'mizpah',
  'samaria', 'shechem', 'sidon', 'sodom', 'tyre',
  // fase_2
  'ai', 'anathoth', 'ashdod', 'beersheba', 'beth_shemesh', 'carmel',
  'debir', 'ekron', 'gaza', 'geba', 'gezer', 'gomorrah', 'hamath',
  'heshbon', 'jabesh', 'jezreel', 'keilah', 'kiriath_jearim', 'lachish',
  'libnah', 'nineveh', 'ramah', 'ramoth', 'shiloh', 'susa', 'tarshish', 'ziklag',
] as const`;
if (!c.includes(OLD_IDS)) { console.error('LUGAR_IDS no encontrado'); process.exit(1); }
c = c.replace(OLD_IDS, NEW_IDS);

// 3b. Añadir WAYPOINTS después de PIN
const OLD_PIN = "// Pin único tamaño — sin jerarquía visual\nconst PIN = { r: 6, fill: '#3C3C3C', stroke: '#fff', labelSize: 9 }";
const NEW_PIN = `// Pin único tamaño — sin jerarquía visual
const PIN = { r: 6, fill: '#3C3C3C', stroke: '#fff', labelSize: 9 }

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
}`;
if (!c.includes(OLD_PIN)) { console.error('PIN no encontrado'); process.exit(1); }
c = c.replace(OLD_PIN, NEW_PIN);

fs.writeFileSync('src/components/MapView.tsx', c);
console.log('MapView.tsx: LUGAR_IDS + WAYPOINTS OK');
EOF

echo ""
echo "=== 4. Actualizar App.tsx: activar botón Rutas + estado rutasActive ==="
node << 'EOF'
const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

// 4a. Añadir estado rutasActive
const OLD_STATE = "  const [territoriosActive, setTerritoriosActive] = useState(false)";
const NEW_STATE = `  const [territoriosActive, setTerritoriosActive] = useState(false)
  const [rutasActive, setRutasActive] = useState(false)`;
if (!c.includes(OLD_STATE)) { console.error('estado territoriosActive no encontrado'); process.exit(1); }
c = c.replace(OLD_STATE, NEW_STATE);

// 4b. Pasar rutasActive a MapView
const OLD_MAP = "          territoriosActive={territoriosActive}";
const NEW_MAP = `          territoriosActive={territoriosActive}
            rutasActive={rutasActive}`;
if (!c.includes(OLD_MAP)) { console.error('prop territoriosActive no encontrada'); process.exit(1); }
c = c.replace(OLD_MAP, NEW_MAP);

// 4c. Activar botón Rutas
const OLD_BTN = '          <button className="layer-btn layer-btn-disabled" disabled title="Próximamente">🚶 Rutas</button>';
const NEW_BTN = '          <button className={`layer-btn${rutasActive ? \' active\' : \'\'}`} onClick={() => setRutasActive(a => !a)} title="Mostrar rutas de personajes">🚶 Rutas</button>';
if (!c.includes(OLD_BTN)) { console.error('botón Rutas no encontrado'); process.exit(1); }
c = c.replace(OLD_BTN, NEW_BTN);

fs.writeFileSync('src/App.tsx', c);
console.log('App.tsx: rutasActive + botón OK');
EOF

echo ""
echo "=== 5. Añadir lógica de polylines en MapView.tsx ==="
node << 'EOF'
const fs = require('fs');
let c = fs.readFileSync('src/components/MapView.tsx', 'utf8');

// 5a. Añadir rutasActive a la interfaz MapViewProps
const OLD_PROPS = `interface MapViewProps {
  onSelectLugar: (lugar: Lugar) => void
  selectedId?: string
  periodId?: string
  territoriosActive?: boolean
}`;
const NEW_PROPS = `interface MapViewProps {
  onSelectLugar: (lugar: Lugar) => void
  selectedId?: string
  periodId?: string
  territoriosActive?: boolean
  rutasActive?: boolean
}`;
if (!c.includes(OLD_PROPS)) { console.error('MapViewProps no encontrado'); process.exit(1); }
c = c.replace(OLD_PROPS, NEW_PROPS);

// 5b. Añadir rutasActive al destructuring
const OLD_DEST = `export function MapView({
  onSelectLugar,
  selectedId,
  periodId = 'hierro_2',
  territoriosActive = false,
}: MapViewProps) {`;
const NEW_DEST = `export function MapView({
  onSelectLugar,
  selectedId,
  periodId = 'hierro_2',
  territoriosActive = false,
  rutasActive = false,
}: MapViewProps) {`;
if (!c.includes(OLD_DEST)) { console.error('destructuring MapView no encontrado'); process.exit(1); }
c = c.replace(OLD_DEST, NEW_DEST);

// 5c. Añadir ref de polylines y useEffect de rutas antes del return
const OLD_RETURN = `  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', background: '#EDE8DF' }}
    />
  )
}`;
const NEW_RETURN = `  // ─── Rutas de personajes ─────────────────────────────────────────────────
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

    const group = L.layerGroup()
    const RUTA_COLOR = '#8B4A26'

    lugares.forEach(lugar => {
      const periodosAt: string[] = (lugar as any).periodos_at ?? []
      if (!periodosAt.includes(periodId)) return
      ;(lugar.personajes ?? []).forEach(p => {
        const pts = (p.ruta ?? [])
          .filter((id: string) => coordMap[id])
          .map((id: string) => coordMap[id] as [number, number])
        if (pts.length < 2) return
        L.polyline(pts, {
          color: RUTA_COLOR,
          weight: 2,
          opacity: 0.75,
          dashArray: '6 4',
        }).addTo(group)
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
}`;
if (!c.includes(OLD_RETURN)) { console.error('return final no encontrado'); process.exit(1); }
c = c.replace(OLD_RETURN, NEW_RETURN);

fs.writeFileSync('src/components/MapView.tsx', c);
console.log('MapView.tsx: polylines OK');
EOF

echo ""
echo "=== Verificación ==="
echo "JSONs en public/data: $(ls public/data/*.json | wc -l | tr -d ' ')"
grep -c "rutasActive" src/App.tsx && echo "rutasActive en App.tsx OK"
grep -c "rutasActive" src/components/MapView.tsx && echo "rutasActive en MapView.tsx OK"
grep -c "WAYPOINTS" src/components/MapView.tsx && echo "WAYPOINTS OK"
grep -c "polyline" src/components/MapView.tsx && echo "polylines OK"

echo ""
echo "=== Commit y push ==="
git add public/data/ src/App.tsx src/components/MapView.tsx
git commit -m "feat: 49 lugares (fase_1+fase_2), rutas de personajes con polylines y waypoints"
git push

echo ""
echo "✓ Listo"
