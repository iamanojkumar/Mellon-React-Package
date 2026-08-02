import { describe, expect, it, vi } from 'vitest';
import { createRef, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { SearchField } from './SearchField';
import { AIProvider } from '../../providers/AIProvider';
import type { AIClient } from '../../contexts/AIContext';

describe('SearchField', () => {
  it('renders a native input with type=search', () => {
    render(<SearchField aria-label="Search" />);
    expect(screen.getByRole('searchbox')).toHaveAttribute('type', 'search');
  });

  it('forwards the ref to the underlying input element', () => {
    const ref = createRef<HTMLInputElement>();
    render(<SearchField aria-label="Search" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<SearchField aria-label="Search" />);
    await expectNoA11yViolations(container);
  });

  it('does not show the clear button when empty', () => {
    render(<SearchField aria-label="Search" />);
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
  });

  it('shows the clear button once there is a value, and clears on click', async () => {
    const user = userEvent.setup();
    render(<SearchField aria-label="Search" defaultValue="hello" />);
    const input = screen.getByRole('searchbox') as HTMLInputElement;
    expect(input.value).toBe('hello');

    const clearButton = screen.getByRole('button', { name: 'Clear search' });
    await user.click(clearButton);
    expect(input.value).toBe('');
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
  });

  it('works controlled, deferring to the value prop', async () => {
    const onChange = vi.fn();
    render(<SearchField aria-label="Search" value="controlled" onChange={onChange} />);
    expect((screen.getByRole('searchbox') as HTMLInputElement).value).toBe('controlled');
  });

  it('supports a custom clear label', () => {
    render(<SearchField aria-label="Search" defaultValue="hi" clearLabel="Reset" />);
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
  });

  describe('aiSearch', () => {
    it('renders no AI trigger when aiSearch is omitted', () => {
      render(<SearchField aria-label="Search" defaultValue="hello" />);
      expect(screen.queryByRole('button', { name: 'Search with AI' })).not.toBeInTheDocument();
    });

    it('renders no AI trigger when aiSearch is true but no AIProvider is mounted', () => {
      render(<SearchField aria-label="Search" defaultValue="hello" aiSearch />);
      expect(screen.queryByRole('button', { name: 'Search with AI' })).not.toBeInTheDocument();
    });

    it('renders no AI trigger when the query is empty, even with a provider', () => {
      const client: AIClient = { complete: vi.fn() };
      render(
        <AIProvider client={client}>
          <SearchField aria-label="Search" aiSearch />
        </AIProvider>,
      );
      expect(screen.queryByRole('button', { name: 'Search with AI' })).not.toBeInTheDocument();
    });

    it('renders the AI trigger once there is a query and a provider is mounted', () => {
      const client: AIClient = { complete: vi.fn() };
      render(
        <AIProvider client={client}>
          <SearchField aria-label="Search" aiSearch defaultValue="hello" />
        </AIProvider>,
      );
      expect(screen.getByRole('button', { name: 'Search with AI' })).toBeInTheDocument();
    });

    it('triggers the AI client on open and accepting replaces the query via the same setValue path', async () => {
      const user = userEvent.setup();
      const client: AIClient = { complete: vi.fn().mockResolvedValue('refined query') };

      function Controlled() {
        const [value, setValue] = useState('hello');
        return (
          <AIProvider client={client}>
            <SearchField
              aria-label="Search"
              aiSearch
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </AIProvider>
        );
      }
      render(<Controlled />);

      await user.click(screen.getByRole('button', { name: 'Search with AI' }));
      expect(client.complete).toHaveBeenCalledWith(
        expect.objectContaining({ prompt: expect.stringContaining('hello') }),
      );

      await screen.findByText('refined query');
      await user.click(screen.getByRole('button', { name: 'Accept' }));

      expect((screen.getByRole('searchbox') as HTMLInputElement).value).toBe('refined query');
    });
  });
});
