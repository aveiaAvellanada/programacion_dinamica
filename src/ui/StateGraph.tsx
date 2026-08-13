import { useMemo, useState } from 'react';
import type { DPProblem, Solution } from '../engine/types';
import { cellKey } from './highlight';

interface Props {
  problem: DPProblem;
  solution: Solution;
  primary: Set<string>;
  linked: Set<string>;
  path: Set<string>;
  onHoverCell: (k: number, state: number, d: number) => void;
  onLeaveCell: () => void;
}

interface NodePos {
  k: number;
  colIdx: number;
  state: number;
  x: number;
  y: number;
}

interface EdgeDef {
  id: string;
  k: number;
  state: number;
  d: number;
  prevState: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  isOptimal: boolean;
  isPath: boolean;
  isPrimary: boolean;
  isLinked: boolean;
}

export function StateGraph({
  problem,
  solution,
  primary,
  linked,
  path,
  onHoverCell,
  onLeaveCell,
}: Props) {
  const [showAllTransitions, setShowAllTransitions] = useState(false);
  const [hoveredEdge, setHoveredEdge] = useState<EdgeDef | null>(null);

  const K = problem.stages.length;
  const N = problem.resources;

  // Parámetros de renderizado SVG
  const colWidth = 140;
  const rowHeight = 45;
  const paddingX = 80;
  const paddingY = 60;

  const width = paddingX * 2 + K * colWidth;
  const height = paddingY * 2 + N * rowHeight;

  const { nodes, edges, colHeaderLabels } = useMemo(() => {
    const nodes: NodePos[] = [];
    const nodeMap = new Map<string, NodePos>();

    // Encabezados de columnas:
    // colIdx 0 -> Etapa K entrada (s_K)
    // colIdx 1 -> Etapa K-1 entrada (s_{K-1})
    // ...
    // colIdx K-1 -> Etapa 1 entrada (s_1)
    // colIdx K -> Estado final (s_0)
    const colHeaderLabels: string[] = [];
    for (let c = 0; c <= K; c++) {
      if (c === K) {
        colHeaderLabels.push('Estado Final (s₀)');
      } else {
        const stageK = K - c; // k de 1..K
        const stageDef = solution.stages.find((s) => s.k === stageK);
        colHeaderLabels.push(`k=${stageK}: ${stageDef?.label ?? ''}`);
      }
    }

    // Calcular posiciones de nodos
    for (let colIdx = 0; colIdx <= K; colIdx++) {
      const stageK = K - colIdx; // stage index (k=K at col 0, down to k=1 at col K-1, and 0 for col K)
      const x = paddingX + colIdx * colWidth;
      for (let s = 0; s <= N; s++) {
        const y = paddingY + (N - s) * rowHeight; // s=N arriba, s=0 abajo
        const node: NodePos = { k: stageK, colIdx, state: s, x, y };
        nodes.push(node);
        nodeMap.set(`${colIdx},${s}`, node);
      }
    }

    // Calcular aristas (transiciones)
    const edges: EdgeDef[] = [];

    // Iteramos cada etapa k = K..1 (correspondientes a colIdx = 0..K-1)
    for (let colIdx = 0; colIdx < K; colIdx++) {
      const stageK = K - colIdx;
      const stageResult = solution.stages.find((s) => s.k === stageK);
      if (!stageResult) continue;

      const sourceCol = colIdx;
      const targetCol = colIdx + 1;

      stageResult.rows.forEach((row) => {
        const s = row.state;
        const sourceNode = nodeMap.get(`${sourceCol},${s}`);
        if (!sourceNode) return;

        row.cells.forEach((cell) => {
          if (!cell.feasible) return;
          const targetNode = nodeMap.get(`${targetCol},${cell.prevState}`);
          if (!targetNode) return;

          const key = cellKey(stageK, s, cell.d);
          const isOptimal = cell.isOptimal;
          const isPath = path.has(key);
          const isPrimary = primary.has(key);
          const isLinked = linked.has(key);

          edges.push({
            id: key,
            k: stageK,
            state: s,
            d: cell.d,
            prevState: cell.prevState,
            x1: sourceNode.x,
            y1: sourceNode.y,
            x2: targetNode.x,
            y2: targetNode.y,
            isOptimal,
            isPath,
            isPrimary,
            isLinked,
          });
        });
      });
    }

    return { nodes, edges, colHeaderLabels };
  }, [K, N, solution, primary, linked, path, colWidth, rowHeight, paddingX, paddingY]);

  // Filtrar aristas a mostrar
  const visibleEdges = edges.filter((e) => showAllTransitions || e.isOptimal || e.isPath || e.isPrimary || e.isLinked);

  return (
    <section className="panel">
      <div className="graph-header">
        <div>
          <h2>Red de Estados y Transiciones</h2>
          <p className="hint">
            Visualización de la red de decisión s_k → s_(k-1). Las aristas resaltadas corresponden a decisiones óptimas (d*)
            o la política seleccionada.
          </p>
        </div>
        <div className="graph-controls">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showAllTransitions}
              onChange={(e) => setShowAllTransitions(e.target.checked)}
            />
            Mostrar todas las transiciones factibles
          </label>
        </div>
      </div>

      <div className="graph-container">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <defs>
            <marker
              id="arrow-normal"
              viewBox="0 0 10 10"
              refX="16"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#3a404d" />
            </marker>
            <marker
              id="arrow-optimal"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
            </marker>
            <marker
              id="arrow-path"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#c77dff" />
            </marker>
            <marker
              id="arrow-primary"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#ffb020" />
            </marker>
          </defs>

          {/* Encabezados de columnas */}
          {colHeaderLabels.map((label, c) => {
            const x = paddingX + c * colWidth;
            return (
              <g key={c}>
                <text x={x} y={paddingY - 25} textAnchor="middle" className="graph-col-title">
                  {label}
                </text>
                <line
                  x1={x}
                  y1={paddingY - 15}
                  x2={x}
                  y2={height - paddingY + 15}
                  stroke="#262b33"
                  strokeDasharray="3 3"
                />
              </g>
            );
          })}

          {/* Aristas */}
          {visibleEdges.map((edge) => {
            let strokeColor = '#2a303c';
            let strokeWidth = 1.5;
            let strokeDash = showAllTransitions && !edge.isOptimal ? '3 3' : 'none';
            let marker = 'url(#arrow-normal)';

            if (edge.isOptimal) {
              strokeColor = '#10b981';
              strokeWidth = 2.2;
              marker = 'url(#arrow-optimal)';
            }
            if (edge.isLinked) {
              strokeColor = '#4da3ff';
              strokeWidth = 3;
            }
            if (edge.isPrimary) {
              strokeColor = '#ffb020';
              strokeWidth = 3.5;
              marker = 'url(#arrow-primary)';
            }
            if (edge.isPath) {
              strokeColor = '#c77dff';
              strokeWidth = 3.5;
              marker = 'url(#arrow-path)';
            }

            return (
              <g
                key={edge.id}
                className="graph-edge-group"
                onMouseEnter={() => {
                  setHoveredEdge(edge);
                  onHoverCell(edge.k, edge.state, edge.d);
                }}
                onMouseLeave={() => {
                  setHoveredEdge(null);
                  onLeaveCell();
                }}
              >
                <line
                  x1={edge.x1}
                  y1={edge.y1}
                  x2={edge.x2}
                  y2={edge.y2}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDash}
                  markerEnd={marker}
                />
                {/* Etiqueta de decisión d sobre la arista cuando está resaltada o hover */}
                {(edge.isPath || edge.isPrimary || edge.isLinked || hoveredEdge?.id === edge.id) && (
                  <g transform={`translate(${(edge.x1 + edge.x2) / 2}, ${(edge.y1 + edge.y2) / 2 - 8})`}>
                    <rect x="-14" y="-9" width="28" height="16" rx="4" fill="#0f1216" stroke={strokeColor} strokeWidth="1" />
                    <text x="0" y="3" textAnchor="middle" fill="#e6e6e6" fontSize="10" fontWeight="bold">
                      d={edge.d}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Nodos */}
          {nodes.map((node) => {
            // Verificar si el nodo está en la ruta seleccionada
            const isInitialStart = node.colIdx === 0 && node.state === N;
            const isReachableOptimal = edges.some(
              (e) => (e.isOptimal || e.isPath) && ((e.x1 === node.x && e.y1 === node.y) || (e.x2 === node.x && e.y2 === node.y))
            );

            return (
              <g key={`${node.colIdx}-${node.state}`} transform={`translate(${node.x}, ${node.y})`}>
                <circle
                  r={12}
                  fill={isInitialStart ? '#2563eb' : isReachableOptimal ? '#172554' : '#171b21'}
                  stroke={isInitialStart ? '#60a5fa' : isReachableOptimal ? '#3b82f6' : '#333a44'}
                  strokeWidth={isInitialStart ? 3 : 1.5}
                />
                <text x="0" y="4" textAnchor="middle" fill="#e6e6e6" fontSize="11" fontWeight="600">
                  {node.state}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {hoveredEdge && (
        <div className="graph-tooltip">
          Etapa k={hoveredEdge.k}: En estado s={hoveredEdge.state}, tomar decisión d={hoveredEdge.d} pasa al estado s'=
          {hoveredEdge.prevState}
        </div>
      )}
    </section>
  );
}
