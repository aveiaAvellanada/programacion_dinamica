import { useState, type ChangeEvent } from 'react';
import type { DPProblem, Sense } from '../engine/types';
import { PRESET_PROBLEMS } from './presets';

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
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  function setResources(resources: number): void {
    if (!Number.isFinite(resources) || resources < 0) return;
    const cleanN = Math.floor(resources);
    onChange({
      ...problem,
      resources: cleanN,
      stages: problem.stages.map((s) => ({ ...s, payoff: resizePayoff(s.payoff, cleanN) })),
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
        { id: `etapa-${n}-${Date.now()}`, label: `Etapa ${n}`, payoff: new Array(problem.resources + 1).fill(0) },
      ],
    });
  }

  function removeStage(idx: number): void {
    if (problem.stages.length <= 1) return;
    onChange({ ...problem, stages: problem.stages.filter((_, i) => i !== idx) });
  }

  function loadPreset(presetId: string): void {
    const preset = PRESET_PROBLEMS.find((p) => p.id === presetId);
    if (preset) {
      onChange(preset.problem);
    }
  }

  function exportJson(): void {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(problem, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `problema_dp_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  function handleImportJson(): void {
    try {
      setJsonError(null);
      const parsed = JSON.parse(jsonInput) as DPProblem;
      if (typeof parsed.resources !== 'number' || !Array.isArray(parsed.stages)) {
        throw new Error('Estructura JSON inválida. Debe incluir `resources` (número) y `stages` (array).');
      }
      onChange(parsed);
      setShowJsonModal(false);
      setJsonInput('');
    } catch (err: unknown) {
      setJsonError(err instanceof Error ? err.message : 'Error al procesar el JSON');
    }
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Configuración del Problema</h2>
        <div className="presets-bar">
          <label className="inline-label">
            <span>Ejemplos predefinidos:</span>
            <select onChange={(e) => e.target.value && loadPreset(e.target.value)} defaultValue="">
              <option value="" disabled>
                -- Seleccionar problema --
              </option>
              {PRESET_PROBLEMS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="btn-secondary" onClick={exportJson}>
            📥 Exportar JSON
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setJsonInput(JSON.stringify(problem, null, 2));
              setShowJsonModal(true);
            }}
          >
            📤 Importar JSON
          </button>
        </div>
      </div>

      <div className="row params-row">
        <label>
          <span>Recursos totales (N)</span>
          <input
            type="number"
            min={0}
            max={20}
            value={problem.resources}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setResources(Number(e.target.value))}
          />
        </label>
        <label>
          <span>Objetivo (f*)</span>
          <select value={problem.sense} onChange={(e) => setSense(e.target.value as Sense)}>
            <option value="max">Maximizar (Ganancia / VPN)</option>
            <option value="min">Minimizar (Costo / Riesgo)</option>
          </select>
        </label>
        <button type="button" className="btn-primary" onClick={addStage}>
          + Agregar Etapa
        </button>
      </div>

      <div className="stages-container">
        {problem.stages.map((stage, stageIdx) => (
          <div className="stage-editor" key={stage.id}>
            <div className="stage-header">
              <span className="badge stage-badge">k = {stageIdx + 1}</span>
              <input
                className="stage-label"
                value={stage.label}
                placeholder={`Etapa ${stageIdx + 1}`}
                onChange={(e) => setStageLabel(stageIdx, e.target.value)}
              />
              <button
                type="button"
                className="btn-danger-sm"
                onClick={() => removeStage(stageIdx)}
                disabled={problem.stages.length <= 1}
                title="Eliminar esta etapa"
              >
                ✕ Quitar
              </button>
            </div>
            <div className="payoff-grid">
              <span className="payoff-grid-title">Retornos p_k(d_k):</span>
              {stage.payoff.map((value, d) => (
                <label key={d} className="payoff-cell">
                  <span className="payoff-d-label">d={d}</span>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => setPayoffValue(stageIdx, d, Number(e.target.value))}
                  />
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showJsonModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Importar / Editar JSON del Problema</h3>
            <textarea
              className="json-textarea"
              rows={12}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
            />
            {jsonError && <p className="error-text">{jsonError}</p>}
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowJsonModal(false)}>
                Cancelar
              </button>
              <button type="button" className="btn-primary" onClick={handleImportJson}>
                Aplicar JSON
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
