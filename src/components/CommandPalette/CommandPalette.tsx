import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { Dialog } from '../Dialog/Dialog';
import { useControllableState } from '../../hooks/useControllableState';
import { mergeClasses } from '../../utilities/mergeClasses';
import comboboxStyles from '../Combobox/Combobox.module.css';
import styles from './CommandPalette.module.css';

export interface CommandPaletteItem {
  id: string;
  label: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  /** Shown right-aligned, e.g. `"⌘P"` — purely decorative, not itself focusable/matched. */
  shortcut?: ReactNode;
  /** Extra terms matched against the query, beyond `label` (only matched when `label` is a plain string — see `filterItems`). */
  keywords?: string[];
  disabled?: boolean;
  onSelect: () => void;
}

export interface CommandPaletteGroup {
  id: string;
  heading?: ReactNode;
  items: CommandPaletteItem[];
}

export interface CommandPaletteAISearchOptions {
  /**
   * Resolves the current query into real, executable items. Runs entirely
   * outside this component's own AI plumbing — turning freeform AI text
   * into safely-executable actions is app-specific, so `CommandPalette`
   * never calls `AIClient`/`useAIAction` itself; the consumer's own
   * `onQuery` may do that internally (or drive an LLM function-calling
   * flow), and just needs to resolve to `CommandPaletteItem[]`.
   */
  onQuery: (query: string) => Promise<CommandPaletteItem[]>;
  /** Only calls `onQuery` once local filtering yields zero matches. Defaults to `true`. */
  onlyWhenNoMatches?: boolean;
  /** Debounce before calling `onQuery`, in ms. Defaults to `300`. */
  debounceMs?: number;
  /** Shown in place of results while `onQuery` is in flight. Defaults to `'Thinking…'`. */
  loadingLabel?: ReactNode;
  /** Heading for the synthesized group holding `onQuery`'s results. Defaults to `'Suggested'`. */
  groupHeading?: ReactNode;
}

export interface CommandPaletteProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Flat items — wrapped in a single unheaded group internally. Ignored if `groups` is passed. */
  items?: CommandPaletteItem[];
  groups?: CommandPaletteGroup[];
  placeholder?: string;
  /** Shown when no item matches the current query. Defaults to `'No results'`. */
  emptyLabel?: ReactNode;
  /** Filters each group's items against the current query. Defaults to a case-insensitive substring match on `label` (only when it's a plain string) plus `keywords`. */
  filterItems?: (items: CommandPaletteItem[], query: string) => CommandPaletteItem[];
  /** Registers a document-level Cmd/Ctrl+K listener that toggles `open`. Defaults to `true`. */
  hotkey?: boolean;
  /** Defaults to `'Command palette'`. */
  'aria-label'?: string;
  /** Adds a debounced, AI-resolved group of suggested commands. Off by default; a no-op when omitted. */
  aiSearch?: CommandPaletteAISearchOptions;
}

function defaultFilterItems(items: CommandPaletteItem[], query: string): CommandPaletteItem[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return items;
  return items.filter((item) => {
    const label = typeof item.label === 'string' ? item.label.toLowerCase() : '';
    const keywords = (item.keywords ?? []).join(' ').toLowerCase();
    return label.includes(normalized) || keywords.includes(normalized);
  });
}

