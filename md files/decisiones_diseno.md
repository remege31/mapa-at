# DECISIONES DE DISEÑO CONFIRMADAS
## Mapa Interactivo AT · Fase 2
### Referencia para programador y diseñador
### ⚠ Actualizado desde auditoría de código real — Junio 2026

---

## 1. LAYOUT

- **Desktop:** Mapa flex-1 izquierda · Panel lateral 340px derecha (tablet 60vw, máx 480px)
- **Topbar:** fondo `--ink`, título + campo de búsqueda + botón hamburguesa
- **Timeline:** barra bajo el topbar con 5 botones de período (Todos + 4 históricos)
- **Fila de capas:** segunda barra bajo el timeline (`#layers-row`), con los botones Territorios/Rutas
- **Mobile:** Panel y menú como drawers fijos desde la derecha (`92vw`, máx 360px), `transform: translateX`, animación 0.3s
- **Overlay:** oscuro en mobile (`rgba(0,0,0,0.38)`); en desktop el menú también usa overlay (`rgba(0,0,0,0.18)`)

---

## 2. ESTADO INICIAL

- Período activo: **"Todos los períodos"** — todos los pines visibles al abrir
- Menú lateral: **abierto** en desktop al iniciar
- Zoom: **9** · Centro: **[31.8, 35.5]** (Israel/Cisjordania)
- Territorios: **OFF** · Rutas: **OFF**

---

## 3. PANEL LATERAL — ESTRUCTURA

- **5 acordeones**: 📍 Lugar · 📖 Historias · 👤 Personajes · ✡ Contexto religioso · 🌍 Eventos paralelos
- Cerrados por defecto, solo uno abierto a la vez
- Header con botón ✕ circular — visible en mobile, oculto en desktop
- Fade inferior si hay contenido oculto por scroll
- Footer fijo: "Mapa Interactivo AT · MVP v1"
- **Acordeón Eventos paralelos en modo "Todos":** muestra mensaje "Selecciona un período histórico para ver eventos paralelos" — no muestra eventos

---

## 4. BÚSQUEDA

- Visible en topbar, siempre accesible (no detrás de botón)
- Activa con 2+ caracteres, máximo 6 resultados en dropdown
- Resultado muestra nombre + tipo de lugar
- Enter selecciona el primer resultado
- Al seleccionar → abre panel del lugar

---

## 5. MAPA — PINES

- Pin único radio base `r=6`, escalado por zoom (0.6×–1.6×)
- Color: `#3C3C3C`; seleccionado → `#8B4A26` con halo 3px
- Etiqueta de nombre siempre visible (halo blanco)
- Jerusalén: marca ★, pulso animado + tooltip onboarding (solo mobile, hasta primer click)
- **Pines atenuados** (opacity 0.25, sin click): si `periodos_at` no incluye el período activo
- **Modo "Todos"**: ningún pin atenuado — todos activos y clicables
- **Zoom progresivo:**
  - `primario`: siempre visible
  - `secundario`: visible desde zoom ≥ 6
  - `terciario`: visible desde zoom ≥ 8
- **z-index**: seleccionado 2000 · primario 1000 · secundario 500 · terciario 100
- **Collision avoidance**: si dos pines no-primarios están a <52px, la etiqueta del secundario se oculta
- Accesibilidad: tabindex, role="button", aria-label, Enter/Space activables ✅
- ❌ Hover scale + drop-shadow: no implementado

---

## 6. MAPA — CONTROLES

- **5 botones de período** (Todos + 4 históricos): uno siempre activo, default "Todos"
- Botón activo: nombre completo (rango visible solo si no es vacío)
- Mobile: scroll horizontal sin scrollbar visible
- **🗺 Territorios**: toggle on/off, default OFF. No aplica en modo "Todos" (sin GeoJSON asociado)
- **🚶 Rutas**: toggle on/off funcional ✅ — activa rutas de personajes del período activo

---

## 7. RUTAS DE PERSONAJES

