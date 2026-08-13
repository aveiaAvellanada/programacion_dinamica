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
      <h2>Políticas óptimas (valor = {optimalValue})</h2>
      {truncated && (
        <p className="warning">⚠ Truncado en {policies.length} políticas — hay más empates de los que se muestran.</p>
      )}
      <ul className="policy-list">
        {policies.map((policy, idx) => (
          <li key={idx}>
            <button
              type="button"
              className={idx === selected ? 'policy-btn selected' : 'policy-btn'}
              onClick={() => onSelect(idx === selected ? null : idx)}
            >
              {policy.decisions.map((d, i) => `d_${i + 1}=${d}`).join(', ')} → total {policy.total}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
