import type { Policy, StageResult, Step } from './types';

export function buildSteps(stages: StageResult[], policies: Policy[]): Step[] {
  const steps: Step[] = [];

  for (const stage of stages) {
    steps.push({ type: 'enter-stage', k: stage.k });
    for (const row of stage.rows) {
      steps.push({ type: 'enter-row', k: stage.k, state: row.state });
      for (const cell of row.cells) {
        if (cell.feasible) {
          steps.push({
            type: 'eval-cell',
            k: stage.k,
            state: row.state,
            d: cell.d,
            prevState: cell.prevState,
            value: cell.value,
          });
        }
      }
      steps.push({ type: 'commit-row', k: stage.k, state: row.state, fStar: row.fStar, dStar: row.dStar });
    }
  }

  steps.push({ type: 'begin-backtrack' });
  policies.forEach((policy, policyIndex) => {
    for (let i = policy.decisions.length - 1; i >= 0; i--) {
      steps.push({
        type: 'backtrack-pick',
        policyIndex,
        k: i + 1,
        state: policy.states[i],
        d: policy.decisions[i],
      });
    }
  });
  steps.push({ type: 'done' });

  return steps;
}
