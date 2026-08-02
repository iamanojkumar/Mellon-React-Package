import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Avatar } from './Avatar';

describe('Avatar', () => {
  it('renders as a span by default', () => {
    render(<Avatar data-testid="avatar" name="Ada Lovelace" />);
    expect(screen.getByTestId('avatar').tagName).toBe('SPAN');
  });

  it('renders as the element passed via the "as" prop', () => {
    render(<Avatar as="div" data-testid="avatar" name="Ada Lovelace" />);
    expect(screen.getByTestId('avatar').tagName).toBe('DIV');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Avatar ref={ref} name="Ada Lovelace" />);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it('merges a custom className with the base style', () => {
    render(<Avatar data-testid="avatar" className="custom" name="Ada Lovelace" />);
    expect(screen.getByTestId('avatar').className).toContain('custom');
  });

  it('has no accessibility violations with an image', async () => {
    const { container } = render(<Avatar src="https://example.com/a.png" alt="Ada Lovelace" />);
    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations with initials', async () => {
    const { container } = render(<Avatar name="Ada Lovelace" />);
    await expectNoA11yViolations(container);
  });

  it('renders an img with alt text when src is given', () => {
    render(<Avatar src="https://example.com/a.png" alt="Ada Lovelace" />);
    expect(screen.getByRole('img', { name: 'Ada Lovelace' })).toHaveAttribute(
      'src',
      'https://example.com/a.png',
    );
  });

  it('falls back to initials derived from name when there is no src', () => {
    render(<Avatar name="Ada Lovelace" />);
    expect(screen.getByRole('img', { name: 'Ada Lovelace' })).toHaveTextContent('AL');
  });

  it('derives initials from a single-word name using its first two letters', () => {
    render(<Avatar name="Cher" />);
    expect(screen.getByText('CH')).toBeInTheDocument();
  });

  it('defaults to size=md and shape=circle', () => {
    render(<Avatar data-testid="avatar" name="Ada Lovelace" />);
    const el = screen.getByTestId('avatar');
    expect(el).toHaveAttribute('data-size', 'md');
    expect(el).toHaveAttribute('data-shape', 'circle');
  });
});
