import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderConIdioma } from '../../../test/utilidades';
import { ChecklistDocumentos } from './ChecklistDocumentos';

const items = [
  { nombre: 'Tu cédula', oficial: 'Cédula de identidad vigente', listo: true },
  { nombre: 'Cartola Hogar', donde: 'En línea, gratis, en registrosocial.gob.cl', listo: false },
  { nombre: 'Certificado de ahorro', vence: '30 sep 2026', listo: false },
];

describe('ChecklistDocumentos', () => {
  it('muestra el progreso en texto, no solo en barra', () => {
    renderConIdioma(<ChecklistDocumentos items={items} />);
    expect(screen.getByText('1 de 3 listos')).toBeInTheDocument();
  });

  it('el nombre común va primero y el oficial abajo en letra chica', () => {
    renderConIdioma(<ChecklistDocumentos items={items} />);
    expect(screen.getByText('Tu cédula')).toBeInTheDocument();
    expect(screen.getByText('Cédula de identidad vigente')).toBeInTheDocument();
  });

  it('un documento pendiente con vencimiento muestra la fecha completa', () => {
    renderConIdioma(<ChecklistDocumentos items={items} />);
    expect(screen.getByText('Vence: 30 sep 2026')).toBeInTheDocument();
  });

  it('marcar la casilla llama a onToggle con el índice', async () => {
    const onToggle = vi.fn();
    renderConIdioma(<ChecklistDocumentos items={items} onToggle={onToggle} />);
    await userEvent.click(screen.getByRole('checkbox', { name: /Cartola Hogar/ }));
    expect(onToggle).toHaveBeenCalledWith(1);
  });

  it('dice que la app no guarda los documentos', () => {
    renderConIdioma(<ChecklistDocumentos items={items} />);
    expect(screen.getByText(/La app no guarda tus documentos/)).toBeInTheDocument();
  });

  it('cada documento tiene una casilla con la etiqueta visible "Ya lo tengo guardado"', () => {
    renderConIdioma(<ChecklistDocumentos items={items} />);
    expect(screen.getAllByText('Ya lo tengo guardado')).toHaveLength(3);
  });

  it('explica en una línea para qué sirve la casilla', () => {
    renderConIdioma(<ChecklistDocumentos items={items} />);
    expect(screen.getByText(/Marca cada papel cuando ya lo tengas guardado/)).toBeInTheDocument();
  });

  it('el nombre accesible de la casilla incluye el documento', () => {
    renderConIdioma(<ChecklistDocumentos items={items} />);
    expect(screen.getByRole('checkbox', { name: /Cartola Hogar/ })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Tu cédula/ })).toBeChecked();
  });
});
