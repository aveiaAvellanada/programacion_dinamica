import { MathView } from './MathView';

const ITEMS: { cls: string; label: string; mathLabel?: string; help: string }[] = [
  { cls: 'optimal', label: 'Decisión óptima ', mathLabel: 'd^*', help: 'Su valor iguala a f* de la fila (puede haber empates).' },
  { cls: 'primary', label: 'Celda enfocada', help: 'La celda bajo el cursor, fijada, o evaluada por el reproductor.' },
  { cls: 'linked', label: 'Consultada en ', mathLabel: 'k-1', help: 'El óptimo de la etapa anterior que esta celda reutiliza.' },
  { cls: 'path', label: 'Ruta de la política', help: 'Trayectoria completa de la política óptima seleccionada.' },
  { cls: 'infeasible', label: 'Infactible (—)', help: 'd > s: no hay tantos recursos disponibles.' },
];

export function Legend() {
  return (
    <div className="legend">
      {ITEMS.map((item) => (
        <span className="legend-item" key={item.cls} title={item.help}>
          <span className={`legend-swatch cell ${item.cls}`} />
          {item.label}
          {item.mathLabel && <MathView math={item.mathLabel} />}
        </span>
      ))}
    </div>
  );
}
