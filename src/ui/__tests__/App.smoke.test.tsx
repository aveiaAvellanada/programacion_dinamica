// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import { App } from '../App';

afterEach(cleanup);

/**
 * Prueba de humo: no valida matemática (de eso se encargan los tests del
 * motor), sino que la UI monte y reaccione sin errores de runtime.
 */
describe('App — prueba de humo de la interfaz', () => {
  it('monta sin lanzar y muestra el valor óptimo de El Primo', () => {
    render(<App />);
    expect(screen.getByText('Valor óptimo f*')).toBeDefined();
    // El problema inicial (El Primo) tiene f* = 25 y 3 políticas óptimas.
    const summary = screen.getByText('Valor óptimo f*').parentElement;
    expect(summary?.textContent).toContain('25');
    // El resumen de cabecera, no el encabezado del panel de políticas
    // (ambos dicen "Políticas óptimas", así que se acota por clase).
    const badges = Array.from(document.querySelectorAll('.summary-badge'));
    const policiesBadge = badges.find((b) => b.textContent?.includes('Políticas óptimas'));
    expect(policiesBadge?.textContent).toContain('3');
  });

  it('no emite errores ni warnings de React al montar', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    render(<App />);
    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it('renderiza una tabla por etapa con sus filas de estado', () => {
    render(<App />);
    // 3 etapas de El Primo.
    expect(screen.getByText('Tienda 1')).toBeDefined();
    expect(screen.getByText('Tienda 2')).toBeDefined();
    expect(screen.getByText('Tienda 3')).toBeDefined();
  });

  it('el inspector reacciona al hover sobre una celda factible', () => {
    render(<App />);
    expect(screen.getByText(/Pasa el cursor por una celda/)).toBeDefined();

    // La celda (k=1, s=5, d=5) es factible: title contiene su descomposición.
    const cell = document.querySelector('td[title^="f_1(5, 5)"]');
    expect(cell).not.toBeNull();
    if (cell) fireEvent.mouseEnter(cell);

    // Ya no debe verse el placeholder; ahora hay una ecuación de Bellman.
    expect(screen.queryByText(/Pasa el cursor por una celda/)).toBeNull();
    expect(document.querySelector('.bellman')).not.toBeNull();
  });

  it('hacer clic en una celda la fija y Escape la suelta', () => {
    render(<App />);
    const cell = document.querySelector('td[title^="f_1(5, 5)"]');
    expect(cell).not.toBeNull();
    if (!cell) return;

    fireEvent.click(cell);
    fireEvent.mouseLeave(cell);
    // Al soltar el hover, la celda fijada mantiene el inspector abierto.
    expect(document.querySelector('.inspector.pinned')).not.toBeNull();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(document.querySelector('.inspector.pinned')).toBeNull();
  });

  it('el reproductor avanza y describe el paso actual', () => {
    render(<App />);
    const player = screen.getByText('Reproductor paso a paso').closest('section');
    expect(player).not.toBeNull();
    if (!player) return;

    fireEvent.click(within(player).getByTitle('Paso siguiente (→)'));
    expect(within(player).getByText(/1 \/ \d+/)).toBeDefined();
    expect(document.querySelector('.phase-badge')).not.toBeNull();
  });

  it('seleccionar una política resalta su ruta en las tablas', () => {
    render(<App />);
    expect(document.querySelectorAll('td.cell.path').length).toBe(0);

    const firstPolicy = document.querySelector('.policy-btn');
    expect(firstPolicy).not.toBeNull();
    if (firstPolicy) fireEvent.click(firstPolicy);

    // Una política de 3 etapas resalta 3 celdas.
    expect(document.querySelectorAll('td.cell.path').length).toBe(3);
  });

  it('editar los recursos recalcula la solución sin romper la vista', () => {
    render(<App />);
    const input = screen.getByLabelText(/Recursos totales/i, { selector: 'input' });
    fireEvent.change(input, { target: { value: '3' } });

    // Con N=3 cada tabla tiene 4 filas de estado (s=0..3); la app sigue viva.
    expect(screen.getByText('Valor óptimo f*')).toBeDefined();
    expect(document.querySelector('.bellman')).toBeNull();
  });
});
