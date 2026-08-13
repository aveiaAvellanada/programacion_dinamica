# Motor de Programación Dinámica (Fase 1) — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el motor headless (TypeScript puro, sin UI) de Programación Dinámica Multietapa Determinística — construcción de tablas por inducción hacia atrás, enumeración de todas las políticas óptimas ante empates, y una traza de eventos para la futura animación — con su suite de tests y un demo de consola, según el spec aprobado en `docs/superpowers/specs/2026-08-12-dp-engine-phase1-design.md`.

**Architecture:** Pipeline de 3 funciones puras encadenadas por `index.ts`: `buildStages` (solve.ts) construye las tablas etapa por etapa desde `k=1` hasta `k=K`, materializando cada `Row`/`Cell` (incluidas las infactibles); `enumeratePolicies` (backtrack.ts) hace DFS determinista desde `s_K=N` siguiendo los conjuntos `dStar` ya calculados, con tope de 200 políticas; `buildSteps` (trace.ts) recorre las tablas y políticas ya materializadas (no recalcula nada) para producir el array plano `steps[]`. Los tres se combinan en `solve(problem): Solution`.

**Tech Stack:** Vite (sin scaffolding interactivo — configuración manual) + TypeScript `strict: true` + Vitest. Sin dependencias de runtime más allá de esas tres.

**Todas las rutas son relativas a la raíz del proyecto:** `C:\Users\camil\Documents\modelos_deterministicos`. Todos los comandos se ejecutan desde ahí.

---

## Task 1: Scaffolding del proyecto

**Files:**
- Create: `package.json` (vía `npm init` + `npm pkg set`)
- Create: `tsconfig.json`
- Create: `tsconfig.demo.json`
- Create: `index.html`
- Create: `.gitignore`

- [ ] **Step 1: Inicializar package.json e instalar dependencias**

```bash
npm init -y
npm install -D typescript vite vitest
```

Expected: `package.json` creado, `node_modules/` poblado, `devDependencies` con `typescript`, `vite`, `vitest`.

- [ ] **Step 2: Configurar scripts en package.json**

```bash
npm pkg set scripts.dev="vite"
npm pkg set scripts.build="vite build"
npm pkg set scripts.test="vitest run"
npm pkg set "scripts.test:watch=vitest"
npm pkg set scripts.demo="tsc -p tsconfig.demo.json && node dist-demo/demo.js"
```

Expected: cada comando termina sin error; `package.json` queda con esos 5 scripts.

- [ ] **Step 3: Crear tsconfig.json (config principal, strict, para Vite/Vitest)**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Crear tsconfig.demo.json (config de build CommonJS para `npm run demo`)**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist-demo",
    "rootDir": "src"
  },
  "include": ["src/engine/**/*.ts", "src/demo.ts"],
  "exclude": ["src/engine/__tests__/**"]
}
```

- [ ] **Step 5: Crear index.html mínimo**

```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <title>Motor DP — Fase 1</title>
  </head>
  <body>
    <p>Fase 1: motor headless. Todavía sin UI — corre <code>npm test</code> o <code>npm run demo</code>.</p>
  </body>
</html>
```

- [ ] **Step 6: Crear .gitignore**

```
node_modules/
dist/
dist-demo/
```

- [ ] **Step 7: Crear la estructura de carpetas de src**

```bash
mkdir -p src/engine/__tests__
```

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json tsconfig.json tsconfig.demo.json index.html .gitignore
git commit -m "chore: scaffold project (Vite + TS strict + Vitest, sin UI)"
```

---

## Task 2: Contrato de tipos (`src/engine/types.ts`)

**Files:**
- Create: `src/engine/types.ts`

- [ ] **Step 1: Escribir types.ts**

