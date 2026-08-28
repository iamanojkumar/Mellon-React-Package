import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { DocumentPage } from './DocumentPage';

describe('DocumentPage', () => {
  it('applies the resolved aspect ratio as a CSS value', () => {
    const { container } = render(<DocumentPage aspectRatio="16:9" />);
    expect(container.firstElementChild).toHaveStyle({ aspectRatio: '16 / 9' });
  });

  it('defaults to a4', () => {
    const { container } = render(<DocumentPage />);
    expect(container.firstElementChild).toHaveStyle({ aspectRatio: '210 / 297' });
  });

  it('accepts a custom width/height ratio', () => {
    const { container } = render(<DocumentPage aspectRatio={{ width: 3, height: 5 }} />);
    expect(container.firstElementChild).toHaveStyle({ aspectRatio: '3 / 5' });
  });

  it('renders header, body, and footer only when supplied', () => {
    render(
      <DocumentPage>
        <DocumentPage.Header>Masthead</DocumentPage.Header>
        <DocumentPage.Body>Content</DocumentPage.Body>
      </DocumentPage>,
    );

    expect(screen.getByText('Masthead')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('wraps two-column and sidebar layouts in a Grid, leaves single plain', () => {
    const single = render(
      <DocumentPage>
        <DocumentPage.Body layout="single">x</DocumentPage.Body>
      </DocumentPage>,
    );
    expect(single.container.querySelector('[data-layout]')).toBeNull();

    const twoColumn = render(
      <DocumentPage>
        <DocumentPage.Body layout="two-column">x</DocumentPage.Body>
      </DocumentPage>,
    );
    expect(twoColumn.container.querySelector('[data-layout="two-column"]')).toBeInTheDocument();

    const sidebar = render(
      <DocumentPage>
        <DocumentPage.Body layout="sidebar">x</DocumentPage.Body>
      </DocumentPage>,
    );
    expect(sidebar.container.querySelector('[data-layout="sidebar"]')).toBeInTheDocument();
  });

  it('forwards a ref to the body element, for overflow measurement', () => {
    let node: HTMLDivElement | null = null;
    render(
      <DocumentPage>
        <DocumentPage.Body
          ref={(el) => {
            node = el;
          }}
        >
          x
        </DocumentPage.Body>
      </DocumentPage>,
    );
    expect(node).not.toBeNull();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <DocumentPage>
        <DocumentPage.Header>Title</DocumentPage.Header>
        <DocumentPage.Body>Body text</DocumentPage.Body>
        <DocumentPage.Footer>Page 1</DocumentPage.Footer>
      </DocumentPage>,
    );

    await expectNoA11yViolations(container);
  });
});
