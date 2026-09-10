export type StubServiceListener = (..._args: unknown[]) => void;

export interface StubServiceState {
  messages: unknown[];
  session: Record<string, unknown>;
  connection: { status: string };
  context: string;
  isTyping: boolean;
}

export interface StubWebchatService {
  on(_event: string, _listener: StubServiceListener): StubWebchatService;
  off(_event: string, _listener: StubServiceListener): StubWebchatService;
  emit(_event: string, ..._args: unknown[]): void;
  getState(): StubServiceState;
  getMessages(): unknown[];
  readonly listenerCount: number;
}

const defaultState = (): StubServiceState => ({
  messages: [],
  session: {},
  connection: { status: 'disconnected' },
  context: '',
  isTyping: false,
});

/**
 * In-memory stand-in for `@weni/webchat-service` 1.10.3's published surface.
 * Built for teardown assertions: `listenerCount` must return to its pre-mount
 * value after unmount.
 */
export function createStubService(initial?: {
  messages?: unknown[];
  state?: Partial<StubServiceState>;
}): StubWebchatService {
  const listeners = new Map<string, Set<StubServiceListener>>();
  const messages = [...(initial?.messages ?? [])];
  const state: StubServiceState = {
    ...defaultState(),
    ...initial?.state,
    messages,
  };

  const service: StubWebchatService = {
    on(event, listener) {
      const set = listeners.get(event) ?? new Set<StubServiceListener>();
      set.add(listener);
      listeners.set(event, set);
      return service;
    },

    off(event, listener) {
      const set = listeners.get(event);
      if (!set) {
        return service;
      }

      set.delete(listener);
      if (set.size === 0) {
        listeners.delete(event);
      }

      return service;
    },

    emit(event, ...args) {
      const set = listeners.get(event);
      if (!set) {
        return;
      }

      for (const listener of set) {
        listener(...args);
      }
    },

    getState() {
      return {
        ...state,
        messages: [...messages],
        session: { ...state.session },
        connection: { ...state.connection },
      };
    },

    getMessages() {
      return [...messages];
    },

    get listenerCount() {
      let count = 0;
      for (const set of listeners.values()) {
        count += set.size;
      }
      return count;
    },
  };

  return service;
}
