import type { Cell, DPProblem, Row, Sense, StageResult } from './types';

const EPS = 1e-9;

type RawCell = Omit<Cell, 'isOptimal'>;

function pickOptimal(sense: Sense, candidates: { d: number; value: number }[]): { fStar: number; dStar: number[] } {
  let fStar = sense === 'max' ? -Infinity : Infinity;
  for (const c of candidates) {
    if (sense === 'max' ? c.value > fStar : c.value < fStar) {
      fStar = c.value;
    }
  }
  const dStar = candidates
    .filter((c) => Math.abs(c.value - fStar) < EPS)
    .map((c) => c.d)
    .sort((a, b) => a - b);
  return { fStar, dStar };
}

/** Backward induction: procesa las etapas en orden k=1..K, cada una consultando f* de la etapa anterior ya construida. */
export function buildStages(problem: DPProblem): StageResult[] {
  const { resources, stages: stageDefs, sense } = problem;
  const result: StageResult[] = [];

  stageDefs.forEach((def, i) => {
    const k = i + 1;
    const prevStage = i === 0 ? null : result[i - 1];
    const rows: Row[] = [];

    for (let s = 0; s <= resources; s++) {
      const raw: RawCell[] = [];

      for (let d = 0; d <= resources; d++) {
        const feasible = d <= s;
        const pk = def.payoff[d] ?? 0;
        const prevState = s - d;

        if (feasible) {
          const fPrev = prevStage === null ? 0 : prevStage.rows[prevState].fStar;
          raw.push({ d, pk, prevState, fPrev, value: pk + fPrev, feasible: true });
        } else {
          raw.push({ d, pk, prevState, fPrev: NaN, value: NaN, feasible: false });
        }
      }

      const { fStar, dStar } = pickOptimal(
        sense,
        raw.filter((r) => r.feasible).map((r) => ({ d: r.d, value: r.value })),
      );

      const cells: Cell[] = raw.map((r) => ({
        ...r,
        isOptimal: r.feasible && Math.abs(r.value - fStar) < EPS,
      }));

      rows.push({ state: s, cells, fStar, dStar });
    }

    result.push({ k, label: def.label, rows });
  });

  return result;
}
