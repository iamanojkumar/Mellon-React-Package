import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { KanbanColumn } from './KanbanColumn';

describe('KanbanColumn', () => {
  it('is labelled by its own heading', () => {
    render(<KanbanColumn column={{ id: 'todo', title: 'To do', cardIds: [] }} />);

    expect(screen.getByRole('region', { name: 'To do' })).toBeInTheDocument();
  });

  it('shows a bare count when there is no WIP limit', () => {
    render(<KanbanColumn column={{ id: 'todo', title: 'To do', cardIds: ['a', 'b'] }} />);

    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows count against limit when one is set', () => {
    render(<KanbanColumn column={{ id: 'todo', title: 'To do', cardIds: ['a'], wipLimit: 3 }} />);

    expect(screen.getByText('1 of 3')).toBeInTheDocument();
  });

  it('states an overflow in words rather than by colour alone', () => {
    render(
      <KanbanColumn column={{ id: 'todo', title: 'To do', cardIds: ['a', 'b'], wipLimit: 1 }} />,
    );

    expect(screen.getByText('Over WIP limit')).toBeInTheDocument();
  });

  it('shows the empty state only when empty', () => {
    const { rerender } = render(
      <KanbanColumn column={{ id: 'todo', title: 'To do', cardIds: [] }} />,
    );
    expect(screen.getByText('No cards')).toBeInTheDocument();

    rerender(
      <KanbanColumn column={{ id: 'todo', title: 'To do', cardIds: ['a'] }}>
        <li>A card</li>
      </KanbanColumn>,
    );
    expect(screen.queryByText('No cards')).not.toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <KanbanColumn column={{ id: 'todo', title: 'To do', cardIds: ['a'], wipLimit: 2 }}>
        <li>A card</li>
      </KanbanColumn>,
    );

    await expectNoA11yViolations(container);
  });
});
