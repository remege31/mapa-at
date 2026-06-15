# Estructura de Datos JSON
## Mapa Interactivo del Antiguo Testamento
### Guía completa para el Investigador · MVP Fase 1
### ⚠ Reescrito a partir de `lugar.ts` + `jerusalen.json` reales (auditoría junio 2026)

---

## 1. Introducción

Este documento define la estructura exacta de datos que el Investigador debe completar para cada lugar del MVP, basada en el tipo TypeScript real (`src/types/lugar.ts`) y el archivo de referencia `jerusalen.json`.

**Lugares del MVP (5 archivos JSON):**
- jerusalen.json
- canaan.json
- mesopotamia.json
- egipto.json
- sinai.json

⚠ Cada lugar = un archivo JSON independiente con la misma estructura, en `/public/data/`.

---

## 2. Convenciones generales

| Campo | Tipo | Requerido | Descripción | Ejemplo |
|---|---|---|---|---|
| id | string | ✅ | Identificador único, sin espacios ni acentos | "jerusalen" |
| nombre | string | ✅ | Nombre del lugar tal como aparece en el AT | "Jerusalén" |
| tipo | string | ✅ | `ciudad` \| `territorio` \| `region_natural` | "ciudad" |
| lat | number | ✅ | Latitud decimal | 31.7683 |
| lng | number | ✅ | Longitud decimal | 35.2137 |
| frecuencia_at | number | ✅ | Nº de menciones en el AT | 660 |
| jerarquia_pin | string | ✅ | `primario` \| `secundario` \| `terciario`. Campo **intencional** — controla qué pines se renderizan por nivel. Fase 1: solo `nivel_1` y `nivel_2`. Fase 2: se activa `nivel_3` con zoom progresivo. Ver sección 11 de `documento_tecnico_referencia.md` | "primario" |
| nota_coordenadas | string | ⬜ | Aclaración si las coordenadas son aproximadas | — |
| periodos | array de objetos | ✅ | Períodos descriptivos del lugar (ver sección 8) | ver ejemplo |
| descripcion_geo | string | ✅ | Descripción geográfica. Sin límite estricto, recomendado ~400-600 caracteres | "Ciudad en las montañas..." |
| altitud_m | number \| string | ✅ | Altitud en metros (string si es aproximada/descriptiva) | 754 |
| clima | string | ✅ | Descripción del clima | "Mediterráneo — veranos secos..." |
| recursos | array de strings | ✅ | Recursos y características, uno por elemento | ["Agua (manantial de Guijón)", "Piedra caliza"] |
| importancia_estrategica | string | ✅ | Por qué era importante (ruta, militar, religiosa) | "Cruce entre la ruta costera..." |
| periodos_at | array de strings | ✅ | **Campo que realmente filtra el pin en el mapa.** IDs de período (sección 8) en que el pin está activo | ["hierro_2", "post_exilio"] |

**Ejemplo de `periodos` (objetos descriptivos):**
```json
"periodos": [
  { "desde": -1000, "hasta": -586, "nombre": "Edad de Hierro II — Monarquía" },
  { "desde": -586, "hasta": -400, "nombre": "Post-Exilio — Reconstrucción" }
]
```

⚠ **Importante para el Investigador:** `periodos` (objetos con fechas) es **descriptivo/informativo** para el panel. `periodos_at` (array de IDs) es el campo que **controla la visibilidad del pin** según el filtro de período del mapa. Ambos deben mantenerse consistentes pero son campos distintos — no confundir.

---

## 3. Otros habitantes

⚠ **Cambio de concepto importante respecto a versiones anteriores de este documento:** este campo NO representa territorios geográficos con polígono. Los territorios/polígonos del mapa vienen enteramente de `aourednik/historical-basemaps` y se gestionan en código (`MapView.tsx`), no desde estos JSON. `otros_habitantes` es una lista de **pueblos/grupos humanos** que coexistieron con Israel en ese lugar, para el acordeón "Lugar" del panel.

| Campo | Tipo | Requerido | Descripción | Ejemplo |
|---|---|---|---|---|
| id | string | ✅ | Identificador único del pueblo | "jebuseos" |
| nombre | string | ✅ | Nombre del pueblo | "Jebuseos" |
| descripcion | string | ✅ | Descripción del pueblo, su historia y relación con Israel | "Pueblo cananeo original de Jerusalén..." |
| religion | string | ✅ | Religión/culto practicado | "Politeísmo cananeo — culto a Baal y Asera" |
| periodo | string | ✅ | Período en que coexistieron (texto libre, no es un ID de sección 8) | "Anterior a c. 1000 a.C." |

⚠ Mínimo 2, máximo 5 entradas por lugar (mantenido del documento original).

---

## 4. Historias principales

Exactamente 3 historias por lugar.

