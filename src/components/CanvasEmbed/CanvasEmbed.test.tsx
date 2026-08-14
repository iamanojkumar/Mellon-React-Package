import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { CanvasEmbed } from './CanvasEmbed';

describe('CanvasEmbed security', () => {
  it('sandboxes the frame without allow-same-origin', () => {
    // Granting allow-scripts *and* allow-same-origin together is equivalent to
    // no sandbox at all: the frame could reach the parent document and remove
    // its own sandbox attribute. This test exists to stop that pairing being
    // reintroduced.
    render(<CanvasEmbed title="Embedded" url="https://example.com" />);
    const frame = screen.getByTitle('Embedded');
    const sandbox = frame.getAttribute('sandbox') ?? '';

    expect(sandbox).toContain('allow-scripts');
    expect(sandbox).not.toContain('allow-same-origin');
  });

  it('renders HTML through srcdoc, never as parent-document markup', () => {
    const { container } = render(
      <CanvasEmbed title="Snippet" html="<script>window.pwned = true</script><p>hi</p>" />,
    );

    expect(container.querySelector('script')).toBeNull();
    expect(screen.getByTitle('Snippet')).toHaveAttribute('srcdoc');
  });

  it('keeps the host URL out of the embedded request', () => {
    render(<CanvasEmbed title="Embedded" url="https://example.com" />);

    expect(screen.getByTitle('Embedded')).toHaveAttribute('referrerpolicy', 'no-referrer');
  });

  it('prefers url over html when both are given', () => {
    render(<CanvasEmbed title="Both" url="https://example.com" html="<p>ignored</p>" />);
    const frame = screen.getByTitle('Both');

    expect(frame).toHaveAttribute('src', 'https://example.com');
    expect(frame).not.toHaveAttribute('srcdoc');
  });
});

describe('CanvasEmbed rendering', () => {
  it('shows an empty state rather than a blank frame', () => {
    render(<CanvasEmbed title="Nothing" />);

    expect(screen.getByText('Nothing embedded')).toBeInTheDocument();
    expect(screen.queryByTitle('Nothing')).not.toBeInTheDocument();
  });

  // Asserted on the frame-free state: axe-core tries to descend into an iframe
  // and jsdom can't host one ("Respondable target must be a frame in the
  // current window"). The embedded case is covered by `pnpm test:storybook`,
  // which runs axe in a real browser — the same jsdom-gap split as
  // `color-contrast`.
  it('has no accessibility violations', async () => {
    const { container } = render(<CanvasEmbed title="Nothing" />);

    await expectNoA11yViolations(container);
  });

  it('gives the frame an accessible name', () => {
    render(<CanvasEmbed title="Embedded" url="https://example.com" />);

    expect(screen.getByTitle('Embedded').tagName).toBe('IFRAME');
  });
});
