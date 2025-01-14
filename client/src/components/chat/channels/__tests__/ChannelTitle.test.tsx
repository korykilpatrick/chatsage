import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ChannelTitle from '../ChannelTitle';

describe('ChannelTitle', () => {
  const mockPublicChannel = {
    id: 1,
    name: 'general',
    type: 'PUBLIC',
    workspaceId: 1,
    topic: null,
    archived: false,
    createdAt: new Date(),
    updatedAt: new Date()
  } as const;

  const mockPrivateChannel = {
    ...mockPublicChannel,
    type: 'PRIVATE',
    name: 'private-channel'
  } as const;

  it('renders public channel name with hash icon', () => {
    render(<ChannelTitle channel={mockPublicChannel} />);
    expect(screen.getByText('general')).toBeInTheDocument();
  });

  it('renders private channel name with lock icon', () => {
    render(<ChannelTitle channel={mockPrivateChannel} />);
    expect(screen.getByText('private-channel')).toBeInTheDocument();
  });
});