/**
 * A global action launcher: `Dialog` (Portal/focus-trap/Escape/backdrop/
 * scroll-lock, reused directly — composition, not reimplementation) housing
 * a search input + filtered command list. Reuses the *interaction model*
 * `Combobox` established (`role="combobox"` input driving a
 * `role="listbox"`/`role="option"` panel via `aria-activedescendant` +
 * an `activeIndex`, arrow keys to move, Enter to commit) rather than its
 * JSX — `Combobox` is built around `Popover`-anchored single-value field
 * selection, materially different from an always-modal, run-an-action-then-
 * close launcher, the same "reuse the pattern, not the component" call
 * `Tooltip` made for `Popover` in Phase 6. `.listbox`/`.option`/
 * `.noResults` are reused directly from `Combobox.module.css` though (self-
 * contained rules — verified per docs/SPEC.md's CSS reuse note) since the
 * option-row visuals genuinely are the same thing.
 *
 * `hotkey` (default `true`) wires a document-level Cmd/Ctrl+K listener that
 * toggles `open` — re-subscribed on every `open` change (via the effect's
 * dependency array) rather than read through a ref, so the toggle always
 * sees the current value without risking the stale-closure class of bug
 * documented for `OTPInput`/`Drawer` in Phases 12-13.
 *
 * Selecting an item (click, or Enter on the active one) calls that item's
 * own `onSelect` and closes the palette — there is no "value" this
 * component holds afterward, unlike `Combobox`/`Select`; running the action
 * *is* the result.
 */
