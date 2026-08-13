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
