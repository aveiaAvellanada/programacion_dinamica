export type Sense = 'max' | 'min';

export interface StageDef {
  id: string;
  label: string;
  /** payoff[d] para d = 0..resources */
  payoff: number[];
}

export interface DPProblem {
  /** N, entero >= 0 */
  resources: number;
  /** índice 0 => k=1 (última etapa evaluada), índice K-1 => k=K (etapa inicial) */
  stages: StageDef[];
  sense: Sense;
}

export interface Cell {
  d: number;
  pk: number;
  /**
   * s_{k-1} = s_k - d. Si feasible=false, este valor puede ser negativo
   * (fuera del rango de filas de la etapa anterior) — es una señal
   * deliberada de "no aplica", nunca un índice real a consultar.
   */
  prevState: number;
  /** NaN cuando feasible=false */
  fPrev: number;
  /** pk + fPrev; NaN cuando feasible=false */
  value: number;
  /** false cuando d > s_k */
  feasible: boolean;
  /** true si value === fStar de su fila (con tolerancia EPS) */
  isOptimal: boolean;
}

export interface Row {
  state: number;
  /** longitud resources+1, incluidas las infactibles */
  cells: Cell[];
  fStar: number;
  /** siempre array, ascendente, nunca vacío si state >= 0 */
  dStar: number[];
}

export interface StageResult {
  k: number;
  label: string;
  /** ordenadas por state ascendente, de 0 a resources; rows[s] tiene state === s */
  rows: Row[];
}

export interface Policy {
  /** decisions[i] = d para la etapa k=i+1 */
  decisions: number[];
  /** states[i] = s_k a la entrada de la etapa k=i+1 */
  states: number[];
  /** contributions[i] = p_k(d_k) */
  contributions: number[];
  total: number;
}

export type Step =
  | { type: 'enter-stage'; k: number }
  | { type: 'enter-row'; k: number; state: number }
  | { type: 'eval-cell'; k: number; state: number; d: number; prevState: number; value: number }
  | { type: 'commit-row'; k: number; state: number; fStar: number; dStar: number[] }
  | { type: 'begin-backtrack' }
  | { type: 'backtrack-pick'; policyIndex: number; k: number; state: number; d: number }
  | { type: 'done' };

export interface Solution {
  problem: DPProblem;
  stages: StageResult[];
  policies: Policy[];
  steps: Step[];
  optimalValue: number;
  /** true si se alcanzó el tope de 200 políticas durante el backtracking */
  truncated?: boolean;
}
