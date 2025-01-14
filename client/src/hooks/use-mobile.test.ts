import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useIsMobile } from './use-mobile';

describe('useIsMobile', () => {
  let matchMediaMock: typeof window.matchMedia;
  let addEventListenerMock: jest.Mock;
  let removeEventListenerMock: jest.Mock;

  beforeEach(() => {
    // Store original implementation
    matchMediaMock = window.matchMedia;
    addEventListenerMock = vi.fn();
    removeEventListenerMock = vi.fn();

    // Mock matchMedia with a function that returns matches based on the query
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(max-width: 640px)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: addEventListenerMock,
      removeEventListener: removeEventListenerMock,
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    // Restore original implementation
    window.matchMedia = matchMediaMock;
  });

  it('returns false for desktop viewport', () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: addEventListenerMock,
      removeEventListener: removeEventListenerMock,
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('returns true for mobile viewport', () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: addEventListenerMock,
      removeEventListener: removeEventListenerMock,
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('updates when viewport changes', () => {
    const mediaQueryList = {
      matches: false,
      media: '(max-width: 640px)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: addEventListenerMock,
      removeEventListener: removeEventListenerMock,
      dispatchEvent: vi.fn(),
    };

    window.matchMedia = vi.fn().mockReturnValue(mediaQueryList);

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    // Get the change handler
    const [[eventName, handler]] = addEventListenerMock.mock.calls;
    expect(eventName).toBe('change');

    // Simulate viewport change to mobile
    act(() => {
      mediaQueryList.matches = true;
      handler.call(mediaQueryList, { matches: true });
    });

    expect(result.current).toBe(true);
  });
});