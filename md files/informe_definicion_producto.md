# INFORME DE DEFINICIÓN DE PRODUCTO
## Mapa Interactivo del Antiguo Testamento
**Fecha de actualización:** 13 de junio de 2026
**Stakeholders:** Programador, Investigador, Diseñador
**Product Owner:** Rebeca

---

## 1. PORTADA / INTRODUCCIÓN

**Proyecto:** Mapa Interactivo del Antiguo Testamento

**Objetivo general:** Visualización interactiva que integra geografía, historias, contexto histórico paralelo y perspectivas religiosas del Antiguo Testamento.

**Alcance MVP (Fase 1):** 5 lugares principales — Jerusalén, Canaán, Mesopotamia, Egipto, Sinaí

**Público objetivo:** Personas cercanas a Rebeca, educadores, estudiantes, investigadores, tutores de religión/historia

**Valor propuesto:** Entender la geografía del AT como personaje activo que moldea narrativas, contextualizado con civilizaciones paralelas (Egipto, Asiria, Babilonia, Persia, Grecia, Roma, India, China, América) y perspectivas religiosas (Judaísmo, Cristianismo, Islam)

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

---

## 3. ESTADO ACTUAL — FASE 1 (IMPLEMENTADO)

✅ Mapa interactivo con pines (tamaño único, escalado por zoom, sin jerarquía visual)
✅ Filtro por período mediante **4 botones fijos**: Bronce Tardío, Hierro I, Hierro II, Post-Exilio — siempre activo, afecta pines, territorios y eventos paralelos
✅ Territorios con color y categoría política individual por territorio (~32 territorios mapeados, paleta + traducción ES completas), `fillOpacity: 0.18`, capa con toggle on/off (OFF por defecto)
✅ Etiquetas permanentes sobre territorios (nombre ES + categoría política), escaladas por zoom
✅ Animación fade (300ms) al cambiar período o activar/desactivar territorios
✅ Coordenadas corregidas (Canaán/Jerusalén ya no se superponen)
✅ Panel lateral con 5 acordeones exclusivos: Lugar, Historias, Personajes, Contexto religioso, Eventos paralelos
✅ Eventos paralelos implementados con datos reales (`eventosParalelos.ts`), filtrados por período
✅ Menú lateral (☰) con acceso a "último lugar consultado"
✅ Autenticación SSH configurada (GitHub `remege31`)

---

## 4. FUNCIONALIDADES — PANEL LATERAL

Panel deslizable (drawer en mobile) con **5 acordeones**, exclusivos (uno abierto a la vez), cerrados por defecto:

1. **📍 Lugar** — descripción geográfica, altitud, clima, recursos, importancia estratégica, otros habitantes (pueblos, sin interactividad con el mapa)
2. **📖 Historias** — exactamente 3 historias por lugar (título, fecha, descripción, referencias bíblicas como tags — ⚠ aún no son links)
3. **👤 Personajes** — exactamente 3 personajes (avatar emoji, nombre, rol, período, descripción, referencias; campo `ruta` existe en datos pero sin uso en UI)
4. **✡ Contexto religioso** — contexto general + religiones presentes + mitos con checkboxes Judaísmo/Cristianismo/Islam (`null` = "no aplica" visible, no oculto)
5. **🌍 Eventos paralelos** — banner de período activo + eventos de las 9 civilizaciones filtrados por `periodo_at`

---

## 5. ESPECIFICACIONES DEL MAPA

**Layout:**
- Desktop: Mapa flex-1 izquierda / Panel 340px derecha
- Tablet (769-1024px): Panel/menú a 60vw (máx 480px)
- Mobile: Panel y menú como drawers desde la derecha (92vw, máx 360px), overlay oscuro, botón ✕ para cerrar — acceso vía botón hamburguesa en topbar (no FAB)

**Tile base:** CartoDB `light_nolabels`

**Pines:**
- Tamaño uniforme, escalado por zoom (0.6×–1.6×)
- Color `#3C3C3C`; seleccionado `#8B4A26` con halo
- Etiqueta de nombre siempre visible con halo blanco
- Jerusalén: marca ★ + pulso/tooltip de onboarding (solo mobile, hasta primer click)
- Pines atenuados (opacity 0.25, sin click) si `periodos_at` no incluye el período activo
- ⚠ Accesibilidad por teclado: pendiente de implementar

**Territorios:**
- Polígonos desde `aourednik/historical-basemaps` (3 datasets según período), recortados a la región de interés
- Color y categoría política (Imperio/Reino/Región cultural/Zona tribal) individuales por territorio (~32 mapeados + color default)
- Nombres traducidos al español, etiqueta permanente con categoría (visible desde zoom≥6)
- `fillOpacity: 0.18`, fade in/out 300ms

**Controles del mapa** (bajo el timeline):
- Botón **Territorios**: muestra/oculta la capa de territorios — **OFF por defecto**
- Botón **Rutas**: deshabilitado, "Próximamente" — sin funcionalidad de rutas de personajes implementada aún

**Filtro de período:** 4 botones fijos, siempre activo, afecta pines + territorios + eventos paralelos

