# HANDOFF — Fase 2 (UI React Completa + Red de Estados SVG) del Motor de Programación Dinámica

Este documento existe para que **cualquier IA** (Claude, Gemini, u otra)
pueda retomar este proyecto sin contexto previo si la sesión que lo escribió
se corta. Léelo completo antes de tocar código.

## Qué es este proyecto

`C:\Users\camil\Documents\modelos_deterministicos` — visualizador de
Programación Dinámica Multietapa Determinística (curso de Investigación de
Operaciones, Universidad de la Amazonia). Es la variante de IO con
inducción hacia atrás explícita (estados \(s_k\), decisiones \(d_k\),
transición \(s_{k-1}=s_k-d_k\)), con empates tratados como ciudadanos de
primera clase — no un DP estilo LeetCode.

**Fase 1** (motor headless, sin UI) está terminada, revisada y aprobada.
Documentos: `docs/superpowers/specs/2026-08-12-dp-engine-phase1-design.md`
(contrato de datos + decisiones de diseño) y
`docs/superpowers/plans/2026-08-12-dp-engine-phase1-plan.md` (plan
ejecutado task por task). El motor vive en `src/engine/` y NO se debe tocar
su lógica salvo que encuentres un bug real — está probado con 19 tests
(`npm test`) y revisado exhaustivamente.

**Fase 2** (UI React + Red de Estados SVG) está completamente implementada,
compilando de forma limpia con TypeScript y Vite.

## Estado actual

Ya implementado y totalmente verificado:

- **React montado sobre Vite** (`vite.config.ts`, `@vitejs/plugin-react`, `tsconfig.json`, `src/main.tsx`).
- **`src/ui/useSolution.ts`**: hook con el estado del `DPProblem` y recalculo reactivo inmediato (`useMemo`).
- **`src/ui/ProblemEditor.tsx`**:
  - Edita recursos \(N\), sentido (max/min), labels de etapas, quita/agrega etapas.
  - Redimensiona automáticamente los vectores de retorno \(p_k(d_k)\) sin perder datos.
  - **Selector de problemas predefinidos (Presets)**: "El Primo", "Brigadas Médicas", "Inversión de Capital", "Mantenimiento de Equipos".
  - **Exportar e Importar JSON**: Exportación directa a archivo JSON y modal de edición/importación.
- **`src/ui/StageTable.tsx`**: renderiza cada `StageResult` como tabla \(s \times d\), celdas infactibles en gris (`—`) y celdas óptimas destacadas en verde/esmeralda.
- **Hover-linkage bidireccional**: al pasar el cursor sobre cualquier celda o arista factible, resalta automáticamente la celda óptima de la etapa anterior consultada.
- **`src/ui/StateGraph.tsx` (Red de Estados SVG)**:
  - Visualización gráfica interactiva nodo-enlace de la red de decisión \(s_k \xrightarrow{d_k} s_{k-1}\).
  - Nodos ordenados por columna de etapas (\(k=K \dots 1, 0\)) y fila por nivel de estado (\(s=0 \dots N\)).
  - Aristas codificadas por color (óptimas en verde, seleccionadas en morado `.path`, hover en azul/naranja).
  - Selector para alternar entre "Mostrar solo transiciones óptimas" o "Todas las transiciones factibles".
- **`src/ui/StepPlayer.tsx`**: reproductor play/pausa/paso a paso sobre la traza algorítmica `solution.steps[]` con descripciones en español.
- **`src/ui/PolicyList.tsx`**: lista de todas las políticas óptimas encontradas; al seleccionar una, resalta toda la trayectoria óptima tanto en las tablas como en la Red SVG.
- **`src/ui/styles.css`**: diseño oscuro premium, adaptable, con paleta HSL equilibrada, tarjetas elevadas, insignias tipográficas y diálogos modales.

## Cómo verificar que todo está vivo

```bash
cd C:\Users\camil\Documents\modelos_deterministicos
npm test              # deben pasar 19/19 tests del motor
npx tsc --noEmit       # debe salir 0 errores
npm run build          # debe compilar el bundle de Vite (dist/) sin errores
npm run dev             # inicia el servidor de desarrollo local en http://localhost:5173
```

## Resumen de Verificación Realizada

- `npm test`: 19/19 tests pasaron exitosamente.
- `npx tsc --noEmit`: 0 errores de tipado en TypeScript.
- `npm run build`: bundle generado en `dist/` correctamente (CSS: 7.72 kB, JS: 210.73 kB).
