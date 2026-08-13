# HANDOFF — Fase 2 (UI React) del Motor de Programación Dinámica

Este documento existe para que **cualquier IA** (Claude, Gemini, u otra)
pueda retomar este proyecto sin contexto previo si la sesión que lo escribió
se corta. Léelo completo antes de tocar código.

## Qué es este proyecto

`C:\Users\camil\Documents\modelos_deterministicos` — visualizador de
Programación Dinámica Multietapa Determinística (curso de Investigación de
Operaciones, Universidad de la Amazonia). Es la variante de IO con
inducción hacia atrás explícita (estados `s_k`, decisiones `d_k`,
transición `s_{k-1}=s_k-d_k`), con empates tratados como ciudadanos de
primera clase — no un DP estilo LeetCode.

**Fase 1** (motor headless, sin UI) está terminada, revisada y aprobada.
Documentos: `docs/superpowers/specs/2026-08-12-dp-engine-phase1-design.md`
(contrato de datos + decisiones de diseño) y
`docs/superpowers/plans/2026-08-12-dp-engine-phase1-plan.md` (plan
ejecutado task por task). El motor vive en `src/engine/` y NO se debe tocar
su lógica salvo que encuentres un bug real — está probado con 19 tests
(`npm test`) y revisado exhaustivamente.

**Fase 2** (UI React) se está construyendo ahora, **sin el proceso pesado
de brainstorming/plan/subagentes** que se usó en Fase 1 — el usuario pidió
explícitamente ir rápido porque se le acababa el tiempo de sesión. Se
construyó directamente, verificando con `tsc --noEmit` + `npm run build` +
`npm test` en cada paso, sin despachar subagentes de revisión.

## Estado actual (commit `68e00ee`, siguiente será posterior a este)

Ya implementado y committeado:

- **React montado sobre Vite** (`vite.config.ts`, `@vitejs/plugin-react`,
  `tsconfig.json` con `"jsx": "react-jsx"`, `src/vite-env.d.ts` para los
  tipos de `import.meta`/CSS). `index.html` ahora monta `<div id="root">` y
  carga `src/main.tsx`.
- **`src/ui/useSolution.ts`**: hook con el estado del `DPProblem` (arranca
  con el problema "El Primo") y `solution = useMemo(() => solve(problem))`
  — recalcula en vivo con cada edición.
- **`src/ui/ProblemEditor.tsx`**: edita `resources`, `sense`, labels de
  etapa, agrega/quita etapas, y edita cada valor de la matriz de payoffs.
  Al cambiar `resources`, redimensiona los arrays de payoff (rellena con 0
  o trunca).
- **`src/ui/StageTable.tsx`**: renderiza cada `StageResult` como tabla
  `s × d`, con celdas infactibles en gris (`—`) y celdas óptimas
  resaltadas.
- **Hover-linkage**: al pasar el mouse por una celda factible, se resalta
  (borde azul, clase `.linked`) la(s) celda(s) óptima(s) de la fila que
  consulta en `k-1`, usando `Cell.prevState` — sin recalcular nada. Lógica
  en `App.tsx` (`linkFrom`).
- **`src/ui/StepPlayer.tsx`**: reproductor play/pausa/paso a paso sobre
  `solution.steps[]`, con descripción en español de cada evento. El paso
  actual también dispara el mismo resaltado que el hover (para
  `eval-cell`/`commit-row`) y va acumulando la ruta de la política que se
  está reconstruyendo (para `backtrack-pick`).
- **`src/ui/PolicyList.tsx`**: lista las políticas óptimas; al hacer click
  en una, resalta su ruta completa (celda elegida en cada etapa) en todas
  las tablas con un color distinto (`.path`, morado).
- **Editar el problema resetea** hover/paso/política seleccionada
  (`useEffect` en `App.tsx`) para evitar índices obsoletos tras un resize.

Verificado en esta sesión: `npx tsc --noEmit` limpio, `npm run build`
compila el bundle sin error, `npm test` sigue en 19/19, `npm run demo`
sigue funcionando. **NO se verificó visualmente en un navegador real** —
nadie ha abierto `npm run dev` y mirado la página todavía. Eso es lo
primero que hay que hacer al retomar.

