import { useId, useMemo, useRef, useState } from 'react';
import type { FocusEvent, KeyboardEvent, MouseEvent, ReactNode } from 'react';
import { useControllableState } from '../../hooks/useControllableState';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './TreeView.module.css';

export interface TreeViewNode {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  children?: TreeViewNode[];
  disabled?: boolean;
}

export interface TreeViewProps {
  nodes: TreeViewNode[];
  expandedIds?: string[];
  defaultExpandedIds?: string[];
  onExpandedChange?: (ids: string[]) => void;
  selectedId?: string;
  defaultSelectedId?: string;
  onSelectedChange?: (id: string | undefined) => void;
  'aria-label'?: string;
  className?: string;
}

interface FlatNode {
  id: string;
  parentId: string | undefined;
  hasChildren: boolean;
  disabled: boolean;
}

function flattenVisible(
  nodes: TreeViewNode[],
  expandedIds: string[],
  parentId: string | undefined,
): FlatNode[] {
  const result: FlatNode[] = [];
  for (const node of nodes) {
    const hasChildren = Boolean(node.children && node.children.length > 0);
    result.push({ id: node.id, parentId, hasChildren, disabled: Boolean(node.disabled) });
    if (hasChildren && expandedIds.includes(node.id)) {
      result.push(...flattenVisible(node.children ?? [], expandedIds, node.id));
    }
  }
  return result;
}

