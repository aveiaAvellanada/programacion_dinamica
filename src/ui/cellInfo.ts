import type { Cell, Solution } from '../engine/types';

export interface CellInfo {
  k: number;
  stageLabel: string;
  state: number;
  cell: Cell;
  /** null cuando k=1, porque f*_0 ≡ 0 no es una etapa real */
  prevStageLabel: string | null;
  fStar: number;
  dStar: number[];
}

export function getCellInfo(solution: Solution, k: number, state: number, d: number): CellInfo | null {
  const stage = solution.stages.find((s) => s.k === k);
  if (!stage) return null;
  const row = stage.rows[state];
  if (!row) return null;
  const cell = row.cells[d];
  if (!cell) return null;
  const prevStage = solution.stages.find((s) => s.k === k - 1);
  return {
    k,
    stageLabel: stage.label,
    state,
    cell,
    prevStageLabel: prevStage ? prevStage.label : null,
    fStar: row.fStar,
    dStar: row.dStar,
  };
}

/** Texto corto de la recursión, útil como tooltip nativo (atributo title). */
export function bellmanText(info: CellInfo): string {
  const { k, state, cell } = info;
  if (!cell.feasible) {
    return `Infactible: d=${cell.d} > s=${state}. No se pueden asignar más recursos de los disponibles.`;
  }
  return (
    `f_${k}(s=${state}, d=${cell.d}) = p_${k}(${cell.d}) + f*_${k - 1}(${cell.prevState}) ` +
    `= ${cell.pk} + ${cell.fPrev} = ${cell.value}`
  );
}
