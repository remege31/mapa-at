# DOCUMENTO TÉCNICO DE REFERENCIA
## Mapa Interactivo · Antiguo Testamento — MVP Fase 1
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
    App.tsx          → toda la UI (topbar, timeline, controles, panel, menú)
    App.css          → estilos globales
    main.tsx
    types/lugar.ts    → tipos de datos
    data/eventosParalelos.ts → eventos paralelos globales
    components/MapView.tsx   → mapa Leaflet (pines + territorios)
  public/data/
    jerusalen.json, canaan.json, mesopotamia.json, egipto.json, sinai.json
  ```
- Dev local: `npm run dev` → `http://localhost:5173`

---

## 2. LAYOUT GENERAL

```
┌─────────────────────────────────────────────┐
│ #topbar (38px, fondo --ink)                  │ ← título + ☰ menú
├─────────────────────────────────────────────┤
│ #timeline-bar → 4 botones de período         │
├─────────────────────────────────────────────┤
│ #layers-row → 🗺 Territorios | 🚶 Rutas      │
├──────────────────────────────┬───────────────┤
│                                │               │
│  #map-wrap (flex:1)           │  #panel       │
│  Leaflet map                  │  (340px,      │
│                                │   desktop)    │
│                                │               │
└──────────────────────────────┴───────────────┘
```

- **Desktop:** mapa flex-1 + panel fijo 340px a la derecha
- **Tablet (769–1024px):** panel/menú a `60vw` (máx 480px)
- **Mobile (≤768px):** panel y menú son drawers fijos (`92vw`, máx 360px) que entran desde la derecha (`translateX`, 0.3s), con overlay oscuro (`rgba(0,0,0,.38)`) y header con botón ✕
- En desktop, el menú lateral (☰) también es un drawer con overlay (`rgba(0,0,0,.18)`)
- `drawerTop` se calcula dinámicamente (altura topbar + timeline) para posicionar los drawers

---

## 3. CONTROLES DEL MAPA

**Filtro de período** (`#period-btns`) — 4 botones fijos, uno siempre activo (default `hierro_2`):

| ID | Nombre | Rango |
|---|---|---|
| `bronce_tardio` | Edad de Bronce Tardía | 1500–1200 a.C. |
| `hierro_1` | Edad de Hierro I | 1200–1000 a.C. |
| `hierro_2` | Edad de Hierro II | 1000–586 a.C. |
| `post_exilio` | Post-Exilio | 586–400 a.C. |

Botón activo: nombre completo + rango. Inactivos: solo nombre. En mobile, scroll horizontal sin scrollbar visible.

**Fila de capas** (`#layers-row`):
- **🗺 Territorios** — toggle on/off (default **OFF**). Activa la capa de polígonos históricos
- **🚶 Rutas** — presente pero `disabled`, "Próximamente". Sin funcionalidad

**El filtro de período afecta:**
1. La capa de territorios (polígonos + etiquetas, fade 300ms)
2. Los pines de lugares: si `periodos_at` del lugar no incluye el período activo, el pin se atenúa (`opacity:0.25`) y se desactiva el click
3. Los eventos paralelos mostrados en el panel (`periodo_at.includes(periodId)`)

---

## 4. PINES (MapView.tsx)

- Tamaño uniforme, radio base `r=6`, escala con zoom: `clamp(0.6, (zoom-3)/4, 1.6)`
- Colores: default `#3C3C3C` (--ink) · seleccionado `#8B4A26` (--terra) con halo 3px
- Etiqueta de nombre permanente bajo el pin, con halo de texto (`text-shadow`) para legibilidad
- **Jerusalén:** marca `★`, animación de pulso + tooltip "Toca para explorar" — solo mobile, hasta el primer click (onboarding)
- Click → `onSelectLugar(lugar)` → abre panel
- ⚠ **Pendiente:** accesibilidad por teclado (tabindex, role="button", aria-label) — no implementada
- ❌ No hay hover effect (scale/shadow) — no implementado, no es un requisito confirmado actualmente

---

## 5. TERRITORIOS HISTÓRICOS (MapView.tsx)

- Fuente: `aourednik/historical-basemaps` (GeoJSON, GPL-3.0), 3 datasets:
  - `world_bc1500.geojson` → `bronce_tardio`
  - `world_bc1000.geojson` → `hierro_1` y `hierro_2` (comparten dataset)
  - `world_bc500.geojson` → `post_exilio`
- Recorte a región de interés: lat 20–42, lng 25–55
- **Color y categoría política por territorio** (no genérico): diccionarios `TERRITORY_COLORS` y `TERRITORY_TYPE` en `MapView.tsx`, ~32 territorios cubiertos + `default: #8B7355`
- Categorías políticas usadas: Imperio, Reino, Región cultural, Zona tribal
- **Traducción al español:** `TERRITORY_NAMES_ES`, cobertura completa de los ~32 territorios
- Render: `fillOpacity: 0.18`, `opacity: 0.85` (borde), con `className="territorio-shape"` (transición CSS 300ms)
- **Etiqueta por territorio:** nombre (ES) + categoría política, Georgia, halo blanco
  - Tamaño de fuente según zoom: 7px (zoom<6) · 9px (zoom=6) · 11px (zoom≥7)
  - Categoría política solo visible desde zoom≥6
- **Animación fade in/out** (300ms) al cambiar período o activar/desactivar capa — implementada con `setTimeout` + control de requests obsoletos (`requestIdRef`)

---

## 6. PANEL LATERAL — 5 ACORDEONES