export function CommandPalette({
  open,
  defaultOpen = false,
  onOpenChange,
  items,
  groups,
  placeholder = 'Type a command or search…',
  emptyLabel = 'No results',
  filterItems = defaultFilterItems,
  hotkey = true,
  'aria-label': ariaLabel = 'Command palette',
  aiSearch,
}: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useControllableState<boolean>({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [aiItems, setAiItems] = useState<CommandPaletteItem[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const aiRequestIdRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const {
    onQuery: aiOnQuery,
    onlyWhenNoMatches: aiOnlyWhenNoMatches = true,
    debounceMs: aiDebounceMs = 300,
    loadingLabel: aiLoadingLabel = 'Thinking…',
    groupHeading: aiGroupHeading = 'Suggested',
  } = aiSearch ?? {};

  useEffect(() => {
    if (!hotkey) return;
    function handleGlobalKeyDown(event: globalThis.KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsOpen(!isOpen);
      }
    }
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [hotkey, isOpen, setIsOpen]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setAiItems([]);
      setIsLoadingAI(false);
      aiRequestIdRef.current += 1; // invalidate any in-flight onQuery
    }
  }, [isOpen]);

  const resolvedGroups = useMemo<CommandPaletteGroup[]>(
    () => groups ?? [{ id: '_default', items: items ?? [] }],
    [groups, items],
  );

  const localFilteredGroups = useMemo(
    () =>
      resolvedGroups
        .map((group) => ({ ...group, items: filterItems(group.items, query) }))
        .filter((group) => group.items.length > 0),
    [resolvedGroups, query, filterItems],
  );

  const showAIGroup =
    !!aiSearch && aiItems.length > 0 && (!aiOnlyWhenNoMatches || localFilteredGroups.length === 0);

  const filteredGroups = useMemo(() => {
    if (!showAIGroup) return localFilteredGroups;
    return [...localFilteredGroups, { id: '_ai', heading: aiGroupHeading, items: aiItems }];
  }, [localFilteredGroups, showAIGroup, aiGroupHeading, aiItems]);

  const flatItems = useMemo(() => filteredGroups.flatMap((group) => group.items), [filteredGroups]);

  useEffect(() => {
    if (!aiSearch || !aiOnQuery || !isOpen) return;
    if (aiOnlyWhenNoMatches && localFilteredGroups.length > 0) {
      setAiItems([]);
      setIsLoadingAI(false);
      return;
    }
    const trimmed = query.trim();
    if (!trimmed) {
      setAiItems([]);
      setIsLoadingAI(false);
      return;
    }

    const requestId = (aiRequestIdRef.current += 1);
    setIsLoadingAI(true);
    const timer = setTimeout(() => {
      aiOnQuery(trimmed)
        .then((resolvedItems) => {
          if (aiRequestIdRef.current !== requestId) return;
          setAiItems(resolvedItems);
          setIsLoadingAI(false);
        })
        .catch(() => {
          if (aiRequestIdRef.current !== requestId) return;
          setAiItems([]);
          setIsLoadingAI(false);
        });
    }, aiDebounceMs);

    return () => clearTimeout(timer);
  }, [
    aiSearch,
    isOpen,
    query,
    aiOnlyWhenNoMatches,
    localFilteredGroups.length,
    aiOnQuery,
    aiDebounceMs,
  ]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    const item = flatItems[activeIndex];
    if (!item) return;
    listboxRef.current
      ?.querySelector<HTMLElement>(`[data-command-id="${CSS.escape(item.id)}"]`)
      ?.scrollIntoView?.({ block: 'nearest' });
  }, [activeIndex, flatItems]);

  function commit(item: CommandPaletteItem) {
    if (item.disabled) return;
    setIsOpen(false);
    item.onSelect();
  }

  function moveActive(direction: 1 | -1) {
    if (flatItems.length === 0) return;
    setActiveIndex((current) => {
      let next = current;
      for (let i = 0; i < flatItems.length; i += 1) {
        next = (next + direction + flatItems.length) % flatItems.length;
        if (!flatItems[next]?.disabled) return next;
      }
      return current;
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        moveActive(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        moveActive(-1);
        break;
      case 'Enter': {
        event.preventDefault();
        const item = flatItems[activeIndex];
        if (item) commit(item);
        break;
      }
      default:
        break;
    }
  }

  const activeItem = flatItems[activeIndex];
  const activeDescendant = activeItem ? `${listboxId}-${activeItem.id}` : undefined;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={setIsOpen}
      aria-label={ariaLabel}
      showCloseButton={false}
      className={styles.panel}
    >
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded="true"
        aria-controls={listboxId}
        aria-activedescendant={activeDescendant}
        aria-label={ariaLabel}
        placeholder={placeholder}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={handleKeyDown}
        className={styles.input}
      />
      <div
        ref={listboxRef}
        id={listboxId}
        role="listbox"
        aria-label={ariaLabel}
        className={mergeClasses(comboboxStyles.listbox, styles.listbox)}
      >
        {flatItems.length === 0 ? (
          <div className={comboboxStyles.noResults}>
            {isLoadingAI ? aiLoadingLabel : emptyLabel}
          </div>
        ) : (
          filteredGroups.map((group) => {
            const headingId = group.heading ? `${listboxId}-${group.id}-heading` : undefined;
            return (
              <div key={group.id} className={styles.group} role="group" aria-labelledby={headingId}>
                {group.heading && (
                  <div id={headingId} className={styles.groupHeading}>
                    {group.heading}
                  </div>
                )}
                {group.items.map((item) => {
                  const index = flatItems.indexOf(item);
                  return (
                    // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- keyboard selection is handled by the input's own onKeyDown (Enter), the same shape Combobox's options use — this element never receives real DOM focus (see aria-activedescendant above)
                    <div
                      key={item.id}
                      id={`${listboxId}-${item.id}`}
                      data-command-id={item.id}
                      role="option"
                      tabIndex={-1}
                      aria-selected={index === activeIndex}
                      aria-disabled={item.disabled || undefined}
                      data-active={index === activeIndex || undefined}
                      className={mergeClasses(comboboxStyles.option, styles.option)}
                      onMouseDown={(event) => event.preventDefault()}
                      onMouseEnter={() => !item.disabled && setActiveIndex(index)}
                      onClick={() => commit(item)}
                    >
                      {item.icon && (
                        <span className={styles.icon} aria-hidden="true">
                          {item.icon}
                        </span>
                      )}
                      <span className={styles.itemText}>
                        <span className={styles.label}>{item.label}</span>
                        {item.description && (
                          <span className={styles.description}>{item.description}</span>
                        )}
                      </span>
                      {item.shortcut && (
                        <span className={styles.shortcut} aria-hidden="true">
                          {item.shortcut}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </Dialog>
  );
}

CommandPalette.displayName = 'CommandPalette';
