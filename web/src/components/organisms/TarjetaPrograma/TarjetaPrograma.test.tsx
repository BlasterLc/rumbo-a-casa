import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderConIdioma, cssActual } from '../../../test/utilidades';
import { TarjetaPrograma } from './TarjetaPrograma';

describe('TarjetaPrograma', () => {
  it('el título junta la sigla y el nombre común', () => {
    renderConIdioma(
      <TarjetaPrograma
        sigla="DS49"
        nombreComun="Casa propia sin crédito"
        estado="califica"
        razon="Cumples los requisitos."
      />,
    );
    expect(screen.getByText('DS49 — Casa propia sin crédito')).toBeInTheDocument();
  });

  it('muestra la razón y la regla citada', () => {
    renderConIdioma(
      <TarjetaPrograma
        sigla="DS49"
        nombreComun="Casa propia sin crédito"
        estado="califica"
        razon="Cumples los requisitos de DS49."
        regla="D.S. N°49 (V. y U.) de 2011"
      />,
    );
    expect(screen.getByText('Cumples los requisitos de DS49.')).toBeInTheDocument();
    expect(screen.getByText('Fuente: D.S. N°49 (V. y U.) de 2011')).toBeInTheDocument();
  });

  it('la acción llama a onAccion', async () => {
    const onAccion = vi.fn();
    renderConIdioma(
      <TarjetaPrograma
        sigla="DS49"
        nombreComun="Casa propia sin crédito"
        estado="califica"
        razon="Cumples."
        accion="Ver los documentos"
        onAccion={onAccion}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Ver los documentos' }));
    expect(onAccion).toHaveBeenCalledOnce();
  });

  it('sin accion, no muestra ningún botón', () => {
    renderConIdioma(
      <TarjetaPrograma sigla="DS52" nombreComun="Arriendo" estado="noAplica" razon="Ya tienes vivienda propia." />,
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('ocupa el alto de su celda para que el botón quede al pie aunque el texto sea corto', () => {
    renderConIdioma(<TarjetaPrograma sigla="DS1" nombreComun="Sectores medios" estado="noAplica" razon="No alcanza." />);
    expect(cssActual()).toMatch(/height:\s*100%/);
  });
});
