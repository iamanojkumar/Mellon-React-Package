import { describe, expect, it, vi } from 'vitest';
import type { ComponentPropsWithoutRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Breadcrumb } from './Breadcrumb';

function BasicBreadcrumb() {
  return (
    <Breadcrumb>
      <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
      <Breadcrumb.Item href="/products">Products</Breadcrumb.Item>
      <Breadcrumb.Item current>Widget</Breadcrumb.Item>
    </Breadcrumb>
  );
}

describe('Breadcrumb', () => {
  it('renders a nav landmark labelled "Breadcrumb" by default', () => {
    render(<BasicBreadcrumb />);
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
  });

  it('accepts a custom aria-label', () => {
    render(
      <Breadcrumb aria-label="You are here">
        <Breadcrumb.Item current>Home</Breadcrumb.Item>
      </Breadcrumb>,
    );
    expect(screen.getByRole('navigation', { name: 'You are here' })).toBeInTheDocument();
  });

  it('renders each item as a link by default', () => {
    render(<BasicBreadcrumb />);
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Products' })).toHaveAttribute('href', '/products');
  });

  it('renders the current item as a non-link with aria-current="page"', () => {
    render(<BasicBreadcrumb />);
    expect(screen.queryByRole('link', { name: 'Widget' })).not.toBeInTheDocument();
    const current = screen.getByText('Widget');
    expect(current.tagName).toBe('SPAN');
    expect(current).toHaveAttribute('aria-current', 'page');
  });

  it('renders a separator between items but not after the last one', () => {
    render(<BasicBreadcrumb />);
    const separators = screen.getAllByText('/', { selector: 'span' });
    expect(separators).toHaveLength(2);
  });

  it('supports a custom separator', () => {
    render(
      <Breadcrumb separator=">">
        <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
        <Breadcrumb.Item current>Widget</Breadcrumb.Item>
      </Breadcrumb>,
    );
    expect(screen.getByText('>')).toBeInTheDocument();
  });

  it('renders as an ordered list of items', () => {
    render(<BasicBreadcrumb />);
    expect(screen.getByRole('list').tagName).toBe('OL');
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('supports the "as" prop for router-link integration', () => {
    function FakeRouterLink({ children, ...props }: ComponentPropsWithoutRef<'a'>) {
      return (
        <a data-router-link="" {...props}>
          {children}
        </a>
      );
    }
    render(
      <Breadcrumb>
        <Breadcrumb.Item as={FakeRouterLink} href="/">
          Home
        </Breadcrumb.Item>
        <Breadcrumb.Item current>Widget</Breadcrumb.Item>
      </Breadcrumb>,
    );
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('data-router-link', '');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<BasicBreadcrumb />);
    await expectNoA11yViolations(container);
  });
  // A router-driven trail step has no href to hang on an <a>, so as="button"
  // is a first-class call site rather than an edge case. The styling half of
  // this (native button chrome had to be neutralised in Breadcrumb.module.css
  // — hover and focus were keyed off `a.item` and so never matched a button)
  // isn't assertable here: jsdom applies no stylesheet. Breadcrumb.stories'
  // AsButton story is the real-browser check.
  describe('as="button"', () => {
    it('renders a real button that carries the item styling and fires onClick', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(
        <Breadcrumb>
          <Breadcrumb.Item as="button" onClick={onClick}>
            Home
          </Breadcrumb.Item>
          <Breadcrumb.Item current>Widget</Breadcrumb.Item>
        </Breadcrumb>,
      );

      const item = screen.getByRole('button', { name: 'Home' });
      expect(item.tagName).toBe('BUTTON');
      expect(item.className).toBe(screen.getByText('Widget').className.replace(/s*$/, ''));

      await user.click(item);
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('has no accessibility violations', async () => {
      const { container } = render(
        <Breadcrumb>
          <Breadcrumb.Item as="button" onClick={() => {}}>
            Home
          </Breadcrumb.Item>
          <Breadcrumb.Item current>Widget</Breadcrumb.Item>
        </Breadcrumb>,
      );
      await expectNoA11yViolations(container);
    });
  });
});
