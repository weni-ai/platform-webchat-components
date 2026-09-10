import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

describe('token layer', () => {
  const source = readFileSync(
    path.join(process.cwd(), 'src/styles/tokens.scss'),
    'utf8',
  );

  it('forwards Unnnic and exposes no tokens of its own', () => {
    expect(source).toContain('@weni/unnnic-system/src/assets/scss/unnnic.scss');
    expect(source).not.toMatch(/\$[A-Za-z0-9_-]+\s*:/);
  });
});
