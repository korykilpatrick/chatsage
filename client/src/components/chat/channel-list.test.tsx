import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChannelList from './channel-list';
import { createMockChannel } from '../../test/setupTests';

describe('ChannelList', () => {
  it('renders public channels correctly', () => {
    const channels = [
      createMockChannel({ id: 1, name: 'general', type: 'PUBLIC' })
    ];

    render(<ChannelList channels={channels} />);

    // Check if channel name is displayed
    expect(screen.getByText('general')).toBeInTheDocument();

    // Check if hash icon is present for public channel
    const hashIcon = document.querySelector('svg.lucide-hash');
    expect(hashIcon).toBeInTheDocument();
  });

  it('renders private channels correctly', () => {
    const channels = [
      createMockChannel({ id: 2, name: 'private-channel', type: 'PRIVATE' })
    ];

    render(<ChannelList channels={channels} />);

    // Check if channel name is displayed
    expect(screen.getByText('private-channel')).toBeInTheDocument();

    // Check if lock icon is present for private channel
    const lockIcon = document.querySelector('svg.lucide-lock');
    expect(lockIcon).toBeInTheDocument();
  });

  it('renders multiple channels', () => {
    const channels = [
      createMockChannel({ id: 1, name: 'general', type: 'PUBLIC' }),
      createMockChannel({ id: 2, name: 'random', type: 'PUBLIC' }),
      createMockChannel({ id: 3, name: 'private', type: 'PRIVATE' })
    ];

    render(<ChannelList channels={channels} />);

    expect(screen.getByText('general')).toBeInTheDocument();
    expect(screen.getByText('random')).toBeInTheDocument();
    expect(screen.getByText('private')).toBeInTheDocument();

    const hashIcons = document.querySelectorAll('svg.lucide-hash');
    const lockIcons = document.querySelectorAll('svg.lucide-lock');

    expect(hashIcons).toHaveLength(2);
    expect(lockIcons).toHaveLength(1);
  });

  it('renders empty channel list', () => {
    render(<ChannelList channels={[]} />);
    const channelList = screen.getByRole('region', { name: /channels list/i });
    expect(channelList).toBeInTheDocument();
    const channelContent = channelList.querySelector('.p-2.space-y-1');
    expect(channelContent?.children).toHaveLength(0);
  });
});