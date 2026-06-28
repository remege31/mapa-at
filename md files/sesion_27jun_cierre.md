# Cierre de sesión — 27 Jun 2026

## Lo que se hizo hoy

### Feature: Viajes múltiples por personaje nómada (commit f1bee80)

**Schema (`src/types/lugar.ts`):**
- Nuevo interface `Viaje { nombre, ruta, referencias? }`
- `Personaje` ahora tiene `viajes?: Viaje[]` (opcional, retrocompatible)
- `RutaSeleccionada` amplía con `personajeId`, `viajeIdx`, `viajeNombre?`, `viajes?`

**Datos — 4 personajes nómadas restructurados:**
- `hebron.json` → Abraham: 5 viajes (migración familiar, el llamado, Egipto, rescate de Lot, Gerar)
- `haran.json` → Jacob: 3 viajes (huida a Harán, regreso a Canaán, descenso a Egipto)
- `sinai.json` → Moisés: 3 viajes (huida a Madián, el Éxodo, camino a Canaán)
- `sidon.json` → Elías el Tisbita: 2 viajes (ministerio profético, huida al Horeb)

**MapView.tsx:**
- Deduplicación por nombre de personaje (prefiere entradas con `viajes`)
- Una polilínea por viaje; UN label por personaje (ej: "Abraham · 5")
- Opacidades 3 niveles: viaje activo 90% / otros viajes del mismo personaje 50% / resto 20%
- WAYPOINTS ampliados con `egipto` [29.8, 31.2] y `mesopotamia` [32.5, 44.5]
- Nuevos props: `selectedPersonaje?` y `selectedViajeIdx?`

**App.tsx:**
- Estado `activeViajeIdx` para rastrear viaje activo en el panel
- `handleSelectRuta` actualiza `activeViajeIdx` al índice del viaje clicado
- `PanelRuta` actualizado: navegador "VIAJE N DE M" con ← →, dots clickeables, refs por viaje
- MapView recibe `selectedPersonaje` y `selectedViajeIdx` para re-render de opacidades

---

## Tareas pendientes para próxima sesión

### Limpieza inmediata
```bash
rm /Users/rebeca/Documents/Claude/mapa-at/src/data/personajeColors.ts
```
Archivo huérfano creado al inicio de T-10 sin completar.

### T-10: Búsqueda incluye rutas y territorios
- Mostrar rutas siempre en búsqueda, independiente del período activo
- Al seleccionar una ruta: activar capa Rutas + cambiar período automáticamente + mostrar aviso en panel
- Requiere mover `PERSONAJE_COLORS` a `src/data/personajeColors.ts` (compartido entre MapView y App)
- Dropdown categorizado: Lugares / Rutas / (Territorios futuro)

### T-11: Panel lateral para territorios
- Hacer polígonos de la capa Territorios clickeables (`interactive: true`)
- Al hacer click → panel lateral con: nombre ES, tipo (Imperio/Reino/etc.), período, descripcion_geo, importancia_estrategica
- Para territorios con JSON propio (egipto, mesopotamia, canaan): mostrar también historias y personajes
- Nuevo interface `TerritorioSeleccionado` en `lugar.ts`
- Mapping: `'Egypt'→'egipto'`, `'Babylonia'→'mesopotamia'`, `'Canaan'→'canaan'`

---

## Estado del repo
- Branch: main
- Commits ahead of origin: 6 (incluyendo f1bee80 de esta sesión)
- Pendiente push a Vercel

## Backlog existente (no tocado hoy)
- Contenido: 17 lugares placeholder sin commitear (lotes A-D generados el 23 Jun)
- ES-01 a ES-06: auditoría de español completo
- UX-01 a UX-03: accesibilidad (WCAG, touch targets, ARIA)
- MN-01/MN-02: contenido y lógica del menú hamburguesa
- FASE_NT: pendiente hasta completar AT
