import type { ChangeEvent } from 'react';
import type { DPProblem, Sense } from '../engine/types';

interface Props {
  problem: DPProblem;
  onChange: (problem: DPProblem) => void;
}

function resizePayoff(payoff: number[], resources: number): number[] {
  const next = payoff.slice(0, resources + 1);
  while (next.length < resources + 1) next.push(0);
  return next;
}

export function ProblemEditor({ problem, onChange }: Props) {
  function setResources(resources: number): void {
    if (!Number.isFinite(resources) || resources < 0) return;
    onChange({
      ...problem,
      resources: Math.floor(resources),
      stages: problem.stages.map((s) => ({ ...s, payoff: resizePayoff(s.payoff, Math.floor(resources)) })),
    });
  }

  function setSense(sense: Sense): void {
    onChange({ ...problem, sense });
  }

  function setStageLabel(idx: number, label: string): void {
    onChange({ ...problem, stages: problem.stages.map((s, i) => (i === idx ? { ...s, label } : s)) });
  }

  function setPayoffValue(stageIdx: number, d: number, value: number): void {
    if (!Number.isFinite(value)) return;
    const stages = problem.stages.map((s, i) => {
      if (i !== stageIdx) return s;
      const payoff = s.payoff.slice();
      payoff[d] = value;
      return { ...s, payoff };
    });
    onChange({ ...problem, stages });
  }

  function addStage(): void {
    const n = problem.stages.length + 1;
    onChange({
      ...problem,
      stages: [
        ...problem.stages,
        { id: `etapa-${n}-${Date.now()}`, label: `Etapa ${n}`, payoff: new Array(problem.resources + 1).fill(0) as number[] },
      ],
    });
  }

  function removeStage(idx: number): void {
    if (problem.stages.length <= 1) return;
    onChange({ ...problem, stages: problem.stages.filter((_, i) => i !== idx) });
  }

  return (
    <section className="panel">
      <h2>Problema</h2>
      <div className="row">
        <label>
          Recursos (N)
          <input
            type="number"
            min={0}
            value={problem.resources}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setResources(Number(e.target.value))}
          />
        </label>
        <label>
          Sentido
          <select value={problem.sense} onChange={(e) => setSense(e.target.value as Sense)}>
            <option value="max">Maximizar</option>
            <option value="min">Minimizar</option>
          </select>
        </label>
        <button type="button" onClick={addStage}>
          + etapa
        </button>
      </div>

      {problem.stages.map((stage, stageIdx) => (
        <div className="stage-editor" key={stage.id}>
          <div className="row">
            <input className="stage-label" value={stage.label} onChange={(e) => setStageLabel(stageIdx, e.target.value)} />
            <span className="stage-k">k = {stageIdx + 1}</span>
            <button type="button" onClick={() => removeStage(stageIdx)} disabled={problem.stages.length <= 1}>
              quitar
            </button>
          </div>
          <div className="payoff-row">
            {stage.payoff.map((value, d) => (
              <label key={d} className="payoff-cell">
                <span>d={d}</span>
                <input type="number" value={value} onChange={(e) => setPayoffValue(stageIdx, d, Number(e.target.value))} />
              </label>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
