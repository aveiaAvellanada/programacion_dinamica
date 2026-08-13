# Fase 1 — Motor de Programación Dinámica (headless)

Fecha: 2026-08-12
Estado: aprobado

## Propósito

Construir el motor algorítmico (sin UI) de un visualizador interactivo de
Programación Dinámica Multietapa Determinística, para un curso de
Investigación de Operaciones (Modelos Determinísticos, Universidad de la
Amazonia). Es la variante de IO con tablas explícitas de inducción hacia
atrás (estados `s_k`, decisiones `d_k`, transición `s_{k-1} = s_k - d_k`),
no un DP estilo LeetCode.

Este spec cubre **solo la Fase 1**: motor TypeScript puro + tests + demo de
consola. Ninguna UI (React, hover, animación, grafo) se implementa aquí; el
contrato de datos se diseña para soportarla sin recálculo en fases futuras.

## Modelo matemático

- Etapa `k`: actividad/tienda, `k = 1..K`. `k=1` es la última etapa evaluada
  (recibe el remanente), `k=K` es la etapa inicial (tiene todos los
  recursos).
- Estado `s_k`: recursos disponibles al llegar a la etapa `k`. `s_K = N`.
- Decisión `d_k`: recursos asignados a la etapa `k`, `0 <= d_k <= s_k`.
- Transición: `s_{k-1} = s_k - d_k`.
- Recursión de Bellman: `f_k(s_k, d_k) = p_k(d_k) ⊕ f*_{k-1}(s_k - d_k)`,
  donde `⊕` es `+` con `max`/`min` según `sense`, y `f*_0(s) ≡ 0`.
- La etapa 1 se deriva con la misma recursión general (no es un caso
  aparte): se evalúan todas las `d_1 <= s_1`, usando `f*_0 ≡ 0`.
- Los empates (múltiples `d` óptimos en una fila, o múltiples políticas
  globales óptimas) son ciudadanos de primera clase del diseño, no un caso
  excepcional.

## Caso de prueba canónico — "Supermercados El Primo"

5 cargas de fresas, 3 tiendas. Matriz `p_k(d)`:

| `d` | Tienda 1 | Tienda 2 | Tienda 3 |
|---|---|---|---|
| 0 | 0  | 0  | 0  |
| 1 | 5  | 6  | 4  |
| 2 | 9  | 11 | 9  |
| 3 | 14 | 15 | 13 |
| 4 | 19 | 17 | 18 |
| 5 | 21 | 22 | 20 |

Etapa 1 = Tienda 1, Etapa 2 = Tienda 2, Etapa 3 = Tienda 3. `s_3 = 5`.

Resultados verificados a mano (usados como tests):

- `f*_1 = [0, 5, 9, 14, 19, 21]` para `s_1 = 0..5`
- `f*_2 = [0, 6, 11, 16, 20, 25]` para `s_2 = 0..5`
- `d*_2`: `s=0→{0}`, `s=1→{1}`, `s=2→{1,2}`, `s=3→{2}`, `s=4→{1,2,3}`, `s=5→{1,2}`
- `f*_3(5) = 25`, `d*_3 ∈ {0, 2}`
- Tres políticas óptimas globales, todas con total 25, como `(d_3, d_2, d_1)`:
  - `(0, 1, 4)` → 0 + 6 + 19
  - `(0, 2, 3)` → 0 + 11 + 14
  - `(2, 2, 1)` → 9 + 11 + 5

## Arquitectura

```
/src
  /engine                  ← TypeScript puro, sin imports de React/DOM
    types.ts
    solve.ts                ← construcción de tablas por inducción hacia atrás
    backtrack.ts             ← enumeración de todas las políticas óptimas
    trace.ts                 ← generación de steps[] para la animación futura
    index.ts
  /engine/__tests__
    elPrimo.test.ts
    edgeCases.test.ts
  demo.ts                    ← script de src/, invocado por npm run demo
```

Stack: Vite (plantilla `vanilla-ts`) + TypeScript `strict: true` + Vitest.
Sin React, sin Tailwind, sin librerías de grafos, sin dependencias más allá
de `vitest`/`typescript`.

## Contrato de datos

```ts
export type Sense = 'max' | 'min';

export interface StageDef {
  id: string;
  label: string;
  payoff: number[];        // payoff[d] para d = 0..resources
}

export interface DPProblem {
  resources: number;       // N, entero >= 0
  stages: StageDef[];      // índice 0 => k=1, índice K-1 => k=K
  sense: Sense;
}

export interface Cell {
  d: number;
  pk: number;
  prevState: number;       // s_{k-1} = s_k - d
  fPrev: number;
  value: number;           // pk (+/-) fPrev según sense
  feasible: boolean;       // false cuando d > s_k
  isOptimal: boolean;      // true si value === fStar de su fila (tolerancia EPS)
}

export interface Row {
  state: number;           // s_k
  cells: Cell[];            // longitud resources+1, incluidas infactibles
  fStar: number;
  dStar: number[];          // siempre array, ascendente, nunca vacío si state >= 0
}

export interface StageResult {
  k: number;
  label: string;
  rows: Row[];               // ordenadas por state, 0..resources
}

export interface Policy {
  decisions: number[];       // decisions[i] = d para etapa k=i+1
  states: number[];          // states[i] = s_k a la entrada de la etapa k=i+1
  contributions: number[];   // contributions[i] = p_k(d_k)
  total: number;
}

export type Step =
  | { type: 'enter-stage'; k: number }
  | { type: 'enter-row'; k: number; state: number }
  | { type: 'eval-cell'; k: number; state: number; d: number; prevState: number; value: number }
  | { type: 'commit-row'; k: number; state: number; fStar: number; dStar: number[] }
  | { type: 'begin-backtrack' }
  | { type: 'backtrack-pick'; policyIndex: number; k: number; state: number; d: number }
  | { type: 'done' };

export interface Solution {
  problem: DPProblem;
  stages: StageResult[];
  policies: Policy[];
  steps: Step[];
  optimalValue: number;
  truncated?: boolean;       // true si se alcanzó el tope de 200 políticas
}

export function solve(problem: DPProblem): Solution;
```

