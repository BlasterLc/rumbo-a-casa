import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocaleProvider, useT, useIdioma } from './LocaleContext';

function Sonda() {
  const t = useT();
  const { idioma, cambiarIdioma } = useIdioma();
  return (
    <div>
      <div data-testid="idioma">{idioma}</div>
      <div data-testid="texto">{t.pantallas.bienvenida.empezar}</div>
      <button onClick={() => cambiarIdioma('en')}>a ingles</button>
    </div>
  );
}

describe('LocaleProvider', () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('arranca en español por defecto', () => {
    render(
      <LocaleProvider>
        <Sonda />
      </LocaleProvider>,
    );
    expect(screen.getByTestId('idioma')).toHaveTextContent('es');
    expect(screen.getByTestId('texto')).toHaveTextContent('Empezar');
  });

  it('cambiar de idioma actualiza el texto en vivo', async () => {
    render(
      <LocaleProvider>
        <Sonda />
      </LocaleProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'a ingles' }));
    expect(screen.getByTestId('idioma')).toHaveTextContent('en');
    expect(screen.getByTestId('texto')).toHaveTextContent('Start');
  });

  it('guarda el idioma elegido y lo recupera en una sesión nueva', async () => {
    const { unmount } = render(
      <LocaleProvider>
        <Sonda />
      </LocaleProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'a ingles' }));
    unmount();
    render(
      <LocaleProvider>
        <Sonda />
      </LocaleProvider>,
    );
    expect(screen.getByTestId('idioma')).toHaveTextContent('en');
  });

  it('si localStorage lanza, sigue funcionando en memoria en español', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() =>
      render(
        <LocaleProvider>
          <Sonda />
        </LocaleProvider>,
      ),
    ).not.toThrow();
    expect(screen.getByTestId('idioma')).toHaveTextContent('es');
  });
});
