import { useEffect, useState } from 'react';
import type { Step } from '../engine/types';

interface Props {
  steps: Step[];
  stepIndex: number;
  onStepIndexChange: (index: number) => void;
}

function describeStep(step: Step): string {
  switch (step.type) {
    case 'enter-stage':
      return `Entrando a la etapa k=${step.k}`;
    case 'enter-row':
      return `Etapa k=${step.k}: evaluando estado s=${step.state}`;
    case 'eval-cell':
      return `k=${step.k}, s=${step.state}: probar d=${step.d} (consulta s'=${step.prevState} en k=${step.k - 1}) → valor ${step.value}`;
    case 'commit-row':
      return `k=${step.k}, s=${step.state}: f*=${step.fStar}, d*={${step.dStar.join(',')}}`;
    case 'begin-backtrack':
      return 'Backtracking: reconstruyendo todas las políticas óptimas desde s_K=N';
    case 'backtrack-pick':
      return `Política #${step.policyIndex + 1}: en k=${step.k}, s=${step.state} se elige d=${step.d}`;
    case 'done':
      return 'Traza completa.';
    default:
      return '';
  }
}

export function StepPlayer({ steps, stepIndex, onStepIndexChange }: Props) {
  const [playing, setPlaying] = useState(false);
  const active = stepIndex >= 0 && stepIndex < steps.length;

  useEffect(() => {
    if (!playing) return;
    const id = window.setTimeout(() => {
      const next = stepIndex + 1;
      if (next >= steps.length) {
        setPlaying(false);
        return;
      }
      onStepIndexChange(next);
    }, 350);
    return () => window.clearTimeout(id);
  }, [playing, stepIndex, steps.length, onStepIndexChange]);

  return (
    <section className="panel">
      <h2>Reproductor paso a paso</h2>
      <div className="row">
        <button type="button" onClick={() => onStepIndexChange(0)}>
          ⏮ inicio
        </button>
        <button type="button" onClick={() => onStepIndexChange(Math.max(0, stepIndex - 1))} disabled={stepIndex <= 0}>
          ◀ anterior
        </button>
        <button type="button" onClick={() => setPlaying((p) => !p)}>
          {playing ? '⏸ pausa' : '▶ reproducir'}
        </button>
        <button
          type="button"
          onClick={() => onStepIndexChange(Math.min(steps.length - 1, stepIndex + 1))}
          disabled={stepIndex >= steps.length - 1}
        >
          siguiente ▶
        </button>
        <button
          type="button"
          onClick={() => {
            setPlaying(false);
            onStepIndexChange(-1);
          }}
        >
          ✕ salir
        </button>
        <span className="step-counter">{active ? `${stepIndex + 1} / ${steps.length}` : 'inactivo'}</span>
      </div>
      <p className="step-description">
        {active ? describeStep(steps[stepIndex]) : 'Presiona un botón para reproducir la traza del algoritmo paso a paso.'}
      </p>
    </section>
  );
}
