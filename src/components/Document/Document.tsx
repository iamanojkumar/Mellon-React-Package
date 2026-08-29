import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  CSSProperties,
  FocusEvent,
  FormEvent,
  KeyboardEvent,
  ReactNode,
  SyntheticEvent,
} from 'react';
import { DocumentPage } from '../DocumentPage/DocumentPage';
import type { DocumentPageLayout } from '../DocumentPage/DocumentPage';
import {
  RichTextEditor,
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  BulletedListIcon,
  NumberedListIcon,
  LinkIcon,
} from '../RichTextEditor/RichTextEditor';
import { IconButton } from '../IconButton/IconButton';
import { ToggleButton } from '../ToggleButton/ToggleButton';
import { Popover } from '../Popover/Popover';
import { Select } from '../Select/Select';
import type { SelectOption } from '../Select/Select';
import { Button } from '../Button/Button';
import { useControllableState } from '../../hooks/useControllableState';
import { useRovingFocus } from '../../hooks/useRovingFocus';
import { mergeClasses } from '../../utilities/mergeClasses';
import type { DocumentAspectRatio } from '../../utilities/documentAspectRatio';
import { paginationSplitIndex } from '../../utilities/documentPagination';
import inputStyles from '../Input/Input.module.css';
import styles from './Document.module.css';

export type DocumentView = 'list' | 'grid';

/** Interaction geometry for the zoom control, not a design value. */
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2;
const ZOOM_STEP = 1.2;

type BlockStyleValue =
  'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'caption' | 'quote' | 'note';

const BLOCK_STYLE_OPTIONS: SelectOption[] = [
  { value: 'h1', label: 'Heading 1' },
  { value: 'h2', label: 'Heading 2' },
  { value: 'h3', label: 'Heading 3' },
  { value: 'h4', label: 'Heading 4' },
  { value: 'h5', label: 'Heading 5' },
  { value: 'h6', label: 'Heading 6' },
  { value: 'body', label: 'Body' },
  { value: 'caption', label: 'Caption' },
  { value: 'quote', label: 'Quote' },
  { value: 'note', label: 'Note' },
];

/** `execCommand('formatBlock', ...)` only understands real block tags — `caption`/`note` have no tag of their own, so both format as `<p>` and are told apart afterward by a CSS class (`applyBlockStyle` below). */
const BLOCK_STYLE_TAGS: Record<BlockStyleValue, string> = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  body: 'p',
  caption: 'p',
  quote: 'blockquote',
  note: 'p',
};

interface DocumentFormatState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  insertUnorderedList: boolean;
  insertOrderedList: boolean;
}

const emptyFormatState: DocumentFormatState = {
  bold: false,
  italic: false,
  underline: false,
  insertUnorderedList: false,
  insertOrderedList: false,
};

export interface DocumentOwnProps {
  /**
   * One **HTML** string per page — not markdown. `<p>Bold: <strong>yes</strong></p>`,
   * never `**yes**`, which renders as literal asterisks. Worth stating
   * because it's the natural mistake for a model writing into this prop: say
   * so explicitly in the prompt, the same way the canvas command vocabulary
   * has to be spelled out. It's the same string `RichTextEditor` round-trips,
   * and the same trust model as `CanvasBlock`'s `text` kind — content the
   * consumer already owns, not third-party markup (that belongs in a
   * sandboxed `embed`).
   *
   * Controlled/uncontrolled the same way as `Canvas`'s `scene` — this is the
   * seam an AI/chat component edits through (the same `onPagesChange` a
   * person's own typing already goes through), not a parallel path. Note that
   * auto-pagination writes back through it too, so a controlled `pages`
   * without an `onPagesChange` can never paginate.
   */
  pages?: string[];
  defaultPages?: string[];
  onPagesChange?: (pages: string[]) => void;
  aspectRatio?: DocumentAspectRatio;
  layout?: DocumentPageLayout;
  /**
   * The document's own name/title — e.g. a file name — supplied by the
   * consumer rather than typed into the page itself. Rendered as a small
   * label above the page's top-left corner (a browser-tab-style identity
   * tag), separate from `header`/`headerValue`, which is in-page content
   * (a resume's masthead) that prints/exports with the page. Omit to render
   * no label at all.
   */
  name?: string;
  /**
   * Double-clicking the name tag swaps it for a text input when this is
   * supplied — the same "supplying a callback is the opt-in" shape
   * `resolveCommands` uses on `KanbanPromptBar`. Fires on blur, Enter, or
   * Escape-then-blur; Escape alone discards the edit without calling this.
   * Omit to leave the tag a static label, double-click or not.
   */
  onNameChange?: (name: string) => void;
  /**
   * Rendered on every page. Typically a name/title — a resume's masthead,
   * not page furniture that varies per page. Static — ignored once
   * `headerValue`/`onHeaderChange` opts the header itself into editing.
   */
  header?: ReactNode;
  footer?: ReactNode;
  /**
   * Header content as an HTML string, editable in place — the same
   * controlled/uncontrolled shape as `pages`. Supplying this (or
   * `onHeaderChange`/`defaultHeaderValue`) switches the header from the
   * static `header` slot to a real editable surface while `editable` is
   * `true`; a page has one continuous editable surface (header, body,
   * footer) rather than the body alone.
   */
  headerValue?: string;
  defaultHeaderValue?: string;
  onHeaderChange?: (html: string) => void;
  /** Footer counterpart to `headerValue`/`defaultHeaderValue`/`onHeaderChange`. */
  footerValue?: string;
  defaultFooterValue?: string;
  onFooterChange?: (html: string) => void;
  /**
   * `false` renders each page's body as static HTML (`RichTextEditor` never
   * mounts) — for a read-only view or a canvas block with its editor hidden.
   * Auto-pagination runs either way: content that doesn't fit is content the
   * reader can't see, and that is as true of a document nobody can type into
   * as of one they can.
   */
  editable?: boolean;
  /** Accessible label for a page. Defaults to `'Page N'`. */
  pageLabel?: (index: number) => string;