```ts
export type Sense = 'max' | 'min';

export interface StageDef {
  id: string;
  label: string;
  /** payoff[d] para d = 0..resources */
  payoff: number[];
}

export interface DPProblem {
  /** N, entero >= 0 */
  resources: number;
  /** índice 0 => k=1 (última etapa evaluada), índice K-1 => k=K (etapa inicial) */
  stages: StageDef[];
  sense: Sense;
}

export interface Cell {
  d: number;
  pk: number;
  /**
   * s_{k-1} = s_k - d. Si feasible=false, este valor puede ser negativo
   * (fuera del rango de filas de la etapa anterior) — es una señal
   * deliberada de "no aplica", nunca un índice real a consultar.
   */
  prevState: number;
  /** NaN cuando feasible=false */
  fPrev: number;
  /** pk + fPrev; NaN cuando feasible=false */
  value: number;
  /** false cuando d > s_k */
  feasible: boolean;
  /** true si value === fStar de su fila (con tolerancia EPS) */
  isOptimal: boolean;
}

export interface Row {
  state: number;
  /** longitud resources+1, incluidas las infactibles */
  cells: Cell[];
  fStar: number;
  /** siempre array, ascendente, nunca vacío si state >= 0 */
  dStar: number[];
}

export interface StageResult {
  k: number;
  label: string;
  /** ordenadas por state ascendente, de 0 a resources; rows[s] tiene state === s */
  rows: Row[];
}

export interface Policy {
  /** decisions[i] = d para la etapa k=i+1 */
  decisions: number[];
  /** states[i] = s_k a la entrada de la etapa k=i+1 */
  states: number[];
  /** contributions[i] = p_k(d_k) */
  contributions: number[];
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
  /** true si se alcanzó el tope de 200 políticas durante el backtracking */
  truncated?: boolean;
}
```

- [ ] **Step 2: Verificar que compila**

```bash
npx tsc --noEmit
```

Expected: sin salida, exit code 0 (no hay lógica aún, solo tipos — nada que pueda fallar salvo un typo).

- [ ] **Step 3: Commit**

```bash
git add src/engine/types.ts
git commit -m "feat: define DP engine data contract (types.ts)"
```

---

## Task 3: Motor completo (`solve.ts`, `backtrack.ts`, `trace.ts`, `index.ts`) + suite "El Primo"

Este task cubre un solo ciclo red→green: el test importa `solve` desde `../index`, que no existe todavía (red por error de resolución de módulo), y los 4 archivos de implementación se escriben juntos para hacerlo pasar (green), porque estos módulos son un único algoritmo cohesivo — no tienen contratos independientes fuera de `types.ts`.

**Files:**
- Create: `src/engine/__tests__/testUtils.ts`
- Create: `src/engine/__tests__/elPrimo.test.ts`
- Create: `src/engine/solve.ts`
- Create: `src/engine/backtrack.ts`
- Create: `src/engine/trace.ts`
- Create: `src/engine/index.ts`

- [ ] **Step 1: Escribir el helper de invariantes reutilizable (testUtils.ts)**

```ts
import { expect } from 'vitest';
import type { Solution } from '../types';

const EPS = 1e-9;

/** Para toda fila: fStar coincide con el value de toda celda isOptimal, y ninguna celda factible la supera (según sense). */
export function assertStructuralInvariants(solution: Solution): void {
  const { sense } = solution.problem;
  for (const stage of solution.stages) {
    for (const row of stage.rows) {
      const feasibleCells = row.cells.filter((c) => c.feasible);
      const optimalCells = feasibleCells.filter((c) => c.isOptimal);

      expect(optimalCells.length).toBeGreaterThan(0);
      expect(row.dStar).toEqual(optimalCells.map((c) => c.d).sort((a, b) => a - b));

      for (const cell of optimalCells) {
        expect(Math.abs(cell.value - row.fStar)).toBeLessThan(EPS);
      }
      for (const cell of feasibleCells) {
        if (sense === 'max') {
          expect(cell.value).toBeLessThanOrEqual(row.fStar + EPS);
        } else {
          expect(cell.value).toBeGreaterThanOrEqual(row.fStar - EPS);
        }
      }
    }
  }
}

/** commit-row cuenta igual que el total de filas; todo eval-cell referencia un prevState en rango. */
export function assertTraceInvariants(solution: Solution): void {
  const totalRows = solution.stages.reduce((sum, s) => sum + s.rows.length, 0);
  const commitRowCount = solution.steps.filter((s) => s.type === 'commit-row').length;
  expect(commitRowCount).toBe(totalRows);

  const resources = solution.problem.resources;
  for (const step of solution.steps) {
    if (step.type === 'eval-cell') {
      expect(step.prevState).toBeGreaterThanOrEqual(0);
      expect(step.prevState).toBeLessThanOrEqual(resources);
    }
  }
}
```

