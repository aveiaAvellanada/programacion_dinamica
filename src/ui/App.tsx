import { useEffect, useMemo, useState } from 'react';
import { useSolution } from './useSolution';
import { ProblemEditor } from './ProblemEditor';
import { PayoffMatrixView } from './PayoffMatrixView';
import { StageTable } from './StageTable';
import { StateGraph } from './StateGraph';
import { StepPlayer } from './StepPlayer';
import { PolicyList } from './PolicyList';
import { CellInspector } from './CellInspector';
import { Legend } from './Legend';
import { cellKey } from './highlight';
import { getCellInfo } from './cellInfo';
import { MathView } from './MathView';

interface FocusedCell {
  k: number;
  state: number;
  d: number;
}

export function App() {
  const { problem, setProblem, solution } = useSolution();
  const [hovered, setHovered] = useState<FocusedCell | null>(null);
  const [pinned, setPinned] = useState<FocusedCell | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<number | null>(null);
  const [stepIndex, setStepIndex] = useState<number>(-1);
  const [activeTab, setActiveTab] = useState<'both' | 'tables' | 'graph' | 'matrix'>('both');

  // Al editar el problema, cualquier hover/selección/paso anterior podría apuntar
  // a un estado o política que ya no existe — se limpia para evitar índices obsoletos.
  useEffect(() => {
    setHovered(null);
    setPinned(null);
    setSelectedPolicy(null);
    setStepIndex(-1);
  }, [problem]);

  // Escape suelta la celda fijada y la política seleccionada.
  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        setPinned(null);
        setSelectedPolicy(null);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const currentStep = stepIndex >= 0 && stepIndex < solution.steps.length ? solution.steps[stepIndex] : null;

  // El hover manda mientras existe; al soltarlo se vuelve a la celda fijada.
  const manualFocus = hovered ?? pinned;

  // Celda que describe el inspector: el paso actual si está evaluando una, si no la manual.
  const focusCell: FocusedCell | null =
    currentStep && currentStep.type === 'eval-cell'
      ? { k: currentStep.k, state: currentStep.state, d: currentStep.d }
      : manualFocus;

  const focusInfo = focusCell ? getCellInfo(solution, focusCell.k, focusCell.state, focusCell.d) : null;

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
    } else if (manualFocus) {
      linkFrom(manualFocus.k, manualFocus.state, manualFocus.d);
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
  }, [manualFocus, currentStep, stepIndex, selectedPolicy, solution]);

  const pinnedKey = pinned ? cellKey(pinned.k, pinned.state, pinned.d) : null;

  function togglePin(k: number, state: number, d: number): void {
    setPinned((prev) => (prev && prev.k === k && prev.state === state && prev.d === d ? null : { k, state, d }));
  }

  const tieRows = solution.stages.reduce((n, s) => n + s.rows.filter((r) => r.dStar.length > 1).length, 0);

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Visualizador de Programación Dinámica Multietapa</h1>
          <div className="authors-badge">
            <span>Desarrollado por:</span>
            <strong>Carlos Daniel Gómez Murcia</strong> & <strong>Camilo Andrés Artunduaga Bueno</strong>
          </div>
          <p className="subtitle">
            Inducción hacia atrás explícita (<MathView math="s_k, \, d_k, \, s_{k-1} = s_k - d_k" />) con tratamiento riguroso de empates
          </p>
        </div>
        <div className="solution-summary">
          <div className="summary-badge">
            <span className="label">Valor óptimo <MathView math="f^*" /></span>
            <span className="value">{solution.optimalValue}</span>
          </div>
          <div className="summary-badge">
            <span className="label">Políticas óptimas</span>
            <span className="value">
              {solution.policies.length}
              {solution.truncated ? '+' : ''}
            </span>
          </div>
          <div className="summary-badge">
            <span className="label">Filas con empate</span>
            <span className="value">{tieRows}</span>
          </div>
        </div>
      </header>

      <ProblemEditor problem={problem} onChange={setProblem} />

      <PayoffMatrixView problem={problem} />

      <section className="panel inspector-panel">
        <div className="panel-header">
          <h2>Inspector de celda</h2>
          <Legend />
        </div>
        <CellInspector info={focusInfo} sense={problem.sense} pinned={pinned !== null && hovered === null} onUnpin={() => setPinned(null)} />
      </section>

      <div className="view-selector">
        <span className="view-selector-title">Visualización:</span>
        <button
          type="button"
          className={activeTab === 'both' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setActiveTab('both')}
        >
          📊 Vista combinada
        </button>
        <button
          type="button"
          className={activeTab === 'tables' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setActiveTab('tables')}
        >
          📋 Tablas de inducción
        </button>
        <button
          type="button"
          className={activeTab === 'graph' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setActiveTab('graph')}
        >
          🕸️ Red de estados
        </button>
      </div>

      {(activeTab === 'tables' || activeTab === 'both') && (
        <section className="panel">
          <div className="panel-header">
            <h2>Tablas de inducción hacia atrás (k = 1..{solution.stages.length})</h2>
            <span className="hint-pill">
              Pasa el cursor para explorar · <kbd>clic</kbd> para fijar una celda · <kbd>Esc</kbd> para soltar
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
                crosshair={focusCell}
                pinnedKey={pinnedKey}
                onHoverCell={(state, d) => setHovered({ k: stage.k, state, d })}
                onLeaveCell={() => setHovered(null)}
                onClickCell={(state, d) => togglePin(stage.k, state, d)}
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
          onClickCell={(k, state, d) => togglePin(k, state, d)}
          pinnedKey={pinnedKey}
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

      <footer className="app-footer">
        <div>
          <strong>Visualizador de Programación Dinámica Multietapa</strong> · Desarrollado por{' '}
          <strong>Carlos Daniel Gómez Murcia</strong> & <strong>Camilo Andrés Artunduaga Bueno</strong>
        </div>
        <div className="footer-subtext">
          Investigación de Operaciones · Universidad de la Amazonia
        </div>
      </footer>
    </div>
  );
}
