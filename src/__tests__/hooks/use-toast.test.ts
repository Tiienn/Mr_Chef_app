import { renderHook, act } from '@testing-library/react';
import { useToast, toast, reducer } from '@/hooks/use-toast';

describe('useToast hook', () => {
  it('should return initial state with empty toasts', () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toasts).toEqual([]);
  });

  it('should have toast and dismiss functions', () => {
    const { result } = renderHook(() => useToast());
    expect(typeof result.current.toast).toBe('function');
    expect(typeof result.current.dismiss).toBe('function');
  });

  it('should add a toast when toast function is called', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({
        title: 'Test Toast',
        description: 'Test description',
      });
    });

    expect(result.current.toasts.length).toBe(1);
    expect(result.current.toasts[0].title).toBe('Test Toast');
    expect(result.current.toasts[0].description).toBe('Test description');
  });

  it('should return id, dismiss, and update from toast function', () => {
    const { result } = renderHook(() => useToast());

    let toastResult: { id: string; dismiss: () => void; update: (props: unknown) => void };
    act(() => {
      toastResult = result.current.toast({
        title: 'Test Toast',
      });
    });

    expect(toastResult!.id).toBeDefined();
    expect(typeof toastResult!.dismiss).toBe('function');
    expect(typeof toastResult!.update).toBe('function');
  });

  it('should dismiss a specific toast by id', () => {
    const { result } = renderHook(() => useToast());

    let toastId: string;
    act(() => {
      const toastResult = result.current.toast({
        title: 'Test Toast',
      });
      toastId = toastResult.id;
    });

    expect(result.current.toasts[0].open).toBe(true);

    act(() => {
      result.current.dismiss(toastId);
    });

    expect(result.current.toasts[0].open).toBe(false);
  });

  it('should dismiss all toasts when no id is provided', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({ title: 'Toast 1' });
    });

    expect(result.current.toasts.length).toBe(1);

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.toasts[0].open).toBe(false);
  });
});

describe('toast reducer', () => {
  it('should add a toast', () => {
    const state = { toasts: [] };
    const action = {
      type: 'ADD_TOAST' as const,
      toast: {
        id: '1',
        title: 'Test Toast',
        open: true,
        onOpenChange: () => {},
      },
    };

    const newState = reducer(state, action);
    expect(newState.toasts.length).toBe(1);
    expect(newState.toasts[0].id).toBe('1');
  });

  it('should update a toast', () => {
    const state = {
      toasts: [
        {
          id: '1',
          title: 'Original Title',
          open: true,
          onOpenChange: () => {},
        },
      ],
    };
    const action = {
      type: 'UPDATE_TOAST' as const,
      toast: {
        id: '1',
        title: 'Updated Title',
      },
    };

    const newState = reducer(state, action);
    expect(newState.toasts[0].title).toBe('Updated Title');
  });

  it('should dismiss a specific toast', () => {
    const state = {
      toasts: [
        {
          id: '1',
          title: 'Toast 1',
          open: true,
          onOpenChange: () => {},
        },
        {
          id: '2',
          title: 'Toast 2',
          open: true,
          onOpenChange: () => {},
        },
      ],
    };
    const action = {
      type: 'DISMISS_TOAST' as const,
      toastId: '1',
    };

    const newState = reducer(state, action);
    expect(newState.toasts[0].open).toBe(false);
    expect(newState.toasts[1].open).toBe(true);
  });

  it('should dismiss all toasts when no id is provided', () => {
    const state = {
      toasts: [
        {
          id: '1',
          title: 'Toast 1',
          open: true,
          onOpenChange: () => {},
        },
        {
          id: '2',
          title: 'Toast 2',
          open: true,
          onOpenChange: () => {},
        },
      ],
    };
    const action = {
      type: 'DISMISS_TOAST' as const,
      toastId: undefined,
    };

    const newState = reducer(state, action);
    expect(newState.toasts.every(t => t.open === false)).toBe(true);
  });

  it('should remove a specific toast', () => {
    const state = {
      toasts: [
        {
          id: '1',
          title: 'Toast 1',
          open: true,
          onOpenChange: () => {},
        },
        {
          id: '2',
          title: 'Toast 2',
          open: true,
          onOpenChange: () => {},
        },
      ],
    };
    const action = {
      type: 'REMOVE_TOAST' as const,
      toastId: '1',
    };

    const newState = reducer(state, action);
    expect(newState.toasts.length).toBe(1);
    expect(newState.toasts[0].id).toBe('2');
  });

  it('should remove all toasts when no id is provided', () => {
    const state = {
      toasts: [
        {
          id: '1',
          title: 'Toast 1',
          open: true,
          onOpenChange: () => {},
        },
        {
          id: '2',
          title: 'Toast 2',
          open: true,
          onOpenChange: () => {},
        },
      ],
    };
    const action = {
      type: 'REMOVE_TOAST' as const,
      toastId: undefined,
    };

    const newState = reducer(state, action);
    expect(newState.toasts.length).toBe(0);
  });

  it('should limit toasts to TOAST_LIMIT', () => {
    const state = { toasts: [] };

    const newState = reducer(state, {
      type: 'ADD_TOAST',
      toast: { id: '1', title: 'Toast 1', open: true, onOpenChange: () => {} },
    });

    const finalState = reducer(newState, {
      type: 'ADD_TOAST',
      toast: { id: '2', title: 'Toast 2', open: true, onOpenChange: () => {} },
    });

    expect(finalState.toasts.length).toBeLessThanOrEqual(1);
    expect(finalState.toasts[0].id).toBe('2');
  });
});

describe('toast function', () => {
  it('should create a toast with provided props', () => {
    const result = toast({
      title: 'Direct Toast',
      description: 'Created directly',
    });

    expect(result.id).toBeDefined();
    expect(typeof result.dismiss).toBe('function');
    expect(typeof result.update).toBe('function');
  });
});
