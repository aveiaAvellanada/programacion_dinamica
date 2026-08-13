import type { Policy } from '../engine/types';

interface Props {
  policies: Policy[];
  optimalValue: number;
  truncated?: boolean;
  selected: number | null;
  onSelect: (index: number | null) => void;
}

export function PolicyList({ policies, optimalValue, truncated, selected, onSelect }: Props) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>
          Políticas óptimas <span className="count-chip">{policies.length}</span>
        </h2>
        <span className="hint-pill">
          {policies.length > 1
            ? 'Varias asignaciones distintas alcanzan el mismo óptimo — haz clic para resaltar su ruta'
            : 'Haz clic para resaltar su ruta en las tablas y en la red'}
        </span>
      </div>

      {truncated && (
        <p className="warning">
          ⚠ Truncado en {policies.length} políticas: hay más empates de los que se enumeran (tope de seguridad del motor).
        </p>
      )}

      <ul className="policy-list">
        {policies.map((policy, idx) => {
          const isSel = idx === selected;
          return (
            <li key={idx}>
              <button
                type="button"
                className={isSel ? 'policy-btn selected' : 'policy-btn'}
                onClick={() => onSelect(isSel ? null : idx)}
                aria-pressed={isSel}
              >
                <span className="policy-rank">#{idx + 1}</span>

                <span className="policy-chain">
                  {policy.decisions
                    .map((d, i) => ({ d, i }))
                    .reverse()
                    .map(({ d, i }) => (
                      <span className="policy-hop" key={i}>
                        <span className="hop-state">s={policy.states[i]}</span>
                        <span className="hop-arrow" title={`Etapa k=${i + 1}: asignar ${d}`}>
                          —d<sub>{i + 1}</sub>={d}→
                        </span>
                      </span>
                    ))}
                  <span className="hop-state final">s=0</span>
                </span>

                <span className="policy-sum">
                  {policy.contributions
                    .map((c, i) => ({ c, i }))
                    .reverse()
                    .map(({ c, i }) => (
                      <span key={i}>
                        {i < policy.contributions.length - 1 && <span className="plus"> + </span>}
                        <span className="contrib">{c}</span>
                      </span>
                    ))}
                  <span className="equals"> = </span>
                  <strong className="policy-total">{policy.total}</strong>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <p className="policy-footnote">
        Valor óptimo global f* = <strong>{optimalValue}</strong>
        {policies.length > 1 && <> · todas las políticas listadas lo alcanzan exactamente (empate real, no redondeo).</>}
      </p>
    </section>
  );
}
