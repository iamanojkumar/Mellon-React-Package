import { describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { KeyValueList } from './KeyValueList';
import { AIProvider } from '../../providers/AIProvider';
import type { AIClient } from '../../contexts/AIContext';

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

  describe('aiExplain', () => {
    it('renders no AI trigger when aiExplain is omitted', () => {
      render(<KeyValueList items={ITEMS} />);
      expect(screen.queryByRole('button', { name: 'Explain with AI' })).not.toBeInTheDocument();
    });

    it('renders no AI trigger when aiExplain is true but no AIProvider is mounted', () => {
      render(<KeyValueList items={ITEMS} aiExplain />);
      expect(screen.queryByRole('button', { name: 'Explain with AI' })).not.toBeInTheDocument();
    });

    it('renders the AI trigger when a provider is mounted', () => {
      const client: AIClient = { complete: vi.fn() };
      render(
        <AIProvider client={client}>
          <KeyValueList items={ITEMS} aiExplain />
        </AIProvider>,
      );
      expect(screen.getByRole('button', { name: 'Explain with AI' })).toBeInTheDocument();
    });

    it('triggers the AI client on open with the serialized items and has no accept/reject actions (read-only)', async () => {
      const user = userEvent.setup();
      const complete = vi.fn().mockResolvedValue('This account is on the Pro plan and active.');
      const client: AIClient = { complete };
      render(
        <AIProvider client={client}>
          <KeyValueList items={ITEMS} aiExplain />
        </AIProvider>,
      );

      await user.click(screen.getByRole('button', { name: 'Explain with AI' }));
      const prompt = complete.mock.calls[0]?.[0].prompt as string;
      expect(prompt).toContain('Status: Active');
      expect(prompt).toContain('Plan: Pro');
      expect(
        await screen.findByText('This account is on the Pro plan and active.'),
      ).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Discard' })).not.toBeInTheDocument();
    });

    it('has no accessibility violations with the AI trigger rendered', async () => {
      const client: AIClient = { complete: vi.fn() };
      const { container } = render(
        <AIProvider client={client}>
          <KeyValueList items={ITEMS} aiExplain />
        </AIProvider>,
      );
      await expectNoA11yViolations(container);
    });
  });
});
