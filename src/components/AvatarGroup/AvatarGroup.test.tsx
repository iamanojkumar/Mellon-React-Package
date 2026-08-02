import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { AvatarGroup } from './AvatarGroup';
import { Avatar } from '../Avatar/Avatar';

describe('AvatarGroup', () => {
  it('renders as a div by default', () => {
    render(
      <AvatarGroup data-testid="group">
        <Avatar name="Ada Lovelace" />
      </AvatarGroup>,
    );
    expect(screen.getByTestId('group').tagName).toBe('DIV');
  });

  it('renders as the element passed via the "as" prop', () => {
    render(
      <AvatarGroup as="section" data-testid="group">
        <Avatar name="Ada Lovelace" />
      </AvatarGroup>,
    );
    expect(screen.getByTestId('group').tagName).toBe('SECTION');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <AvatarGroup ref={ref}>
        <Avatar name="Ada Lovelace" />
      </AvatarGroup>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('merges a custom className with the base style', () => {
    render(
      <AvatarGroup data-testid="group" className="custom">
        <Avatar name="Ada Lovelace" />
      </AvatarGroup>,
    );
    expect(screen.getByTestId('group').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <AvatarGroup max={2}>
        <Avatar name="Ada Lovelace" />
        <Avatar name="Grace Hopper" />
        <Avatar name="Margaret Hamilton" />
      </AvatarGroup>,
    );
    await expectNoA11yViolations(container);
  });

  it('renders every avatar when there is no max', () => {
    render(
      <AvatarGroup>
        <Avatar name="Ada Lovelace" />
        <Avatar name="Grace Hopper" />
      </AvatarGroup>,
    );
    expect(screen.getByText('AL')).toBeInTheDocument();
    expect(screen.getByText('GH')).toBeInTheDocument();
  });

  it('collapses avatars past max into a "+N" indicator', () => {
    render(
      <AvatarGroup max={2}>
        <Avatar name="Ada Lovelace" />
        <Avatar name="Grace Hopper" />
        <Avatar name="Margaret Hamilton" />
      </AvatarGroup>,
    );
    expect(screen.getByText('AL')).toBeInTheDocument();
    expect(screen.getByText('GH')).toBeInTheDocument();
    expect(screen.queryByText('MH')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: '1 more' })).toBeInTheDocument();
  });

  it('applies a uniform size to every child and the overflow indicator', () => {
    render(
      <AvatarGroup max={1} size="lg" data-testid="group">
        <Avatar name="Ada Lovelace" />
        <Avatar name="Grace Hopper" />
      </AvatarGroup>,
    );
    const avatars = screen.getByTestId('group').querySelectorAll('[data-size]');
    avatars.forEach((el) => expect(el).toHaveAttribute('data-size', 'lg'));
  });
});
