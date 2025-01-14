import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ChannelList from '../ChannelList';

describe('ChannelList', () => {
  const mockChannels = [
    {
      id: 1,
      name: 'general',
      type: 'PUBLIC',
      workspaceId: 1,
      topic: null,
      archived: false,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 2,
      name: 'private-channel',
      type: 'PRIVATE',
      workspaceId: 1,
      topic: null,
      archived: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ] as const;

  it('renders public and private channel sections', () => {
    render(<ChannelList channels={mockChannels} />);
    expect(screen.getByText('CHANNELS (1)')).toBeInTheDocument();
    expect(screen.getByText('PRIVATE CHANNELS (1)')).toBeInTheDocument();
  });

  it('toggles channel sections visibility', () => {
    render(<ChannelList channels={mockChannels} />);
    const publicHeader = screen.getByText('CHANNELS (1)');
    
    // Initially visible
    expect(screen.getByText('general')).toBeInTheDocument();
    
    // Click to collapse
    fireEvent.click(publicHeader);
    
    // Should not be visible after collapse
    expect(screen.queryByText('general')).not.toBeInTheDocument();
  });
});
