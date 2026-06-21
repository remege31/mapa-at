# DOCUMENTO TÉCNICO DE REFERENCIA
## Mapa Interactivo · Antiguo Testamento — Fase 2
### Para Diseñador y Programador · Estado real auditado · Junio 2026

---

## 1. STACK Y ARQUITECTURA

- **Frontend:** React + TypeScript + Vite
- **Mapa:** Leaflet.js, tile base CartoDB `light_nolabels`
- **Despliegue:** Vercel (`mapa-at.vercel.app`)
- **Repo:** `github.com/remege31/mapa-at` (SSH, ed25519)
- **Estructura de archivos:**
  ```
  src/
    App.tsx          → toda la UI (topbar, timeline, controles, panel, menú, búsqueda)
    App.css          → estilos globales
    main.tsx
    types/lugar.ts    → tipos de datos
    data/eventosParalelos.ts → eventos paralelos globales
    components/MapView.tsx   → mapa Leaflet (pines + territorios + rutas)
  public/data/
    index.json        → lista de IDs de lugares cargados dinámicamente
    *.json            → 49 JSONs de lugar (5 MVP + 44 fase_1/fase_2)
  ```
- Dev local: `npm run dev` → `http://localhost:5173`

---

## 2. LAYOUT GENERAL

```
┌─────────────────────────────────────────────┐
│ #topbar (fondo --ink)  título + 🔍 + ☰ menú  │
├─────────────────────────────────────────────┤
│ #timeline-bar → Todos + 4 botones período    │
├─────────────────────────────────────────────┤
│ #layers-row → 🗺 Territorios | 🚶 Rutas      │
├──────────────────────────────┬───────────────┤
│                              │               │
│  #map-wrap (flex:1)          │  #panel       │
│  Leaflet map                 │  (340px,      │
│                              │   desktop)    │
└──────────────────────────────┴───────────────┘
```

- **Desktop:** mapa flex-1 + panel fijo 340px a la derecha
- **Tablet (769–1024px):** panel/menú a `60vw` (máx 480px)
- **Mobile (≤768px):** panel y menú son drawers fijos (`92vw`, máx 360px) desde la derecha (`translateX`, 0.3s), con overlay oscuro (`rgba(0,0,0,.38)`) y header con botón ✕
- En desktop, el menú lateral (☰) también es un drawer con overlay (`rgba(0,0,0,.18)`)
- `drawerTop` se calcula dinámicamente (altura topbar + timeline) para posicionar los drawers

---

## 3. CONTROLES DEL MAPA

**Filtro de período** (`#period-btns`) — 5 botones, uno siempre activo (default `todos`):

| ID | Nombre | Rango |
|---|---|---|
| `todos` | Todos los períodos | — |
| `bronce_tardio` | Edad de Bronce Tardía | 1500–1200 a.C. |
| `hierro_1` | Edad de Hierro I | 1200–1000 a.C. |
| `hierro_2` | Edad de Hierro II | 1000–586 a.C. |
| `post_exilio` | Post-Exilio | 586–400 a.C. |

- Con `todos`: todos los pines visibles y activos (ninguno atenuado). Los eventos paralelos muestran mensaje "Selecciona un período para ver eventos paralelos".
- Botón activo: nombre completo (sin rango si `range` es vacío). En mobile, scroll horizontal sin scrollbar visible.

**Fila de capas** (`#layers-row`):
- **🗺 Territorios** — toggle on/off (default **OFF**). Afecta polígonos del período activo (ignorado en modo `todos`, que no tiene GeoJSON propio)
- **🚶 Rutas** — toggle on/off activo. Muestra rutas de personajes por período activo

**El filtro de período afecta:**
1. La capa de territorios (polígonos + etiquetas, fade 300ms)
2. Los pines: si `periodos_at` no incluye el período activo, el pin se atenúa (`opacity:0.25`) y se desactiva el click. Con `todos`, ningún pin se atenúa.
3. Los eventos paralelos en el panel (vacíos con mensaje en modo `todos`)

---

## 4. BÚSQUEDA EN TOPBAR

- Input visible en topbar junto al título. Icono 🔍 a la izquierda del campo.
- Activa con 2+ caracteres, busca por `nombre` (case-insensitive), muestra hasta 6 resultados en dropdown
- Enter selecciona el primer resultado
- Click en resultado → `handleSelect(lugar)` → abre panel
- Dropdown desaparece al seleccionar o borrar el input

---

## 5. PINES (MapView.tsx)

