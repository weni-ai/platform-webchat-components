import { describe, expect, it } from 'vitest';

describe('package entry', () => {
  it('loads without importing the service', async () => {
    const mod = await import('../index');

    expect(mod).toBeDefined();
  });

  it('exports no runtime values from the public entry', async () => {
    const mod = await import('../index');

    expect(Object.keys(mod)).toEqual([]);
  });

  it('loads the composables entry without implementation', async () => {
    const mod = await import('../composables');

    expect(Object.keys(mod)).toEqual([]);
  });
});
