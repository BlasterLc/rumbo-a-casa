import { describe, it, expect } from 'vitest';
import { mapEstado } from './estado';

describe('mapEstado', () => {
  it('mapea elegible a califica', () => expect(mapEstado('elegible')).toBe('califica'));
  it('mapea falta_dato a falta', () => expect(mapEstado('falta_dato')).toBe('falta'));
  it('mapea no_elegible a noAplica, nunca a "posible"', () => expect(mapEstado('no_elegible')).toBe('noAplica'));
});
