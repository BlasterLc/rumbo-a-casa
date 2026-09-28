import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocaleProvider, useT } from '../../../i18n/LocaleContext';
import { cssActual } from '../../../test/utilidades';
import { SelectorIdioma } from './SelectorIdioma';

function Testigo() {
  const t = useT();
  return <div data-testid="testigo">{t.pantallas.bienvenida.empezar}</div>;
}

describe('SelectorIdioma', () => {
  beforeEach(() => window.localStorage.clear());

  it('muestra ES activo por defecto, con su nombre completo accesible', () => {
    render(
      <LocaleProvider>
        <SelectorIdioma />
      </LocaleProvider>,
    );
    expect(screen.getByRole('button', { name: 'Español', pressed: true })).toBeInTheDocument();
  });

  it('tocar EN cambia el idioma de toda la app', async () => {
    render(
      <LocaleProvider>
        <SelectorIdioma />
        <Testigo />
      </LocaleProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'English' }));
    expect(screen.getByTestId('testigo')).toHaveTextContent('Start');
  });

  it('con tono claro sigue ofreciendo los dos idiomas y marca el activo', () => {
    render(
      <LocaleProvider>
        <SelectorIdioma tono="claro" />
      </LocaleProvider>,
    );
    expect(screen.getByRole('button', { name: 'Español', pressed: true })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'English', pressed: false })).toBeInTheDocument();
  });

  it.each([
    ['sobreMarca', '#ffffff'],
    ['claro', '#1b4d8f'],
  ] as const)('con tono %s el anillo de foco de los botones es %s', (tono, esperado) => {
    const { container } = render(
      <LocaleProvider>
        <SelectorIdioma tono={tono} />
      </LocaleProvider>,
    );
    const clase = Array.from(container.firstElementChild!.classList).find((c) => c.startsWith('css-'))!;
    const regla = new RegExp(`\\.${clase} \\.MuiToggleButton-root:focus-visible\\{[^}]*outline:3px solid ${esperado}`);
    expect(cssActual()).toMatch(regla);
  });
});