**Paleta:**
```css
--ocre:   #775C3C
--beige:  #D4C5B0
--terra:  #8B4A26
--sand:   #E8DCC8
--olive:  #6B8E23   /* sin uso detectado */
--gray:   #6B6054
--blue:   #2E5F8A
--lblue:  #6BA3D4   /* sin uso detectado */
--ink:    #3C3C3C
--paper:  #F5F0E8
--gray-on-dark: #B5AB97  /* sin uso detectado */
```

**Tipografía:** Georgia (etiquetas de territorio, títulos de panel) + system-ui (cuerpo, pines)

---

## 6. ESTRUCTURA DE DATOS

Definida en `estructura_json_at` (reescrito desde `lugar.ts` + `jerusalen.json`). Resumen:

- Un JSON por lugar en `/public/data/`; eventos paralelos en `src/data/eventosParalelos.ts`
- Campos base: id, nombre, tipo, lat, lng, frecuencia_at, `jerarquia_pin` (campo intencional, controla visibilidad de pines por nivel), `periodos` (descriptivo), `periodos_at` (filtra el pin), descripcion_geo, altitud_m, clima, recursos (array), importancia_estrategica
- `otros_habitantes`: 2–5 pueblos (id, nombre, descripción, religión, período) — sin relación con territorios del mapa
- `historias`: exactamente 3, con `personajes_clave`
- `personajes`: exactamente 3, con `emoji` y `ruta` (array, `[]` si no aplica)
- `contexto_religioso`: contexto + `religiones_presentes` + 1–3 mitos con `aparece_en` y perspectivas Judaísmo/Cristianismo/Islam (`null` si no aplica)
- Períodos válidos: `bronce_tardio`, `hierro_1`, `hierro_2`, `post_exilio`

**Reglas de investigación:**
- Campo sin fuente → `null`
- Contenido incierto → marcado con ⚠
- Cristianismo representado solo con NT en Fase 1
- 3 historias y 3 personajes por lugar

---

## 7. FUENTES DE DATOS

**Biblia (texto y referencias):**
- Nueva Biblia de Jerusalén (física) — fuente principal de verdad
- `eneleich1/La-Biblia-de-Jerusalen-Project` (GitHub, BJ 1976, JSON) — respaldo de texto de versículos citados; ⚠ derechos de redistribución no verificados, uso interno

**Geografía y territorios:**
- STEPBible / TIPNR (CC BY 4.0) — ~1.600 lugares bíblicos con coordenadas
- `aourednik/historical-basemaps` (GeoJSON, GPL-3.0) — polígonos por período

**Eventos paralelos:**
- *Times History of the World*, *Peoples and Empires* — contenido redactado por el Investigador, sin dataset GitHub viable

**Mitos paralelos — perspectivas religiosas:**
- Judaísmo: Midrash Rabbah, BHS, Talmud
- Cristianismo: Nueva Biblia de Jerusalén (NT, Fase 1)
- Islam: Corán (trad. Julio Cortés), Hadith, Tafsir

**Contexto académico general:**
- Oxford Companion to the Bible, Oxford Research Encyclopedias

Documentación completa: `decisiones_diseno.md`

---

## 8. FASE 2 — PENDIENTES

**Técnicos (confirmados por auditoría de código):**
- Referencias bíblicas como links clicables a Bible Gateway (`<a href>`)
- Accesibilidad por teclado en pines (tabindex, role, aria-label)
- Botón de ruta por personaje + visualización de rutas en el mapa (activar "🚶 Rutas")
- Revisar/limpiar variables CSS sin uso (`--olive`, `--lblue`, `--gray-on-dark`)

**Producto/contenido:**
- Drawer mobile mejorado: gesto swipe de 3 posiciones (cerrado/peek/expandido, estilo Apple Maps)
- Integración TIPNR: dataset procesado (CC BY 4.0), clasificado en 3 niveles (nivel_1: 17, nivel_2: 27, nivel_3: 80) + 19 NT separados. Esqueletos JSON generados. Pendiente: copiar a /public/data/ e implementar renderizado por niveles en MapView.tsx
- Árbol genealógico: herramienta separada con integración futura; grupos propuestos (primordial, patriarcal, línea davídica, profetas por período)
- Navegación por lista de lugares, conexiones historia↔ubicación, resaltado de polígonos de territorio
- Escalado a 10–20+ lugares adicionales, búsqueda de lugares/mitos

---

## 9. FASE 3+ — FUTURO

- Segundo mapa: Apóstoles de Jesús (posible toggle de capa)
- Comparador visual de mitos
- Base de datos colaborativa
- Visualizador separado de mitos cruzados

---

## 10. RIESGOS VIGENTES

| Riesgo | Mitigación |
|---|---|
| Datos religiosos sesgados | Múltiples fuentes académicas por tradición; NT-only para Cristianismo en Fase 1 |
| Datos históricos contradictorios | Documentar perspectivas distintas; `⚠` para contenido incierto |
| Información incompleta | Campos `null` explícitos + lista `// PENDIENTE` |
| Performance con muchos pines/territorios | Filtrado por período activo; TIPNR limitado a frecuencia ≥5 |
| Texto bíblico de fuente no verificada (`eneleich1`) | Uso interno solamente, no redistribuir |
| Edición de archivos sin editor de código | Workflow vía Terminal (heredocs, `node -e`); evitar GitHub web UI |
