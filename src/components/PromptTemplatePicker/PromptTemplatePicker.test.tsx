import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { PromptTemplatePicker } from './PromptTemplatePicker';
import type { PromptTemplate } from './PromptTemplatePicker';

const TEMPLATES: PromptTemplate[] = [
  { id: '1', title: 'Summarize', content: 'Summarize the above.' },
  { id: '2', title: 'Translate', content: 'Translate the above to French.' },
  { id: '3', title: 'Explain', content: 'Explain the above.', disabled: true },
];

describe('PromptTemplatePicker', () => {
  it('renders a closed trigger button with the default label', () => {
    render(<PromptTemplatePicker templates={TEMPLATES} onSelect={() => {}} />);
    expect(screen.getByRole('button', { name: 'Templates' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('supports a custom trigger label', () => {
    render(
      <PromptTemplatePicker templates={TEMPLATES} onSelect={() => {}} triggerLabel="Prompts" />,
    );
    expect(screen.getByRole('button', { name: 'Prompts' })).toBeInTheDocument();
  });

  it('opens the menu on trigger click, listing every template', async () => {
    const user = userEvent.setup();
    render(<PromptTemplatePicker templates={TEMPLATES} onSelect={() => {}} />);
    await user.click(screen.getByRole('button', { name: 'Templates' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getAllByRole('menuitem')).toHaveLength(3);
  });

  it('selecting a template calls onSelect, closes the menu, and refocuses the trigger', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<PromptTemplatePicker templates={TEMPLATES} onSelect={onSelect} />);
    const trigger = screen.getByRole('button', { name: 'Templates' });
    await user.click(trigger);
    await user.click(screen.getByText('Summarize'));
    expect(onSelect).toHaveBeenCalledWith(TEMPLATES[0]);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('renders emptyLabel when there are no templates', async () => {
    const user = userEvent.setup();
    render(
      <PromptTemplatePicker templates={[]} onSelect={() => {}} emptyLabel="No saved templates" />,
    );
    await user.click(screen.getByRole('button', { name: 'Templates' }));
    expect(screen.getByText('No saved templates')).toBeInTheDocument();
  });

  it('works as a controlled component via the open prop', async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(
      <PromptTemplatePicker
        templates={TEMPLATES}
        onSelect={() => {}}
        open={false}
        onOpenChange={onOpenChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Templates' }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    // Controlled: stays closed since the open prop wasn't updated by the consumer.
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('has no accessibility violations, closed or open', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <PromptTemplatePicker templates={TEMPLATES} onSelect={() => {}} />,
    );
    await expectNoA11yViolations(container);
    await user.click(screen.getByRole('button', { name: 'Templates' }));
    await expectNoA11yViolations(container);
  });
});