- [ ] **Step 2: Escribir elPrimo.test.ts**

```ts
import { describe, it, expect } from 'vitest';
import { solve } from '../index';
import type { DPProblem } from '../types';
import { assertStructuralInvariants, assertTraceInvariants } from './testUtils';

const elPrimo: DPProblem = {
  resources: 5,
  sense: 'max',
  stages: [
    { id: 'tienda-1', label: 'Tienda 1', payoff: [0, 5, 9, 14, 19, 21] },
    { id: 'tienda-2', label: 'Tienda 2', payoff: [0, 6, 11, 15, 17, 22] },
    { id: 'tienda-3', label: 'Tienda 3', payoff: [0, 4, 9, 13, 18, 20] },
  ],
};

describe('El Primo — resultados verificados a mano', () => {
  const solution = solve(elPrimo);

  it('f*_1 coincide con el óptimo de la etapa 1 (caso base f*_0=0)', () => {
    expect(solution.stages[0].rows.map((r) => r.fStar)).toEqual([0, 5, 9, 14, 19, 21]);
  });

  it('f*_2 coincide con los valores esperados', () => {
    expect(solution.stages[1].rows.map((r) => r.fStar)).toEqual([0, 6, 11, 16, 20, 25]);
  });

  it('d*_2 tiene los conjuntos de empate esperados por estado', () => {
    expect(solution.stages[1].rows.map((r) => r.dStar)).toEqual([
      [0],
      [1],
      [1, 2],
      [2],
      [1, 2, 3],
      [1, 2],
    ]);
  });

  it('f*_3(5) = 25 con d*_3 = {0, 2}', () => {
    const row5 = solution.stages[2].rows[5];
    expect(row5.fStar).toBe(25);
    expect(row5.dStar).toEqual([0, 2]);
  });

  it('el valor óptimo global es 25 y no está truncado', () => {
    expect(solution.optimalValue).toBe(25);
    expect(solution.truncated).toBeUndefined();
  });

  it('produce exactamente las 3 políticas óptimas esperadas', () => {
    const got = solution.policies.map((p) => p.decisions.join(',')).sort();
    const expected = ['4,1,0', '3,2,0', '1,2,2'].sort();
    expect(got).toEqual(expected);
    expect(solution.policies).toHaveLength(3);
    for (const policy of solution.policies) {
      expect(policy.total).toBe(25);
    }
  });

  it('cumple los invariantes estructurales y de traza', () => {
    assertStructuralInvariants(solution);
    assertTraceInvariants(solution);
  });
});
```

- [ ] **Step 3: Correr los tests y verificar que fallan por el motivo correcto**

```bash
npm test
```

Expected: FAIL — no puede resolver el módulo `../index` (todavía no existe ningún archivo de implementación).

- [ ] **Step 4: Implementar solve.ts (construcción de etapas por inducción hacia atrás)**

