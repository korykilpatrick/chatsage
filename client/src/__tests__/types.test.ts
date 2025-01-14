import { describe, it, expect } from 'vitest';
import { UserStatus, ChannelType } from '../types';

describe('Type Definitions', () => {
  it('has correct user status enums', () => {
    expect(UserStatus.ONLINE).toBe('ONLINE');
    expect(UserStatus.AWAY).toBe('AWAY');
    expect(UserStatus.DND).toBe('DND');
    expect(UserStatus.OFFLINE).toBe('OFFLINE');
  });

  it('has correct channel type enums', () => {
    expect(ChannelType.PUBLIC).toBe('PUBLIC');
    expect(ChannelType.PRIVATE).toBe('PRIVATE');
    expect(ChannelType.DM).toBe('DM');
  });
});
