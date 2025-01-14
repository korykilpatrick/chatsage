import { describe, it, expect } from 'vitest';
import { store } from '../store';

describe('Redux Store', () => {
  it('creates store with initial state', () => {
    const state = store.getState();
    expect(state).toBeDefined();
  });
});