## Lo que falta / se simplificó a propósito por falta de tiempo

1. **Verificación visual en navegador — pendiente.** Corre `npm run dev`,
   abre la URL que imprime (normalmente `http://localhost:5173`), y prueba:
   editar la matriz, hacer hover sobre celdas, usar el reproductor, hacer
   click en políticas. Busca errores en la consola del navegador.
2. **NO hay un grafo de estados tipo nodo-enlace separado.** El pedido
   original mencionaba "grafo de estados con múltiples rutas óptimas
   resaltadas" como una vista aparte. Lo que se construyó en su lugar es
   resaltado de rutas **dentro de las mismas tablas** (vía `PolicyList` y
   el `StepPlayer`), que cumple el mismo propósito pedagógico pero no es
   una visualización de grafo independiente. Si el usuario la sigue
   queriendo como vista separada: sería un nuevo componente
   `src/ui/StateGraph.tsx`, SVG, con nodos en una grilla `(k, s)` fija
   (no hace falta layout de fuerzas — el espacio de estados ya es discreto
   y acotado) y líneas entre `(k, s)` y `(k-1, s-d)` para cada decisión de
   la política seleccionada.
3. **Sin tests automatizados para la UI.** Fase 1 tiene 19 tests de motor;
   Fase 2 no tiene tests de componentes (Testing Library, etc.). Fue una
   decisión consciente por tiempo, no un olvido.
4. **`package.json` no tiene `"type": "module"`** (se dejó así
   intencionalmente en Fase 1 para que el build CommonJS de `npm run demo`
   funcione con `node` plano). Esto hace que `vite.config.ts` (que usa
   sintaxis ESM) dispare una advertencia de Vite sobre un futuro cambio de
   default — no rompe nada hoy, pero si algún día Vite lo vuelve estricto,
   la solución es renombrar `vite.config.ts` a `vite.config.mts`.
5. **Sin responsive/mobile**, sin accesibilidad revisada (aria-*, contraste
   WCAG), sin animaciones de transición entre highlights. Funcional pero
   sin pulir.
6. **Sin manejo de error si el usuario deja `resources` en 0 con etapas
   vacías** más allá de lo que el motor ya garantiza (siempre hay al menos
   `d=0` factible) — no debería romperse, pero no se probó explícitamente
   ese caso en la UI.

## Cómo verificar que todo sigue vivo

```bash
cd C:\Users\camil\Documents\modelos_deterministicos
npm test              # deben pasar 19/19
npx tsc --noEmit       # debe salir limpio
npm run build          # debe compilar el bundle de Vite sin error
npm run dev             # abre el visualizador real en el navegador
```

## Cómo continuar (para la próxima IA/sesión)

1. Corre los 4 comandos de arriba para confirmar que el estado sigue
   siendo el descrito aquí (si algo no coincide, confía en lo que veas, no
   en este documento).
2. Abre `npm run dev` en un navegador y haz una pasada manual — es el paso
   que quedó pendiente.
3. Si el usuario quiere el grafo de estados como vista separada, constrúyelo
   como se describe en el punto 2 de arriba.
4. Si el usuario pide seguir mejorando: pregunta primero qué le importa más
   (¿el grafo separado? ¿pulir estilos? ¿tests de UI?) — no asumas.
5. Sigue trabajando directo en `master` (así se ha hecho toda la sesión,
   con consentimiento explícito del usuario) a menos que te diga lo
   contrario.
6. No hace falta el proceso de subagentes con doble revisión que se usó en
   Fase 1 — el usuario pidió explícitamente ir rápido para esta fase.
   Usa tu criterio: para cambios grandes/riesgosos, sí vale la pena verificar
   con más cuidado.

## Memoria persistente relacionada

Si estás en Claude Code con memoria persistente activada para este
proyecto, revisa `dp-engine-phase1-progress` y `dp-engine-workflow` en el
índice de memoria — tienen contexto adicional de cómo se construyó la Fase
1 (puede estar desactualizado respecto a la Fase 2; este archivo
`HANDOFF.md` es la fuente más reciente).
