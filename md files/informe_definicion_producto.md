# INFORME DE DEFINICIÓN DE PRODUCTO
## Mapa Interactivo del Antiguo Testamento
**Fecha de actualización:** 18 de junio de 2026
**Stakeholders:** Programador, Investigador, Diseñador
**Product Owner:** Rebeca

---

## 1. PORTADA / INTRODUCCIÓN

**Proyecto:** Mapa Interactivo del Antiguo Testamento

**Objetivo general:** Visualización interactiva que integra geografía, historias, contexto histórico paralelo y perspectivas religiosas del Antiguo Testamento.

**Alcance MVP (Fase 1):** 5 lugares principales — Jerusalén, Canaán, Mesopotamia, Egipto, Sinaí — completados.

**Fase 2 (en curso / casi completada):** 44 lugares adicionales (nivel 1 y nivel 2), carga dinámica, búsqueda, rutas, zoom progresivo, estado inicial optimizado.

**Público objetivo:** Personas cercanas a Rebeca, educadores, estudiantes, investigadores, tutores de religión/historia

**Valor propuesto:** Entender la geografía del AT como personaje activo que moldea narrativas, contextualizado con civilizaciones paralelas y perspectivas religiosas (Judaísmo, Cristianismo, Islam)

**Stack técnico:**
- React + TypeScript + Leaflet.js + Vite
- Despliegue: Vercel (`mapa-at.vercel.app`)
- Repo: `github.com/remege31/mapa-at`
- Datos: JSON estático por lugar en `/public/data/` + `src/data/eventosParalelos.ts`

---

## 2. VISIÓN GENERAL DEL PRODUCTO

El Antiguo Testamento es una historia desarrollada en un territorio específico durante 1500+ años. La geografía no es solo contexto: es un personaje que participa activamente en cada narrativa.

El mapa permite:
- Explorar lugares del AT en contexto histórico y geográfico
- Comparar eventos bíblicos con lo que ocurría simultáneamente en otras civilizaciones
- Entender cómo distintas religiones interpretan historias compartidas
- Ver cambios de fronteras/territorios entre 4 períodos históricos
- Buscar lugares por nombre
- Ver rutas de los personajes principales sobre el mapa

---

## 3. ESTADO ACTUAL — FASE 1 (COMPLETADA)

✅ Mapa interactivo con pines escalados por zoom  
✅ Filtro por período — 4 botones fijos (Bronce Tardío, Hierro I, Hierro II, Post-Exilio)  
✅ Territorios con color y categoría política individual (~32 territorios), toggle on/off  
✅ Etiquetas permanentes sobre territorios, escaladas por zoom  
✅ Animación fade (300ms) al cambiar período o activar/desactivar territorios  
✅ Panel lateral con 5 acordeones exclusivos  
✅ Eventos paralelos con datos reales, filtrados por período  
✅ Menú lateral (☰) con acceso a último lugar consultado  
✅ Autenticación SSH configurada (GitHub `remege31`)  
✅ 5 JSONs MVP completos con fuentes secundarias (Midrash, Talmud, Ibn Kathir, patrística)

---

## 4. ESTADO ACTUAL — FASE 2 (CASI COMPLETADA)

✅ Carga dinámica de lugares desde `index.json` — 49 lugares activos  
✅ Búsqueda de lugares en topbar (input + dropdown, Enter para seleccionar)  
✅ Botón "Todos los períodos" — muestra todos los pines sin filtro  
✅ Estado inicial optimizado: todos los períodos, zoom 9, centro Israel, menú abierto  
✅ Zoom progresivo por `jerarquia_pin` (primario siempre, secundario ≥6, terciario ≥8)  
✅ Rutas de personajes funcionales (🚶 Rutas, colores por personaje, etiquetas)  
✅ Referencias bíblicas como links a Bible Gateway ✅  
✅ Accesibilidad por teclado en pines (tabindex, role, aria-label, Enter/Space)  
✅ Collision avoidance de etiquetas entre pines cercanos  
✅ z-index 2000 en pin seleccionado  
✅ Territorios no bloquean clicks en pines (`interactive: false`)  
✅ Contenido: 31/49 JSONs con 3 historias y 3 personajes completos (Lotes A–F)  

⏳ **Pendiente de contenido:** 16 JSONs con campos PENDIENTE (ammon, babylon, bethel, bethlehem, damascus, dan, gath, gibeah, gibeon, hebron, jericho, mizpah, samaria, shechem, sidon, sodom, tyre + sodom = 16 total)  
⏳ **Pendiente técnico:** fix scroll horizontal al activar Territorios (identificado, no resuelto)

---

## 5. FUNCIONALIDADES — PANEL LATERAL