| Campo | Tipo | Requerido | Descripción | Ejemplo |
|---|---|---|---|---|
| id | string | ✅ | Identificador único de la historia | "conquista-david" |
| titulo | string | ✅ | Título de la historia | "David conquista Jerusalén" |
| fecha | string | ✅ | Formato `c. 1000 a.C.` o fecha exacta `586 a.C.` | "c. 1000 a.C." |
| descripcion | string | ✅ | Descripción de la historia | "David captura la ciudad jebusea..." |
| referencias | array de strings | ✅ | Referencias bíblicas exactas | ["2 Sam 5:6-10", "1 Cr 11:4-9"] |
| personajes_clave | array de strings | ✅ | IDs de personajes (de la sección 5) relacionados con esta historia | ["david"] |

---

## 5. Personajes clave

Exactamente 3 personajes por lugar.

| Campo | Tipo | Requerido | Descripción | Ejemplo |
|---|---|---|---|---|
| id | string | ✅ | Identificador único del personaje | "david" |
| nombre | string | ✅ | Nombre del personaje | "David" |
| emoji | string | ✅ | Emoji representativo, usado en UI | "👑" |
| rol | string | ✅ | Rol/descripción corta del cargo | "Rey fundador de la dinastía davídica" |
| periodo | string | ✅ | Período de vida aproximado | "c. 1010–970 a.C." |
| descripcion | string | ✅ | Descripción del personaje y su relevancia | "Pastor de Belén que se convierte en rey..." |
| referencias | array de strings | ✅ | Referencias bíblicas principales | ["2 Sam 5:1-25", "1 Re 2:1-12"] |
| ruta | array de strings | ✅ (puede ser vacío `[]`) | IDs de lugares por donde transitó el personaje. **No existe campo `tiene_ruta`** — actualmente sin uso en UI | ["belen", "jerusalen", "hebrón"] |

⚠ Si el personaje no tiene ruta relevante, usar `"ruta": []` (no omitir el campo).

---

## 6. Contexto religioso

### 6a. Contexto general del lugar

| Campo | Tipo | Requerido | Descripción | Ejemplo |
|---|---|---|---|---|
| contexto_lugar | string | ✅ | Panorama religioso general del lugar | "Jerusalén es el centro del monoteísmo yahvista..." |
| religiones_presentes | array de strings | ✅ | Lista de religiones/cultos presentes en el lugar durante los períodos cubiertos | ["Yahvismo (monoteísmo israelita)", "Politeísmo cananeo (Baal, Asera)"] |

### 6b. Mitos

Array de mitos asociados al lugar (mínimo 1, máximo 3).

| Campo | Tipo | Requerido | Descripción | Ejemplo |
|---|---|---|---|---|
| id | string | ✅ | Identificador único del mito | "aqeda" |
| nombre | string | ✅ | Nombre del mito | "Sacrificio de Isaac (Aqedá)" |
| aparece_en | objeto de booleanos | ✅ | `{ judaismo: bool, cristianismo: bool, islam: bool }` — controla checkboxes en UI | `{"judaismo": true, "cristianismo": true, "islam": true}` |
| judaismo | object \| null | ✅ | Perspectiva judía (estructura `MitoTradicion`, ver 6c). `null` si `aparece_en.judaismo` es `false` | {...} \| null |
| cristianismo | object \| null | ✅ | Perspectiva cristiana (NT, Fase 1) | {...} \| null |
| islam | object \| null | ✅ | Perspectiva islámica | {...} \| null |

⚠ `aparece_en` y los campos `null`/objeto deben ser **consistentes**: si `aparece_en.islam` es `false`, entonces `islam` debe ser `null`. Si es `null` y `aparece_en` es `true`, la UI muestra "No aplica directamente en esta tradición".

### 6c. Estructura `MitoTradicion` (cuando no es null)

| Campo | Tipo | Requerido | Descripción | Ejemplo |
|---|---|---|---|---|
| fuente_primaria | string | ✅ | Texto sagrado de referencia | "Gén 22:1-19" |
| fuente_secundaria | string | ✅ | Fuente académica/tradicional complementaria | "Midrash Rabbah, Génesis 55:4" |
| descripcion | string | ✅ | Descripción de esa versión del mito | "El Monte Moria donde Abraham..." |
| similitudes | string \| null | ✅ | Similitudes con otras versiones, o `null` | "Obediencia total del hijo al padre..." |
| diferencias | string \| null | ✅ | Diferencias clave con otras versiones, o `null` | "El hijo es Ismael. El lugar es La Meca." |
| significado_teologico | string | ✅ | Significado en esa tradición | "Fundamento de la alianza..." |
| posible_relacion_cultural | string \| null | ✅ | Relación cultural compartida entre tradiciones, o `null` | "Tradición compartida del patriarca Abraham..." |

⚠ `similitudes` y `diferencias` son **string \| null**, no arrays. En UI se truncan a 70 caracteres.

---

## 7. Eventos paralelos