Acordeones **exclusivos** (solo uno abierto a la vez), cerrados por defecto. Header con ✕ (mobile). Fade inferior si hay overflow de scroll.

### 📍 1. Lugar
- Grid 2 columnas: Altitud · Tipo (Ciudad/Territorio/Región natural)
- Clima, Geografía (`descripcion_geo`), Importancia estratégica — todo texto corrido
- Recursos: lista (`<ul>`)
- Otros habitantes: lista nombre + descripción, **sin interactividad** (sin click, sin resaltado de mapa)

### 📖 2. Historias
- Card por historia: título (Georgia) + fecha, descripción, referencias bíblicas como tags (`.ref`)
- ⚠ Referencias son texto plano, **no son links** todavía

### 👤 3. Personajes
- Card por personaje: avatar circular con emoji, nombre + rol/período, descripción, hasta 3 referencias
- `ruta: string[]` existe en datos pero **sin uso en UI** — no hay botón de ruta por personaje

### ✡ 4. Contexto religioso
- Bloque de contexto general (`ctx-block`)
- Lista de religiones presentes
- Por mito: checkboxes ✡/✝/☪ según `aparece_en`; por cada tradición, bloque con descripción + fuente, o *"No aplica directamente en esta tradición"* si es `null`
- Diferencias/similitudes como tags truncados a 70 caracteres

### 🌍 5. Eventos paralelos
- Banner con nombre + rango del período activo
- Cards filtradas de `EVENTOS_PARALELOS_GLOBAL` por `periodo_at.includes(periodId)` — ✅ implementado con datos reales
- Cada card: emoji + civilización + período histórico, evento + descripción

---

## 7. MENÚ LATERAL (☰)

Drawer independiente del panel de lugar:
- Botón destacado "última consulta" (o Jerusalén por defecto si no se ha seleccionado nada) → navega al panel de ese lugar
- Secciones "El mapa" y "Información" — **todos los items actualmente deshabilitados**: Acerca del proyecto, Fuentes consultadas, Cómo usar el mapa, Créditos, "Más mapas — próximamente"

---

## 8. ESTRUCTURA DE DATOS

Ver `estructura_json_at` (documento separado, reescrito desde `lugar.ts` + `jerusalen.json`). Resumen de campos clave:

- `periodos_at: string[]` → controla filtrado real de pines (no confundir con `periodos`, que es descriptivo)
- `jerarquia_pin` → campo **intencional** que controla visibilidad de pines por nivel (ver sección 12)
- `otros_habitantes` → pueblos (id, nombre, descripción, religión, período), sin relación con territorios del mapa
- `personajes[].ruta` → siempre array, `[]` si no aplica; sin `tiene_ruta`
- `contexto_religioso.mitos[].aparece_en` → objeto de booleanos que controla checkboxes
- Eventos paralelos viven en `src/data/eventosParalelos.ts`, no en los JSON de lugar

---

## 9. PALETA Y TIPOGRAFÍA

```css
--ocre:   #775C3C   /* títulos, fechas, etiquetas */
--beige:  #D4C5B0   /* bordes, fondos secundarios */
--terra:  #8B4A26   /* acentos, pin seleccionado, botón cerrar */
--sand:   #E8DCC8   /* fondos de card/headers */
--gray:   #6B6054   /* texto secundario */
--blue:   #2E5F8A   /* referencias bíblicas */
--ink:    #3C3C3C   /* texto principal, topbar, pin default */
--paper:  #F5F0E8   /* fondo general */
```
⚠ `--olive`, `--lblue`, `--gray-on-dark` definidas pero sin uso detectado — revisar si se necesitan o limpiar.

**Tipografía:**
- Georgia (serif): títulos de drawer, nombres de historia/personaje/mito, etiquetas de territorio
- system-ui (sans): cuerpo, UI, pines
- Escala: 9px (labels uppercase) · 10px (meta/refs) · 11px (cuerpo) · 13px (títulos card) · 14px (header drawer) · 15px (topbar)

---

## 10. PENDIENTES CONFIRMADOS (no especulativos)

| Ítem | Estado |
|---|---|
| Referencias bíblicas como links a Bible Gateway | Formato de dato OK; falta `<a href>` |
| Botón de ruta por personaje + visualización en mapa | No implementado (toggle global "Rutas" deshabilitado) |
| Accesibilidad por teclado en pines | No confirmada/implementada |
| Variables CSS sin uso (`--olive`, `--lblue`, `--gray-on-dark`) | Revisar necesidad o limpiar |
| `jerarquia_pin` en datos | Decisión tomada — ver sección 11 |

---

## 11. JERARQUÍA DE PINES — DECISIÓN TOMADA (junio 2026)

- `jerarquia_pin` es un campo **intencional**, no legacy. Controla qué pines se renderizan según nivel.
- **Fase 1 (actual):** solo renderizan pines `nivel_1` y `nivel_2`. `nivel_3` no se carga en el mapa.
- **Fase 2:** se activa `nivel_3` + lógica de zoom progresivo en `MapView.tsx` — a mayor alejamiento, solo los niveles más altos son visibles.
- El Programador **no debe eliminar ni ignorar** este campo — es la base de la implementación futura.

---

## 12. NO IMPLEMENTADO (descartado, no confundir con "pendiente")

- Toggles de capas Ciudades/Regiones/Notas — no existen, no están planeados
- Hover scale+shadow en pines
- Jerarquía visual de pines por tamaño
- FAB móvil (se usa botón hamburguesa en topbar)
- Interactividad de "otros habitantes" con polígonos del mapa
