import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useToast } from './use-toast';
import { createWrapper } from '../test/test-utils';

describe('useToast', () => {
  beforeEach(() => {
    // Clear all toasts before each test
    const { result } = renderHook(() => useToast(), {
      wrapper: createWrapper()
    });
    act(() => {
      result.current.toasts.forEach(toast => {
        result.current.dismiss(toast.id);
      });
    });
  });

  it('should add a toast', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: createWrapper()
    });

    act(() => {
      result.current.toast({
        title: 'Test Toast',
        description: 'This is a test toast message'
      });
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      title: 'Test Toast',
      description: 'This is a test toast message'
    });
  });

  it('should remove a toast by id', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: createWrapper()
    });

    let toastId: string;
    act(() => {
      const toast = result.current.toast({
        title: 'Test Toast',
        description: 'This is a test toast message'
      });
      toastId = toast.id;
    });

    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      result.current.dismiss(toastId);
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it('should handle multiple toasts', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: createWrapper()
    });

    act(() => {
      result.current.toast({ title: 'Toast 1' });
    });

    act(() => {
      result.current.toast({ title: 'Toast 2' });
    });

    act(() => {
      result.current.toast({ title: 'Toast 3' });
    });

    expect(result.current.toasts).toHaveLength(3);
    const toastTitles = result.current.toasts.map(t => t.title);
    expect(toastTitles).toContain('Toast 1');
    expect(toastTitles).toContain('Toast 2');
    expect(toastTitles).toContain('Toast 3');
  });

  it('should update an existing toast', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: createWrapper()
    });

    let toastId: string;
    act(() => {
      const toast = result.current.toast({ title: 'Original' });
      toastId = toast.id;
    });

    act(() => {
      result.current.toast({
        id: toastId,
        title: 'Updated'
      });
    });

    const updatedToast = result.current.toasts.find(t => t.id === toastId);
    expect(updatedToast?.title).toBe('Updated');
  });

  it('should handle toast variants correctly', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: createWrapper()
    });

    act(() => {
      result.current.toast({
        title: 'Success Toast',
        variant: 'default'
      });
    });

    act(() => {
      result.current.toast({
        title: 'Error Toast',
        variant: 'destructive'
      });
    });

    expect(result.current.toasts[0].variant).toBe('default');
    expect(result.current.toasts[1].variant).toBe('destructive');
  });
});