const ChevronIcon = (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
    <path
      d="M3 1.5L7 5L3 8.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * WAI-ARIA APG Tree View pattern: `role="tree"` (a `<ul>`) of `role=
 * "treeitem"` `<li>`s, each carrying `aria-level`/`aria-setsize`/
 * `aria-posinset` computed from its position in `nodes`, and (only when it
 * has children) `aria-expanded`. A nested `role="group"` `<ul>` sits
 * *inside* the parent `<li>` (not as its sibling) — the DOM shape the APG
 * example itself uses — and is only rendered while expanded.
 *
 * Data-driven (a recursive `nodes` prop) rather than children-composed:
 * hand-authoring `aria-level`/`aria-setsize`/`aria-posinset` correctly by
 * hand for arbitrarily deep JSX would be exactly the kind of easy-to-get-
 * subtly-wrong bookkeeping this component exists to not require of
 * consumers.
 *
 * Keyboard nav is roving-tabindex like `Tabs`/`Accordion`, but computed
 * over a flattened list of only the *currently visible* nodes (collapsed
 * subtrees excluded) so ArrowDown/ArrowUp/Home/End behave like moving
 * through what's actually on screen: ArrowRight expands a collapsed
 * branch, or moves into its first child if already expanded; ArrowLeft
 * collapses an expanded branch, or moves to its parent if already
 * collapsed (or a leaf). Disabled items stay in the navigable sequence
 * (so their existence isn't hidden from keyboard users) but refuse
 * selection/toggling — the same "disabled but still focusable" precedent
 * `DatePicker`'s out-of-range days established.
 *
 * Selecting a row (click, or Enter/Space on the focused item) and
 * expanding/collapsing a branch (click the twisty, or ArrowRight/Left) are
 * deliberately separate actions, not coupled — the common desktop file-
 * explorer convention, and it avoids an accidental expand/collapse every
 * time a row is selected.
 *
 * Each treeitem's accessible name comes from an explicit `aria-labelledby`
 * pointing at its own label `<span>`, not from the element's default
 * "name from content" — because the nested `role="group"` sits *inside*
 * the parent `<li>` (the APG DOM shape above), letting the name default to
 * content would fold every visible descendant's text into the parent's
 * name too (an expanded "Fruits" item would compute as "Fruits Apple
 * Banana"), caught by this component's own tests once a branch was
 * expanded and its now-wrong accessible name broke a later query.
 */
export function TreeView({
  nodes,
  expandedIds,
  defaultExpandedIds = [],
  onExpandedChange,
  selectedId,
  defaultSelectedId,
  onSelectedChange,
  'aria-label': ariaLabel = 'Tree',
  className,
}: TreeViewProps) {
  const [expanded, setExpanded] = useControllableState<string[]>({
    value: expandedIds,
    defaultValue: defaultExpandedIds,
    onChange: onExpandedChange,
  });
  const [selected, setSelected] = useControllableState<string | undefined>({
    value: selectedId,
    defaultValue: defaultSelectedId,
    onChange: onSelectedChange,
  });

  const flat = useMemo(() => flattenVisible(nodes, expanded, undefined), [nodes, expanded]);
  const [focusedId, setFocusedId] = useState<string | undefined>(() => flat[0]?.id);
  const containerRef = useRef<HTMLUListElement>(null);

  function focusItemById(id: string) {
    containerRef.current
      ?.querySelector<HTMLElement>(`[data-tree-item="${CSS.escape(id)}"]`)
      ?.focus();
  }

  function setNodeExpanded(id: string, expand: boolean) {
    const has = expanded.includes(id);
    if (expand && !has) setExpanded([...expanded, id]);
    else if (!expand && has) setExpanded(expanded.filter((x) => x !== id));
  }

  function handleFocus(event: FocusEvent<HTMLUListElement>) {
    const id = event.target.getAttribute('data-tree-item');
    if (id) setFocusedId(id);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    const currentId = (event.target as HTMLElement).getAttribute('data-tree-item');
    if (!currentId) return;
    const index = flat.findIndex((n) => n.id === currentId);
    if (index === -1) return;
    const current = flat[index];
    if (!current) return;

    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        const next = flat[index + 1];
        if (next) focusItemById(next.id);
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        const prev = flat[index - 1];
        if (prev) focusItemById(prev.id);
        break;
      }
      case 'Home': {
        event.preventDefault();
        const first = flat[0];
        if (first) focusItemById(first.id);
        break;
      }
      case 'End': {
        event.preventDefault();
        const last = flat[flat.length - 1];
        if (last) focusItemById(last.id);
        break;
      }
      case 'ArrowRight': {
        event.preventDefault();
        if (current.hasChildren && !expanded.includes(current.id)) {
          setNodeExpanded(current.id, true);
        } else if (current.hasChildren) {
          const firstChild = flat[index + 1];
          if (firstChild && firstChild.parentId === current.id) focusItemById(firstChild.id);
        }
        break;
      }
      case 'ArrowLeft': {
        event.preventDefault();
        if (current.hasChildren && expanded.includes(current.id)) {
          setNodeExpanded(current.id, false);
        } else if (current.parentId) {
          focusItemById(current.parentId);
        }
        break;
      }
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!current.disabled) setSelected(current.id);
        break;
      default:
        break;
    }
  }

  return (
    <ul
      ref={containerRef}
      role="tree"
      aria-label={ariaLabel}
      className={mergeClasses(styles.tree, className)}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
    >
      {nodes.map((node, index) => (
        <TreeViewItem
          key={node.id}
          node={node}
          level={1}
          setSize={nodes.length}
          posInSet={index + 1}
          expandedIds={expanded}
          selectedId={selected}
          focusedId={focusedId}
          onToggle={setNodeExpanded}
          onSelect={setSelected}
        />
      ))}
    </ul>
  );
}

TreeView.displayName = 'TreeView';

interface TreeViewItemProps {
  node: TreeViewNode;
  level: number;
  setSize: number;
  posInSet: number;
  expandedIds: string[];
  selectedId: string | undefined;
  focusedId: string | undefined;
  onToggle: (id: string, expand: boolean) => void;
  onSelect: (id: string) => void;
}

function TreeViewItem({
  node,
  level,
  setSize,
  posInSet,
  expandedIds,
  selectedId,
  focusedId,
  onToggle,
  onSelect,
}: TreeViewItemProps) {
  const hasChildren = Boolean(node.children && node.children.length > 0);
  const isExpanded = expandedIds.includes(node.id);
  const isSelected = selectedId === node.id;
  const isFocused = focusedId === node.id;
  const labelId = useId();

  function handleRowClick(event: MouseEvent) {
    event.stopPropagation();
    if (!node.disabled) onSelect(node.id);
  }

  function handleTwistyClick(event: MouseEvent) {
    event.stopPropagation();
    onToggle(node.id, !isExpanded);
  }

  return (
    <li
      role="treeitem"
      data-tree-item={node.id}
      aria-level={level}
      aria-setsize={setSize}
      aria-posinset={posInSet}
      aria-expanded={hasChildren ? isExpanded : undefined}
      aria-selected={isSelected}
      aria-disabled={node.disabled || undefined}
      aria-labelledby={labelId}
      tabIndex={isFocused ? 0 : -1}
      className={styles.item}
    >
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- Enter/Space (handled by the parent treeitem's onKeyDown, via the root tree's roving-tabindex handler) are the keyboard-accessible equivalent of clicking this row, same pattern as DatePicker's day cells */}
      <div
        className={styles.row}
        data-selected={isSelected || undefined}
        data-disabled={node.disabled || undefined}
        onClick={handleRowClick}
      >
        {hasChildren ? (
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            className={styles.twisty}
            data-expanded={isExpanded || undefined}
            onClick={handleTwistyClick}
          >
            {ChevronIcon}
          </button>
        ) : (
          <span className={styles.twistySpacer} aria-hidden="true" />
        )}
        {node.icon && (
          <span className={styles.icon} aria-hidden="true">
            {node.icon}
          </span>
        )}
        <span id={labelId} className={styles.label}>
          {node.label}
        </span>
      </div>
      {hasChildren && isExpanded && (
        <ul role="group" className={styles.group}>
          {(node.children ?? []).map((child, index) => (
            <TreeViewItem
              key={child.id}
              node={child}
              level={level + 1}
              setSize={node.children?.length ?? 0}
              posInSet={index + 1}
              expandedIds={expandedIds}
              selectedId={selectedId}
              focusedId={focusedId}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
