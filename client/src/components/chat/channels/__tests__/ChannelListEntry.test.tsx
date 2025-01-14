import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ChannelListEntry from '../ChannelListEntry';

describe('ChannelListEntry', () => {
  const mockChannel = {
    id: 1,
    name: 'general',
    type: 'PUBLIC',
    workspaceId: 1,
    topic: 'General discussion',
    archived: false,
    createdAt: new Date(),
    updatedAt: new Date()
  } as const;

  it('renders channel name and topic', () => {
    render(<ChannelListEntry channel={mockChannel} />);
    expect(screen.getByText('general')).toBeInTheDocument();
    expect(screen.getByText('General discussion')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<ChannelListEntry channel={mockChannel} onClick={handleClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });

  it('applies active styles when isActive is true', () => {
    render(<ChannelListEntry channel={mockChannel} isActive={true} />);
    expect(screen.getByRole('button')).toHaveClass('bg-accent');
  });
});
