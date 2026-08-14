import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { CanvasChangePreview, describeCanvasCommand } from './CanvasChangePreview';
import type { CanvasScene } from '../../utilities/canvasReducer';

const scene: CanvasScene = {
  blocks: [
    { id: 'a', kind: 'sticky', text: 'Login', x: 0, y: 0, width: 100, height: 100 },
    { id: 'b', kind: 'sticky', text: 'Auth', x: 200, y: 0, width: 100, height: 100 },
  ],
  connectors: [],
};

describe('describeCanvasCommand', () => {
  it('names blocks by label, not id', () => {
    expect(describeCanvasCommand(scene, { op: 'delete', id: 'a' })).toBe('Delete “Login”');
  });

  it('describes each op readably', () => {
    expect(describeCanvasCommand(scene, { op: 'move', id: 'a', x: 10.4, y: 20.6 })).toBe(
      'Move “Login” to 10, 21',
    );
    expect(describeCanvasCommand(scene, { op: 'resize', id: 'a', width: 50, height: 60 })).toBe(
      'Resize “Login” to 50 × 60',
    );
    expect(describeCanvasCommand(scene, { op: 'update', id: 'a', patch: { text: 'x' } })).toBe(
      'Update text on “Login”',
    );
    expect(
      describeCanvasCommand(scene, { op: 'connect', connector: { id: 'e', from: 'a', to: 'b' } }),
    ).toBe('Connect “Login” to “Auth”');
  });

  it('falls back to the id for an unknown block', () => {
    expect(describeCanvasCommand(scene, { op: 'delete', id: 'ghost' })).toBe('Delete “ghost”');
  });
});

describe('CanvasChangePreview', () => {
  const commands = [
    { op: 'move' as const, id: 'a', x: 10, y: 10 },
    { op: 'delete' as const, id: 'b' },
  ];

  it('starts with every command checked', () => {
    render(
      <CanvasChangePreview
        scene={scene}
        commands={commands}
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    screen.getAllByRole('checkbox').forEach((box) => expect(box).toBeChecked());
  });

  it('names blocks created in the same batch, not their ids', () => {
    render(
      <CanvasChangePreview
        scene={scene}
        commands={[
          {
            op: 'create',
            block: { id: 'n1', kind: 'sticky', text: 'Fresh', x: 0, y: 0, width: 10, height: 10 },
          },
          { op: 'connect', connector: { id: 'e', from: 'a', to: 'n1' } },
        ]}
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    expect(screen.getByText('Connect “Login” to “Fresh”')).toBeInTheDocument();
  });

  it('passes only the checked commands to onAccept', async () => {
    const user = userEvent.setup();
    const onAccept = vi.fn();
    render(
      <CanvasChangePreview
        scene={scene}
        commands={commands}
        onAccept={onAccept}
        onReject={vi.fn()}
      />,
    );

    await user.click(screen.getByText('Delete “Auth”'));
    await user.click(screen.getByRole('button', { name: 'Apply 1 of 2' }));

    expect(onAccept).toHaveBeenCalledWith([commands[0]]);
  });

  it('shows why a command was ignored', () => {
    render(
      <CanvasChangePreview
        scene={scene}
        commands={[]}
        rejected={[{ command: { op: 'delete', id: 'ghost' }, reason: 'Unknown block "ghost"' }]}
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    expect(screen.getByText('Unknown block "ghost"')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <CanvasChangePreview
        scene={scene}
        commands={commands}
        rejected={[{ command: { op: 'delete', id: 'x' }, reason: 'Unknown block "x"' }]}
        message="Here is what I would do."
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    await expectNoA11yViolations(container);
  });
});
