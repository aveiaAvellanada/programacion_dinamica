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
