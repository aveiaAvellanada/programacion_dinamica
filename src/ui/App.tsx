import { useEffect, useMemo, useState } from 'react';
import { useSolution } from './useSolution';
import { ProblemEditor } from './ProblemEditor';
import { StageTable } from './StageTable';
import { StateGraph } from './StateGraph';
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
  const [activeTab, setActiveTab] = useState<'tables' | 'graph' | 'both'>('both');

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
      <header className="app-header">
        <div>
          <h1>Visualizador de Programación Dinámica Multietapa</h1>
          <p className="subtitle">
            Inducción hacia atrás explícita (s_k, d_k, s_(k-1) = s_k - d_k) con tratamiento riguroso de empates
          </p>
        </div>
        <div className="solution-summary">
          <div className="summary-badge">
            <span className="label">Valor Óptimo f*</span>
            <span className="value">{solution.optimalValue}</span>
          </div>
          <div className="summary-badge">
            <span className="label">Políticas Óptimas</span>
            <span className="value">
              {solution.policies.length} {solution.truncated ? '(truncado)' : ''}
            </span>
          </div>
        </div>
      </header>

      <ProblemEditor problem={problem} onChange={setProblem} />

      <div className="view-selector">
        <span className="view-selector-title">Visualización:</span>
        <button
          type="button"
          className={activeTab === 'both' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setActiveTab('both')}
        >
          📊 Vista Combinada (Tablas + Red)
        </button>
        <button
          type="button"
          className={activeTab === 'tables' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setActiveTab('tables')}
        >
          📋 Tablas de Inducción
        </button>
        <button
          type="button"
          className={activeTab === 'graph' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setActiveTab('graph')}
        >
          🕸️ Red de Estados (SVG)
        </button>
      </div>

      {(activeTab === 'tables' || activeTab === 'both') && (
        <section className="panel">
          <div className="panel-header">
            <h2>Tablas de Inducción Hacia Atrás (k=1..{solution.stages.length})</h2>
            <span className="hint-pill">
              Pasa el mouse sobre una celda factible para resaltar la celda que consulta en k-1
            </span>
          </div>
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
      )}

      {(activeTab === 'graph' || activeTab === 'both') && (
        <StateGraph
          problem={problem}
          solution={solution}
          primary={primary}
          linked={linked}
          path={path}
          onHoverCell={(k, state, d) => setHovered({ k, state, d })}
          onLeaveCell={() => setHovered(null)}
        />
      )}

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