- Tamaño uniforme, radio base `r=6`, escala con zoom: `clamp(0.6, (zoom-3)/4, 1.6)`
- Colores: default `#3C3C3C` (--ink) · seleccionado `#8B4A26` (--terra) con halo 3px
- Etiqueta de nombre permanente bajo el pin, con halo de texto (`text-shadow`) para legibilidad
- **Zoom progresivo por jerarquía:**
  - `primario` (nivel 1): siempre visible
  - `secundario` (nivel 2): visible desde zoom ≥ 6
  - `terciario` (nivel 3): visible desde zoom ≥ 8
- **Collision avoidance:** si dos pines no-primarios están a menos de 52px, la etiqueta del secundario se oculta
- **Pines atenuados:** `opacity: 0.25`, sin click, si `periodos_at` no incluye el período activo (excepto en modo `todos`)
- **z-index:** pin seleccionado → `zIndexOffset: 2000`; primario → 1000; secundario → 500; terciario → 100
- **Jerusalén:** marca `★`, animación de pulso + tooltip "Toca para explorar" — solo mobile, hasta el primer click
- Accesibilidad: `tabindex`, `role="button"`, `aria-label`, `onkeydown` (Enter/Space) en pines activos ✅

---

## 6. TERRITORIOS HISTÓRICOS (MapView.tsx)

- Fuente: `aourednik/historical-basemaps` (GeoJSON, GPL-3.0), 3 datasets:
  - `world_bc1500.geojson` → `bronce_tardio`
  - `world_bc1000.geojson` → `hierro_1` y `hierro_2`
  - `world_bc500.geojson` → `post_exilio`
  - ⚠ No hay dataset entre bc1500 y bc1000 — limitación aceptada y documentada
- Recorte a región de interés: lat 20–42, lng 25–55
- **Color y categoría política por territorio:** diccionarios `TERRITORY_COLORS` y `TERRITORY_TYPE` en `MapView.tsx`, ~32 territorios cubiertos + `default: #8B7355`
- Categorías: Imperio, Reino, Región cultural, Zona tribal
- **Traducción al español:** `TERRITORY_NAMES_ES`, cobertura completa
- Render: `fillOpacity: 0.18`, `opacity: 0.85`, con `className="territorio-shape"` (transición CSS 300ms)
- **Etiqueta por territorio:** nombre (ES) + categoría política, Georgia, halo blanco
  - Tamaño: 7px (zoom<6) · 9px (zoom=6) · 11px (zoom≥7)
  - Categoría política solo visible desde zoom≥6
- **Animación fade in/out** (300ms) — implementada con `setTimeout` + control de requests obsoletos (`requestIdRef`)
- `interactive: false` en la capa GeoJSON — los clicks pasan a través al mapa

---

## 7. RUTAS DE PERSONAJES (MapView.tsx)

- Activadas con botón **🚶 Rutas** (toggle, default OFF) ✅
- Polilíneas `dashArray: '6 4'`, color individual por personaje (paleta en `PERSONAJE_COLORS`)
- Etiqueta con nombre del personaje a mitad de la ruta
- Filtradas por `periodos_at` del lugar: solo personajes de lugares activos en el período
- Waypoints de lugares sin JSON propio definidos en `WAYPOINTS` (ur, haran, madian, etc.)
- Personajes con paleta definida: Abraham, Moisés, José, David, Jeremías, Daniel, Ezequiel, Elías, Miriam, Josué, Débora, Salomón

---

## 8. PANEL LATERAL — 5 ACORDEONES

Acordeones **exclusivos** (solo uno abierto a la vez), cerrados por defecto. Header con ✕ (mobile). Fade inferior si hay overflow de scroll.

### 📍 1. Lugar
- Grid 2 columnas: Altitud · Tipo (Ciudad/Territorio/Región natural)
- Clima, Geografía (`descripcion_geo`), Importancia estratégica — todo texto corrido
- Recursos: lista (`<ul>`)
- Otros habitantes: lista nombre + descripción, **sin interactividad**

### 📖 2. Historias
- Card por historia: título (Georgia) + fecha, descripción, referencias bíblicas como `<a href>` a Bible Gateway ✅

### 👤 3. Personajes
- Card por personaje: avatar circular con emoji, nombre + rol/período, descripción, hasta 3 referencias como `<a href>` a Bible Gateway ✅
- `ruta: string[]` existe en datos pero sin botón de ruta individual en UI

