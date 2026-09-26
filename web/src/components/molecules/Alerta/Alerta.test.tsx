import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Alerta } from './Alerta';

describe('Alerta', () => {
  it('dice qué pasó y qué sigue', () => {
    render(<Alerta severity="warning">El llamado del DS1 cierra el 28 de octubre. Te faltan 2 documentos.</Alerta>);
    expect(screen.getByText(/El llamado del DS1 cierra el 28 de octubre/)).toBeInTheDocument();
  });

  it('usa la superficie suave de warning, no un rojo de bloqueo', () => {
    render(<Alerta severity="warning">Plazo por vencer.</Alerta>);
    expect(screen.getByRole('alert')).toHaveStyle({ backgroundColor: 'rgb(253, 240, 217)' });
  });

  it('el título hace de palabra cuando existe, junto al icono', () => {
    render(
      <Alerta severity="success" titulo="Documento listo">
        Guardamos tu certificado.
      </Alerta>,
    );
    expect(screen.getByText('Documento listo')).toBeInTheDocument();
    expect(screen.getByTestId('SuccessOutlinedIcon')).toBeInTheDocument();
  });

  it('la acción llama a onAccion al presionarla', async () => {
    const onAccion = vi.fn();
    render(
      <Alerta severity="info" accion="Ver mi plan" onAccion={onAccion}>
        Calificas para DS49.
      </Alerta>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Ver mi plan' }));
    expect(onAccion).toHaveBeenCalledOnce();
  });
});
