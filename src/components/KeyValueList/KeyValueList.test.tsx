import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { KeyValueList } from './KeyValueList';

const ITEMS = [
  { label: 'Status', value: 'Active' },
  { label: 'Plan', value: 'Pro' },
];

describe('KeyValueList', () => {
  it('renders as a dl', () => {
    render(<KeyValueList data-testid="list" items={ITEMS} />);
    expect(screen.getByTestId('list').tagName).toBe('DL');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLDListElement>();
    render(<KeyValueList ref={ref} items={ITEMS} />);
    expect(ref.current).toBeInstanceOf(HTMLDListElement);
  });

  it('merges a custom className with the base style', () => {
    render(<KeyValueList data-testid="list" className="custom" items={ITEMS} />);
    expect(screen.getByTestId('list').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<KeyValueList items={ITEMS} />);
    await expectNoA11yViolations(container);
  });

  it('renders a dt/dd pair per item', () => {
    render(<KeyValueList items={ITEMS} />);
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Plan')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
  });

  it('renders nothing when items is empty', () => {
    render(<KeyValueList data-testid="list" items={[]} />);
    expect(screen.getByTestId('list')).toBeEmptyDOMElement();
  });
});