⚠ **No vive en los JSON de lugar.** Está en `src/data/eventosParalelos.ts`, export `EVENTOS_PARALELOS_GLOBAL` — ✅ implementado con datos reales.

| Campo | Tipo | Descripción | Ejemplo |
|---|---|---|---|
| civilizacion | string | ID de la civilización | "asiria" |
| emoji | string | Emoji representativo | "🏺" |
| periodo_historico | string | Nombre del período en esa civilización | "Imperio Neoasirio · 911–609 a.C." |
| periodo_at | array de strings | Períodos del AT (sección 8) a los que corresponde — un evento puede aparecer en varios | ["hierro_2"] |
| evento | string | Nombre/descripción del evento | "Destrucción del Reino del Norte" |
| descripcion | string | Descripción breve | "Sargón II conquista Samaria..." |

**Civilizaciones:** egipto · asiria · babilonia · persia · grecia · roma · india · china · america

---

## 8. Períodos históricos válidos (`periodos_at` / `periodo_at`)

| ID | Nombre completo | Rango aproximado |
|---|---|---|
| bronce_tardio | Edad de Bronce Tardía | 1500–1200 a.C. |
| hierro_1 | Edad de Hierro I | 1200–1000 a.C. |
| hierro_2 | Edad de Hierro II | 1000–586 a.C. |
| post_exilio | Post-Exilio | 586–400 a.C. |

⚠ El filtro de período (4 botones fijos) usa exactamente estos IDs, comparándolos contra `periodos_at` del lugar, `periodo` de cada territorio (en código) y `periodo_at` de eventos paralelos.

---

## 9. Ejemplo completo de referencia

Ver `jerusalen.json` en `/public/data/` — archivo de referencia validado contra `lugar.ts`.

```json
{
  "id": "...", "nombre": "...", "tipo": "ciudad",
  "lat": 0, "lng": 0, "frecuencia_at": 0,
  "jerarquia_pin": "primario",
  "periodos": [{ "desde": -1000, "hasta": -586, "nombre": "..." }],
  "descripcion_geo": "...", "altitud_m": 0, "clima": "...",
  "recursos": ["..."], "importancia_estrategica": "...",
  "otros_habitantes": [
    { "id": "...", "nombre": "...", "descripcion": "...", "religion": "...", "periodo": "..." }
  ],
  "historias": [
    { "id": "...", "titulo": "...", "fecha": "...", "descripcion": "...", "referencias": ["..."], "personajes_clave": ["..."] }
  ],
  "personajes": [
    { "id": "...", "nombre": "...", "emoji": "...", "rol": "...", "periodo": "...", "descripcion": "...", "referencias": ["..."], "ruta": [] }
  ],
  "contexto_religioso": {
    "contexto_lugar": "...",
    "religiones_presentes": ["..."],
    "mitos": [
      {
        "id": "...", "nombre": "...",
        "aparece_en": { "judaismo": true, "cristianismo": true, "islam": false },
        "judaismo": { "fuente_primaria": "...", "fuente_secundaria": "...", "descripcion": "...", "similitudes": null, "diferencias": null, "significado_teologico": "...", "posible_relacion_cultural": null },
        "cristianismo": { ... },
        "islam": null
      }
    ]
  },
  "periodos_at": ["hierro_2", "post_exilio"]
}
```

---

## 10. Checklist del Investigador

- ☐ id, nombre, tipo, lat, lng, frecuencia_at, jerarquia_pin (campo intencional, siempre incluir)
- ☐ periodos (objetos desde/hasta/nombre) — al menos 1
- ☐ periodos_at (array de IDs sección 8) — controla visibilidad real del pin
- ☐ descripcion_geo, altitud_m, clima, recursos (array), importancia_estrategica
- ☐ otros_habitantes (mín 2, máx 5) — pueblos con religión y período, sin polígono
- ☐ historias (exactamente 3, con personajes_clave)
- ☐ personajes (exactamente 3, con emoji y ruta — `[]` si no aplica)
- ☐ contexto_religioso.contexto_lugar + religiones_presentes
- ☐ contexto_religioso.mitos (mín 1, máx 3), con aparece_en consistente con campos null

---

## Resumen de cambios respecto a la versión anterior

- ❌ Eliminado: concepto de `otros_habitantes` como territorios con polígono/categoría política — eso vive hardcoded en `MapView.tsx`
- ❌ Eliminado: `tiene_ruta`, `tiene_poligono` — no existen
- ❌ Eliminado: `evento_principal`, `similitudes`/`diferencias` como arrays
- ✅ Añadido: `jerarquia_pin` (campo intencional), `periodos_at` (filtrado real), `emoji`, `personajes_clave`, `religiones_presentes`, `aparece_en`, `posible_relacion_cultural`
- ✅ Corregido: `periodos` es array de objetos, `recursos` es array
- ✅ Confirmado: `eventos_paralelos` vive en `src/data/eventosParalelos.ts`, no en JSON de lugar
