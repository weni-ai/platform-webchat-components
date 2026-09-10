/**
 * Sentinel wording for SC-006. Render a block with these `labels` values and
 * assert that no text outside the sentinels (and supplied conversation data)
 * appears.
 */

export const SENTINEL_PREFIX = '__PWC_';
export const SENTINEL_SUFFIX = '__';

const SENTINEL_PATTERN = /^__PWC_[A-Za-z0-9.]+__$/;

export function sentinelLabel(path: string): string {
  return `${SENTINEL_PREFIX}${path}${SENTINEL_SUFFIX}`;
}

export function isSentinelLabel(value: string): boolean {
  return SENTINEL_PATTERN.test(value);
}

function labelsFor<Keys extends readonly string[]>(
  namespace: string,
  keys: Keys,
): Record<Keys[number], string> {
  const result = {} as Record<Keys[number], string>;

  for (const key of keys) {
    result[key as Keys[number]] = sentinelLabel(`${namespace}.${key}`);
  }

  return result;
}

export const threadLabels = labelsFor('thread', [
  'empty',
  'loadingEarlier',
  'peerComposing',
  'peerWorking',
  'deliveryPending',
  'deliveryDelivered',
  'deliveryRead',
  'deliveryFailed',
  'openDocument',
  'unsupportedMessage',
  'mediaLoadFailed',
  'goToNewest',
]);

export const messageLabels = labelsFor('message', [
  'deliveryPending',
  'deliveryDelivered',
  'deliveryRead',
  'deliveryFailed',
  'openDocument',
  'unsupportedMessage',
  'mediaLoadFailed',
]);

export const messageActionsLabels = labelsFor('messageActions', [
  'copy',
  'send',
  'rateHelpful',
  'rateUnhelpful',
]);

export const composerLabels = labelsFor('composer', [
  'placeholder',
  'send',
  'attach',
  'startAudioRecording',
  'startCameraRecording',
  'finishRecording',
  'discardRecording',
  'enterVoiceMode',
  'selectAgentConfig',
  'recordingElapsed',
  'fileRejectedSize',
  'fileRejectedType',
]);

export const suggestionsLabels = labelsFor('suggestions', ['send', 'edit']);

export const productSetLabels = labelsFor('productSet', [
  'add',
  'remove',
  'increase',
  'decrease',
  'pagePrevious',
  'pageNext',
  'imageUnavailable',
]);

export const productDetailLabels = labelsFor('productDetail', [
  'addToCart',
  'back',
]);

export const cartIndicatorLabels = labelsFor('cartIndicator', [
  'open',
  'itemCount',
]);

export const cartLabels = labelsFor('cart', [
  'empty',
  'subtotal',
  'discount',
  'total',
  'submit',
  'increase',
  'decrease',
  'remove',
  'back',
]);

export const voiceLabels = labelsFor('voice', [
  'exit',
  'starting',
  'listening',
  'working',
  'replying',
]);

export const sentinelLabels = {
  thread: threadLabels,
  message: messageLabels,
  messageActions: messageActionsLabels,
  composer: composerLabels,
  suggestions: suggestionsLabels,
  productSet: productSetLabels,
  productDetail: productDetailLabels,
  cartIndicator: cartIndicatorLabels,
  cart: cartLabels,
  voice: voiceLabels,
} as const;

export function listSentinelLabels(): string[] {
  return Object.values(sentinelLabels).flatMap((group) => Object.values(group));
}
