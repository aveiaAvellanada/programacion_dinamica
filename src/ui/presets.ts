import type { DPProblem } from '../engine/types';

export interface PresetProblem {
  id: string;
  name: string;
  description: string;
  problem: DPProblem;
}

export const PRESET_PROBLEMS: PresetProblem[] = [
  {
    id: 'el-primo',
    name: 'El Primo (3 Tiendas, N=5)',
    description: 'Problema guía: Asignación de 5 unidades de recursos a 3 tiendas para maximizar utilidad.',
    problem: {
      resources: 5,
      sense: 'max',
      stages: [
        { id: 'tienda-1', label: 'Tienda 1', payoff: [0, 5, 9, 14, 19, 21] },
        { id: 'tienda-2', label: 'Tienda 2', payoff: [0, 6, 11, 15, 17, 22] },
        { id: 'tienda-3', label: 'Tienda 3', payoff: [0, 4, 9, 13, 18, 20] },
      ],
    },
  },
  {
    id: 'brigadas-salud',
    name: 'Brigadas Médicas (4 Zonas, N=5)',
    description: 'Distribución de 5 brigadas en 4 zonas de la ciudad para maximizar la población asistida.',
    problem: {
      resources: 5,
      sense: 'max',
      stages: [
        { id: 'zona-1', label: 'Zona Norte', payoff: [0, 9, 15, 19, 21, 22] },
        { id: 'zona-2', label: 'Zona Centro', payoff: [0, 8, 14, 17, 19, 20] },
        { id: 'zona-3', label: 'Zona Sur', payoff: [0, 10, 16, 18, 20, 21] },
        { id: 'zona-4', label: 'Zona Oriente', payoff: [0, 7, 12, 16, 18, 19] },
      ],
    },
  },
  {
    id: 'inversion-capital',
    name: 'Inversión de Capital (3 Proyectos, N=4)',
    description: 'Inversión de $4 millones entre 3 proyectos capitales para maximizar el Valor Presente Neto (VPN).',
    problem: {
      resources: 4,
      sense: 'max',
      stages: [
        { id: 'proj-1', label: 'Proyecto Energía', payoff: [0, 12, 25, 36, 42] },
        { id: 'proj-2', label: 'Proyecto Tecnología', payoff: [0, 15, 24, 33, 40] },
        { id: 'proj-3', label: 'Proyecto Infraestructura', payoff: [0, 10, 22, 35, 44] },
      ],
    },
  },
  {
    id: 'minimizar-costos',
    name: 'Mantenimiento de Equipos (3 Años, N=4)',
    description: 'Minimización del costo de mantenimiento a lo largo de 3 periodos.',
    problem: {
      resources: 4,
      sense: 'min',
      stages: [
        { id: 'period-1', label: 'Año 1', payoff: [2, 5, 8, 12, 18] },
        { id: 'period-2', label: 'Año 2', payoff: [1, 4, 7, 11, 15] },
        { id: 'period-3', label: 'Año 3', payoff: [3, 6, 9, 13, 17] },
      ],
    },
  },
];