```ts
import type { Cell, DPProblem, Row, Sense, StageResult } from './types';

const EPS = 1e-9;

type RawCell = Omit<Cell, 'isOptimal'>;

function pickOptimal(sense: Sense, candidates: { d: number; value: number }[]): { fStar: number; dStar: number[] } {
  let fStar = sense === 'max' ? -Infinity : Infinity;
  for (const c of candidates) {
    if (sense === 'max' ? c.value > fStar : c.value < fStar) {
      fStar = c.value;
    }
  }
  const dStar = candidates
    .filter((c) => Math.abs(c.value - fStar) < EPS)
    .map((c) => c.d)
    .sort((a, b) => a - b);
  return { fStar, dStar };
}

/** Backward induction: procesa las etapas en orden k=1..K, cada una consultando f* de la etapa anterior ya construida. */
export function buildStages(problem: DPProblem): StageResult[] {
  const { resources, stages: stageDefs, sense } = problem;
  const result: StageResult[] = [];

  stageDefs.forEach((def, i) => {
    const k = i + 1;
    const prevStage = i === 0 ? null : result[i - 1];
    const rows: Row[] = [];

    for (let s = 0; s <= resources; s++) {
      const raw: RawCell[] = [];

      for (let d = 0; d <= resources; d++) {
        const feasible = d <= s;
        const pk = def.payoff[d];
        const prevState = s - d;

        if (feasible) {
          const fPrev = prevStage === null ? 0 : prevStage.rows[prevState].fStar;
          raw.push({ d, pk, prevState, fPrev, value: pk + fPrev, feasible: true });
        } else {
          raw.push({ d, pk, prevState, fPrev: NaN, value: NaN, feasible: false });
        }
      }

      const { fStar, dStar } = pickOptimal(
        sense,
        raw.filter((r) => r.feasible).map((r) => ({ d: r.d, value: r.value })),
      );

      const cells: Cell[] = raw.map((r) => ({
        ...r,
        isOptimal: r.feasible && Math.abs(r.value - fStar) < EPS,
      }));

      rows.push({ state: s, cells, fStar, dStar });
    }

    result.push({ k, label: def.label, rows });
  });

  return result;
}
```

- [ ] **Step 5: Implementar backtrack.ts (enumeración de todas las políticas óptimas)**

```ts
import type { DPProblem, Policy, StageResult } from './types';

const MAX_POLICIES = 200;

/** DFS determinista desde s_K=N siguiendo dStar en orden ascendente, con tope de seguridad. */
export function enumeratePolicies(
  problem: DPProblem,
  stages: StageResult[],
): { policies: Policy[]; truncated: boolean } {
  const policies: Policy[] = [];
  let truncated = false;
  const total = stages[stages.length - 1].rows[problem.resources].fStar;

  function dfs(stageIdx: number, state: number, decisions: number[], states: number[], contributions: number[]): void {
    if (truncated) return;
    const row = stages[stageIdx].rows[state];

    for (const d of row.dStar) {
      if (truncated) return;
      const cell = row.cells[d];

      decisions.push(d);
      states.push(state);
      contributions.push(cell.pk);

      if (stageIdx === 0) {
        if (policies.length >= MAX_POLICIES) {
          truncated = true;
        } else {
          policies.push({
            decisions: [...decisions].reverse(),
            states: [...states].reverse(),
            contributions: [...contributions].reverse(),
            total,
          });
        }
      } else {
        dfs(stageIdx - 1, cell.prevState, decisions, states, contributions);
      }

      decisions.pop();
      states.pop();
      contributions.pop();
    }
  }

  dfs(stages.length - 1, problem.resources, [], [], []);
  return { policies, truncated };
}
```

- [ ] **Step 6: Implementar trace.ts (traza plana a partir de las tablas y políticas ya materializadas)**

```ts
import type { Policy, StageResult, Step } from './types';

export function buildSteps(stages: StageResult[], policies: Policy[]): Step[] {
  const steps: Step[] = [];

  for (const stage of stages) {
    steps.push({ type: 'enter-stage', k: stage.k });
    for (const row of stage.rows) {
      steps.push({ type: 'enter-row', k: stage.k, state: row.state });
      for (const cell of row.cells) {
        if (cell.feasible) {
          steps.push({
            type: 'eval-cell',
            k: stage.k,
            state: row.state,
            d: cell.d,
            prevState: cell.prevState,
            value: cell.value,
          });
        }
      }
      steps.push({ type: 'commit-row', k: stage.k, state: row.state, fStar: row.fStar, dStar: row.dStar });
    }
  }

  steps.push({ type: 'begin-backtrack' });
  policies.forEach((policy, policyIndex) => {
    for (let i = policy.decisions.length - 1; i >= 0; i--) {
      steps.push({
        type: 'backtrack-pick',
        policyIndex,
        k: i + 1,
        state: policy.states[i],
        d: policy.decisions[i],
      });
    }
  });
  steps.push({ type: 'done' });

  return steps;
}
```

- [ ] **Step 7: Implementar index.ts (orquestador público)**

