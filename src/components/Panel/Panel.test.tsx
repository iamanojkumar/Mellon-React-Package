import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Panel } from './Panel';

describe('Panel', () => {
  it('renders as a div by default', () => {
    render(<Panel data-testid="panel">content</Panel>);
    expect(screen.getByTestId('panel').tagName).toBe('DIV');
  });

  it('renders as the element passed via the "as" prop', () => {
    render(<Panel as="aside" data-testid="panel" />);
    expect(screen.getByTestId('panel').tagName).toBe('ASIDE');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Panel ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('merges a custom className with the base style', () => {
    render(<Panel data-testid="panel" className="custom" />);
    expect(screen.getByTestId('panel').className).toContain('custom');
  });

  it('defaults to dock=end', () => {
    render(<Panel data-testid="panel" />);
    expect(screen.getByTestId('panel')).toHaveAttribute('data-dock', 'end');
  });

  it('reflects a start dock', () => {
    render(<Panel dock="start" data-testid="panel" />);
    expect(screen.getByTestId('panel')).toHaveAttribute('data-dock', 'start');
  });

  it('renders children inside the scrollable body', () => {
    render(<Panel>Body content</Panel>);
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  it('renders no header or footer row when neither is passed', () => {
    render(<Panel data-testid="panel">Body only</Panel>);
    expect(screen.getByTestId('panel').children).toHaveLength(1);
  });

  it('renders the header and footer slots when provided', () => {
    render(
      <Panel header="Properties" footer="Actions">
        Body content
      </Panel>,
    );
    expect(screen.getByText('Properties')).toBeInTheDocument();
    expect(screen.getByText('Body content')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <Panel header="Properties" footer="Actions">
        Body content
      </Panel>,
    );
    await expectNoA11yViolations(container);
  });
});
