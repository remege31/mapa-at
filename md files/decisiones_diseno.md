# DECISIONES DE DISEÑO CONFIRMADAS
## Mapa Interactivo AT · MVP Fase 1
### Referencia para programador y diseñador
### ⚠ Reescrito desde auditoría de código real (`App.tsx`, `App.css`, `MapView.tsx`) — junio 2026

---

## 1. LAYOUT

- **Desktop:** Mapa flex-1 izquierda · Panel lateral 340px derecha (tablet 60vw, máx 480px)
- **Topbar:** 38px, fondo `--ink`, título + botón hamburguesa (abre menú)
- **Timeline:** Barra bajo el topbar, altura dinámica (medida en runtime)
- **Fila de capas:** segunda barra bajo el timeline (`#layers-row`), con los botones Territorios/Rutas
- **Mobile:** Panel y menú como drawers fijos desde la derecha (`92vw`, máx 360px), `transform: translateX`, animación 0.3s
- **Overlay:** oscuro en mobile (`rgba(0,0,0,0.38)`); en desktop el menú también usa overlay (`rgba(0,0,0,0.18)`) al abrirse

---

## 2. PANEL LATERAL — ESTRUCTURA

- **5 acordeones**:
  1. 📍 Lugar
  2. 📖 Historias
  3. 👤 Personajes
  4. ✡ Contexto religioso
  5. 🌍 Eventos paralelos
- Cerrados por defecto (`openAcc = -1`), se expanden al click, **solo uno abierto a la vez**
- Header del drawer con botón ✕ circular — visible en mobile, oculto en desktop
- Fade inferior (`panel-scroll-fade`) si hay contenido oculto por scroll
- Footer fijo `#panel-nav`: "Mapa Interactivo AT · MVP v1"
- **Acordeón Lugar incluye:** Altitud + Tipo (grid 2 col), Clima, Geografía, Importancia estratégica, Recursos (lista), Otros habitantes (lista nombre+descripción, sin click ni resaltado de polígono)
- **Acordeón Eventos paralelos:** banner con nombre+rango del período activo, luego eventos filtrados desde `EVENTOS_PARALELOS_GLOBAL` por `periodo_at.includes(periodId)` — ✅ implementado con datos reales
- **Menú lateral (hamburguesa):** drawer separado (`#menu-drawer`) con acceso rápido al "último lugar consultado" (o Jerusalén por defecto) + secciones "El mapa" y "Información" — items actualmente deshabilitados

---

## 3. MAPA — PINES

- ❌ Sin jerarquía de tamaño por frecuencia. Pin único, radio base `r=6`, escalado por zoom (0.6×–1.6×)
- Color: `#3C3C3C`; seleccionado → `#8B4A26` con halo
- Etiqueta de nombre bajo el pin, siempre visible, con halo blanco
- Jerusalén: marca ★, pulso animado + tooltip "Toca para explorar" (solo mobile, hasta primer click)
- **Pines atenuados (opacity 0.25, sin click)** si `periodos_at` del lugar no incluye el período activo
- Click → abre panel lateral
- ⚠ Accesibilidad por teclado (tabindex, role="button", aria-label): **no confirmado en `MapView.tsx`** — pendiente
- ❌ Hover scale + drop-shadow: no implementado

---

## 4. MAPA — CONTROLES

❌ Eliminado el concepto de 4 toggles (Ciudades/Territorios/Regiones/Notas). Lo real:

- **Fila de controles** (`#layers-row`), bajo el timeline, alineada a la izquierda
- Botón **🗺 Territorios**: toggle on/off de la capa de territorios históricos — **OFF por defecto**
- Botón **🚶 Rutas**: presente pero **deshabilitado** ("Próximamente")
- No existen capas de "Ciudades", "Regiones" ni "Notas" — los pines siempre visibles, sin toggle

---

## 5. TIMELINE / FILTRO DE PERÍODO

- ❌ Eliminado: slider continuo -1500 a -400, step 10
- ✅ **4 botones fijos** (`#period-btns`), siempre uno activo (`hierro_2` por defecto):
  - Edad de Bronce Tardía · 1500–1200 a.C.
  - Edad de Hierro I · 1200–1000 a.C.
  - Edad de Hierro II · 1000–586 a.C.
  - Post-Exilio · 586–400 a.C.
- Botón activo: nombre completo + rango; inactivos: solo nombre
- Mobile: scroll horizontal sin scrollbar visible
- Animación fade in/out (300ms) de territorios y etiquetas al cambiar período — ✅ implementado

---

## 6. PALETA DE COLORES

```css
--ocre:   #775C3C   /* títulos, acentos cálidos, fechas de historia */
--beige:  #D4C5B0   /* bordes, fondos secundarios */
--terra:  #8B4A26   /* acentos fuertes, pin seleccionado, botones cerrar */
--sand:   #E8DCC8   /* fondos de cards, hover, headers de card */
--olive:  #6B8E23   /* (sin uso detectado en App.css) */
--gray:   #6B6054   /* texto secundario */
--blue:   #2E5F8A   /* referencias bíblicas */
--lblue:  #6BA3D4   /* (sin uso detectado en App.css) */
--ink:    #3C3C3C   /* texto principal, topbar, pin default */
--paper:  #F5F0E8   /* fondo general */
--gray-on-dark: #B5AB97  /* (sin uso detectado en App.css) */
```