- Polilíneas discontinuas (`dashArray: '6 4'`), color individual por personaje
- Etiqueta con nombre del personaje a mitad de la ruta
- Filtradas por período activo del lugar origen
- Personajes con color propio: Abraham (#C4872A), Moisés (#4A7A8B), José (#6B7A3A), David (#7A3A2A), Jeremías (#6A4A7A), Daniel (#2A4A7A), Ezequiel (#8A6A2A), Elías (#8A3A2A), Miriam (#8A5A5A), Josué (#3A6A4A), Débora (#8A7A2A), Salomón (#8B4A26)
- ❌ Botón de ruta por personaje individual: no implementado

---

## 8. TERRITORIOS HISTÓRICOS

- Polígonos desde `aourednik/historical-basemaps` (3 datasets según período)
- Color y categoría política individuales por territorio (~32 mapeados)
- Categorías: Imperio, Reino, Región cultural, Zona tribal
- Nombres traducidos al español con categoría visible desde zoom≥6
- `fillOpacity: 0.18`, fade in/out 300ms
- `interactive: false` — clicks pasan a través al mapa ✅

---

## 9. PALETA DE COLORES

```css
--ocre:   #775C3C   /* títulos, acentos cálidos */
--beige:  #D4C5B0   /* bordes, fondos secundarios */
--terra:  #8B4A26   /* acentos, pin seleccionado, botones cerrar */
--sand:   #E8DCC8   /* fondos de cards, headers de card */
--gray:   #6B6054   /* texto secundario */
--blue:   #2E5F8A   /* referencias bíblicas */
--ink:    #3C3C3C   /* texto principal, topbar, pin default */
--paper:  #F5F0E8   /* fondo general */
```
⚠ `--olive (#6B8E23)`, `--lblue (#6BA3D4)`, `--gray-on-dark (#B5AB97)` definidas sin uso detectado.

**Color de territorios:** color individual por territorio en `TERRITORY_COLORS` (MapView.tsx), no por categoría.

---

## 10. TIPOGRAFÍA

- **Serif:** Georgia — títulos de panel/drawer, nombres historia/personaje/mito, etiquetas de territorio
- **Sans-serif:** system-ui — cuerpo, UI, pines, búsqueda
- **Tamaños reales:** 9px (sec-label uppercase) · 10px (meta/refs) · 11px (desc/cuerpo) · 13px (títulos card) · 14px (drawer header) · 15px (topbar)

---

## 11. REFERENCIAS BÍBLICAS

- Renderizan como `<a href>` a Bible Gateway, abren en pestaña nueva ✅
- URL: `https://www.biblegateway.com/passage/?search={ref encodeURIComponent}&version=RVR1960`
- Formato en JSON: `"2 Sam 5:6-10"`

---

## 12. FECHAS

✅ `"c. 1000 a.C."` (con "c." si aproximado; sin "c." si exacto, ej. `"586 a.C."`)

---

## 13. CIVILIZACIONES EN EVENTOS PARALELOS

- Datos en `src/data/eventosParalelos.ts`, export `EVENTOS_PARALELOS_GLOBAL`
- Filtrado por `periodo_at.includes(periodId)` — un evento puede aparecer en varios períodos
- En modo "Todos": no se filtran ni muestran — se muestra mensaje explicativo
- 9 civilizaciones: Egipto · Asiria · Babilonia · Persia · Grecia · Roma · India · China · América

---

## 14. DATOS — REGLAS DE CONTENIDO

- Exactamente 3 historias y 3 personajes por lugar
- `otros_habitantes`: mín 2, máx 5
- `mitos`: mín 1, máx 3
- Campo sin fuente → `null`; contenido incierto → `⚠`
- `periodos_at` debe reflejar ocupación arqueológica real (pendiente I2 en Fase 3)
- `jerarquia_pin` es campo intencional — no modificar al completar contenido
- `lat`/`lng` no se modifican al completar contenido

---

## 15. DECISIONES NO IMPLEMENTADAS (descartadas, no pendientes)

- Toggles de capas Ciudades/Regiones/Notas
- Hover scale+shadow en pines
- Jerarquía visual de pines por tamaño
- FAB móvil
- Interactividad de "otros habitantes" con polígonos del mapa
- Árbol genealógico (herramienta separada, futuro)

---

## Resumen de cambios Fase 1 → Fase 2

- ✅ Búsqueda de lugares en topbar
- ✅ Botón "Todos los períodos" + estado inicial con todos los pines visibles
- ✅ Zoom progresivo por jerarquía de pin
- ✅ Rutas de personajes funcionales (colores + etiquetas)
- ✅ Referencias bíblicas como links a Bible Gateway
- ✅ Accesibilidad por teclado en pines
- ✅ Carga dinámica desde index.json (49 lugares)
- ✅ Collision avoidance de etiquetas
- ✅ z-index 2000 en pin seleccionado
- ✅ Menú inicial abierto en desktop, zoom 9, centro Israel
