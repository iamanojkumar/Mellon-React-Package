import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from './ToastProvider';
import { useToast } from '../hooks/useToast';

function getViewport() {
  const viewport = document.querySelector('[role="region"][aria-label="Notifications"]');
  if (!viewport) throw new Error('Toast viewport not found');
  return viewport as HTMLElement;
}

function ToastLauncher(props: Parameters<ReturnType<typeof useToast>['toast']>[0] = {}) {
  const { toast } = useToast();
  return (
    <button type="button" onClick={() => toast({ title: 'Saved', ...props })}>
      Launch
    </button>
  );
}

describe('ToastProvider', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders children', () => {
    render(
      <ToastProvider>
        <span data-testid="child">content</span>
      </ToastProvider>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('useToast throws when used outside a ToastProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<ToastLauncher />)).toThrow('useToast must be used within a ToastProvider');
    consoleError.mockRestore();
  });

  it('shows a toast with title and description via toast()', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ToastLauncher title="Saved" description="Your changes were saved." />
      </ToastProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Launch' }));
    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(screen.getByText('Your changes were saved.')).toBeInTheDocument();
  });

  it('defaults to variant=info and role=status', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ToastLauncher />
      </ToastProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Launch' }));
    const toastEl = within(getViewport()).getByRole('status');
    expect(toastEl).toHaveAttribute('data-variant', 'info');
  });

  it('uses role=alert for warning/danger variants', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ToastLauncher variant="danger" />
      </ToastProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Launch' }));
    expect(within(getViewport()).getByRole('alert')).toHaveAttribute('data-variant', 'danger');
  });

  it('reflects the position prop as a data attribute on the viewport', () => {
    render(<ToastProvider position="top-left">content</ToastProvider>);
    expect(getViewport()).toHaveAttribute('data-position', 'top-left');
  });

  it('removes a toast when its dismiss button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ToastLauncher />
      </ToastProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Launch' }));
    expect(screen.getByText('Saved')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
  });

  it('calls the action handler and keeps the toast open', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ToastLauncher action={{ label: 'Undo', onClick }} />
      </ToastProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Launch' }));
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('caps visible toasts at the limit, dropping the oldest first', async () => {
    const user = userEvent.setup();
    function MultiLauncher() {
      const { toast } = useToast();
      return (
        <button
          type="button"
          onClick={() => {
            toast({ title: 'first' });
            toast({ title: 'second' });
            toast({ title: 'third' });
          }}
        >
          Launch
        </button>
      );
    }
    render(
      <ToastProvider limit={2}>
        <MultiLauncher />
      </ToastProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Launch' }));
    expect(screen.queryByText('first')).not.toBeInTheDocument();
    expect(screen.getByText('second')).toBeInTheDocument();
    expect(screen.getByText('third')).toBeInTheDocument();
  });

  it('updates an existing toast in place when toast() is called again with the same id', async () => {
    const user = userEvent.setup();
    function UpdateLauncher() {
      const { toast } = useToast();
      return (
        <button
          type="button"
          onClick={() => {
            toast({ id: 'save', title: 'Saving…' });
            toast({ id: 'save', title: 'Saved' });
          }}
        >
          Launch
        </button>
      );
    }
    render(
      <ToastProvider>
        <UpdateLauncher />
      </ToastProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Launch' }));
    expect(screen.queryByText('Saving…')).not.toBeInTheDocument();
    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(within(getViewport()).getAllByRole('status')).toHaveLength(1);
  });

  it('auto-dismisses after the given duration', () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <ToastLauncher duration={1000} />
      </ToastProvider>,
    );
    // `fireEvent` (not `userEvent`) here — userEvent's own internal awaits
    // rely on real timers even when `advanceTimersByTime` is used, and
    // deadlock once `vi.useFakeTimers()` is active; `fireEvent.click` is
    // synchronous and has no such dependency.
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Launch' }));
    });
    expect(screen.getByText('Saved')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
  });

  it('does not auto-dismiss when duration is 0', () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <ToastLauncher duration={0} />
      </ToastProvider>,
    );
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Launch' }));
    });
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('dismissAll clears every toast', async () => {
    const user = userEvent.setup();
    function DismissAllLauncher() {
      const { toast, dismissAll } = useToast();
      return (
        <>
          <button type="button" onClick={() => toast({ title: 'Saved' })}>
            Launch
          </button>
          <button type="button" onClick={dismissAll}>
            Clear
          </button>
        </>
      );
    }
    render(
      <ToastProvider>
        <DismissAllLauncher />
      </ToastProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Launch' }));
    expect(screen.getByText('Saved')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
  });
});
