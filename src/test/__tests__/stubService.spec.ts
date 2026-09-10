import { describe, expect, it, vi } from 'vitest';

import { createStubService } from '../stubService';

describe('createStubService', () => {
  it('returns seeded messages and state without sharing them', () => {
    const payload = [{ id: 'm-1' }];
    const stub = createStubService({
      messages: payload,
      state: { context: 'preview', isTyping: true },
    });

    payload.push({ id: 'm-2' });
    const messages = stub.getMessages();
    messages.push({ id: 'm-3' });

    expect(stub.getMessages()).toEqual([{ id: 'm-1' }]);
    expect(stub.getState().context).toBe('preview');
    expect(stub.getState().isTyping).toBe(true);
    expect(stub.getState().messages).toEqual([{ id: 'm-1' }]);
  });

  it('tracks listeners so teardown can assert a zero residual count', () => {
    const stub = createStubService();
    const first = vi.fn();
    const second = vi.fn();

    expect(stub.listenerCount).toBe(0);

    stub.on('message:received', first);
    stub.on('message:received', second);
    stub.on('connected', first);

    expect(stub.listenerCount).toBe(3);

    stub.emit('message:received', { id: 'm-1' });
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);

    stub.off('message:received', first);
    stub.off('message:received', second);
    stub.off('connected', first);

    expect(stub.listenerCount).toBe(0);
    stub.emit('message:received', { id: 'm-2' });
    expect(first).toHaveBeenCalledTimes(1);
  });

  it('keeps two stubs independent', () => {
    const left = createStubService({ messages: [{ id: 'left' }] });
    const right = createStubService({ messages: [{ id: 'right' }] });
    const listener = vi.fn();

    left.on('message:received', listener);
    right.emit('message:received', { id: 'nope' });

    expect(listener).not.toHaveBeenCalled();
    expect(left.getMessages()).toEqual([{ id: 'left' }]);
    expect(right.getMessages()).toEqual([{ id: 'right' }]);
    expect(left.listenerCount).toBe(1);
    expect(right.listenerCount).toBe(0);
  });
});
