import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Statistic } from './Statistic';

describe('Statistic', () => {
  it('renders as a div', () => {
    render(<Statistic data-testid="stat" label="Revenue" value="$12,000" />);
    expect(screen.getByTestId('stat').tagName).toBe('DIV');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Statistic ref={ref} label="Revenue" value="$12,000" />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('merges a custom className with the base style', () => {
    render(<Statistic data-testid="stat" className="custom" label="Revenue" value="$12,000" />);
    expect(screen.getByTestId('stat').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <Statistic label="Revenue" value="$12,000" trend="up" trendValue="+12%" />,
    );
    await expectNoA11yViolations(container);
  });

  it('renders the label and value', () => {
    render(<Statistic label="Revenue" value="$12,000" />);
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('$12,000')).toBeInTheDocument();
  });

  it('does not render a trend row when trend is not given', () => {
    render(<Statistic label="Revenue" value="$12,000" />);
    expect(screen.queryByText('+12%')).not.toBeInTheDocument();
  });

  it('renders the trend value when trend is given', () => {
    render(<Statistic label="Revenue" value="$12,000" trend="up" trendValue="+12%" />);
    expect(screen.getByText('+12%')).toBeInTheDocument();
  });
});