**Color de territorios:** cada territorio tiene su propio color individual (no por categoría), definido en `MapView.tsx` (`TERRITORY_COLORS`, ~32 entradas + `default: #8B7355`)

---

## 7. TIPOGRAFÍA

- **Serif:** Georgia (títulos de panel/drawer, nombres de historia/personaje/mito, etiquetas de territorio)
- **Sans-serif:** system-ui / -apple-system / Segoe UI (cuerpo, UI, pines)
- **Tamaños reales:**
  - 9px: `.sec-label`, `.menu-section-label` (uppercase, letter-spacing 0.08em)
  - 10px: `.gl`, `.ml`, `.ref`, `.civ-per`, etiquetas de período/territorio en zoom bajo
  - 11px: `.desc`, `.gv`, `.resource-list`, cuerpo general
  - 13px: `.story-title`, `.pname`, `.myth-name`, título de drawer (mobile)
  - 14px: `.drawer-header-title`
  - 15px: `#topbar-title`
  - 18px: `#panel-name` (⚠ definido en CSS pero no usado en `App.tsx` — posible resto legacy)

---

## 8. REFERENCIAS BÍBLICAS

- En código actual, `.ref` solo renderiza texto (ej. `2 Sam 5:6-10`) como `<span>`, sin `<a href>`
- Formato en JSON: `"2 Sam 5:6-10"` ✅
- ⚠ **Pendiente:** construir URL `https://www.biblegateway.com/passage/?search=` + referencia, abrir en pestaña nueva

---

## 9. FECHAS

✅ `"c. 1000 a.C."` (con "c." si es aproximado; sin "c." si la fecha es exacta, ej. `"586 a.C."`)

---

## 10. CIVILIZACIONES EN EVENTOS PARALELOS

- Datos en `src/data/eventosParalelos.ts`, export `EVENTOS_PARALELOS_GLOBAL`
- Cada evento: `emoji`, `civilizacion`, `periodo_historico`, `periodo_at: string[]`, `evento`, `descripcion`
- Filtrado en panel por `periodo_at.includes(periodId)` — un evento puede aparecer en varios períodos
- Egipto · Asiria · Babilonia · Persia · Grecia · Roma · India · China · América

---

## 11. PERSONAJES — FUNCIONALIDADES

❌ `tiene_ruta` no existe.
- `ruta: string[]` siempre presente; vacío `[]` si no aplica
- Botón 🗺 Ruta: **no implementado** en `PersonajeCard`
- El botón global "🚶 Rutas" en `#layers-row` está deshabilitado — funcionalidad de rutas no existe todavía, ni individual ni global

---

## 12. HABITANTES (acordeón Lugar)

❌ `tiene_poligono` no existe, no aplica.
- `otros_habitantes` es lista de pueblos (nombre + descripción) — sin interactividad, sin click, sin resaltado de polígono
- Los polígonos de territorios (mapa) son una capa independiente, sin relación con `otros_habitantes`

---

## 13. CONTEXTO RELIGIOSO — MITOS

- Checkboxes visuales (`.cb-on`/`.cb-off`) según `aparece_en.{judaismo,cristianismo,islam}` ✅
- Si la tradición es `null` → bloque visible *"No aplica directamente en esta tradición"* (`.rel-na`) ✅
- Diferencias/similitudes como tags truncados a 70 caracteres

---

## 14. MOBILE

- Drawer desde la derecha, `92vw` máx `360px`, `translateX` + transición 0.3s
- Header con botón ✕ (`.drawer-close-btn`, circular, terra)
- Overlay oscuro (`rgba(0,0,0,0.38)`) con `backdrop-filter: blur(1px)`
- Timeline con scroll horizontal sin scrollbar visible
- `#layers-row` se ajusta (`width: auto`, sin borde inferior) en mobile
- ❌ No existe FAB flotante — acceso vía botón hamburguesa en topbar
- Tablet (769–1024px): panel/menú a `60vw` (máx 480px)

---

## 15. REFERENCIAS TÉCNICAS

- Stack: React + TypeScript + Leaflet.js + Vite + Vercel
- Coordenadas: reales (`lat`/`lng` decimales en JSON)
- JSON: un archivo por lugar en `/public/data/` + `src/data/eventosParalelos.ts` para eventos globales
- Tipos TypeScript: `src/types/lugar.ts`
- Tile base: CartoDB `light_nolabels`
- Territorios: `aourednik/historical-basemaps` (GeoJSON), recortado a región (lat 20-42, lng 25-55)

---

## Resumen de cambios respecto a la versión de mayo 2026

- ❌ Eliminado: toggles de 4 capas → ahora 2 botones (Territorios on/off, Rutas deshabilitado)
- ❌ Eliminado: slider continuo de timeline → 4 botones fijos
- ❌ Eliminado: jerarquía de pines por tamaño/frecuencia
- ❌ Eliminado: `tiene_ruta`, `tiene_poligono`, interactividad de habitantes con polígonos
- ❌ Eliminado: FAB móvil → botón hamburguesa en topbar
- ❌ Eliminado: hover scale+shadow en pines
- ✅ Añadido: acordeones exclusivos, fade de scroll, menú lateral con "último lugar", segunda barra de controles
- ✅ Confirmado: eventos paralelos implementados con datos reales
- ⚠ Pendiente: referencias bíblicas como links, accesibilidad teclado
- ⚠ Hallazgo: `--olive`, `--lblue`, `--gray-on-dark`, `#panel-name`/`#panel-tags`/`.ptag*` sin uso aparente
