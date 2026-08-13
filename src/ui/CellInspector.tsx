import type { Sense } from '../engine/types';
import type { CellInfo } from './cellInfo';
import { MathView } from './MathView';

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
          estado <MathView math={`s_{${k}} = ${state}`} />, decisión <MathView math={`d_{${k}} = ${cell.d}`} />
        </span>
        {pinned && (
          <button type="button" className="btn-danger-sm inspector-unpin" onClick={onUnpin} title="Soltar celda fijada (Esc)">
            📌 fijada — soltar
          </button>
        )}
      </div>

      {!cell.feasible ? (
        <p className="inspector-infeasible">
          <strong>Infactible.</strong> No se puede asignar <MathView math={`d_{${k}} = ${cell.d}`} /> cuando solo hay{' '}
          <MathView math={`s_{${k}} = ${state}`} /> recursos disponibles (se requiere <MathView math="d_k \\le s_k" />).
        </p>
      ) : (
        <>
          <div className="bellman">
            <span className="bellman-term">
              <MathView math={`f_{${k}}(${state}, ${cell.d})`} />
            </span>
            <span className="bellman-op">=</span>
            <span className="bellman-term term-pk" title={`Retorno inmediato de asignar ${cell.d} en esta etapa`}>
              <MathView math={`p_{${k}}(${cell.d}) = ${cell.pk}`} />
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
              <MathView math={`f^*_{${k - 1}}(${cell.prevState}) = ${cell.fPrev}`} />
            </span>
            <span className="bellman-op">=</span>
            <span className={cell.isOptimal ? 'bellman-result optimal' : 'bellman-result'}>{cell.value}</span>
            {cell.isOptimal && <span className="badge badge-optimal">óptimo <MathView math="d^*" /></span>}
          </div>

          <p className="inspector-note">
            Transición: <MathView math={`s_{${k - 1}} = s_{${k}} - d_{${k}} = ${state} - ${cell.d} = ${cell.prevState}`} />
            {prevStageLabel ? (
              <>
                {' '}
                → se consulta el óptimo ya calculado de <em>{prevStageLabel}</em> (k={k - 1}).
              </>
            ) : (
              <> → caso base <MathView math="f^*_0 \\equiv 0" />, no hay más etapas por resolver.</>
            )}
          </p>

          <p className="inspector-note">
            En esta fila el {senseWord} es <MathView math={`f^*_{${k}}(${state}) = ${fStar}`} />, alcanzado por{' '}
            <MathView math={`d_{${k}}^* \\in \\{${dStar.join(', ')}\\}`} />
            {dStar.length > 1 && <span className="tie-note"> — hay {dStar.length} decisiones empatadas.</span>}
          </p>
        </>
      )}
    </div>
  );
}
