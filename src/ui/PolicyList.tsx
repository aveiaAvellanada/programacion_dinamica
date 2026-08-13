import type { Policy, StageDef } from '../engine/types';
import { MathView } from './MathView';

interface Props {
  policies: Policy[];
  stages?: StageDef[];
  optimalValue: number;
  truncated?: boolean;
  selected: number | null;
  onSelect: (index: number | null) => void;
}

export function PolicyList({ policies, stages = [], optimalValue, truncated, selected, onSelect }: Props) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>
            Políticas Óptimas de Asignación <span className="count-chip">{policies.length}</span>
          </h2>
          <p className="panel-subtitle">
            {policies.length > 1
              ? `Se encontraron ${policies.length} reparticiones distintas que alcanzan la ganancia máxima de ${optimalValue}. Haz clic en cualquiera para ver y resaltar su ruta.`
              : 'Asignación recomendada para maximizar el beneficio total. Haz clic para ver y resaltar su ruta.'}
          </p>
        </div>
        <span className="hint-pill">
          <MathView math={`f^* = ${optimalValue}`} />
        </span>
      </div>

      {truncated && (
        <p className="warning">
          ⚠ Truncado en {policies.length} políticas: hay más empates de los que se enumeran (tope de seguridad del motor).
        </p>
      )}

      <div className="policy-cards-container">
        {policies.map((policy, idx) => {
          const isSel = idx === selected;

          // Mapeo orden de etapas desde k=K hasta k=1
          const hops = policy.decisions
            .map((d, i) => {
              const k = i + 1;
              const stageLabel = stages[i]?.label || `Etapa ${k}`;
              const stateIn = policy.states[i];
              const contrib = policy.contributions[i];
              return { k, stageLabel, d, stateIn, contrib, index: i };
            })
            .reverse();

          // Resumen amigable en texto plano
          const summaryText = hops
            .map((h) => `${h.d} ${h.d === 1 ? 'carga' : 'cargas'} a ${h.stageLabel}`)
            .join(', ');

          return (
            <div
              key={idx}
              className={isSel ? 'policy-card selected' : 'policy-card'}
              onClick={() => onSelect(isSel ? null : idx)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(isSel ? null : idx);
                }
              }}
            >
              <div className="policy-card-header">
                <div className="policy-card-title">
                  <span className="policy-rank-badge">Opción #{idx + 1}</span>
                  <strong>Plan de Asignación Óptimo</strong>
                </div>
                <div className="policy-card-meta">
                  <span className="policy-total-badge">
                    Ganancia Total: <strong>{policy.total}</strong>
                  </span>
                  <button type="button" className={isSel ? 'btn-secondary selected-btn' : 'btn-secondary policy-btn'}>
                    {isSel ? '✓ Ruta Resaltada' : '🔍 Resaltar Ruta'}
                  </button>
                </div>
              </div>

              {/* Grid visual de asignación por supermercado/etapa */}
              <div className="policy-stages-grid">
                {hops.map((hop) => (
                  <div key={hop.k} className="policy-stage-box">
                    <div className="policy-stage-top">
                      <span className="policy-k-badge">k = {hop.k}</span>
                      <span className="policy-stage-name">{hop.stageLabel}</span>
                    </div>
                    <div className="policy-stage-alloc">
                      <strong>{hop.d}</strong> {hop.d === 1 ? 'carga' : 'cargas'}
                    </div>
                    <div className="policy-stage-contrib">
                      Retorno: <span className="contrib-val">+{hop.contrib}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Resumen explicativo humano */}
              <div className="policy-human-summary">
                <span className="summary-icon">💡</span>
                <span>
                  <strong>Distribución recomendada:</strong> Asignar {summaryText} para generar un beneficio total de <strong>{policy.total}</strong>.
                </span>
              </div>

              {/* Trazabilidad técnica de estados e inducción */}
              <div className="policy-tech-details">
                <span className="tech-label">Transición de Estados (<MathView math="s_k \xrightarrow{d_k} s_{k-1}" />):</span>
                <span className="policy-chain">
                  {hops.map((h) => (
                    <span className="policy-hop" key={h.k}>
                      <span className="hop-state">
                        <MathView math={`s_{${h.k}}=${h.stateIn}`} />
                      </span>
                      <span className="hop-arrow" title={`${h.stageLabel}: asignar ${h.d}`}>
                        <MathView math={`\\xrightarrow{d_{${h.k}}=${h.d}}`} />
                      </span>
                    </span>
                  ))}
                  <span className="hop-state final">
                    <MathView math="s_0=0" />
                  </span>
                </span>
                <span className="policy-sum-inline">
                  (Suma: {hops.map((h) => h.contrib).join(' + ')} = <strong>{policy.total}</strong>)
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="policy-footnote">
        Valor óptimo global <MathView math="f^*" /> = <strong>{optimalValue}</strong>
        {policies.length > 1 && <> · todas las políticas listadas alcanzan este mismo beneficio máximo (empate real).</>}
      </p>
    </section>
  );
}
