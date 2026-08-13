# HANDOFF — Visualizador de Programación Dinámica Multietapa

Este documento existe para que **cualquier IA** (Claude, Gemini, u otra)
pueda retomar el proyecto sin contexto previo. Léelo completo antes de
tocar código.

## Qué es este proyecto

`C:\Users\camil\Documents\modelos_deterministicos` — visualizador de
Programación Dinámica Multietapa Determinística (Investigación de
Operaciones, Universidad de la Amazonia). Variante de IO con inducción
hacia atrás explícita (estados `s_k`, decisiones `d_k`, transición
`s_{k-1} = s_k - d_k`), con empates tratados como ciudadanos de primera
clase — no un DP estilo LeetCode.

## Estado: completo y verificado

**Fase 1 — motor headless (`src/engine/`)**: terminada, revisada y
aprobada. Diseño en
`docs/superpowers/specs/2026-08-12-dp-engine-phase1-design.md` y plan en
`docs/superpowers/plans/2026-08-12-dp-engine-phase1-plan.md`. **No toques su
lógica** salvo que encuentres un bug real: está cubierta por 19 pruebas y
fue revisada exhaustivamente.

**Fase 2 — interfaz React (`src/ui/`)**: implementada y pulida.

- `useSolution.ts` — estado del `DPProblem` y recálculo reactivo (`useMemo`).
- `ProblemEditor.tsx` — recursos `N`, sentido max/min, etiquetas, alta/baja
  de etapas, matriz `p_k(d)` editable, presets e importación/exportación JSON.
- `StageTable.tsx` — tabla por etapa; celdas óptimas, infactibles, empates,
  crosshair de fila/columna y desglose `p+f` al pasar el cursor.
- `CellInspector.tsx` — desglosa la celda enfocada en sus términos de
  Bellman (`p_k(d) + f*_{k-1}(s−d) = valor`) y explica la transición.
- `StateGraph.tsx` — red nodo-enlace en SVG, `f*` en cada nodo, aristas
  curvas clicables y leyenda propia.
- `StepPlayer.tsx` — reproductor de `solution.steps[]` con velocidad, barra
  de posición, insignia de fase, salto al backtracking y atajos de teclado.
- `PolicyList.tsx` — cadena completa de estados y suma de contribuciones por
  política; al seleccionarla resalta su ruta en tablas y red.
- `Legend.tsx` — leyenda de los colores de resaltado.
- `styles.css` + `polish.css` (capa de pulido, importada después).

**Modelo de interacción**: el hover previsualiza; el clic *fija* una celda
(o arista) y <kbd>Esc</kbd> la suelta. Mientras el reproductor está activo,
el paso actual manda sobre el hover. Editar el problema limpia hover,
fijado, política seleccionada y paso, para no dejar índices obsoletos.

## Verificación realizada

- `npm test` → **28/28** (19 del motor + 9 de interfaz en jsdom).
- `npx tsc --noEmit` → 0 errores (modo estricto).
- `npm run build` → bundle generado sin errores.

Las pruebas de interfaz (`src/ui/__tests__/App.smoke.test.tsx`) verifican
comportamiento real en jsdom: que monte sin errores ni warnings de React,
hover, fijado y `Esc`, avance del reproductor, resaltado de la ruta al
seleccionar una política, render de la red con sus nodos `f*` y aristas
clicables, y recálculo al editar los recursos.

## Lo único pendiente

**Nadie ha revisado la página en un navegador real.** Toda la verificación
es automatizada (tipos, build y jsdom). jsdom no calcula layout, así que
puede haber detalles visuales —desbordes, solapamientos, espaciados— que
solo se ven abriendo la app. Es lo primero que conviene hacer:

```bash
npm run dev   # y abrir la URL que imprime
```

Pasa el cursor por las tablas, fija celdas con clic, usa el reproductor,
selecciona políticas, cambia a la pestaña de red y edita la matriz.

Otros puntos abiertos, ninguno bloqueante:

- Sin validación de entrada más allá de lo que el motor garantiza (por
  ejemplo, `payoff.length` vs `resources+1` al importar un JSON a mano).
- Sin pruebas de accesibilidad (contraste WCAG, lectores de pantalla).
- `package.json` no declara `"type": "module"` a propósito, para que el
  build CommonJS de `npm run demo` corra con `node` plano; por eso el config
  de Vite es `vite.config.mts`.

## Cómo verificar que todo sigue vivo

```bash
cd C:\Users\camil\Documents\modelos_deterministicos
npm install
npm test              # 28/28
npx tsc --noEmit      # 0 errores
npm run build         # bundle en dist/
npm run dev           # servidor local
```

Si algo no coincide con lo descrito aquí, confía en lo que veas (`git log`,
la salida de los comandos), no en este documento.

## Convenciones del proyecto

- TypeScript estricto, sin `any` ni aserciones `!`.
- Comentarios en español, breves, solo donde la intención no sea obvia.
- Se trabaja directo en `master`, con remoto en GitHub
  (`aveiaAvellanada/programacion_dinamica`).
- El motor y la interfaz están desacoplados: `src/ui/` consume `solve()` y
  los tipos, nunca los módulos internos del motor.
