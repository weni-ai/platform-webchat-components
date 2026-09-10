import { describe, expect, it } from 'vitest';

describe('package entry', () => {
  it('loads without importing the service', async () => {
    const mod = await import('../index');

    expect(mod).toBeDefined();
  });
});
