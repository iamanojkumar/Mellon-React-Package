import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { KanbanCard } from './KanbanCard';
import type { KanbanCard as KanbanCardData } from '../../utilities/kanbanReducer';

const card: KanbanCardData = {
  id: 'c1',
  title: 'Fix login redirect',
  description: 'Users bounce back to /login after SSO.',
  status: 'danger',
  tags: ['bug', 'auth'],
  assignee: { id: 'u1', name: 'Ana Diaz' },
};

function renderInList(element: React.ReactElement) {
  return render(<ul>{element}</ul>);
}

describe('KanbanCard', () => {
  it('renders the title, description, tags and assignee', () => {
    renderInList(<KanbanCard card={card} />);

    expect(screen.getByText('Fix login redirect')).toBeInTheDocument();
    expect(screen.getByText('Users bounce back to /login after SSO.')).toBeInTheDocument();
    expect(screen.getByText('bug')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Ana Diaz' })).toBeInTheDocument();
  });

  it('names the status in visible text, so colour is never the only signal', () => {
    renderInList(<KanbanCard card={card} />);

    expect(screen.getByText('Blocked')).toBeInTheDocument();
  });

  it('accepts overridden status labels', () => {
    renderInList(
      <KanbanCard
        card={card}
        statusLabels={{ success: 'Fine', warning: 'Wobbly', danger: 'Stuck' }}
      />,
    );

    expect(screen.getByText('Stuck')).toBeInTheDocument();
  });

  it('omits the footer entirely when there is nothing to put in it', () => {
    renderInList(<KanbanCard card={{ id: 'c2', title: 'Bare card' }} />);

    expect(screen.getByText('Bare card')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('lets renderCard replace the face', () => {
    renderInList(<KanbanCard card={card} renderCard={(item) => <span>{item.id}</span>} />);

    expect(screen.getByText('c1')).toBeInTheDocument();
    expect(screen.queryByText('Fix login redirect')).not.toBeInTheDocument();
  });

  it('reflects drag and lift state as data attributes', () => {
    const { container } = renderInList(<KanbanCard card={card} dragging lifted />);
    const item = container.querySelector('li');

    expect(item).toHaveAttribute('data-dragging');
    expect(item).toHaveAttribute('data-lifted');
  });

  it('has no accessibility violations', async () => {
    const { container } = renderInList(<KanbanCard card={card} />);

    await expectNoA11yViolations(container);
  });
});
