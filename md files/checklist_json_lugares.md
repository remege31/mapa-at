# Checklist Investigador → Programador
## JSONs de lugares — Mapa Interactivo del Antiguo Testamento

Ejecutar antes de pasar cualquier lote al Programador.

---

## A. Estructura JSON (sintaxis)

- [ ] JSON parsea sin errores
  ```bash
  python3 -c "import json; json.load(open('file.json'))"
  ```
- [ ] Sin campos `// PENDIENTE` restantes
- [ ] `historias`: exactamente 3
- [ ] `personajes`: exactamente 3
- [ ] `otros_habitantes`: entre 2 y 5
- [ ] `contexto_religioso.mitos`: entre 1 y 3
- [ ] `aparece_en` consistente con campos `null`/objeto — si `judaismo: false` → campo `judaismo: null`
- [ ] `ruta` presente en cada personaje (array, puede ser `[]`)

---

## B. Contenido (calidad académica)

- [ ] Referencias bíblicas verificadas contra la Nueva Biblia de Jerusalén — formato `Libro Cap:Vers` (ej. `1 Sam 5:1-7`)
- [ ] Fechas en formato `c. 1000 a.C.` o `586 a.C.` (sin mezclar formatos)
- [ ] `periodos_at` coherente con las historias narradas (un lugar que solo aparece en el AT en hierro_2 no debe tener `bronce_tardio`)
- [ ] `periodos` (objetos con fechas) coherente con `periodos_at` (IDs de período)
- [ ] `fuente_secundaria` en mitos: fuente real y específica citada (no genérica como "tradición rabínica")
- [ ] Ningún personaje de los 5 MVP (Jerusalén, Canaán, Mesopotamia, Egipto, Sinaí) reutilizado como personaje principal sin que el lugar tenga conexión narrativa real con él

---

## C. Coherencia de mapa

- [ ] `lat`/`lng` no modificadas respecto al esqueleto original
- [ ] `jerarquia_pin` no modificada respecto al esqueleto original
- [ ] `nivel` no modificado respecto al esqueleto original

---

## Comando de validación por lote

```bash
for f in lugar1 lugar2 lugar3 lugar4 lugar5; do
  python3 << PYEOF
import json
try:
    d = json.load(open('/tmp/$f.json'))
    h = len(d.get('historias',[]))
    p = len(d.get('personajes',[]))
    oh = len(d.get('otros_habitantes',[]))
    m = len(d.get('contexto_religioso',{}).get('mitos',[]))
    campos = ['id','nombre','tipo','nivel','lat','lng','frecuencia_at','jerarquia_pin',
              'periodos','periodos_at','descripcion_geo','altitud_m','clima',
              'recursos','importancia_estrategica']
    missing = [c for c in campos if c not in d]
    pendiente = str(d).count('// PENDIENTE')
    print(f'{"✅" if not missing and not pendiente else "❌"} $f — historias:{h} personajes:{p} otros_hab:{oh} mitos:{m} faltantes:{missing} pendientes:{pendiente}')
except Exception as e:
    print(f'❌ $f — {e}')
PYEOF
done
```
