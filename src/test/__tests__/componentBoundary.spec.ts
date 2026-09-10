import path from 'node:path';

import { ESLint } from 'eslint';
import { beforeAll, describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const eslint = new ESLint({ cwd: repoRoot });

async function lintSnippet(relativePath: string, code: string) {
  const [result] = await eslint.lintText(code, {
    filePath: path.join(repoRoot, relativePath),
  });

  return result?.messages ?? [];
}

describe('presentational core boundary', () => {
  beforeAll(async () => {
    await lintSnippet('src/composables/warmup.ts', 'export {}\n');
  }, 30_000);

  it('forbids components from importing @weni/webchat-service', async () => {
    const messages = await lintSnippet(
      'src/components/PwcThread/forbidden.ts',
      `import { WeniWebchatService } from '@weni/webchat-service';\nexport const Service = WeniWebchatService;\n`,
    );

    expect(
      messages.some((message) => message.ruleId === 'no-restricted-imports'),
    ).toBe(true);
  }, 20_000);

  it('allows the composables entry to import @weni/webchat-service', async () => {
    const messages = await lintSnippet(
      'src/composables/useWebchatService.ts',
      `import { WeniWebchatService } from '@weni/webchat-service';\nexport const Service = WeniWebchatService;\n`,
    );

    expect(
      messages.some((message) => message.ruleId === 'no-restricted-imports'),
    ).toBe(false);
  }, 20_000);
});
