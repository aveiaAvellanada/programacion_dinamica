import type { StageResult } from '../engine/types';
import { cellKey } from './highlight';

interface Props {
  stage: StageResult;
  resources: number;
  primary: Set<string>;
  linked: Set<string>;
  path: Set<string>;
  /** Celda activa (hover o fijada) para dibujar el crosshair, si pertenece a esta etapa. */
  crosshair: { k: number; state: number; d: number } | null;
  pinnedKey: string | null;
  onHoverCell: (state: number, d: number) => void;
  onLeaveCell: () => void;
  onClickCell: (state: number, d: number) => void;
}

export function StageTable({
  stage,
  resources,
  primary,
  linked,
  path,
  crosshair,
  pinnedKey,
  onHoverCell,
  onLeaveCell,
  onClickCell,
}: Props) {
  const cross = crosshair && crosshair.k === stage.k ? crosshair : null;

  return (
    <div className="stage-table">
      <h3>
        <span className="badge stage-badge">k = {stage.k}</span>
        <span className="stage-table-name">{stage.label}</span>
      </h3>
      <div className="stage-table-scroll">
        <table>
          <thead>
            <tr>
              <th className="corner" title="Filas: estado s (recursos disponibles). Columnas: decisión d (recursos asignados).">
                s \ d
              </th>
              {Array.from({ length: resources + 1 }, (_, d) => (
                <th key={d} className={cross && cross.d === d ? 'col-head active' : 'col-head'}>
                  {d}
                </th>
              ))}
              <th className="fstar-head" title="Valor óptimo de la fila">
                f*
              </th>
              <th className="dstar-head" title="Decisiones que alcanzan el óptimo (empates incluidos)">
                d*
              </th>
            </tr>
          </thead>
          <tbody>
            {stage.rows.map((row) => {
              const rowActive = cross !== null && cross.state === row.state;
              return (
                <tr key={row.state} className={rowActive ? 'row-active' : undefined}>
                  <th className={rowActive ? 'row-head active' : 'row-head'}>{row.state}</th>
                  {row.cells.map((cell) => {
                    const key = cellKey(stage.k, row.state, cell.d);
                    const classes = ['cell'];
                    if (!cell.feasible) classes.push('infeasible');
                    else if (cell.isOptimal) classes.push('optimal');
                    if (path.has(key)) classes.push('path');
                    if (linked.has(key)) classes.push('linked');
                    if (primary.has(key)) classes.push('primary');
                    if (pinnedKey === key) classes.push('pinned');
                    if (cross && cross.d === cell.d && !rowActive) classes.push('cross-col');
                    if (rowActive && cross.d !== cell.d) classes.push('cross-row');

                    const title = cell.feasible
                      ? `f_${stage.k}(${row.state}, ${cell.d}) = ${cell.pk} + ${cell.fPrev} = ${cell.value}`
                      : `Infactible: d=${cell.d} > s=${row.state}`;

                    return (
                      <td
                        key={cell.d}
                        className={classes.join(' ')}
                        title={title}
                        onMouseEnter={() => cell.feasible && onHoverCell(row.state, cell.d)}
                        onMouseLeave={onLeaveCell}
                        onClick={() => cell.feasible && onClickCell(row.state, cell.d)}
                      >
                        {cell.feasible ? (
                          <>
                            <span className="cell-value">{cell.value}</span>
                            <span className="cell-breakdown">
                              {cell.pk}+{cell.fPrev}
                            </span>
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                    );
                  })}
                  <td className="fstar">{row.fStar}</td>
                  <td className={row.dStar.length > 1 ? 'dstar has-tie' : 'dstar'}>
                    {`{${row.dStar.join(',')}}`}
                    {row.dStar.length > 1 && (
                      <span className="tie-dot" title={`${row.dStar.length} decisiones empatadas`}>
                        ●
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
