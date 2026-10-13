import { describe, expect, it } from 'vitest';
import {
  applyClick,
  createInitialState,
  ironPerClick,
} from '@akai/shared';

describe('mineração por clique', () => {
  it('um clique concede exatamente o ferro do nível (1 no nível inicial)', () => {
    const state = createInitialState(0);
    const events = applyClick(state);
    expect(state.resources.iron).toBe(1);
    expect(events).toEqual([{ t: 'click', iron: 1 }]);
  });

  it('o ganho por clique cresce com o nível do clicker', () => {
    const state = createInitialState(0);
    state.clickerLevel = 5;
    applyClick(state);
    expect(state.resources.iron).toBe(ironPerClick(5));
    expect(ironPerClick(5)).toBe(5);
  });

  it('ferro nunca fica negativo ao clicar', () => {
    const state = createInitialState(0);
    for (let i = 0; i < 50; i += 1) applyClick(state);
    expect(state.resources.iron).toBeGreaterThanOrEqual(0);
  });
});
