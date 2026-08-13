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