```ts
import type { DPProblem, Solution } from './types';
import { buildStages } from './solve';
import { enumeratePolicies } from './backtrack';
import { buildSteps } from './trace';

export * from './types';

export function solve(problem: DPProblem): Solution {
  const stages = buildStages(problem);
  const { policies, truncated } = enumeratePolicies(problem, stages);
  const steps = buildSteps(stages, policies);
  const lastStage = stages[stages.length - 1];
  const optimalValue = lastStage.rows[problem.resources].fStar;

  return {
    problem,
    stages,
    policies,
    steps,
    optimalValue,
    ...(truncated ? { truncated: true as const } : {}),
  };
}
```

- [ ] **Step 8: Correr los tests y verificar que pasan**

```bash
npm test
```

Expected: PASS — los 7 tests de `elPrimo.test.ts` en verde.

- [ ] **Step 9: Verificar tipos en modo estricto**

```bash
npx tsc --noEmit
```

Expected: sin salida, exit code 0.

- [ ] **Step 10: Commit**

```bash
git add src/engine/solve.ts src/engine/backtrack.ts src/engine/trace.ts src/engine/index.ts src/engine/__tests__/testUtils.ts src/engine/__tests__/elPrimo.test.ts
git commit -m "feat: implement DP engine core (solve, backtrack, trace) + El Primo suite"
```

---

## Task 4: Casos borde (`edgeCases.test.ts`)

El motor ya está completo tras el Task 3; este task es puramente de cobertura de regresión. Si algún test falla, es una señal de un bug real en la implementación del Task 3 — depurar ahí, no añadir casos especiales nuevos al motor.

**Files:**
- Create: `src/engine/__tests__/edgeCases.test.ts`

- [ ] **Step 1: Escribir edgeCases.test.ts**

```ts
import { describe, it, expect } from 'vitest';
import { solve } from '../index';
import type { DPProblem } from '../types';
import { assertStructuralInvariants, assertTraceInvariants } from './testUtils';

describe('resources = 0', () => {
  const problem: DPProblem = {
    resources: 0,
    sense: 'max',
    stages: [
      { id: 'a', label: 'A', payoff: [0] },
      { id: 'b', label: 'B', payoff: [0] },
    ],
  };
  const solution = solve(problem);

  it('cada etapa tiene una única fila en cero', () => {
    for (const stage of solution.stages) {
      expect(stage.rows).toHaveLength(1);
      expect(stage.rows[0].state).toBe(0);
      expect(stage.rows[0].fStar).toBe(0);
      expect(stage.rows[0].dStar).toEqual([0]);
    }
  });

  it('produce una única política trivial con valor 0', () => {
    expect(solution.optimalValue).toBe(0);
    expect(solution.policies).toEqual([
      { decisions: [0, 0], states: [0, 0], contributions: [0, 0], total: 0 },
    ]);
  });

  it('cumple los invariantes estructurales y de traza', () => {
    assertStructuralInvariants(solution);
    assertTraceInvariants(solution);
  });
});

describe('una sola etapa (K=1) con payoffs no monótonos', () => {
  const problem: DPProblem = {
    resources: 3,
    sense: 'max',
    stages: [{ id: 'unica', label: 'Única etapa', payoff: [0, 10, 3, 3] }],
  };
  const solution = solve(problem);

  it('elige d=1 en cada estado donde es factible, no el mayor d disponible', () => {
    expect(solution.stages).toHaveLength(1);
    expect(solution.stages[0].rows.map((r) => r.fStar)).toEqual([0, 10, 10, 10]);
    expect(solution.stages[0].rows[2].dStar).toEqual([1]);
    expect(solution.stages[0].rows[3].dStar).toEqual([1]);
  });

  it('produce una única política óptima con d_1=1 y valor 10', () => {
    expect(solution.optimalValue).toBe(10);
    expect(solution.policies).toHaveLength(1);
    expect(solution.policies[0].decisions).toEqual([1]);
    expect(solution.policies[0].total).toBe(10);
  });

  it('cumple los invariantes estructurales y de traza', () => {
    assertStructuralInvariants(solution);
    assertTraceInvariants(solution);
  });
});

describe('payoffs en cero — explosión combinatoria y truncamiento', () => {
  const problem: DPProblem = {
    resources: 5,
    sense: 'max',
    stages: Array.from({ length: 6 }, (_, i) => ({
      id: `etapa-${i + 1}`,
      label: `Etapa ${i + 1}`,
      payoff: [0, 0, 0, 0, 0, 0],
    })),
  };
  const solution = solve(problem);

  it('trunca en 200 políticas y marca el flag truncated', () => {
    expect(solution.policies).toHaveLength(200);
    expect(solution.truncated).toBe(true);
  });

  it('todas las políticas truncadas suman el óptimo (0)', () => {
    for (const policy of solution.policies) {
      expect(policy.total).toBe(0);
    }
  });

  it('cumple los invariantes estructurales y de traza', () => {
    assertStructuralInvariants(solution);
    assertTraceInvariants(solution);
  });
});

describe('sense: min con la matriz de El Primo', () => {
  const problem: DPProblem = {
    resources: 5,
    sense: 'min',
    stages: [
      { id: 'tienda-1', label: 'Tienda 1', payoff: [0, 5, 9, 14, 19, 21] },
      { id: 'tienda-2', label: 'Tienda 2', payoff: [0, 6, 11, 15, 17, 22] },
      { id: 'tienda-3', label: 'Tienda 3', payoff: [0, 4, 9, 13, 18, 20] },
    ],
  };
  const solution = solve(problem);

  it('con payoffs crecientes, el mínimo siempre elige d=0', () => {
    expect(solution.stages[0].rows.map((r) => r.fStar)).toEqual([0, 0, 0, 0, 0, 0]);
    expect(solution.stages[2].rows[5].fStar).toBe(0);
    expect(solution.optimalValue).toBe(0);
  });

  it('produce una única política con todas las decisiones en 0', () => {
    expect(solution.policies).toHaveLength(1);
    expect(solution.policies[0].decisions).toEqual([0, 0, 0]);
  });

  it('cumple los invariantes estructurales y de traza', () => {
    assertStructuralInvariants(solution);
    assertTraceInvariants(solution);
  });
});
```

