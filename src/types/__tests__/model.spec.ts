import { describe, expect, it } from 'vitest';

import type {
  Cart,
  CartLine,
  Message,
  Product,
  RecordingState,
  Thread,
  VoiceState,
} from '../index';

const product: Product = {
  id: 'sku-1',
  name: 'Mug',
  unitPrice: 12.5,
};

const line: CartLine = {
  product,
  quantity: 2,
  lineTotal: 25,
};

const sample = {
  text: {
    id: 'm-text',
    kind: 'text',
    direction: 'inbound',
    timestamp: 1,
    text: 'Hello',
  },
  image: {
    id: 'm-image',
    kind: 'image',
    direction: 'inbound',
    timestamp: 2,
    url: 'https://example.com/photo.jpg',
  },
  video: {
    id: 'm-video',
    kind: 'video',
    direction: 'outbound',
    timestamp: 3,
    url: 'https://example.com/clip.mp4',
    deliveryState: 'sent',
  },
  audio: {
    id: 'm-audio',
    kind: 'audio',
    direction: 'inbound',
    timestamp: 4,
    url: 'https://example.com/voice.mp3',
    durationMs: 1_200,
  },
  document: {
    id: 'm-document',
    kind: 'document',
    direction: 'outbound',
    timestamp: 5,
    url: 'https://example.com/file.pdf',
    fileName: 'file.pdf',
    deliveryState: 'delivered',
  },
  location: {
    id: 'm-location',
    kind: 'location',
    direction: 'inbound',
    timestamp: 6,
    latitude: -3.73,
    longitude: -38.52,
  },
  options: {
    id: 'm-options',
    kind: 'options',
    direction: 'inbound',
    timestamp: 7,
    text: 'Pick one',
    options: [{ id: 'opt-1', label: 'Yes' }],
  },
  products: {
    id: 'm-products',
    kind: 'products',
    direction: 'inbound',
    timestamp: 8,
    products: [product],
  },
  order: {
    id: 'm-order',
    kind: 'order',
    direction: 'outbound',
    timestamp: 9,
    lines: [line],
    total: 25,
    currency: 'BRL',
    deliveryState: 'read',
  },
  unsupported: {
    id: 'm-unsupported',
    kind: 'unsupported',
    direction: 'inbound',
    timestamp: 10,
    raw: { type: 'unknown' },
  },
} satisfies Record<Message['kind'], Message>;

describe('conversation model', () => {
  it('covers all ten message kinds', () => {
    const messages: Message[] = Object.values(sample);

    expect(messages).toHaveLength(10);
    expect(new Set(messages.map((message) => message.kind)).size).toBe(10);
  });

  it('narrows content by kind', () => {
    const message: Message = sample.text;

    expect(message.kind).toBe('text');
    if (message.kind !== 'text') {
      throw new Error('expected a text message');
    }

    expect(message.text).toBe('Hello');
  });

  it('accepts a thread, cart, recording, and voice state', () => {
    const thread: Thread = {
      messages: Object.values(sample),
      peerActivity: 'composing',
      history: { hasEarlier: true, loadingEarlier: false },
    };
    const cart: Cart = {
      lines: [line],
      summary: { subtotal: 25, total: 25 },
      currency: 'BRL',
    };
    const recording: RecordingState = {
      status: 'recording-audio',
      elapsedMs: 1_000,
    };
    const voice: VoiceState = {
      phase: 'listening',
      partialTranscript: 'he',
      inputLevel: 0.4,
    };

    expect(thread.messages).toHaveLength(10);
    expect(cart.lines[0]?.quantity).toBe(2);
    expect(recording.status).toBe('recording-audio');
    expect(voice.phase).toBe('listening');
  });
});
