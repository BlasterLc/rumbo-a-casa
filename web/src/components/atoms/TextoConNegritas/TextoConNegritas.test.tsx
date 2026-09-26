import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TextoConNegritas } from './TextoConNegritas';

describe('TextoConNegritas', () => {
  it('convierte **texto** en negrita y no deja asteriscos a la vista', () => {
    const { container } = render(<TextoConNegritas texto="Tu familia califica para **tres programas**. ¿Seguimos?" />);
    const negrita = screen.getByText('tres programas');
    expect(negrita.tagName).toBe('STRONG');
    expect(container.textContent).toBe('Tu familia califica para tres programas. ¿Seguimos?');
    expect(container.textContent).not.toContain('*');
  });

  it('acepta varias negritas en el mismo texto', () => {
    render(<TextoConNegritas texto="**DS49:** cumples. **DS1:** no." />);
    expect(screen.getByText('DS49:').tagName).toBe('STRONG');
    expect(screen.getByText('DS1:').tagName).toBe('STRONG');
  });

  it('un texto sin negritas queda tal cual', () => {
    const { container } = render(<TextoConNegritas texto="Hola, ¿en qué región vives?" />);
    expect(container.textContent).toBe('Hola, ¿en qué región vives?');
    expect(container.querySelector('strong')).toBeNull();
  });

  it('nunca interpreta HTML: el marcado del texto se muestra como texto', () => {
    const { container } = render(<TextoConNegritas texto={'**<img src=x onerror=alert(1)>** <b>hola</b>'} />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('b')).toBeNull();
    expect(container.textContent).toBe('<img src=x onerror=alert(1)> <b>hola</b>');
  });

  it('un ** sin pareja no rompe nada y se quita en vez de mostrarse suelto', () => {
    const { container } = render(<TextoConNegritas texto="Cuéntame **¿cuántos años tienes?" />);
    expect(container.textContent).toBe('Cuéntame ¿cuántos años tienes?');
  });
});