- [ ] **Step 2: Correr los tests**

```bash
npm test
```

Expected: PASS — los 4 `describe` de `edgeCases.test.ts` (12 tests) en verde, además de los 7 de `elPrimo.test.ts` ya existentes (19 en total).

- [ ] **Step 3: Commit**

```bash
git add src/engine/__tests__/edgeCases.test.ts
git commit -m "test: cover edge cases (resources=0, K=1, no-monotonic, ties truncation, sense=min)"
```

---

## Task 5: Script de demo (`src/demo.ts`)

**Files:**
- Create: `src/demo.ts`

- [ ] **Step 1: Escribir demo.ts**

```ts
import { solve, type DPProblem, type Solution } from './engine';

const elPrimo: DPProblem = {
  resources: 5,
  sense: 'max',
  stages: [
    { id: 'tienda-1', label: 'Tienda 1', payoff: [0, 5, 9, 14, 19, 21] },
    { id: 'tienda-2', label: 'Tienda 2', payoff: [0, 6, 11, 15, 17, 22] },
    { id: 'tienda-3', label: 'Tienda 3', payoff: [0, 4, 9, 13, 18, 20] },
  ],
};

function printStageTable(solution: Solution, k: number): void {
  const stage = solution.stages.find((s) => s.k === k);
  if (!stage) return;
  const resources = solution.problem.resources;

  const header = ['s\\d', ...Array.from({ length: resources + 1 }, (_, d) => `d=${d}`), 'f*', 'd*'];
  const rows = stage.rows.map((row) => [
    String(row.state),
    ...row.cells.map((c) => (c.feasible ? String(c.value) : '—')),
    String(row.fStar),
    `{${row.dStar.join(',')}}`,
  ]);

  const widths = header.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)));
  const formatRow = (cells: string[]) => cells.map((c, i) => c.padStart(widths[i])).join(' | ');

  console.log(`\n=== Etapa k=${k} — ${stage.label} ===`);
  console.log(formatRow(header));
  console.log(widths.map((w) => '-'.repeat(w)).join('-+-'));
  for (const r of rows) console.log(formatRow(r));
}

function printPolicies(solution: Solution): void {
  console.log(`\n=== Políticas óptimas (valor total = ${solution.optimalValue}) ===`);
  if (solution.truncated) {
    console.log(`(!) Truncado en ${solution.policies.length} políticas`);
  }
  solution.policies.forEach((policy, i) => {
    const parts = policy.decisions.map((d, idx) => `d_${idx + 1}=${d} (+${policy.contributions[idx]})`);
    console.log(`Política ${i + 1}: ${parts.join(', ')} => total ${policy.total}`);
  });
}

const solution = solve(elPrimo);
for (const stage of solution.stages) {
  printStageTable(solution, stage.k);
}
printPolicies(solution);
```

