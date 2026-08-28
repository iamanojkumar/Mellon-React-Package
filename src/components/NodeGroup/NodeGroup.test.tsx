import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { NodeGroup } from './NodeGroup';

describe('NodeGroup', () => {
  it('is a labelled group named by its name', () => {
    render(<NodeGroup name="Research" />);

    expect(screen.getByRole('group', { name: 'Research' })).toBeInTheDocument();
  });

  it('renders no ungroup control without onUngroup', () => {
    render(<NodeGroup name="Research" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('reports clicking the ungroup control', () => {
    const onUngroup = vi.fn();
    render(<NodeGroup name="Research" onUngroup={onUngroup} />);

    fireEvent.click(screen.getByRole('button', { name: 'Ungroup Research' }));

    expect(onUngroup).toHaveBeenCalled();
  });

  it('stays a static label without onRename', () => {
    render(<NodeGroup name="Research" />);

    fireEvent.doubleClick(screen.getByText('Research'));

    expect(screen.queryByLabelText('Node group name')).not.toBeInTheDocument();
  });

  it('renaming: double-click swaps to an input, Enter commits the trimmed value', () => {
    const onRename = vi.fn();
    render(<NodeGroup name="Research" onRename={onRename} />);

    fireEvent.doubleClick(screen.getByText('Research'));
    const input = screen.getByLabelText('Node group name');
    fireEvent.change(input, { target: { value: '  Renamed  ' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onRename).toHaveBeenCalledWith('Renamed');
  });

  it('renaming: Escape discards the draft without calling onRename', () => {
    const onRename = vi.fn();
    render(<NodeGroup name="Research" onRename={onRename} />);

    fireEvent.doubleClick(screen.getByText('Research'));
    fireEvent.change(screen.getByLabelText('Node group name'), { target: { value: 'Discarded' } });
    fireEvent.keyDown(screen.getByLabelText('Node group name'), { key: 'Escape' });

    expect(onRename).not.toHaveBeenCalled();
    expect(screen.getByText('Research')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <NodeGroup name="Research" onRename={vi.fn()} onUngroup={vi.fn()} />,
    );

    await expectNoA11yViolations(container);
  });
});
