import { describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Image } from './Image';
import { AIProvider } from '../../providers/AIProvider';
import type { AIClient } from '../../contexts/AIContext';

describe('Image', () => {
  it('renders as an img', () => {
    render(<Image src="https://example.com/a.png" alt="A description" data-testid="image" />);
    expect(screen.getByTestId('image').tagName).toBe('IMG');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLImageElement>();
    render(<Image ref={ref} src="https://example.com/a.png" alt="A description" />);
    expect(ref.current).toBeInstanceOf(HTMLImageElement);
  });

  it('merges a custom className with the base style', () => {
    render(
      <Image
        src="https://example.com/a.png"
        alt="A description"
        data-testid="image"
        className="custom"
      />,
    );
    expect(screen.getByTestId('image').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Image src="https://example.com/a.png" alt="A description" />);
    await expectNoA11yViolations(container);
  });

  it('accepts an empty alt for decorative images', () => {
    render(<Image src="https://example.com/a.png" alt="" data-testid="image" />);
    expect(screen.getByTestId('image')).toHaveAttribute('alt', '');
  });

  it('defaults to fit=cover and no rounding', () => {
    render(<Image src="https://example.com/a.png" alt="A description" data-testid="image" />);
    const el = screen.getByTestId('image');
    expect(el).toHaveAttribute('data-fit', 'cover');
    expect(el).not.toHaveAttribute('data-rounded');
  });

  it('applies the ratio prop as an aspect-ratio style', () => {
    render(
      <Image
        src="https://example.com/a.png"
        alt="A description"
        ratio={16 / 9}
        data-testid="image"
      />,
    );
    expect(screen.getByTestId('image')).toHaveStyle({ aspectRatio: String(16 / 9) });
  });

  it('sets data-rounded when rounded is true', () => {
    render(
      <Image src="https://example.com/a.png" alt="A description" rounded data-testid="image" />,
    );
    expect(screen.getByTestId('image')).toHaveAttribute('data-rounded', 'true');
  });

  describe('aiDescribe', () => {
    it('renders no AI trigger when aiDescribe is omitted', () => {
      render(<Image src="https://example.com/a.png" alt="A description" />);
      expect(screen.queryByRole('button', { name: 'Describe with AI' })).not.toBeInTheDocument();
    });

    it('renders no AI trigger when aiDescribe is true but no AIProvider is mounted', () => {
      render(<Image src="https://example.com/a.png" alt="A description" aiDescribe />);
      expect(screen.queryByRole('button', { name: 'Describe with AI' })).not.toBeInTheDocument();
    });

    it('renders the AI trigger when a provider is mounted', () => {
      const client: AIClient = { complete: vi.fn() };
      render(
        <AIProvider client={client}>
          <Image src="https://example.com/a.png" alt="A description" aiDescribe />
        </AIProvider>,
      );
      expect(screen.getByRole('button', { name: 'Describe with AI' })).toBeInTheDocument();
    });

    it('triggers the AI client with the src in context and has no accept/reject actions (read-only)', async () => {
      const user = userEvent.setup();
      const client: AIClient = {
        complete: vi.fn().mockResolvedValue('A mountain landscape at sunset.'),
      };
      render(
        <AIProvider client={client}>
          <Image src="https://example.com/a.png" alt="A description" aiDescribe />
        </AIProvider>,
      );

      await user.click(screen.getByRole('button', { name: 'Describe with AI' }));
      expect(client.complete).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('https://example.com/a.png'),
          context: { src: 'https://example.com/a.png' },
        }),
      );
      expect(await screen.findByText('A mountain landscape at sunset.')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Discard' })).not.toBeInTheDocument();
    });

    it('has no accessibility violations with the AI trigger rendered', async () => {
      const client: AIClient = { complete: vi.fn() };
      const { container } = render(
        <AIProvider client={client}>
          <Image src="https://example.com/a.png" alt="A description" aiDescribe />
        </AIProvider>,
      );
      await expectNoA11yViolations(container);
    });
  });
});
