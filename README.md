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

```bash
npm install
npm test        # corre la suite de Vitest
npm run demo    # resuelve "Supermercados El Primo" e imprime las tablas
```

## Estructura

```
src/engine/            motor puro (sin imports de React/DOM)
  types.ts               contrato de datos
  solve.ts                construcción de tablas por inducción hacia atrás
  backtrack.ts             enumeración de todas las políticas óptimas
  trace.ts                  generación de steps[] para la futura animación
  index.ts                   solve(problem): Solution
  __tests__/                  elPrimo.test.ts, edgeCases.test.ts, testUtils.ts
src/demo.ts             script invocado por `npm run demo`
```
