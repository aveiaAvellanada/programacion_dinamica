import type { StageResult } from '../engine/types';
import { cellKey } from './highlight';

interface Props {
  stage: StageResult;
  resources: number;
  primary: Set<string>;
  linked: Set<string>;
  path: Set<string>;
  onHoverCell: (state: number, d: number) => void;
  onLeaveCell: () => void;
}

export function StageTable({ stage, resources, primary, linked, path, onHoverCell, onLeaveCell }: Props) {
  return (
    <div className="stage-table">
      <h3>
        k={stage.k} — {stage.label}
      </h3>
      <table>
        <thead>
          <tr>
            <th>s \ d</th>
            {Array.from({ length: resources + 1 }, (_, d) => (
              <th key={d}>{d}</th>
            ))}
            <th>f*</th>
            <th>d*</th>
          </tr>
        </thead>
        <tbody>
          {stage.rows.map((row) => (
            <tr key={row.state}>
              <th>{row.state}</th>
              {row.cells.map((cell) => {
                const key = cellKey(stage.k, row.state, cell.d);
                const classes = ['cell'];
                if (!cell.feasible) classes.push('infeasible');
                else if (cell.isOptimal) classes.push('optimal');
                if (path.has(key)) classes.push('path');
                if (primary.has(key)) classes.push('primary');
                if (linked.has(key)) classes.push('linked');
                return (
                  <td
                    key={cell.d}
                    className={classes.join(' ')}
                    onMouseEnter={() => cell.feasible && onHoverCell(row.state, cell.d)}
                    onMouseLeave={onLeaveCell}
                  >
                    {cell.feasible ? cell.value : '—'}
                  </td>
                );
              })}
              <td className="fstar">{row.fStar}</td>
              <td className="dstar">{`{${row.dStar.join(',')}}`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
