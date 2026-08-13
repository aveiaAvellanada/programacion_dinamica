import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Step } from '../engine/types';

interface Props {
  steps: Step[];
  stepIndex: number;
  onStepIndexChange: (index: number) => void;
}

const SPEEDS = [
  { label: '0.5×', ms: 700 },
  { label: '1×', ms: 350 },
  { label: '2×', ms: 160 },
  { label: '4×', ms: 70 },
];

function describeStep(step: Step): string {
  switch (step.type) {
    case 'enter-stage':
      return `Comienza la etapa k=${step.k}. Se resolverán todos sus estados usando los óptimos ya calculados de k=${step.k - 1}.`;
    case 'enter-row':
      return `Etapa k=${step.k}: se abre el estado s=${step.state} y se probarán todas sus decisiones factibles.`;
    case 'eval-cell':
      return `k=${step.k}, s=${step.state}: probar d=${step.d} deja s'=${step.prevState} para la etapa k=${step.k - 1} → valor ${step.value}.`;
    case 'commit-row':
      return `k=${step.k}, s=${step.state}: se fija f*=${step.fStar} con d* = {${step.dStar.join(',')}}${
        step.dStar.length > 1 ? ` (${step.dStar.length} decisiones empatadas)` : ''
      }.`;
    case 'begin-backtrack':
      return 'Tablas completas. Ahora se reconstruyen hacia atrás todas las políticas óptimas desde s_K = N.';
    case 'backtrack-pick':
      return `Política #${step.policyIndex + 1}: en k=${step.k} con s=${step.state} se elige d=${step.d}.`;
    case 'done':
      return 'Traza completa. Todas las tablas están construidas y todas las políticas óptimas enumeradas.';
    default:
      return '';
  }
}

function phaseOf(step: Step): string {
  switch (step.type) {
    case 'enter-stage':
    case 'enter-row':
    case 'eval-cell':
    case 'commit-row':
      return `Inducción hacia atrás · etapa k=${step.k}`;
    case 'begin-backtrack':
    case 'backtrack-pick':
      return 'Reconstrucción de políticas';
    default:
      return 'Fin';
  }
}

export function StepPlayer({ steps, stepIndex, onStepIndexChange }: Props) {
  const [playing, setPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(1);
  const active = stepIndex >= 0 && stepIndex < steps.length;

  const backtrackStart = useMemo(() => steps.findIndex((s) => s.type === 'begin-backtrack'), [steps]);

  const go = useCallback(
    (i: number) => onStepIndexChange(Math.max(0, Math.min(steps.length - 1, i))),
    [onStepIndexChange, steps.length],
  );

  // Avance automático mientras está en reproducción.
  useEffect(() => {
    if (!playing) return;
    if (stepIndex >= steps.length - 1) {
      setPlaying(false);
      return;
    }
    const id = window.setTimeout(() => onStepIndexChange(stepIndex + 1), SPEEDS[speedIdx].ms);
    return () => window.clearTimeout(id);
  }, [playing, stepIndex, steps.length, speedIdx, onStepIndexChange]);

  // Al cambiar el problema la traza se reemplaza: detener para no reproducir índices viejos.
  useEffect(() => {
    setPlaying(false);
  }, [steps]);

  // Atajos de teclado, ignorados mientras se escribe en un campo del editor.
  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      const el = e.target as HTMLElement | null;
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      if (e.key === ' ') {
        e.preventDefault();
        setPlaying((p) => !p);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setPlaying(false);
        go(stepIndex < 0 ? 0 : stepIndex + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setPlaying(false);
        go(stepIndex - 1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        go(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        go(steps.length - 1);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stepIndex, steps.length, go]);

  const pct = active ? ((stepIndex + 1) / steps.length) * 100 : 0;

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Reproductor paso a paso</h2>
        <span className="hint-pill">
          Atajos: <kbd>espacio</kbd> reproducir · <kbd>←</kbd> <kbd>→</kbd> paso · <kbd>Home</kbd>/<kbd>End</kbd>
        </span>
      </div>

      <div className="player-controls">
        <button type="button" onClick={() => go(0)} title="Ir al inicio (Home)">
          ⏮
        </button>
        <button
          type="button"
          onClick={() => {
            setPlaying(false);
            go(stepIndex - 1);
          }}
          disabled={stepIndex <= 0}
          title="Paso anterior (←)"
        >
          ◀
        </button>
        <button
          type="button"
          className="btn-primary play-btn"
          onClick={() => {
            if (!active) go(0);
            setPlaying((p) => !p);
          }}
          title="Reproducir / pausar (espacio)"
        >
          {playing ? '⏸ Pausar' : '▶ Reproducir'}
        </button>
        <button
          type="button"
          onClick={() => {
            setPlaying(false);
            go(stepIndex < 0 ? 0 : stepIndex + 1);
          }}
          disabled={active && stepIndex >= steps.length - 1}
          title="Paso siguiente (→)"
        >
          ▶
        </button>
        <button type="button" onClick={() => go(steps.length - 1)} title="Ir al final (End)">
          ⏭
        </button>

        {backtrackStart >= 0 && (
          <button type="button" className="btn-secondary" onClick={() => go(backtrackStart)} title="Saltar a la reconstrucción de políticas">
            ⤳ Ir al backtracking
          </button>
        )}

        <div className="speed-group" role="group" aria-label="Velocidad">
          {SPEEDS.map((s, i) => (
            <button
              key={s.label}
              type="button"
              className={i === speedIdx ? 'speed-btn active' : 'speed-btn'}
              onClick={() => setSpeedIdx(i)}
            >
              {s.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="btn-danger-sm"
          onClick={() => {
            setPlaying(false);
            onStepIndexChange(-1);
          }}
          disabled={!active}
          title="Salir del modo paso a paso"
        >
          ✕ Salir
        </button>
      </div>

      <div className="scrubber-row">
        <input
          className="scrubber"
          type="range"
          min={0}
          max={Math.max(0, steps.length - 1)}
          value={active ? stepIndex : 0}
          onChange={(e) => {
            setPlaying(false);
            go(Number(e.target.value));
          }}
          aria-label="Posición en la traza"
        />
        <span className="step-counter">{active ? `${stepIndex + 1} / ${steps.length}` : `— / ${steps.length}`}</span>
      </div>

      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>

      {active ? (
        <div className="step-info">
          <span className="badge phase-badge">{phaseOf(steps[stepIndex])}</span>
          <p className="step-description">{describeStep(steps[stepIndex])}</p>
        </div>
      ) : (
        <p className="step-description muted">
          Reproduce la traza para ver cómo el algoritmo llena cada tabla y luego reconstruye las políticas óptimas.
        </p>
      )}
    </section>
  );
}
