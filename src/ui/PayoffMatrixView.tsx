import type { DPProblem } from '../engine/types';
import { MathView } from './MathView';

interface Props {
  problem: DPProblem;
}

export function PayoffMatrixView({ problem }: Props) {
  const { resources, stages, sense } = problem;
  const isMax = sense === 'max';

  return (
    <section className="panel payoff-matrix-panel">
      <div className="panel-header">
        <div>
          <h2>Matriz de Ganancias Estimadas & Restricciones</h2>
          <p className="panel-subtitle">
            Ganancia neta esperada <MathView math="p_k(d_k)" /> según el número de cargas / recursos asignados <MathView math="d_k" /> a cada etapa
          </p>
        </div>
        <span className="badge stage-badge">
          Recursos Totales <MathView math={`N = ${resources}`} />
        </span>
      </div>

      <div className="payoff-matrix-container">
        <div className="payoff-table-wrapper">
          <table className="payoff-matrix-table">
            <thead>
              <tr>
                <th className="payoff-matrix-corner">
                  Cargas Asignadas (<MathView math="d_k" />)
                </th>
                {stages.map((stage, idx) => (
                  <th key={stage.id} className="payoff-matrix-col-head">
                    <span className="stage-num-badge">k = {idx + 1}</span>
                    <strong className="stage-name-text">{stage.label}</strong>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: resources + 1 }, (_, d) => (
                <tr key={d}>
                  <td className="payoff-matrix-row-head">
                    <strong>{d} {d === 1 ? 'carga' : 'cargas'}</strong>
                    <span className="d-sub-label">(<MathView math={`d_k = ${d}`} />)</span>
                  </td>
                  {stages.map((stage) => {
                    const value = stage.payoff[d] ?? 0;
                    return (
                      <td key={stage.id} className="payoff-matrix-cell">
                        <span className="payoff-cell-val">{value}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="model-constraints-card">
          <h3>Formulación & Restricciones del Modelo</h3>
          
          <div className="constraint-item">
            <span className="constraint-title">Función Objetivo:</span>
            <div className="constraint-math">
              <MathView
                math={
                  isMax
                    ? `\\max \\sum_{k=1}^{${stages.length}} p_k(d_k)`
                    : `\\min \\sum_{k=1}^{${stages.length}} p_k(d_k)`
                }
                block
              />
            </div>
            <span className="constraint-desc">
              {isMax
                ? 'Maximizar el retorno neto total obtenido de la asignación de recursos.'
                : 'Minimizar el costo total incurrido por la asignación de recursos.'}
            </span>
          </div>

          <div className="constraint-item">
            <span className="constraint-title">Restricción de Recursos Totales:</span>
            <div className="constraint-math">
              <MathView math={`\\sum_{k=1}^{${stages.length}} d_k \\le ${resources}`} block />
            </div>
            <span className="constraint-desc">
              La suma total de cargas asignadas a todas las etapas no puede exceder el límite <MathView math={`N = ${resources}`} />.
            </span>
          </div>

          <div className="constraint-item">
            <span className="constraint-title">Transición de Estado (Inducción):</span>
            <div className="constraint-math">
              <MathView math="s_{k-1} = s_k - d_k, \quad \text{con } s_K = N, \, s_0 = 0" block />
            </div>
            <span className="constraint-desc">
              El estado representa los recursos disponibles al inicio de cada etapa.
            </span>
          </div>

          <div className="constraint-item">
            <span className="constraint-title">Dominio de Variables de Decisión:</span>
            <div className="constraint-math">
              <MathView math="d_k \in \{0, 1, \dots, s_k\}, \quad d_k \ge 0, \quad s_k \ge 0" block />
            </div>
            <span className="constraint-desc">
              En cada etapa <MathView math="k" />, no se pueden asignar más recursos de los disponibles (<MathView math="d_k \le s_k" />).
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
