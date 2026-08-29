import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Document } from './Document';

const CONTENT_ROOT = '[contenteditable="true"], [data-document-body]';

function rect(bottom: number): DOMRect {
  return {
    top: 0,
    bottom,
    left: 0,
    right: 0,
    width: 0,
    height: bottom,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect;
}

/**
 * A fake layout engine. jsdom lays nothing out — every rect is zero and no
 * page ever overflows — so pagination is untestable here without one.
 *
 * The model: every page body clips at `pageBottom`, and every top-level block
 * inside one is `blockHeight` tall, stacked from the top. Patched on
 * `Element.prototype` rather than per node because pagination rewrites a
 * page's HTML, which replaces the very nodes a per-node stub was attached to.
 * Element identity is never used — a body is "an element containing a content
 * root" (`RichTextEditor` puts its own wrapper in between, so "first child"
 * is not it), a block is "an element whose parent is one" — so the stub
 * survives every re-render.
 *
 * Real geometry is still a browser-only concern: this pins down *which* block
 * moves and *where its HTML lands*, not whether a paragraph really fits on A4.
 */
function stubLayout({ pageBottom, blockHeight }: { pageBottom: number; blockHeight: number }) {
  const original = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = function stubbed(this: Element): DOMRect {
    if (this.querySelector(CONTENT_ROOT)) return rect(pageBottom);
    const parent = this.parentElement;
    if (parent?.matches(CONTENT_ROOT)) {
      return rect((Array.from(parent.children).indexOf(this) + 1) * blockHeight);
    }
    return rect(0);
  };
  return () => {
    Element.prototype.getBoundingClientRect = original;
  };
}

const BLOCKS = (...letters: string[]) => letters.map((letter) => `<p>${letter}</p>`).join('');

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

    // Zoom is a real-length scale factor the stylesheet multiplies the
    // sheet's width/margin/text by, not a `transform` — see
    // `Document.module.css`'s `.world` note.
    expect(world().style.getPropertyValue('--doc-zoom')).toBe('1');

    await user.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(Number(world().style.getPropertyValue('--doc-zoom'))).toBeGreaterThan(1);

    await user.click(screen.getByRole('button', { name: /reset to 100%/ }));
    expect(world().style.getPropertyValue('--doc-zoom')).toBe('1');
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
  let restoreLayout: () => void = () => {};

  afterEach(() => restoreLayout());

  // Two blocks fit (bottoms 100, 200); a third (300) does not.
  function twoPerPage() {
    restoreLayout = stubLayout({ pageBottom: 250, blockHeight: 100 });
  }

  it('moves the overflowing content onto the next page instead of clipping it', () => {
    twoPerPage();
    const onPagesChange = vi.fn();
    render(
      <Document defaultPages={[BLOCKS('a', 'b', 'c')]} editable onPagesChange={onPagesChange} />,
    );

    // The block that didn't fit is on page 2 — not left clipped and invisible
    // inside page 1 beside a blank new page, which is what used to happen.
    expect(onPagesChange).toHaveBeenLastCalledWith([BLOCKS('a', 'b'), BLOCKS('c')]);
  });

  // The reported bug: the overflow check only ever ran from the per-page
  // keystroke handler, so anything written programmatically — a `pages` prop,
  // a host's own update, an AI writing a long body in one shot — was simply
  // clipped.
  it('paginates content that arrived from the `pages` prop, with nobody typing', () => {
    twoPerPage();
    const onPagesChange = vi.fn();
    const { rerender } = render(<Document pages={['']} editable onPagesChange={onPagesChange} />);
    expect(onPagesChange).not.toHaveBeenCalled();

    rerender(
      <Document pages={[BLOCKS('a', 'b', 'c', 'd')]} editable onPagesChange={onPagesChange} />,
    );

    expect(onPagesChange).toHaveBeenLastCalledWith([BLOCKS('a', 'b'), BLOCKS('c', 'd')]);
  });

  it('paginates a read-only document too — clipped content is invisible either way', () => {
    twoPerPage();
    const onPagesChange = vi.fn();
    render(<Document defaultPages={[BLOCKS('a', 'b', 'c')]} onPagesChange={onPagesChange} />);

    expect(onPagesChange).toHaveBeenLastCalledWith([BLOCKS('a', 'b'), BLOCKS('c')]);
  });

  it('flows into the page that already follows rather than appending another', () => {
    twoPerPage();
    const onPagesChange = vi.fn();
    render(
      <Document
        defaultPages={[BLOCKS('a', 'b', 'c'), BLOCKS('z')]}
        editable
        onPagesChange={onPagesChange}
      />,
    );

    const last = onPagesChange.mock.calls.at(-1)?.[0];
    expect(last).toEqual([BLOCKS('a', 'b'), BLOCKS('c', 'z')]);
  });

  it('keeps flowing until every page fits', () => {
    twoPerPage();
    const onPagesChange = vi.fn();
    render(
      <Document
        defaultPages={[BLOCKS('a', 'b', 'c', 'd', 'e')]}
        editable
        onPagesChange={onPagesChange}
      />,
    );

    expect(onPagesChange).toHaveBeenLastCalledWith([
      BLOCKS('a', 'b'),
      BLOCKS('c', 'd'),
      BLOCKS('e'),
    ]);
  });

  // Moving it would push the same block onto page after page forever, since
  // it fits nowhere. It stays and clips; this asserts the loop doesn't happen.
  it('leaves a single block taller than the page where it is', () => {
    restoreLayout = stubLayout({ pageBottom: 100, blockHeight: 500 });
    const onPagesChange = vi.fn();
    render(<Document defaultPages={[BLOCKS('huge')]} editable onPagesChange={onPagesChange} />);

    expect(onPagesChange).not.toHaveBeenCalled();
    expect(screen.getAllByRole('region')).toHaveLength(1);
  });

  it('still flows the blocks after an unsplittable first one', () => {
    restoreLayout = stubLayout({ pageBottom: 100, blockHeight: 500 });
    const onPagesChange = vi.fn();
    render(
      <Document defaultPages={[BLOCKS('huge', 'after')]} editable onPagesChange={onPagesChange} />,
    );

    expect(onPagesChange).toHaveBeenLastCalledWith([BLOCKS('huge'), BLOCKS('after')]);
  });

  it('leaves a document that fits completely alone', () => {
    twoPerPage();
    const onPagesChange = vi.fn();
    render(<Document defaultPages={[BLOCKS('a', 'b')]} editable onPagesChange={onPagesChange} />);

    expect(onPagesChange).not.toHaveBeenCalled();
  });

  it('carries focus to the next page when the break happens under the caret', async () => {
    twoPerPage();
    render(<Document defaultPages={[BLOCKS('a')]} editable />);

    const editor = screen.getByRole('textbox');
    fireEvent.input(editor, { target: { innerHTML: BLOCKS('a', 'b', 'c') } });

    // Focus is moved a macrotask later, once the moved HTML is in the DOM to
    // put a caret into.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(screen.getAllByRole('textbox')).toHaveLength(2);
    expect(screen.getAllByRole('textbox')[1]).toHaveFocus();
  });

  // A `pages` update from elsewhere must never yank the caret out of whatever
  // the person is doing.
  it('does not move focus when the split came from a `pages` update', () => {
    twoPerPage();
    const { rerender } = render(<Document pages={['']} editable />);

    rerender(<Document pages={[BLOCKS('a', 'b', 'c')]} editable />);

    expect(document.body).toHaveFocus();
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

  // In list view the tag belongs to the column below it, so wrapping page 1
  // is right. In grid the pages are a wrapping row of cells, and wrapping
  // page 1 alone makes its cell taller than its siblings by the tag's own
  // height — the whole row then sits off-baseline.
  it('keeps the grid tag out of page 1’s own cell, so every page stays on one baseline', () => {
    const { container } = render(
      <Document defaultPages={['a', 'b']} name="Q3-roadmap.doc" view="grid" />,
    );

    expect(screen.getAllByText('Q3-roadmap.doc')).toHaveLength(1);
    const world = container.querySelector('[data-view="grid"]') as HTMLElement;
    const pages = screen.getAllByRole('region');
    // Every page is a direct child of the grid container — none nested one
    // level deeper inside a name wrapper.
    pages.forEach((page) => expect(page.parentElement).toBe(world));
  });

  it('still wraps page 1 with the tag in list view', () => {
    const { container } = render(
      <Document defaultPages={['a', 'b']} name="Q3-roadmap.doc" view="list" />,
    );

    const world = container.querySelector('[data-view="list"]') as HTMLElement;
    const [first, second] = screen.getAllByRole('region');
    expect(first?.parentElement).not.toBe(world);
    expect(second?.parentElement).toBe(world);
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
