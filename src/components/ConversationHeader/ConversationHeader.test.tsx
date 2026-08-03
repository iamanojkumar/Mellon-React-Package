import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { ConversationHeader } from './ConversationHeader';

describe('ConversationHeader', () => {
  it('renders the title as a heading', () => {
    render(<ConversationHeader title="Flexbox centering" />);
    expect(screen.getByRole('heading', { name: 'Flexbox centering' })).toBeInTheDocument();
  });

  it('renders as a header landmark', () => {
    render(<ConversationHeader title="Flexbox centering" />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('renders no meta row when tags and modelUsed are both omitted', () => {
    render(<ConversationHeader title="Flexbox centering" data-testid="unused" />);
    expect(screen.queryByText('GPT-4')).not.toBeInTheDocument();
  });

  it('renders modelUsed and each tag', () => {
    render(
      <ConversationHeader title="Flexbox centering" modelUsed="GPT-4" tags={['css', 'layout']} />,
    );
    expect(screen.getByText('GPT-4')).toBeInTheDocument();
    expect(screen.getByText('css')).toBeInTheDocument();
    expect(screen.getByText('layout')).toBeInTheDocument();
  });

  it('renders the participants and actions slots', () => {
    render(
      <ConversationHeader
        title="Flexbox centering"
        participants={<span data-testid="participants" />}
        actions={<button type="button">Share</button>}
      />,
    );
    expect(screen.getByTestId('participants')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument();
  });

  it('merges a custom className with the base style', () => {
    render(<ConversationHeader title="Flexbox centering" className="custom" />);
    expect(screen.getByRole('banner').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <ConversationHeader
        title="Flexbox centering"
        modelUsed="GPT-4"
        tags={['css']}
        actions={<button type="button">Share</button>}
      />,
    );
    await expectNoA11yViolations(container);
  });
});
