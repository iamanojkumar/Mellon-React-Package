import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Image } from './Image';

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
});