### Reglas de diseño no negociables

1. `dStar` siempre `number[]`, ascendente, nunca vacío para `state >= 0`.
2. Cada `Cell` guarda `prevState` y `fPrev` — el hover-linkage de la Fase 2
   lee un campo, no recalcula.
3. Se materializan también las celdas infactibles (`d > s_k`), tabla
   rectangular.
4. `steps[]` plano y cronológico; el render de la Fase 2 es una función pura
   `(solution, stepIndex) => vista`, sin efectos secundarios en la
   generación de la traza.
5. `solve` es pura: no muta su entrada, no usa estado global, no imprime.
6. Comparación de flotantes con `EPS = 1e-9` para empates, nunca `===`.
7. `sense: 'min'` invierte la comparación de optimalidad; nada más cambia.

### Decisiones de diseño resueltas en esta sesión (huecos del contrato original)

- **`Solution.truncated?: boolean`**: agregado a la interfaz. El texto
  original de backtracking y el test de payoffs-en-cero lo mencionaban pero
  la interfaz no lo declaraba.
- **Celdas infactibles (`d > s_k`)**: `prevState = s_k - d` (se deja
  negativo deliberadamente, fuera del rango visible de la etapa anterior —
  señal explícita de "no aplica"), `fPrev = NaN`, `value = NaN`,
  `isOptimal = false`. **Regla para la Fase 2**: la UI debe chequear
  `feasible` antes de usar `prevState`/`fPrev`/`value`; nunca asumir que
  `prevState` cae dentro del rango de filas de `k-1` solo porque el campo
  existe.
- **Eventos `eval-cell`**: se emiten únicamente para celdas factibles. Las
  infactibles existen en `Row.cells` para el render rectangular, pero no
  representan una evaluación real de la recursión de Bellman y no generan
  step (evita ruido en el futuro reproductor paso a paso).
- **Orden de `backtrack-pick` en `steps[]`**: agrupado por política, en el
  mismo orden en que aparecen en `policies[]` (DFS determinista sobre
  `dStar` ascendente). Para la política `i`, sus picks son contiguos y van
  de `k=K` hacia `k=1`, antes de pasar a la política `i+1`.

## Backtracking (`backtrack.ts`)

DFS desde `s_K = N` siguiendo los conjuntos `dStar`, en orden ascendente de
`d` para determinismo. Tope de seguridad: 200 políticas; al alcanzarlo se
detiene y `Solution.truncated = true`. Cada `Policy` trae `states` y
`contributions` además de `decisions`, para que la Fase 2 dibuje la ruta en
el grafo sin recalcular.

## Tests

- Caso El Primo completo: `f*_1`, `f*_2`, `f*_3`, conjuntos `d*`, valor 25 y
  exactamente las 3 políticas listadas (comparadas como conjunto).
- `resources = 0`: una fila por etapa, todo cero, política trivial.
- Una sola etapa (`K = 1`).
- Payoffs no monótonos: el motor debe elegir bien igual.
- Payoffs todos en cero: una política por combinación hasta el tope de 200,
  con `truncated: true`.
- `sense: 'min'` con la misma matriz: resultado mínimo coherente.
- Invariante estructural: para toda fila, `fStar` iguala el `value` de toda
  celda con `isOptimal: true` (tolerancia EPS), y ninguna celda factible
  supera a `fStar` (según `sense`).
- Invariante de traza: cantidad de `commit-row` == cantidad total de filas;
  todo `eval-cell` de la etapa `k` referencia un `prevState` dentro del
  rango válido de la etapa `k-1`.

## Convenciones

- TypeScript `strict: true`, sin `any`, sin `!` non-null assertion.
- Comentarios en español, breves, solo donde la matemática no sea obvia.
- Sin dependencias externas más allá de `vitest`/`typescript`.
- Git inicializado, commits pequeños y descriptivos.

## Entregable de esta fase

1. Proyecto Vite + TS strict + Vitest inicializado con `npm`.
2. `src/engine/` completo según el contrato.
3. Suite de tests en verde (`npm test`).
4. `npm run demo`: resuelve El Primo, imprime en consola las tres tablas en
   ASCII y las políticas óptimas.
5. `README.md` corto: modelo matemático + cómo correr tests y demo.

## Fuera de alcance (explícitamente pospuesto)

Toda la UI: tablas interactivas, hover-linkage visual, reproductor paso a
paso, grafo de estados con rutas resaltadas, matriz editable. El contrato de
datos de esta fase está diseñado para soportarlas sin recálculo, pero no se
implementan aquí.
