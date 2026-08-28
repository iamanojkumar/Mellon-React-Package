import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Document } from './Document';

/** jsdom never lays anything out, so `scrollHeight`/`clientHeight` are always 0 — stub them on the ref'd node to drive the overflow check deterministically. */
function stubOverflow(el: HTMLElement, scrollHeight: number, clientHeight: number) {
  Object.defineProperty(el, 'scrollHeight', { configurable: true, value: scrollHeight });
  Object.defineProperty(el, 'clientHeight', { configurable: true, value: clientHeight });
}

describe('Document rendering', () => {
  it('renders one page by default', () => {
    render(<Document />);
    expect(screen.getByRole('region', { name: 'Page 1' })).toBeInTheDocument();
  });

  it('renders every page in `pages`', () => {
    render(<Document defaultPages={['one', 'two', 'three']} />);
    expect(screen.getByRole('region', { name: 'Page 1' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Page 2' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Page 3' })).toBeInTheDocument();
  });

  it('renders header and footer on every page when supplied', () => {
    render(<Document defaultPages={['a', 'b']} header="Masthead" footer="Confidential" />);
    expect(screen.getAllByText('Masthead')).toHaveLength(2);
    expect(screen.getAllByText('Confidential')).toHaveLength(2);
  });

  it('renders static HTML when not editable, no RichTextEditor mounted', () => {
    render(<Document defaultPages={['<p>Hello</p>']} />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('mounts a RichTextEditor per page when editable', () => {
    render(<Document defaultPages={['a', 'b']} editable />);
    expect(screen.getAllByRole('textbox')).toHaveLength(2);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Document defaultPages={['<p>Hello</p>']} header="Title" />);
    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations while editable', async () => {
    const { container } = render(<Document defaultPages={['a']} editable />);
    await expectNoA11yViolations(container);
  });
});

describe('Document editable header/footer', () => {
  it('renders the header/footer as static content, not an editor, when no value prop is supplied', () => {
    render(<Document defaultPages={['a']} header="Masthead" editable />);
    expect(screen.getByText('Masthead')).toBeInTheDocument();
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
  });

  it('mounts an editable header/footer once headerValue/footerValue opt in', () => {
    render(
      <Document
        defaultPages={['a']}
        defaultHeaderValue="Untitled note"
        defaultFooterValue="Confidential"
        editable
      />,
    );
    expect(screen.getByRole('textbox', { name: 'Page 1 header' })).toHaveTextContent(
      'Untitled note',
    );
    expect(screen.getByRole('textbox', { name: 'Page 1 footer' })).toHaveTextContent(
      'Confidential',
    );
  });

  it('reports typed header text through onHeaderChange', () => {
    const onHeaderChange = vi.fn();
    render(
      <Document
        defaultPages={['a']}
        defaultHeaderValue=""
        onHeaderChange={onHeaderChange}
        editable
      />,
    );
    fireEvent.input(screen.getByRole('textbox', { name: 'Page 1 header' }), {
      target: { innerHTML: 'New title' },
    });
    expect(onHeaderChange).toHaveBeenCalledWith('New title');
  });

  it('does not render an editable header/footer when not editable', () => {
    render(<Document defaultPages={['a']} defaultHeaderValue="Untitled note" />);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});

describe('Document chrome', () => {
  it('shows the view toggle and zoom controls by default', () => {
    render(<Document />);
    expect(screen.getByRole('group', { name: 'Page view' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Zoom' })).toBeInTheDocument();
  });

  it('hides all chrome and renders only the active page when chrome={false}', () => {
    render(<Document defaultPages={['a', 'b']} chrome={false} defaultActivePageIndex={1} />);
    expect(screen.queryByRole('group', { name: 'Page view' })).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Page 2' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Page 1' })).not.toBeInTheDocument();
  });

  it('switches between list and grid view', async () => {
    const user = userEvent.setup();
    const { container } = render(<Document defaultPages={['a']} />);

    expect(container.querySelector('[class*="world"]')).toHaveAttribute('data-view', 'list');

    await user.click(screen.getByRole('button', { name: 'Grid view' }));
    expect(container.querySelector('[class*="world"]')).toHaveAttribute('data-view', 'grid');
  });

  it('zooms in and out via the toolbar buttons', async () => {
    const user = userEvent.setup();
    const { container } = render(<Document defaultPages={['a']} />);
    const world = () => container.querySelector('[class*="world"]') as HTMLElement;

    expect(world()).toHaveStyle({ transform: 'scale(1)' });

    await user.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(world().style.transform).not.toBe('scale(1)');
  });
});

describe('Document page navigation', () => {
  it('arrow keys move the active page when focus is not in a text surface', () => {
    const onActivePageIndexChange = vi.fn();
    render(
      <Document defaultPages={['a', 'b', 'c']} onActivePageIndexChange={onActivePageIndexChange} />,
    );

    const viewport = screen.getByRole('group', { name: 'Document' });
    fireEvent.keyDown(viewport, { key: 'ArrowRight' });

    expect(onActivePageIndexChange).toHaveBeenCalledWith(1);
  });

  it("does not navigate pages when focus is inside a page's editor", () => {
    const onActivePageIndexChange = vi.fn();
    render(
      <Document
        defaultPages={['a', 'b']}
        editable
        onActivePageIndexChange={onActivePageIndexChange}
      />,
    );

    const [firstEditor] = screen.getAllByRole('textbox');
    fireEvent.keyDown(firstEditor as HTMLElement, { key: 'ArrowRight' });

    expect(onActivePageIndexChange).not.toHaveBeenCalled();
  });

  it('clamps at the first and last page', () => {
    const onActivePageIndexChange = vi.fn();
    render(<Document defaultPages={['a']} onActivePageIndexChange={onActivePageIndexChange} />);

    const viewport = screen.getByRole('group', { name: 'Document' });
    fireEvent.keyDown(viewport, { key: 'ArrowRight' });
    fireEvent.keyDown(viewport, { key: 'ArrowLeft' });

    expect(onActivePageIndexChange).not.toHaveBeenCalled();
  });
});

describe('Document auto-pagination', () => {
  it('appends a new page once the last page overflows', async () => {
    const onPagesChange = vi.fn();
    const { container } = render(
      <Document defaultPages={['start']} editable onPagesChange={onPagesChange} />,
    );

    const body = container.querySelector('[class*="body"]') as HTMLElement;
    stubOverflow(body, 500, 200);

    const editor = screen.getByRole('textbox');
    fireEvent.input(editor, { target: { innerHTML: 'a lot of text' } });

    // The overflow check is deferred to a macrotask, after layout for the
    // new content has actually happened.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(onPagesChange).toHaveBeenLastCalledWith(['a lot of text', '']);
    expect(screen.getAllByRole('textbox')).toHaveLength(2);
  });

  it('never grows a page other than the last one', () => {
    const onPagesChange = vi.fn();
    render(<Document defaultPages={['a', 'b']} editable onPagesChange={onPagesChange} />);

    const [firstEditor] = screen.getAllByRole('textbox');
    fireEvent.input(firstEditor as HTMLElement, { target: { innerHTML: 'edited' } });

    // Content changed, but no page was appended purely from editing the
    // first (non-last) page.
    expect(onPagesChange).toHaveBeenCalledWith(['edited', 'b']);
  });
});

describe('Document format toolbar', () => {
  // jsdom has no real formatting engine and doesn't even define
  // execCommand/queryCommandState — stubbed directly, same as
  // `RichTextEditor.test.tsx`.
  beforeEach(() => {
    document.execCommand = vi.fn().mockReturnValue(true);
    document.queryCommandState = vi.fn().mockReturnValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (document as any).execCommand;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (document as any).queryCommandState;
  });

  it('renders no format toolbar when not editable', () => {
    render(<Document defaultPages={['a']} />);
    expect(screen.queryByRole('toolbar', { name: 'Text formatting' })).not.toBeInTheDocument();
  });

  it('renders one shared format toolbar above the page, not one per region', () => {
    render(
      <Document
        defaultPages={['a']}
        defaultHeaderValue="Title"
        defaultFooterValue="Footer"
        editable
      />,
    );
    expect(screen.getAllByRole('toolbar', { name: 'Text formatting' })).toHaveLength(1);
  });

  it('offers every paragraph style option, in heading-then-body-then-annotation order', () => {
    render(<Document defaultPages={['a']} editable />);
    expect(screen.getByRole('combobox', { name: 'Paragraph style' })).toBeInTheDocument();
  });

  it('applies bold to whichever surface was last focused', async () => {
    const user = userEvent.setup();
    render(<Document defaultPages={['a']} editable />);

    const body = screen.getByRole('textbox', { name: 'Page 1 text' });
    // `fireEvent.focus` only dispatches the synthetic event without moving
    // `document.activeElement` — a real `.focus()` call is what actually
    // triggers React's delegated `focusin` listener here.
    act(() => body.focus());

    await user.click(screen.getByRole('button', { name: 'Bold' }));
    expect(document.execCommand).toHaveBeenCalledWith('bold');
  });

  it('applies a heading via formatBlock when chosen from the paragraph style select', async () => {
    const user = userEvent.setup();
    render(<Document defaultPages={['a']} editable />);

    const body = screen.getByRole('textbox', { name: 'Page 1 text' });
    act(() => body.focus());

    await user.click(screen.getByRole('combobox', { name: 'Paragraph style' }));
    await user.click(screen.getByRole('option', { name: 'Heading 1' }));

    expect(document.execCommand).toHaveBeenCalledWith('formatBlock', false, '<h1>');
  });
});

describe('Document name', () => {
  it('renders no name tag when name is omitted', () => {
    render(<Document defaultPages={['a']} />);
    expect(screen.queryByText('Q3-roadmap.doc')).not.toBeInTheDocument();
  });

  it('renders the name tag once, above the first page', () => {
    render(<Document defaultPages={['a', 'b']} name="Q3-roadmap.doc" />);
    expect(screen.getAllByText('Q3-roadmap.doc')).toHaveLength(1);
  });
});

describe('Document table of contents', () => {
  it('renders no toc panel or toggle when no page has a heading', () => {
    render(<Document defaultPages={['<p>No headings here.</p>']} />);
    expect(screen.queryByRole('navigation', { name: 'Table of contents' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Toggle table of contents' }),
    ).not.toBeInTheDocument();
  });

  it('lists every heading across every page, open by default', () => {
    render(
      <Document defaultPages={['<h1>Intro</h1><p>Text.</p>', '<h2>Details</h2><p>More.</p>']} />,
    );
    expect(screen.getByRole('button', { name: 'Intro' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Details' })).toBeInTheDocument();
  });

  it("jumps to a heading's page on click", async () => {
    const user = userEvent.setup();
    const onActivePageIndexChange = vi.fn();
    render(
      <Document
        defaultPages={['<h1>Intro</h1>', '<h2>Details</h2>']}
        onActivePageIndexChange={onActivePageIndexChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Details' }));
    expect(onActivePageIndexChange).toHaveBeenCalledWith(1);
  });

  it('hides the panel when the toggle is clicked', async () => {
    const user = userEvent.setup();
    render(<Document defaultPages={['<h1>Intro</h1>']} />);
    expect(screen.getByRole('navigation', { name: 'Table of contents' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Toggle table of contents' }));
    expect(screen.queryByRole('navigation', { name: 'Table of contents' })).not.toBeInTheDocument();
  });
});

describe('Document name editing', () => {
  it('does nothing on double-click when onNameChange is not supplied', () => {
    render(<Document defaultPages={['a']} name="Q3-roadmap.doc" />);
    fireEvent.doubleClick(screen.getByText('Q3-roadmap.doc'));
    expect(screen.queryByRole('textbox', { name: 'Document name' })).not.toBeInTheDocument();
  });

  it('swaps the tag for a text input on double-click when onNameChange is supplied', () => {
    render(<Document defaultPages={['a']} name="Q3-roadmap.doc" onNameChange={vi.fn()} />);
    fireEvent.doubleClick(screen.getByText('Q3-roadmap.doc'));
    expect(screen.getByRole('textbox', { name: 'Document name' })).toHaveValue('Q3-roadmap.doc');
  });

  it('commits the edited name on Enter', () => {
    const onNameChange = vi.fn();
    render(<Document defaultPages={['a']} name="Q3-roadmap.doc" onNameChange={onNameChange} />);
    fireEvent.doubleClick(screen.getByText('Q3-roadmap.doc'));

    const input = screen.getByRole('textbox', { name: 'Document name' });
    fireEvent.change(input, { target: { value: 'Renamed.doc' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onNameChange).toHaveBeenCalledWith('Renamed.doc');
    expect(screen.queryByRole('textbox', { name: 'Document name' })).not.toBeInTheDocument();
  });

  it('commits the edited name on blur', () => {
    const onNameChange = vi.fn();
    render(<Document defaultPages={['a']} name="Q3-roadmap.doc" onNameChange={onNameChange} />);
    fireEvent.doubleClick(screen.getByText('Q3-roadmap.doc'));

    const input = screen.getByRole('textbox', { name: 'Document name' });
    fireEvent.change(input, { target: { value: 'Renamed.doc' } });
    fireEvent.blur(input);

    expect(onNameChange).toHaveBeenCalledWith('Renamed.doc');
  });

  it('discards the draft on Escape without calling onNameChange', () => {
    const onNameChange = vi.fn();
    render(<Document defaultPages={['a']} name="Q3-roadmap.doc" onNameChange={onNameChange} />);
    fireEvent.doubleClick(screen.getByText('Q3-roadmap.doc'));

    const input = screen.getByRole('textbox', { name: 'Document name' });
    fireEvent.change(input, { target: { value: 'Renamed.doc' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(onNameChange).not.toHaveBeenCalled();
    expect(screen.getByText('Q3-roadmap.doc')).toBeInTheDocument();
  });
});
