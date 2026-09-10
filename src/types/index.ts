/**
 * Owned conversation model. Compile-time only: no runtime values, and no
 * import from `@weni/webchat-service`. Shape is defined by data-model.md.
 */

export type MessageDirection = 'inbound' | 'outbound';

export type DeliveryState =
  'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface MessageBase {
  id: string;
  direction: MessageDirection;
  timestamp: number;
  /** Outbound only; absence means delivery is not tracked for this message. */
  deliveryState?: DeliveryState;
  /** True while content is still arriving. Drives FR-013 without remounting. */
  streaming?: boolean;
  presetReplies?: PresetReply[];
  callToAction?: CallToAction;
  /** Actions offered upon the message itself. FR-038. */
  actions?: MessageActions;
}

export type Message =
  | (MessageBase & { kind: 'text'; text: string })
  | (MessageBase & { kind: 'image'; url: string; caption?: string })
  | (MessageBase & { kind: 'video'; url: string; caption?: string })
  | (MessageBase & { kind: 'audio'; url: string; durationMs?: number })
  | (MessageBase & {
      kind: 'document';
      url: string;
      fileName: string;
      sizeBytes?: number;
      mimeType?: string;
    })
  | (MessageBase & {
      kind: 'location';
      latitude: number;
      longitude: number;
      address?: string;
    })
  | (MessageBase & {
      kind: 'options';
      text: string;
      options: ReplyOption[];
    })
  | (MessageBase & {
      kind: 'products';
      text?: string;
      products: Product[];
    })
  | (MessageBase & {
      kind: 'order';
      lines: CartLine[];
      total: number;
      currency: string;
    })
  | (MessageBase & { kind: 'unsupported'; raw: unknown });

/** FR-012. Chosen by the consuming product; the message data is identical. */
export type MessagePresentation = 'bubble' | 'assistant';

export type MessageRating = 'helpful' | 'unhelpful';

export interface MessageActions {
  copy?: boolean;
  send?: boolean;
  rate?: boolean;
  /** The rating already given, if any. Presented as chosen. */
  rating?: MessageRating;
}

export interface PresetReply {
  id: string;
  label: string;
}

export interface ReplyOption {
  id: string;
  label: string;
  description?: string;
}

export interface Suggestion {
  id: string;
  text: string;
}

export interface CallToAction {
  label: string;
  url: string;
  disabled?: boolean;
}

export interface Product {
  id: string;
  name: string;
  imageUrl?: string;
  description?: string;
  /** As supplied, in the currency's own units. Never converted or recomputed. */
  unitPrice: number;
  /** When present, `unitPrice` is shown struck through and this is the payable amount. */
  promotionalPrice?: number;
}

/** FR-045. Actionable inside an assistant reply; a record inside a sent message. */
export type ProductSetMode = 'actionable' | 'record';

export interface ProductSection {
  title: string;
  products: Product[];
}

export interface CartLine {
  product: Product;
  quantity: number;
  /** Supplied, never computed here. FR-053. */
  lineTotal: number;
}

/** Quantity per product, for the actionable product set. FR-045. */
export type CartQuantities = Readonly<Record<string, number>>;

export interface CartSummary {
  subtotal: number;
  discount?: number;
  total: number;
}

export interface Cart {
  lines: CartLine[];
  summary: CartSummary;
  currency: string;
}

export type ComposerVariant = 'compact' | 'expanded';

export interface AgentConfigOption {
  id: string;
  label: string;
}

export interface ComposerCapabilities {
  attachment: boolean;
  audioRecording: boolean;
  cameraRecording: boolean;
  voiceMode: boolean;
}

export type RecordingState =
  | { status: 'idle' }
  | { status: 'recording-audio'; elapsedMs: number }
  | { status: 'recording-camera'; elapsedMs: number };

export type VoicePhase =
  'starting' | 'listening' | 'working' | 'replying' | 'failed';

export interface VoiceState {
  phase: VoicePhase;
  /** Revised in place while listening; FR-055. */
  partialTranscript?: string;
  /** Normalised 0..1 input level; FR-056. */
  inputLevel?: number;
  /** Present only when phase is 'failed'; wording supplied by the consumer. */
  failureReason?: string;
}

export interface Thread {
  messages: Message[];
  peerActivity?: PeerActivity;
  history: HistoryState;
}

export type PeerActivity = 'composing' | 'working';

export interface HistoryState {
  hasEarlier: boolean;
  loadingEarlier: boolean;
}

/** Supplied by the consuming product; never derived here. FR-021, Principle III. */
export type StorageNamespace = string;
