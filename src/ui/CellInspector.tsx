import type { Sense } from '../engine/types';
import type { CellInfo } from './cellInfo';

interface Props {
  info: CellInfo | null;
  sense: Sense;
  pinned: boolean;
  onUnpin: () => void;
}

export function CellInspector({ info, sense, pinned, onUnpin }: Props) {
  if (!info) {
    return (
      <div className="inspector inspector-empty">
        <span className="inspector-placeholder">
          Pasa el cursor por una celda de la tabla (o una arista de la red) para ver cómo se calcula. Haz clic para fijarla.
        </span>
      </div>
    );
  }

  const { k, stageLabel, state, cell, prevStageLabel, fStar, dStar } = info;
  const senseWord = sense === 'max' ? 'máximo' : 'mínimo';

  return (
    <div className={pinned ? 'inspector pinned' : 'inspector'}>
      <div className="inspector-head">
        <span className="badge stage-badge">k = {k}</span>
        <strong>{stageLabel}</strong>
        <span className="inspector-sep">·</span>
        <span className="text-muted">
          estado s<sub>{k}</sub> = {state}, decisión d<sub>{k}</sub> = {cell.d}
        </span>
        {pinned && (
          <button type="button" className="btn-danger-sm inspector-unpin" onClick={onUnpin} title="Soltar celda fijada (Esc)">
            📌 fijada — soltar
          </button>
        )}
      </div>

      {!cell.feasible ? (
        <p className="inspector-infeasible">
          <strong>Infactible.</strong> No se puede asignar d<sub>{k}</sub>={cell.d} cuando solo hay s<sub>{k}</sub>={state}{' '}
          recursos disponibles (se requiere d ≤ s).
        </p>
      ) : (
        <>
          <div className="bellman">
            <span className="bellman-term">
              f<sub>{k}</sub>({state}, {cell.d})
            </span>
            <span className="bellman-op">=</span>
            <span className="bellman-term term-pk" title={`Retorno inmediato de asignar ${cell.d} en esta etapa`}>
              p<sub>{k}</sub>({cell.d}) = {cell.pk}
            </span>
            <span className="bellman-op">+</span>
            <span
              className="bellman-term term-fprev"
              title={
                prevStageLabel
                  ? `Óptimo ya calculado de la etapa ${k - 1} (${prevStageLabel}) con ${cell.prevState} recursos restantes`
                  : 'Caso base: f*₀(s) ≡ 0'
              }
            >
              f*<sub>{k - 1}</sub>({cell.prevState}) = {cell.fPrev}
            </span>
            <span className="bellman-op">=</span>
            <span className={cell.isOptimal ? 'bellman-result optimal' : 'bellman-result'}>{cell.value}</span>
            {cell.isOptimal && <span className="badge badge-optimal">óptimo d*</span>}
          </div>

          <p className="inspector-note">
            Transición: s<sub>{k - 1}</sub> = s<sub>{k}</sub> − d<sub>{k}</sub> = {state} − {cell.d} ={' '}
            <strong>{cell.prevState}</strong>
            {prevStageLabel ? (
              <>
                {' '}
                → se consulta el óptimo ya calculado de <em>{prevStageLabel}</em> (k={k - 1}).
              </>
            ) : (
              <> → caso base f*₀ ≡ 0, no hay más etapas por resolver.</>
            )}
          </p>

          <p className="inspector-note">
            En esta fila el {senseWord} es f*<sub>{k}</sub>({state}) = <strong>{fStar}</strong>, alcanzado por d ∈{' '}
            <strong>{`{${dStar.join(', ')}}`}</strong>
            {dStar.length > 1 && <span className="tie-note"> — hay {dStar.length} decisiones empatadas.</span>}
          </p>
        </>
      )}
    </div>
  );
}