Panel deslizable (drawer en mobile) con **5 acordeones**, exclusivos, cerrados por defecto:

1. **📍 Lugar** — descripción geográfica, altitud, clima, recursos, importancia estratégica, otros habitantes (2–5 pueblos, sin interactividad con el mapa)
2. **📖 Historias** — exactamente 3 por lugar (título, fecha, descripción, referencias como links a Bible Gateway)
3. **👤 Personajes** — exactamente 3 (avatar emoji, nombre, rol, período, descripción, referencias como links; campo `ruta` existe pero sin botón individual)
4. **✡ Contexto religioso** — contexto general + religiones presentes + 1–3 mitos con checkboxes Judaísmo/Cristianismo/Islam
5. **🌍 Eventos paralelos** — si período activo: banner + eventos filtrados por civilización; si "Todos": mensaje explicativo

---

## 6. ESPECIFICACIONES DEL MAPA

**Layout:** Desktop mapa flex-1 / Panel 340px · Tablet 60vw · Mobile drawer 92vw  
**Tile base:** CartoDB `light_nolabels`  
**Pines:** radio base r=6, zoom progresivo por jerarquía, collision avoidance  
**Territorios:** aourednik/historical-basemaps, 3 datasets, ~32 territorios con color individual  
**Controles:** 5 botones de período (Todos + 4) · 🗺 Territorios · 🚶 Rutas  
**Búsqueda:** input en topbar, 2+ caracteres, dropdown 6 resultados máx  

---

## 7. ESTRUCTURA DE DATOS

- 49 JSONs en `/public/data/` + `index.json` con lista de IDs
- Campos clave: `jerarquia_pin` (intencional, controla zoom progresivo), `periodos_at` (filtra pines), `historias` (3), `personajes` (3), `otros_habitantes` (2–5), `contexto_religioso.mitos` (1–3)
- Eventos paralelos en `src/data/eventosParalelos.ts`
- Períodos válidos: `bronce_tardio`, `hierro_1`, `hierro_2`, `post_exilio`
- Período especial: `todos` (no filtra pines, sin GeoJSON, sin eventos paralelos)

**Reglas:**
- Campo sin fuente → `null`; contenido incierto → `⚠`
- `lat`/`lng` y `jerarquia_pin` no se modifican al completar contenido
- `periodos_at` debe reflejar ocupación arqueológica (pendiente I2, Fase 3)

---

## 8. FUENTES DE DATOS

**Biblia:** Nueva Biblia de Jerusalén (física, fuente principal)  
**Geografía:** STEPBible/TIPNR (CC BY 4.0) · `aourednik/historical-basemaps` (GeoJSON, GPL-3.0)  
**Mitos:** Midrash Rabbah · Talmud Bavli · Sefaria · Archive.org (Talmud completo) · Ibn Kathir Tafsir · Patrística (Orígenes, Ireneo, Tertuliano, Melitón, Cirilo)  
**Eventos paralelos:** redactados por el Investigador  
**Referencias:** Bible Gateway (biblegateway.com) para links clicables

---

## 9. FASE 3 — CANDIDATOS

| Ítem | Tipo |
|---|---|
| Completar 16 JSONs con PENDIENTE | Investigador |
| Verificación arqueológica `periodos_at` (I2) | Investigador |
| Drawer swipe gesture mobile (3 posiciones) | Programador |
| Búsqueda de personajes y mitos | Programador |
| Fix scroll horizontal al activar Territorios | Programador |
| Timeline extendida hasta año 0 d.C. | Programador |
| Botón de ruta por personaje individual | Programador |
| Documentación final y actualización .md | Coordinador |
| Testing en dispositivo físico (mapa-at.vercel.app) | Rebeca |

---

## 10. FUTURO (Fase 4+)

- Segundo mapa: Apóstoles de Jesús (posible toggle de capa)
- Comparador visual de mitos
- Base de datos colaborativa
- Visualizador separado de mitos cruzados
- Árbol genealógico (herramienta separada)

---

## 11. RIESGOS VIGENTES

| Riesgo | Mitigación |
|---|---|
| Datos religiosos sesgados | Múltiples fuentes académicas por tradición |
| `periodos_at` asignados narrativamente, no arqueológicamente | Pendiente I2 en Fase 3 |
| 16 JSONs con contenido PENDIENTE | Prioridad Investigador en Fase 3 |
| Scroll horizontal bug con capa Territorios | Identificado, pendiente fix |
| Edición de archivos sin editor de código | Workflow vía Terminal (heredocs, scripts Python) |
| Dataset aourednik sin snapshot entre bc1500 y bc1000 | Aceptado y documentado |