- [ ] **Step 2: Correr el demo**

```bash
npm run demo
```

Expected: compila sin errores y, en la salida de consola, la etapa `k=3` muestra `f*=25` y `d*={0,2}` en la fila `s=5`; la sección de políticas lista exactamente 3 políticas, todas con `total 25`.

- [ ] **Step 3: Commit**

```bash
git add src/demo.ts
git commit -m "feat: add console demo for El Primo (three ASCII tables + optimal policies)"
```

---

## Task 6: README.md

**Files:**
- Create: `README.md`

- [ ] **Step 1: Escribir README.md**

```markdown
# Motor de Programación Dinámica Multietapa Determinística

Fase 1: motor algorítmico headless (sin UI) para un visualizador de
Programación Dinámica de Investigación de Operaciones — la variante con
tablas explícitas de inducción hacia atrás (`s_k`, `d_k`,
`s_{k-1} = s_k - d_k`), no un DP estilo LeetCode.

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

## Uso

\`\`\`bash
npm install
npm test        # corre la suite de Vitest
npm run demo    # resuelve "Supermercados El Primo" e imprime las tablas
\`\`\`

## Estructura

\`\`\`
src/engine/            motor puro (sin imports de React/DOM)
  types.ts               contrato de datos
  solve.ts                construcción de tablas por inducción hacia atrás
  backtrack.ts             enumeración de todas las políticas óptimas
  trace.ts                  generación de steps[] para la futura animación
  index.ts                   solve(problem): Solution
  __tests__/                  elPrimo.test.ts, edgeCases.test.ts, testUtils.ts
src/demo.ts             script invocado por `npm run demo`
\`\`\`
```

(Nota: al escribir el archivo real, usar backticks normales para los bloques de código — aquí se muestran como `\`\`\`` solo porque este plan ya está dentro de un bloque de código markdown.)

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with math model and usage instructions"
```

---

## Task 7: Verificación final

**Files:** ninguno (solo verificación)

- [ ] **Step 1: Suite completa**

```bash
npm test
```

Expected: todos los tests en verde (19 tests: 7 de `elPrimo.test.ts` + 12 de `edgeCases.test.ts`).

- [ ] **Step 2: Type-check estricto**

```bash
npx tsc --noEmit
```

Expected: sin salida, exit code 0.

- [ ] **Step 3: Demo**

```bash
npm run demo
```

Expected: imprime las 3 tablas y las 3 políticas óptimas sin errores.

- [ ] **Step 4: Confirmar estado del repo**

```bash
git status
```

Expected: working tree limpio (todo commiteado en tasks anteriores).

---

## Self-review (cobertura contra el spec)

- Contrato de datos (types.ts): Task 2, íntegro.
- `f*_1`, `f*_2`, `d*_2`, `f*_3(5)`, `d*_3`, 3 políticas: Task 3, `elPrimo.test.ts`.
- `resources=0`, `K=1`, no monótono, empates+truncamiento, `sense:'min'`: Task 4, `edgeCases.test.ts`.
- Invariante estructural y de traza: `testUtils.ts` (Task 3), aplicado en todos los describe de ambos archivos de test.
- `npm run demo` con 3 tablas ASCII + políticas: Task 5.
- `README.md` con modelo matemático + uso: Task 6.
- Decisiones de diseño resueltas (huecos del contrato original — `truncated`, semántica de celdas infactibles, `eval-cell` solo en factibles, orden de `backtrack-pick`): ya incorporadas directamente en el código de Task 3 (no quedan como huecos).