### ✡ 4. Contexto religioso
- Bloque de contexto general (`ctx-block`)
- Lista de religiones presentes
- Por mito: checkboxes ✡/✝/☪ según `aparece_en`; por cada tradición, bloque con descripción + fuente, o *"No aplica directamente en esta tradición"* si es `null`
- Diferencias/similitudes como tags truncados a 70 caracteres

### 🌍 5. Eventos paralelos
- Si `periodId === 'todos'`: mensaje "Selecciona un período histórico para ver eventos paralelos"
- Si período activo: banner con nombre + rango del período, luego cards filtradas de `EVENTOS_PARALELOS_GLOBAL`
- Cada card: emoji + civilización + período histórico, evento + descripción

---

## 9. MENÚ LATERAL (☰)

Drawer independiente del panel de lugar:
- Botón destacado "última consulta" (o Jerusalén por defecto) → navega al panel de ese lugar
- Secciones "El mapa" y "Información" — **todos los items actualmente deshabilitados**

---

## 10. CARGA DE DATOS

- `index.json` en `/public/data/` contiene el array de IDs de lugares
- Al iniciar, `App.tsx` y `MapView.tsx` cargan `index.json` y luego cada JSON individualmente
- 49 lugares cargados: 5 MVP + 17 fase_1 + 27 fase_2
- Los JSONs con PENDIENTE son cargados pero sus pines renderizan igual — el panel muestra campos vacíos

---

## 11. ESTADO INICIAL DE LA APP

- `periodId`: `'todos'` — todos los pines visibles al abrir
- `menuOpen`: `true` en desktop — menú lateral abierto por defecto
- Zoom inicial del mapa: `9`
- Centro inicial: `[31.8, 35.5]` (Israel/Cisjordania)
- `territoriosActive`: `false`
- `rutasActive`: `false`

---

## 12. ESTRUCTURA DE DATOS

Ver `estructura_json_at` (documento separado). Resumen de campos clave:

- `periodos_at: string[]` → controla filtrado real de pines
- `jerarquia_pin` → campo **intencional**, controla visibilidad por zoom (primario/secundario/terciario)
- `otros_habitantes` → pueblos (id, nombre, descripción, religión, período)
- `personajes[].ruta` → siempre array, `[]` si no aplica
- `contexto_religioso.mitos[].aparece_en` → objeto de booleanos que controla checkboxes
- Eventos paralelos en `src/data/eventosParalelos.ts`, no en JSON de lugar

---

## 13. PALETA Y TIPOGRAFÍA

```css
--ocre:   #775C3C
--beige:  #D4C5B0
--terra:  #8B4A26
--sand:   #E8DCC8
--gray:   #6B6054
--blue:   #2E5F8A
--ink:    #3C3C3C
--paper:  #F5F0E8
```
⚠ `--olive`, `--lblue`, `--gray-on-dark` definidas pero sin uso detectado.

**Tipografía:**
- Georgia (serif): títulos de drawer, nombres historia/personaje/mito, etiquetas de territorio
- system-ui (sans): cuerpo, UI, pines

---

## 14. PENDIENTES TÉCNICOS (Fase 3)

| Ítem | Estado |
|---|---|
| Verificación arqueológica de `periodos_at` (I2) | Fase 3 |
| Completar 16 JSONs con PENDIENTE (lotes pendientes) | Fase 3 |
| Drawer swipe gesture mobile (3 posiciones) | Fase 3 |
| Botón de ruta por personaje individual | Fase 3 |
| Fix scroll horizontal al activar Territorios | Identificado, no resuelto |
| Variables CSS sin uso (`--olive`, `--lblue`, `--gray-on-dark`) | Revisar/limpiar |

---

## Resumen de cambios Fase 1 → Fase 2

- ✅ Búsqueda de lugares en topbar (input + dropdown)
- ✅ Botón "Todos los períodos" — muestra todos los pines sin filtro
- ✅ Estado inicial: `todos`, zoom 9, centro Israel, menú abierto
- ✅ Zoom progresivo por `jerarquia_pin` (primario siempre, secundario ≥6, terciario ≥8)
- ✅ Rutas de personajes activadas (🚶 Rutas funcional, con colores por personaje y etiquetas)
- ✅ Referencias bíblicas como links a Bible Gateway
- ✅ Accesibilidad por teclado en pines
- ✅ Carga dinámica de 49 lugares desde `index.json`
- ✅ Contenido completo: 31 de 49 JSONs con 3 historias/personajes (Lotes A–F completados; 16 con PENDIENTE)
- ✅ Collision avoidance de etiquetas entre pines cercanos
- ✅ z-index 2000 en pin seleccionado
