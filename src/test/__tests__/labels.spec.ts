import { describe, expect, it } from 'vitest';

import {
  isSentinelLabel,
  listSentinelLabels,
  sentinelLabel,
  sentinelLabels,
  threadLabels,
} from '../labels';

describe('sentinel labels', () => {
  it('builds a recognisable sentinel from a path', () => {
    expect(sentinelLabel('thread.empty')).toBe('__PWC_thread.empty__');
    expect(isSentinelLabel(threadLabels.empty)).toBe(true);
    expect(isSentinelLabel('No messages yet')).toBe(false);
  });

  it('gives every contract labels object unique sentinels', () => {
    const values = listSentinelLabels();
    const unique = new Set(values);

    expect(values.length).toBeGreaterThan(0);
    expect(unique.size).toBe(values.length);
    expect(values.every(isSentinelLabel)).toBe(true);
    expect(Object.keys(sentinelLabels)).toEqual([
      'thread',
      'message',
      'messageActions',
      'composer',
      'suggestions',
      'productSet',
      'productDetail',
      'cartIndicator',
      'cart',
      'voice',
    ]);
  });
});
