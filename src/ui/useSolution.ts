import { useMemo, useState } from 'react';
import { solve } from '../engine';
import type { DPProblem, Solution } from '../engine/types';

const initialProblem: DPProblem = {
  resources: 5,
  sense: 'max',
  stages: [
    { id: 'tienda-1', label: 'Tienda 1', payoff: [0, 5, 9, 14, 19, 21] },
    { id: 'tienda-2', label: 'Tienda 2', payoff: [0, 6, 11, 15, 17, 22] },
    { id: 'tienda-3', label: 'Tienda 3', payoff: [0, 4, 9, 13, 18, 20] },
  ],
};

export function useSolution(): { problem: DPProblem; setProblem: (p: DPProblem) => void; solution: Solution } {
  const [problem, setProblem] = useState<DPProblem>(initialProblem);
  const solution = useMemo<Solution>(() => solve(problem), [problem]);
  return { problem, setProblem, solution };
}
