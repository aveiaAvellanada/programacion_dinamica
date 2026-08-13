import { solve, type DPProblem, type Solution } from './engine';

const elPrimo: DPProblem = {
  resources: 5,
  sense: 'max',
  stages: [
    { id: 'tienda-1', label: 'Tienda 1', payoff: [0, 5, 9, 14, 19, 21] },
    { id: 'tienda-2', label: 'Tienda 2', payoff: [0, 6, 11, 15, 17, 22] },
    { id: 'tienda-3', label: 'Tienda 3', payoff: [0, 4, 9, 13, 18, 20] },
  ],
};

function printStageTable(solution: Solution, k: number): void {
  const stage = solution.stages.find((s) => s.k === k);
  if (!stage) return;
  const resources = solution.problem.resources;

  const header = ['s\\d', ...Array.from({ length: resources + 1 }, (_, d) => `d=${d}`), 'f*', 'd*'];
  const rows = stage.rows.map((row) => [
    String(row.state),
    ...row.cells.map((c) => (c.feasible ? String(c.value) : '—')),
    String(row.fStar),
    `{${row.dStar.join(',')}}`,
  ]);

  const widths = header.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)));
  const formatRow = (cells: string[]) => cells.map((c, i) => c.padStart(widths[i])).join(' | ');

  console.log(`\n=== Etapa k=${k} — ${stage.label} ===`);
  console.log(formatRow(header));
  console.log(widths.map((w) => '-'.repeat(w)).join('-+-'));
  for (const r of rows) console.log(formatRow(r));
}

function printPolicies(solution: Solution): void {
  console.log(`\n=== Políticas óptimas (valor total = ${solution.optimalValue}) ===`);
  if (solution.truncated) {
    console.log(`(!) Truncado en ${solution.policies.length} políticas`);
  }
  solution.policies.forEach((policy, i) => {
    const parts = policy.decisions.map((d, idx) => `d_${idx + 1}=${d} (+${policy.contributions[idx]})`);
    console.log(`Política ${i + 1}: ${parts.join(', ')} => total ${policy.total}`);
  });
}

const solution = solve(elPrimo);
for (const stage of solution.stages) {
  printStageTable(solution, stage.k);
}
printPolicies(solution);
