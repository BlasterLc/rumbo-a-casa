import { describe, it, expect, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEscritorio } from './useEscritorio';
import { simularEscritorio, type ControlEscritorio } from '../test/utilidades';

describe('useEscritorio', () => {
  let control: ControlEscritorio | undefined;
  afterEach(() => {
    control?.restaurar();
    control = undefined;
  });

  it('sin matchMedia (jsdom) devuelve false: la versión móvil', () => {
    const { result } = renderHook(() => useEscritorio());
    expect(result.current).toBe(false);
  });

  it('en una ventana ancha devuelve true', () => {
    control = simularEscritorio(true);
    const { result } = renderHook(() => useEscritorio());
    expect(result.current).toBe(true);
  });

  it('reacciona al cruzar los 900 px en ambos sentidos', () => {
    control = simularEscritorio(true);
    const { result } = renderHook(() => useEscritorio());
    act(() => control!.cambiar(false));
    expect(result.current).toBe(false);
    act(() => control!.cambiar(true));
    expect(result.current).toBe(true);
  });
});
