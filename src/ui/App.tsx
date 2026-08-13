import { useEffect, useMemo, useState } from 'react';
import { useSolution } from './useSolution';
import { ProblemEditor } from './ProblemEditor';
import { StageTable } from './StageTable';
import { StepPlayer } from './StepPlayer';
import { PolicyList } from './PolicyList';
import { cellKey } from './highlight';

interface HoveredCell {
  k: number;
  state: number;
  d: number;
}

export function App() {
  const { problem, setProblem, solution } = useSolution();
  const [hovered, setHovered] = useState<HoveredCell | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<number | null>(null);
  const [stepIndex, setStepIndex] = useState<number>(-1);

  // Al editar el problema, cualquier hover/selección/paso anterior podría apuntar
  // a un estado o política que ya no existe — se limpia para evitar índices obsoletos.
  useEffect(() => {
    setHovered(null);
    setSelectedPolicy(null);
    setStepIndex(-1);
  }, [problem]);

  const currentStep = stepIndex >= 0 && stepIndex < solution.steps.length ? solution.steps[stepIndex] : null;

  const { primary, linked, path } = useMemo(() => {
    const primary = new Set<string>();
    const linked = new Set<string>();
    const path = new Set<string>();

    function linkFrom(k: number, state: number, d: number): void {
      primary.add(cellKey(k, state, d));
      if (k <= 1) return;
      const stage = solution.stages.find((s) => s.k === k);
      const row = stage?.rows[state];
      const cell = row?.cells[d];
      if (!cell || !cell.feasible) return;
      const prevRow = solution.stages.find((s) => s.k === k - 1)?.rows[cell.prevState];
      prevRow?.dStar.forEach((dOpt) => linked.add(cellKey(k - 1, cell.prevState, dOpt)));
    }

    if (currentStep) {
      if (currentStep.type === 'eval-cell') {
        linkFrom(currentStep.k, currentStep.state, currentStep.d);
      } else if (currentStep.type === 'commit-row') {
        currentStep.dStar.forEach((d) => primary.add(cellKey(currentStep.k, currentStep.state, d)));
      } else if (currentStep.type === 'backtrack-pick') {
        for (let i = 0; i <= stepIndex; i++) {
          const s = solution.steps[i];
          if (s.type === 'backtrack-pick' && s.policyIndex === currentStep.policyIndex) {
            path.add(cellKey(s.k, s.state, s.d));
          }
        }
      }
    } else if (hovered) {
      linkFrom(hovered.k, hovered.state, hovered.d);
    }

    if (selectedPolicy !== null) {
      const policy = solution.policies[selectedPolicy];
      policy?.decisions.forEach((d, i) => {
        const k = i + 1;
        const state = policy.states[i];
        path.add(cellKey(k, state, d));
      });
    }

    return { primary, linked, path };
  }, [hovered, currentStep, stepIndex, selectedPolicy, solution]);

  return (
    <div className="app">
      <h1>Visualizador de Programación Dinámica Multietapa</h1>

      <ProblemEditor problem={problem} onChange={setProblem} />

      <section className="panel">
        <h2>
          Tablas de inducción hacia atrás (k=1..{solution.stages.length})
        </h2>
        <p className="hint">
          Pasa el mouse sobre una celda factible para ver qué celda óptima de la etapa anterior consulta.
        </p>
        <div className="tables">
          {solution.stages.map((stage) => (
            <StageTable
              key={stage.k}
              stage={stage}
              resources={problem.resources}
              primary={primary}
              linked={linked}
              path={path}
              onHoverCell={(state, d) => setHovered({ k: stage.k, state, d })}
              onLeaveCell={() => setHovered(null)}
            />
          ))}
        </div>
      </section>

      <StepPlayer steps={solution.steps} stepIndex={stepIndex} onStepIndexChange={setStepIndex} />

      <PolicyList
        policies={solution.policies}
        optimalValue={solution.optimalValue}
        truncated={solution.truncated}
        selected={selectedPolicy}
        onSelect={setSelectedPolicy}
      />
    </div>
  );
}
