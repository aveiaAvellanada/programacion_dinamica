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
