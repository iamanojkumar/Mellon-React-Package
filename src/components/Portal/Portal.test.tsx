import { describe, expect, it, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Portal } from './Portal';

describe('Portal', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders children into document.body by default', () => {
    render(
      <div data-testid="origin">
        <Portal>
          <span data-testid="portaled">content</span>
        </Portal>
      </div>,
    );
    const origin = screen.getByTestId('origin');
    const portaled = screen.getByTestId('portaled');
    expect(portaled.parentElement).toBe(document.body);
    expect(origin).not.toContainElement(portaled);
  });

  it('renders children into a custom container element', () => {
    const container = document.createElement('div');
    container.setAttribute('data-testid', 'custom-container');
    document.body.appendChild(container);

    render(
      <Portal container={container}>
        <span data-testid="portaled">content</span>
      </Portal>,
    );

    expect(screen.getByTestId('portaled').parentElement).toBe(container);
    document.body.removeChild(container);
  });

  it('accepts a function returning the container', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    render(
      <Portal container={() => container}>
        <span data-testid="portaled">content</span>
      </Portal>,
    );

    expect(screen.getByTestId('portaled').parentElement).toBe(container);
    document.body.removeChild(container);
  });

  it('has no accessibility violations', async () => {
    render(
      <Portal>
        <button type="button">Accessible content</button>
      </Portal>,
    );
    await expectNoA11yViolations(document.body);
  });

  it('portals synchronously on the very first render — no one-tick mount delay', () => {
    // Regression test: an earlier version waited a tick after mount before
    // portaling, which raced with consumers (Dialog, Dropdown) whose own
    // effects depend on the portaled ref existing in the same commit.
    render(
      <Portal>
        <span data-testid="portaled">content</span>
      </Portal>,
    );
    // No `await`/`act` flush needed — if this passes without one, the node
    // was already in the DOM synchronously after `render()` returns.
    expect(screen.getByTestId('portaled').parentElement).toBe(document.body);
  });
});
