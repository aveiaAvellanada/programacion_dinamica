# Visualizador de Programación Dinámica Multietapa Determinística

Herramienta interactiva para el curso de Investigación de Operaciones
(Modelos Determinísticos, Universidad de la Amazonia). Es la variante de IO
con tablas explícitas de inducción hacia atrás (`s_k`, `d_k`,
`s_{k-1} = s_k - d_k`), no un DP estilo LeetCode.

Consta de un **motor algorítmico puro** (`src/engine/`, sin dependencias de
React ni del DOM) y una **interfaz React** (`src/ui/`) construida encima de
él.

## Modelo matemático

- Etapa `k = 1..K`: `k=1` es la última etapa evaluada, `k=K` la inicial.
- Estado `s_k`: recursos disponibles al llegar a la etapa `k`; `s_K = N`.
- Decisión `d_k`: recursos asignados a la etapa `k`, `0 <= d_k <= s_k`.
- Transición: `s_{k-1} = s_k - d_k`.
- Recursión de Bellman: `f_k(s_k, d_k) = p_k(d_k) + f*_{k-1}(s_k - d_k)`,
  con `f*_0(s) ≡ 0`. La etapa 1 es un caso particular de esta misma
  recursión, no un caso aparte.
- Los empates (múltiples `d*` por fila, múltiples políticas óptimas
  globales) son ciudadanos de primera clase del diseño.

Ver `docs/superpowers/specs/2026-08-12-dp-engine-phase1-design.md` para el
diseño completo (contrato de datos, decisiones de diseño, casos de prueba).

## Qué ofrece la interfaz

- **Editor del problema**: recursos `N`, sentido (maximizar/minimizar),
  etiquetas y matriz de retornos `p_k(d)` editable; problemas de ejemplo
  precargados e importación/exportación en JSON. Todo recalcula en vivo.
- **Tablas de inducción hacia atrás**, una por etapa, con celdas óptimas,
  infactibles y empates marcados.
- **Inspector de celda**: descompone la celda enfocada en sus términos de
  Bellman — `p_k(d) + f*_{k-1}(s−d) = valor` — y explica la transición.
  Pasa el cursor para explorar, haz **clic para fijar** una celda y
  <kbd>Esc</kbd> para soltarla.
- **Vinculación con la etapa anterior**: al enfocar una celda se resalta la
  celda óptima de `k−1` que reutiliza, sin recalcular nada (el motor ya
  expone `prevState`/`fPrev`).
- **Red de estados (SVG)**: grafo nodo-enlace de las transiciones
  `s_k → s_{k-1}`, con el valor `f*` en cada nodo y aristas clicables.
- **Reproductor paso a paso** sobre la traza del algoritmo: control de
  velocidad, barra de posición, salto a la fase de backtracking y atajos de
  teclado (<kbd>espacio</kbd>, <kbd>←</kbd>/<kbd>→</kbd>, <kbd>Home</kbd>/<kbd>End</kbd>).
- **Lista de políticas óptimas**: cadena completa de estados y suma de
  contribuciones; al seleccionar una se resalta su ruta en las tablas y en
  la red.

## Uso

```bash
npm install
npm run dev     # abre el visualizador (http://localhost:5173)
npm test        # suite completa: motor + interfaz
npm run build   # bundle de producción en dist/
npm run demo    # resuelve "Supermercados El Primo" e imprime las tablas en consola
```

## Estructura

```
src/engine/            motor puro (sin imports de React/DOM)
  types.ts               contrato de datos
  solve.ts                construcción de tablas por inducción hacia atrás
  backtrack.ts             enumeración de todas las políticas óptimas
  trace.ts                  generación de steps[] para la animación
  index.ts                   solve(problem): Solution
  __tests__/                  elPrimo.test.ts, edgeCases.test.ts, testUtils.ts
src/ui/                interfaz React
  App.tsx                 orquesta estado de enfoque, fijado y resaltados
  ProblemEditor.tsx        edición del problema, presets, JSON
  StageTable.tsx            tablas por etapa
  StateGraph.tsx             red de estados en SVG
  StepPlayer.tsx              reproductor de la traza
  PolicyList.tsx               políticas óptimas
  CellInspector.tsx             desglose de Bellman de la celda enfocada
  Legend.tsx                     leyenda de colores
  cellInfo.ts / highlight.ts      utilidades de consulta y claves de celda
  styles.css / polish.css          estilos base y capa de pulido
  __tests__/                        pruebas de humo de la interfaz (jsdom)
src/demo.ts             script invocado por `npm run demo`
```

## Pruebas

`npm test` corre 28 pruebas: 19 del motor (incluyendo el caso canónico
verificado a mano y casos borde como empates, `sense: 'min'` y truncamiento)
y 9 de la interfaz en jsdom (montaje sin errores, hover, fijado, reproductor,
selección de políticas, edición del problema y la red de estados).