  /** Standalone viewer only — ignored while `chrome` is `false`. */
  view?: DocumentView;
  defaultView?: DocumentView;
  onViewChange?: (view: DocumentView) => void;

  /**
   * Standalone viewer only (`chrome` true). Shows/hides the table-of-
   * contents panel to the left of the page(s) — headings (`h1`–`h6`) found
   * anywhere across `pages`, jumping to a heading's page on click. Defaults
   * to `true`; hidden automatically when no page has a heading at all, so
   * an empty panel never takes up space. The toggle icon in the toolbar
   * still renders whenever there's something to show/hide.
   */
  tocOpen?: boolean;
  defaultTocOpen?: boolean;
  onTocOpenChange?: (open: boolean) => void;

  /**
   * `true` (default) renders the standalone viewer chrome — the list/grid
   * toggle, zoom controls, and the scrollable/zoomable viewport wrapping the
   * pages. Set `false` when embedding inside a host that already owns
   * pan/zoom (a `Canvas` block, most currently): only the active page
   * renders, plain, and arrow-key page navigation still works.
   */
  chrome?: boolean;

  activePageIndex?: number;
  defaultActivePageIndex?: number;
  onActivePageIndexChange?: (index: number) => void;

  'aria-label'?: string;
  className?: string;
}

export type DocumentProps = DocumentOwnProps;

function ListViewIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="10" height="2.5" rx="0.5" fill="currentColor" />
      <rect x="2" y="6" width="10" height="2.5" rx="0.5" fill="currentColor" />
      <rect x="2" y="10" width="10" height="2.5" rx="0.5" fill="currentColor" />
    </svg>
  );
}

function ZoomOutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="2" y="6" width="10" height="2" rx="1" fill="currentColor" />
    </svg>
  );
}

function ZoomInIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="2" y="6" width="10" height="2" rx="1" fill="currentColor" />
      <rect x="6" y="2" width="2" height="10" rx="1" fill="currentColor" />
    </svg>
  );
}

function GridViewIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="1.5" y="1.5" width="4.5" height="4.5" rx="0.5" fill="currentColor" />
      <rect x="8" y="1.5" width="4.5" height="4.5" rx="0.5" fill="currentColor" />
      <rect x="1.5" y="8" width="4.5" height="4.5" rx="0.5" fill="currentColor" />
      <rect x="8" y="8" width="4.5" height="4.5" rx="0.5" fill="currentColor" />
    </svg>
  );
}

function TocIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="1" y="2" width="2" height="2" rx="0.5" fill="currentColor" />
      <rect x="1" y="6" width="2" height="2" rx="0.5" fill="currentColor" />
      <rect x="1" y="10" width="2" height="2" rx="0.5" fill="currentColor" />
      <path d="M5 3h8M5 7h8M5 11h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

/**
 * A simple multi-page note/resume editor — not a document engine. Each page
 * is a fixed-aspect-ratio `DocumentPage`; `RichTextEditor` owns each page's
 * body while `editable`.
 *
 * When a page's content outgrows its fixed box, the top-level blocks that
 * don't fit are moved onto the following page — appending one if there isn't
 * one — and, if the break happened under the caret, focus follows them. This
 * runs on any change to `pages`, not just typing: content written
 * programmatically (a `pages` prop, an AI writing a long body in one shot)
 * paginates the same way a person's typing does. Two deliberate limits:
 * pagination only ever flows *forward*, never pulling content back onto a
 * page that has room again, and it splits between blocks, never inside one —
 * so a single block taller than a whole page stays put and clips, since it
 * has nowhere to go.
 *
 * Works two ways, matching how it's meant to be embedded:
 * - Standalone (`chrome` true, the default): list/grid view, zoom, and
 *   arrow-key page-to-page navigation, all in a self-contained scrollable
 *   viewport.
 * - Inside a host that owns its own viewport — a `Canvas` block, currently
 *   the only one — with `chrome={false}`: no view toggle, no zoom wrapper,
 *   just the active page plus the same arrow-key navigation and
 *   auto-pagination.
 *
 * Arrow keys only navigate pages when focus isn't inside a page's own text
 * surface — otherwise Left/Right would fight the caret instead of moving it.
 */
