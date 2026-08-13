import type { DPProblem, Policy, StageResult } from './types';

const MAX_POLICIES = 200;

/** DFS determinista desde s_K=N siguiendo dStar en orden ascendente, con tope de seguridad. */
export function enumeratePolicies(
  problem: DPProblem,
  stages: StageResult[],
): { policies: Policy[]; truncated: boolean } {
  const policies: Policy[] = [];
  let truncated = false;
  const total = stages[stages.length - 1].rows[problem.resources].fStar;

  function dfs(stageIdx: number, state: number, decisions: number[], states: number[], contributions: number[]): void {
    if (truncated) return;
    const row = stages[stageIdx].rows[state];

    for (const d of row.dStar) {
      if (truncated) return;
      const cell = row.cells[d];

      decisions.push(d);
      states.push(state);
      contributions.push(cell.pk);

      if (stageIdx === 0) {
        if (policies.length >= MAX_POLICIES) {
          truncated = true;
        } else {
          policies.push({
            decisions: [...decisions].reverse(),
            states: [...states].reverse(),
            contributions: [...contributions].reverse(),
            total,
          });
        }
      } else {
        dfs(stageIdx - 1, cell.prevState, decisions, states, contributions);
      }

      decisions.pop();
      states.pop();
      contributions.pop();
    }
  }

  dfs(stages.length - 1, problem.resources, [], [], []);
  return { policies, truncated };
}
