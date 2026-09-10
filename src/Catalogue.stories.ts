import type { Meta, StoryObj } from '@storybook/vue3-vite';

const meta = {
  title: 'Catalogue',
  render: () => ({
    template:
      '<p>Catalogue for @weni/platform-webchat-components. Blocks appear here as they are implemented.</p>',
  }),
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Welcome: Story = {};
