import type { Preview } from '@storybook/vue3-vite';

import '@weni/unnnic-system/dist/style.css';

const preview: Preview = {
  parameters: {
    a11y: {
      test: 'todo',
    },
  },
};

export default preview;