export function Document({
  pages: pagesProp,
  defaultPages,
  onPagesChange,
  aspectRatio = 'a4',
  layout = 'single',
  name,
  onNameChange,
  header,
  footer,
  headerValue: headerValueProp,
  defaultHeaderValue,
  onHeaderChange,
  footerValue: footerValueProp,
  defaultFooterValue,
  onFooterChange,
  editable = false,
  pageLabel = (index) => `Page ${index + 1}`,
  view: viewProp,
  defaultView,
  onViewChange,
  tocOpen: tocOpenProp,
  defaultTocOpen,
  onTocOpenChange,
  chrome = true,
  activePageIndex: activePageIndexProp,
  defaultActivePageIndex,
  onActivePageIndexChange,
  'aria-label': ariaLabel = 'Document',
  className,
}: DocumentProps) {
  const [pages, setPages] = useControllableState<string[]>({
    value: pagesProp,
    defaultValue: defaultPages ?? [''],
    onChange: onPagesChange,
  });
  // A header/footer only becomes an editable surface when the caller opted
  // in via one of these three props — otherwise `header`/`footer` stays the
  // plain static `ReactNode` slot it always was (`Document.stories.tsx`'s
  // `Standalone`/`SidebarLayout`/`NoChrome` pass arbitrary JSX there, which
  // has no HTML string to seed a `contentEditable` surface with).
  const headerEditable =
    headerValueProp !== undefined || defaultHeaderValue !== undefined || !!onHeaderChange;
  const footerEditable =
    footerValueProp !== undefined || defaultFooterValue !== undefined || !!onFooterChange;
  const [headerHtml, setHeaderHtml] = useControllableState<string>({
    value: headerValueProp,
    defaultValue: defaultHeaderValue ?? '',
    onChange: onHeaderChange,
  });
  const [footerHtml, setFooterHtml] = useControllableState<string>({
    value: footerValueProp,
    defaultValue: defaultFooterValue ?? '',
    onChange: onFooterChange,
  });
  const [view, setView] = useControllableState<DocumentView>({
    value: viewProp,
    defaultValue: defaultView ?? 'list',
    onChange: onViewChange,
  });
  const [activeIndex, setActiveIndex] = useControllableState<number>({
    value: activePageIndexProp,
    defaultValue: defaultActivePageIndex ?? 0,
    onChange: onActivePageIndexChange,
  });
  const [tocOpen, setTocOpen] = useControllableState<boolean>({
    value: tocOpenProp,
    defaultValue: defaultTocOpen ?? true,
    onChange: onTocOpenChange,
  });
  const [zoom, setZoom] = useState(1);

  // Editing the name tag is local, transient UI state — `name` itself stays
  // the consumer's own value, only ever changed through `onNameChange`, the
  // same "opt-in via a supplied callback" shape the rest of `Document`'s
  // editable surfaces use.
  const [nameEditing, setNameEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (nameEditing) nameInputRef.current?.focus();
  }, [nameEditing]);

  function startEditingName() {
    if (!onNameChange) return;
    setNameDraft(name ?? '');
    setNameEditing(true);
  }

  function commitName() {
    onNameChange?.(nameDraft.trim());
    setNameEditing(false);
  }

  // Headings anywhere across `pages` — recomputed only when the HTML
  // actually changes, not on every render (typing elsewhere on the page
  // shouldn't re-parse every page's markup). Jumping to an entry only ever
  // needs its page, not a scroll offset within it: a page's body is a fixed,
  // clipped box (see `reflowOverflow` below) that doesn't scroll internally —
  // content past its bottom flows onto the next page instead.
  const tocEntries = useMemo(() => {
    const entries: { level: number; text: string; pageIndex: number }[] = [];
    pages.forEach((html, pageIndex) => {
      const parsed = new DOMParser().parseFromString(html, 'text/html');
      parsed.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((heading) => {
        const text = heading.textContent?.trim();
        if (text) entries.push({ level: Number(heading.tagName[1]), text, pageIndex });
      });
    });
    return entries;
  }, [pages]);

  const bodyRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // The formatting toolbar is shared across a page's header/body/footer —
  // three separate `contentEditable` surfaces — rather than each owning its
  // own (`RichTextEditor` renders `showToolbar={false}` for all three
  // below). It always acts on whichever surface was last focused: the same
  // "save the Range on blur, restore it immediately before the command"
  // technique `RichTextEditor`'s own link popover already uses, generalized
  // from one surface to three.
  const lastFocusedEditableRef = useRef<HTMLElement | null>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const [activeFormats, setActiveFormats] = useState<DocumentFormatState>(emptyFormatState);
  const [blockStyle, setBlockStyle] = useState<BlockStyleValue>('body');
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const linkInputRef = useRef<HTMLInputElement>(null);
  const formatToolbarRef = useRef<HTMLDivElement>(null);
  const [formatToolbarActiveIndex, setFormatToolbarActiveIndex] = useState(0);

  useEffect(() => {
    if (linkOpen) {
      setLinkUrl('');
      linkInputRef.current?.focus();
    }
  }, [linkOpen]);

  function findCurrentBlock(root: HTMLElement): HTMLElement | null {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    let node: Node | null = selection.getRangeAt(0).startContainer;
    while (node && node.nodeType !== 1) node = node.parentNode;
    const el = node as HTMLElement | null;
    if (!el || !root.contains(el)) return null;
    return el.closest('h1, h2, h3, h4, h5, h6, blockquote, p, div');
  }

  function detectBlockStyle(root: HTMLElement): BlockStyleValue {
    const block = findCurrentBlock(root);
    if (!block) return 'body';
    const tag = block.tagName.toLowerCase();
    if (/^h[1-6]$/.test(tag)) return tag as BlockStyleValue;
    if (tag === 'blockquote') return 'quote';
    if (block.classList.contains(styles.caption ?? '')) return 'caption';
    if (block.classList.contains(styles.note ?? '')) return 'note';
    return 'body';
  }

  function refreshFormatToolbar() {
    const target = lastFocusedEditableRef.current;
    if (!target) return;
    if (typeof document.queryCommandState === 'function') {
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        insertUnorderedList: document.queryCommandState('insertUnorderedList'),
        insertOrderedList: document.queryCommandState('insertOrderedList'),
      });
    }
    setBlockStyle(detectBlockStyle(target));
  }

  // The `contenteditable` attribute, not `.isContentEditable` — jsdom
  // doesn't implement that property (always `undefined`), and the attribute
  // is exactly what `RichTextEditor` sets on its own editable surface anyway.
  function isEditableSurface(el: HTMLElement): boolean {
    return el.getAttribute('contenteditable') === 'true';
  }

  function handleEditableSurfaceFocus(event: FocusEvent<HTMLDivElement>) {
    const target = event.target;
    if (!isEditableSurface(target)) return;
    lastFocusedEditableRef.current = target;
    refreshFormatToolbar();
  }

  function handleEditableSurfaceBlur(event: FocusEvent<HTMLDivElement>) {
    const target = event.target;
    if (!isEditableSurface(target)) return;
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && target.contains(selection.anchorNode)) {
      savedRangeRef.current = selection.getRangeAt(0).cloneRange();
    }
  }

  /** Bubbles from any of the three surfaces — refreshes the toolbar's pressed/style state as the caret moves, without needing to steal focus. */
  function handleEditableSurfaceSelect(event: SyntheticEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    if (!isEditableSurface(target)) return;
    refreshFormatToolbar();
  }

  /** Re-focuses whichever surface the toolbar is currently acting on and restores its saved selection — `document.execCommand` only ever affects the live selection, and clicking a toolbar control already moved focus (and collapsed the selection) away from it. */
  function focusAndRestoreSelection(): HTMLElement | null {
    const target = lastFocusedEditableRef.current;
    if (!target) return null;
    target.focus();
    const selection = window.getSelection();
    if (selection && savedRangeRef.current) {
      selection.removeAllRanges();
      selection.addRange(savedRangeRef.current);
    }
    return target;
  }

  function execFormat(command: string) {
    if (!focusAndRestoreSelection()) return;
    document.execCommand(command);
    refreshFormatToolbar();
  }

  function applyBlockStyle(next: string) {
    const target = focusAndRestoreSelection();
    if (!target) return;
    const style = next as BlockStyleValue;
    document.execCommand('formatBlock', false, `<${BLOCK_STYLE_TAGS[style]}>`);
    const block = findCurrentBlock(target);
    if (block) {
      block.classList.remove(styles.caption ?? '', styles.note ?? '');
      if (style === 'caption') block.classList.add(styles.caption ?? '');
      if (style === 'note') block.classList.add(styles.note ?? '');
    }
    refreshFormatToolbar();
  }

  function applyLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const url = linkUrl.trim();
    if (!url) return;
    if (!focusAndRestoreSelection()) return;
    document.execCommand('createLink', false, url);
    refreshFormatToolbar();
    setLinkOpen(false);
  }

  const handleFormatToolbarKeyDown = useRovingFocus({
    itemSelector: '[data-doc-format-action]',
    orientation: 'horizontal',
  });

  function handleFormatToolbarFocus(event: FocusEvent<HTMLDivElement>) {
    const items = Array.from(
      formatToolbarRef.current?.querySelectorAll<HTMLElement>('[data-doc-format-action]') ?? [],
    );
    const index = items.indexOf(event.target);
    if (index !== -1) setFormatToolbarActiveIndex(index);
  }

  let formatToolbarItemIndex = -1;
  function nextFormatToolbarTabIndex() {
    formatToolbarItemIndex += 1;
    return formatToolbarItemIndex === formatToolbarActiveIndex ? 0 : -1;
  }

  // `useControllableState`'s setter takes a value, not an updater function —
  // so the overflow check (deferred to the next animation frame) needs a way
  // to read `pages` as of *that* frame rather than the stale value closed
  // over when the keystroke's event handler ran. Synced every render, read
  // through inside anything deferred, the same pattern `useCanvasCommands`
  // uses for its own async flows.
  const pagesRef = useRef(pages);
  pagesRef.current = pages;

  function applyZoom(next: number) {
    setZoom(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next)));
  }

  const zoomPercent = Math.round(zoom * 100);

  /**
   * The page a keystroke last landed in, consumed by the very next reflow
   * pass and cleared there. Only a split on the page being typed into should
   * move focus — see `reflowOverflow`.
   */
  const typingPageRef = useRef<number | undefined>(undefined);

  /**
   * The element holding a page body's top-level blocks — the `RichTextEditor`
   * surface while `editable`, the static HTML div otherwise. Selected by
   * stable attributes rather than a CSS-module class, which is hashed at
   * build time and empty in some test environments.
   */
  function contentRootOf(body: HTMLElement): HTMLElement | null {
    return body.querySelector<HTMLElement>('[contenteditable="true"], [data-document-body]');
  }

  /** The y-coordinate below which a page body clips, in the same viewport space `getBoundingClientRect` reports. */
  function clipLimitOf(body: HTMLElement): number {
    const rect = body.getBoundingClientRect();
    const computed = window.getComputedStyle?.(body);
    // jsdom returns `''` for both, and a zero rect for everything — which
    // makes the whole check a no-op there rather than something needing a
    // guard. The split arithmetic itself is unit-tested separately, pure.
    const paddingBottom = Number.parseFloat(computed?.paddingBottom ?? '') || 0;
    const borderBottom = Number.parseFloat(computed?.borderBottomWidth ?? '') || 0;
    return rect.bottom - paddingBottom - borderBottom;
  }

  /**
   * Flows whatever doesn't fit a page onto the following one, appending that
   * page when it doesn't exist yet.
   *
   * Two things this deliberately does that the original overflow check did
   * not. It runs from an effect on `pages`, so content arriving from *any*
   * source paginates — a `pages` prop, a host's `onPagesChange`, an AI writing
   * a long body in one shot — not only a keystroke, which was the single
   * caller before. And it moves the overflowing blocks rather than appending
   * an empty page beside them, which left the overflow clipped and invisible
   * inside the page above with no scrollbar to reveal it.
   *
   * One page per pass: the effect re-runs on the resulting `pages` and picks
   * the content up wherever it landed. Content only ever moves forward, and
   * `paginationSplitIndex` never moves a page's first block, so this
   * terminates rather than shuffling a too-tall block along forever.
   */
  function reflowOverflow() {
    const current = pagesRef.current;
    for (let index = 0; index < current.length; index += 1) {
      // Absent whenever the page isn't mounted — `chrome={false}` renders
      // only the active page. Its turn comes when it is.
      const body = bodyRefs.current.get(index);
      const content = body ? contentRootOf(body) : null;
      if (!body || !content) continue;

      const blocks = Array.from(content.children) as HTMLElement[];
      const split = paginationSplitIndex(
        blocks.map((block) => block.getBoundingClientRect().bottom),
        clipLimitOf(body),
      );
      if (split === -1) continue;

      const next = [...current];
      next[index] = blocks
        .slice(0, split)
        .map((block) => block.outerHTML)
        .join('');
      const moved = blocks
        .slice(split)
        .map((block) => block.outerHTML)
        .join('');
      if (index + 1 < next.length) next[index + 1] = moved + (next[index + 1] ?? '');
      else next.push(moved);

      setPages(next);
      // Only a split on the page being typed into carries the caret across
      // with the content. A split caused by a `pages` prop update must not
      // move anyone's focus.
      if (typingPageRef.current === index) carryCaretForward(index + 1);
      return;
    }
  }

  /**
   * Puts the caret back at the end of the content that just moved, on its new
   * page — where the person was typing when the break happened. Deferred a
   * macrotask so the moved HTML is in the DOM to place a `Range` in;
   * `setTimeout` rather than `requestAnimationFrame` because rAF never fires
   * at all in a backgrounded/unpainted tab (confirmed live — a real failure
   * mode for an app switched away from mid-paste), while a macrotask still
   * runs regardless of paint state.
   */
  function carryCaretForward(index: number) {
    setActiveIndex(index);
    setTimeout(() => {
      const body = bodyRefs.current.get(index);
      const content = body ? contentRootOf(body) : null;
      const first = content?.firstElementChild;
      if (!content || !first) return;
      content.focus?.();
      const selection = window.getSelection?.();
      if (!selection || typeof document.createRange !== 'function') return;
      const range = document.createRange();
      range.selectNodeContents(first);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }, 0);
  }

  // A ref, not the function itself, so the effect's dependency list can name
  // what actually changes the answer (content and page geometry) rather than
  // a closure identity that changes every render — which would re-measure
  // every page on every keystroke. Same synced-every-render pattern as
  // `pagesRef` above.
  const reflowRef = useRef(reflowOverflow);
  reflowRef.current = reflowOverflow;

  // An inline `{width, height}` aspect ratio is a fresh object every render;
  // its *value* is what changes what fits on a page.
  const aspectRatioKey =
    typeof aspectRatio === 'string' ? aspectRatio : `${aspectRatio.width}x${aspectRatio.height}`;

  useEffect(() => {
    reflowRef.current();
    // Cleared whether or not this pass split anything: the flag only ever
    // describes the change that triggered this very run, and a stale one
    // would let a later `pages` prop update steal the caret.
    typingPageRef.current = undefined;
  }, [pages, aspectRatioKey, layout, view, chrome, editable, activeIndex]);

  function handlePageChange(index: number, html: string) {
    typingPageRef.current = index;
    setPages(pagesRef.current.map((page, i) => (i === index ? html : page)));
  }

  function goToPage(index: number) {
    const clamped = Math.min(pages.length - 1, Math.max(0, index));
    // A press at either boundary (already on the first/last page) is a
    // no-op, not a change to announce — `useControllableState`'s setter
    // always calls `onChange`, so without this guard a consumer listening
    // for page changes would be told "you're on page 1" on every repeated
    // ArrowLeft at the start.
    if (clamped === activeIndex) return;
    setActiveIndex(clamped);
    // jsdom doesn't implement `scrollIntoView` — feature-detected like every
    // other real-browser-only DOM API in this library.
    pageRefs.current.get(clamped)?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    // A press aimed at a page's own text surface belongs to it — otherwise
    // the caret could never reach the start/end of a line with the arrow
    // keys, because the container would intercept them for page navigation
    // first.
    const target = event.target as HTMLElement;
    if (target.closest('[contenteditable="true"]')) return;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      goToPage(activeIndex + 1);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      goToPage(activeIndex - 1);
    }
  }

  function renderPage(html: string, index: number) {
    return (
      <DocumentPage
        key={index}
        ref={(node) => {
          if (node) pageRefs.current.set(index, node);
          else pageRefs.current.delete(index);
        }}
        aspectRatio={aspectRatio}
        className={styles.page}
        role="region"
        aria-label={pageLabel(index)}
        data-active={index === activeIndex || undefined}
      >
        {(headerEditable || header) && (
          <DocumentPage.Header>
            {editable && headerEditable ? (
              <RichTextEditor
                value={headerHtml}
                onChange={setHeaderHtml}
                aria-label={`${pageLabel(index)} header`}
                variant="plain"
                showToolbar={false}
                minHeight="1.5em"
                onFocus={() => setActiveIndex(index)}
              />
            ) : (
              header
            )}
          </DocumentPage.Header>
        )}
        <DocumentPage.Body
          layout={layout}
          ref={(node) => {
            if (node) bodyRefs.current.set(index, node);
            else bodyRefs.current.delete(index);
          }}
        >
          {editable ? (
            <RichTextEditor
              value={html}
              onChange={(next) => handlePageChange(index, next)}
              aria-label={`${pageLabel(index)} text`}
              variant="plain"
              showToolbar={false}
              className={styles.editor}
              onFocus={() => setActiveIndex(index)}
            />
          ) : (
            // Same trust model as `CanvasBlock`'s `text` kind: HTML the
            // consumer already owns, not third-party markup. Marked so
            // `contentRootOf` can find it without a hashed CSS-module class.
            <div
              className={styles.staticBody}
              data-document-body=""
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}
        </DocumentPage.Body>
        {(footerEditable || footer) && (
          <DocumentPage.Footer>
            {editable && footerEditable ? (
              <RichTextEditor
                value={footerHtml}
                onChange={setFooterHtml}
                aria-label={`${pageLabel(index)} footer`}
                variant="plain"
                showToolbar={false}
                minHeight="1.5em"
                onFocus={() => setActiveIndex(index)}
              />
            ) : (
              footer
            )}
          </DocumentPage.Footer>
        )}
      </DocumentPage>
    );
  }

  function renderNameTag() {
    if (nameEditing) {
      return (
        <input
          ref={nameInputRef}
          type="text"
          className={styles.nameTagInput}
          value={nameDraft}
          aria-label="Document name"
          onChange={(event) => setNameDraft(event.target.value)}
          onBlur={commitName}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              commitName();
            } else if (event.key === 'Escape') {
              // Discards the draft — the blur this triggers must not also
              // commit it, so this bypasses `commitName` entirely.
              event.preventDefault();
              setNameEditing(false);
            }
            event.stopPropagation();
          }}
        />
      );
    }
    return (
      <div
        className={styles.nameTag}
        {...(onNameChange ? { onDoubleClick: startEditingName } : {})}
      >
        {name}
      </div>
    );
  }

  const hasNameTag = !!name || nameEditing;

  /**
   * `name` is the document's own identity (a file name), not in-page content
   * — rendered as a small tab-style label above the page's top-left corner,
   * separate from `header`/`headerValue` (which prints/exports with the
   * page). Shown once, above whichever page is currently visible: the only
   * page in `chrome={false}` embedding, or page 1 in the standalone list
   * viewer — a name tag on every page in a long document would just repeat.
   * Double-clicking it swaps it for a text input when `onNameChange` is
   * supplied.
   *
   * Grid view does **not** go through here — see `.gridNameRow`.
   */
  function renderPageWithName(html: string, index: number, isNamedPage: boolean) {
    const page = renderPage(html, index);
    if (!hasNameTag || !isNamedPage) return page;
    return (
      <div key={`named-${index}`} className={styles.namedPage}>
        {renderNameTag()}
        {page}
      </div>
    );
  }

  function renderFormatToolbar() {
    formatToolbarItemIndex = -1;
    return (
      <div className={styles.formatToolbar}>
        <div className={styles.blockStyleWrap}>
          <Select
            options={BLOCK_STYLE_OPTIONS}
            value={blockStyle}
            onChange={applyBlockStyle}
            size="sm"
            aria-label="Paragraph style"
          />
        </div>
        <div
          ref={formatToolbarRef}
          role="toolbar"
          aria-label="Text formatting"
          className={styles.formatToolbarActions}
          onKeyDown={handleFormatToolbarKeyDown}
          onFocus={handleFormatToolbarFocus}
        >
          <ToggleButton
            variant="ghost"
            size="sm"
            aria-label="Bold"
            data-doc-format-action=""
            tabIndex={nextFormatToolbarTabIndex()}
            pressed={activeFormats.bold}
            onPressedChange={() => execFormat('bold')}
            onMouseDown={(event) => event.preventDefault()}
          >
            <BoldIcon />
          </ToggleButton>
          <ToggleButton
            variant="ghost"
            size="sm"
            aria-label="Italic"
            data-doc-format-action=""
            tabIndex={nextFormatToolbarTabIndex()}
            pressed={activeFormats.italic}
            onPressedChange={() => execFormat('italic')}
            onMouseDown={(event) => event.preventDefault()}
          >
            <ItalicIcon />
          </ToggleButton>
          <ToggleButton
            variant="ghost"
            size="sm"
            aria-label="Underline"
            data-doc-format-action=""
            tabIndex={nextFormatToolbarTabIndex()}
            pressed={activeFormats.underline}
            onPressedChange={() => execFormat('underline')}
            onMouseDown={(event) => event.preventDefault()}
          >
            <UnderlineIcon />
          </ToggleButton>
          <ToggleButton
            variant="ghost"
            size="sm"
            aria-label="Bulleted list"
            data-doc-format-action=""
            tabIndex={nextFormatToolbarTabIndex()}
            pressed={activeFormats.insertUnorderedList}
            onPressedChange={() => execFormat('insertUnorderedList')}
            onMouseDown={(event) => event.preventDefault()}
          >
            <BulletedListIcon />
          </ToggleButton>
          <ToggleButton
            variant="ghost"
            size="sm"
            aria-label="Numbered list"
            data-doc-format-action=""
            tabIndex={nextFormatToolbarTabIndex()}
            pressed={activeFormats.insertOrderedList}
            onPressedChange={() => execFormat('insertOrderedList')}
            onMouseDown={(event) => event.preventDefault()}
          >
            <NumberedListIcon />
          </ToggleButton>
          <Popover open={linkOpen} onOpenChange={setLinkOpen}>
            <Popover.Trigger
              data-doc-format-action=""
              tabIndex={nextFormatToolbarTabIndex()}
              aria-label="Insert link"
              onMouseDown={(event) => event.preventDefault()}
            >
              <LinkIcon />
            </Popover.Trigger>
            <Popover.Content role="dialog" className={styles.linkPopover}>
              <form onSubmit={applyLink} className={styles.linkForm}>
                <input
                  ref={linkInputRef}
                  type="url"
                  className={inputStyles.input}
                  data-size="sm"
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(event) => setLinkUrl(event.target.value)}
                  aria-label="Link URL"
                />
                <Button type="submit" size="sm">
                  Apply
                </Button>
              </form>
            </Popover.Content>
          </Popover>
        </div>
      </div>
    );
  }

  if (!chrome) {
    return (
      <div className={mergeClasses(styles.bare, className)}>
        {editable && renderFormatToolbar()}
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
        <div
          className={styles.bareViewport}
          role="group"
          aria-label={ariaLabel}
          /* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onFocus={handleEditableSurfaceFocus}
          onBlur={handleEditableSurfaceBlur}
          onKeyUp={handleEditableSurfaceSelect}
          onMouseUp={handleEditableSurfaceSelect}
        >
          {renderPageWithName(pages[activeIndex] ?? '', activeIndex, true)}
        </div>
      </div>
    );
  }

  const hasToc = tocEntries.length > 0;

  return (
    <div className={mergeClasses(styles.root, className)}>
      {/* One chrome row: the formatting controls (only while `editable`) and
          the view/zoom controls, rather than a stacked bar each. Two rows of
          chrome above a page is most of what made an editable document read
          as a form with a preview under it. */}
      <div className={styles.toolbar}>
        {editable && renderFormatToolbar()}
        <div className={styles.viewControls}>
          <div className={styles.viewToggle} role="group" aria-label="Page view">
            {hasToc && (
              <IconButton
                aria-label="Toggle table of contents"
                size="sm"
                variant={tocOpen ? 'secondary' : 'ghost'}
                aria-pressed={tocOpen}
                onClick={() => setTocOpen(!tocOpen)}
              >
                <TocIcon />
              </IconButton>
            )}
            <IconButton
              aria-label="List view"
              size="sm"
              variant={view === 'list' ? 'secondary' : 'ghost'}
              aria-pressed={view === 'list'}
              onClick={() => setView('list')}
            >
              <ListViewIcon />
            </IconButton>
            <IconButton
              aria-label="Grid view"
              size="sm"
              variant={view === 'grid' ? 'secondary' : 'ghost'}
              aria-pressed={view === 'grid'}
              onClick={() => setView('grid')}
            >
              <GridViewIcon />
            </IconButton>
          </div>
          <div className={styles.zoomControls} role="group" aria-label="Zoom">
            <IconButton
              aria-label="Zoom out"
              size="sm"
              variant="ghost"
              disabled={zoom <= MIN_ZOOM}
              onClick={() => applyZoom(zoom / ZOOM_STEP)}
            >
              <ZoomOutIcon />
            </IconButton>
            {/* A readout *and* the reset control — a silent transform gives
                no way to tell 110% from 120%, and no way back to 100% short
                of stepping there by guess. */}
            <Button
              size="sm"
              variant="ghost"
              className={styles.zoomValue}
              aria-label={`Zoom ${zoomPercent}%, reset to 100%`}
              onClick={() => applyZoom(1)}
            >
              {zoomPercent}%
            </Button>
            <IconButton
              aria-label="Zoom in"
              size="sm"
              variant="ghost"
              disabled={zoom >= MAX_ZOOM}
              onClick={() => applyZoom(zoom * ZOOM_STEP)}
            >
              <ZoomInIcon />
            </IconButton>
          </div>
        </div>
      </div>

      <div className={styles.workspace}>
        {hasToc && tocOpen && (
          <nav className={styles.toc} aria-label="Table of contents">
            {tocEntries.map((entry, i) => (
              <button
                key={i}
                type="button"
                className={styles.tocEntry}
                data-active={entry.pageIndex === activeIndex || undefined}
                style={{ paddingInlineStart: `calc(var(--ds-space-sm) * ${entry.level})` }}
                onClick={() => goToPage(entry.pageIndex)}
              >
                {entry.text}
              </button>
            ))}
          </nav>
        )}

        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
        <div
          className={styles.viewport}
          role="group"
          aria-label={ariaLabel}
          /* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onWheel={(event) => {
            if (!event.ctrlKey && !event.metaKey) return;
            event.preventDefault();
            applyZoom(zoom * (event.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP));
          }}
        >
          {/* Purely a bubble target for the shared format toolbar's focus/
              blur/selection tracking — the interactive elements are the
              pages' own `contentEditable` surfaces nested inside, already
              covered by their own roles/tab stops. */}
          {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
          <div
            className={styles.world}
            data-view={view}
            /* A CSS variable, not `transform: scale()`. The stylesheet
               multiplies the sheet's width, print margin, and text size by
               it together, so zooming reflows real layout — the viewport
               scrolls to the whole page instead of clipping it, and
               auto-pagination keeps measuring in one coordinate space. See
               `Document.module.css`'s `.world` note. */
            style={{ '--doc-zoom': zoom } as CSSProperties}
            onFocus={handleEditableSurfaceFocus}
            onBlur={handleEditableSurfaceBlur}
            onKeyUp={handleEditableSurfaceSelect}
            onMouseUp={handleEditableSurfaceSelect}
          >
            {/* Grid lays the pages out as a wrapping row of equal-height
                cells, so attaching the name tag to page 1 — the list view's
                arrangement, where the tag reads as a label on the column
                below it — makes page 1's cell taller than every other and
                knocks the whole row off its baseline. In grid the tag is one
                full-width row of its own above the pages: still one tag for
                the document, now belonging to all of them rather than to the
                first. */}
            {view === 'grid' && hasNameTag && (
              <div className={styles.gridNameRow}>{renderNameTag()}</div>
            )}
            {pages.map((html, index) =>
              view === 'grid'
                ? renderPage(html, index)
                : renderPageWithName(html, index, index === 0),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

Document.displayName = 'Document';
