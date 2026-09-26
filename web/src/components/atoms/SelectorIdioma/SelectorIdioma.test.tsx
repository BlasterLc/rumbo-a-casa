import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocaleProvider, useT } from '../../../i18n/LocaleContext';
import { SelectorIdioma } from './SelectorIdioma';

function Testigo() {
  const t = useT();
  return <div data-testid="testigo">{t.pantallas.bienvenida.empezar}</div>;
}

describe('SelectorIdioma', () => {
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
});
