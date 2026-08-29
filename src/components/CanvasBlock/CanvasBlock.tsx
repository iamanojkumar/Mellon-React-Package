import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef, PointerEvent, ReactNode } from 'react';
import { StickyNote } from '../StickyNote/StickyNote';
import { CanvasShape } from '../CanvasShape/CanvasShape';
import { Node } from '../Node/Node';
import { CanvasEmbed } from '../CanvasEmbed/CanvasEmbed';
import { CanvasFrame } from '../CanvasFrame/CanvasFrame';
import { Image } from '../Image/Image';
import { Divider } from '../Divider/Divider';
import { Code } from '../Code/Code';
import { Table } from '../Table/Table';
import { Link } from '../Link/Link';
import { ChartSurface } from '../ChartSurface/ChartSurface';
import { CanvasChecklist } from '../CanvasChecklist/CanvasChecklist';
import { CanvasFillPicker } from '../CanvasFillPicker/CanvasFillPicker';
import { AISuggestionPopover } from '../AISuggestionPopover/AISuggestionPopover';
import { Document } from '../Document/Document';
import { useAI } from '../../hooks/useAI';
import { useAIAction } from '../../hooks/useAIAction';
import { mergeClasses } from '../../utilities/mergeClasses';
import { canvasBlockLabel } from '../../utilities/canvasReducer';
import type { CanvasBlockData } from '../../utilities/canvasReducer';
import styles from './CanvasBlock.module.css';
// The port dots are lifted straight from `Node`'s own stylesheet rather than
// restyled here, so a sticky note's port and a node's port cannot drift apart.
import nodeStyles from '../Node/Node.module.css';

function defaultBuildShapeAIPrompt(text: string): string {
  return `Rewrite this flowchart shape's label to be clearer and more concise, keeping its meaning. Reply with the rewritten label only, no punctuation beyond what the label itself needs.\n\n${text || '(no label yet — write a short one that fits a flowchart shape)'}`;
}

/** The eight handles around a selected block. */
export const RESIZE_HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const;
export type CanvasResizeHandle = (typeof RESIZE_HANDLES)[number];

/** The kinds that read as diagram nodes rather than as sized boxes. */
export const NODE_LIKE_BLOCK_KINDS = ['node', 'sticky', 'shape'] as const;

/**
 * Whether a kind is a diagram node — `node`, `sticky` and `shape`.
 *
 * Two consequences hang together on this predicate: such a block is
 * **connectable** (it draws `Node`'s input/output ports and can be wired to
 * any other block), and selecting it draws a **rounded highlight** rather than
 * the rectangular frame the sized kinds carry.
 *
 * It used to carry a third — "not resizable" — which was wrong for two of the
 * three kinds and shipped as a regression. See `isFixedSizeBlockKind`.
 */
export function isNodeLikeBlockKind(kind: CanvasBlockData['kind']): boolean {
  return kind === 'node' || kind === 'sticky' || kind === 'shape';
}

/** The kinds whose size is their content's, and which therefore cannot be resized at all. */
export const FIXED_SIZE_BLOCK_KINDS = ['node'] as const;

/**
 * Whether a kind refuses resizing by every path — no pointer affordance, and
 * Alt+arrows announces a refusal rather than silently doing nothing.
 *
 * Only `node`, whose size is its label's the way a pill's is. This was
 * originally folded into `isNodeLikeBlockKind`, which made `sticky` and
 * `shape` unresizable too — defensible for a pill, wrong for a sticky note,
 * which is a container for arbitrary prose and whose author has every reason
 * to widen it. That grouping also disagreed with the data layer, since
 * `applyCanvasCommands` has always honoured `op: 'resize'` for every kind: a
 * programmatic resize worked while a person couldn't do it by hand.
 *
 * The two are separate predicates rather than one because they answer
 * different questions — "does this connect and highlight like a node" and
 * "does this have a size of its own" — and only `node` answers yes to both.
 */
export function isFixedSizeBlockKind(kind: CanvasBlockData['kind']): boolean {
  return kind === 'node';
}

export interface CanvasBlockOwnProps {
  block: CanvasBlockData;
  selected?: boolean;
  /** Called out by an AI answer. An annotation — the block has not been changed. */
  highlighted?: boolean;
  /** This block's text is being edited, so pointer gestures belong to the editor. */
  editing?: boolean;
  /**
   * Renders resize handles. The canvas owns the drag itself. Ignored for the
   * node-like kinds (`node`, `sticky`, `shape`), which are never resizable —
   * see `isNodeLikeBlockKind`.
   */
  resizable?: boolean;
  onResizeStart?: (event: PointerEvent, handle: CanvasResizeHandle) => void;
  onTextChange?: (text: string) => void;
  onEditingEnd?: () => void;
  /** A checklist item was ticked. The canvas turns it into an `update` command. */
  onItemToggle?: (itemId: string, done: boolean) => void;
  /**
   * A fill color was picked. Only offered — via a small trigger shown while
   * selected — for `sticky` and `shape`, the two kinds with a `color` field.
   */
  onColorChange?: (color: string) => void;
  /** A `document` block's pages changed — typing, or a page auto-added on overflow. */
  onPagesChange?: (pages: string[]) => void;
  /** A `document` block's header/footer changed — typed while editing. */
  onHeaderChange?: (header: string) => void;
  onFooterChange?: (footer: string) => void;
  /** A `node` block was renamed — double-click its label, the same UX as standalone `Node`. */
  onNameChange?: (name: string) => void;
  /**
   * A node-like block's output port was clicked — arms or disarms a pending
   * connection. Supplying it is also what makes the port render at all: a
   * `sticky`/`shape` with no handler draws no dots, so a read-only board and
   * a non-graph board stay free of affordances that do nothing. (`node` draws
   * its ports either way — inert there still communicates the graph's shape.)
   */
  onOutputPortClick?: (id: string) => void;
  /** A node-like block's input port was clicked — completes a pending connection when one is armed. */
  onInputPortClick?: (id: string) => void;
  /** This block is the armed source of a pending connection. */
  nodeConnecting?: boolean;
  /**
   * A "Rewrite with AI" trigger. Inert without an `AIProvider`. Only wired
   * up for the two kinds with editable text of their own — `sticky`
   * (`StickyNote`'s own internal trigger) and `shape` (a `CanvasBlock`-level
   * overlay, since a clipped shape like `diamond`/`triangle` would clip a
   * trigger drawn inside it). Every other kind (`text`, `image`, `embed`,
   * `frame`, `code`, `table`, `link`, `checklist`, `chart`, `document`) has
   * no click-to-edit text entry point on the canvas at all today, so this
   * prop is silently a no-op for them rather than a partial rewrite affordance
   * with nothing to accept a result into.
   */
  aiRewrite?: boolean;
  /**
   * Overrides a `document` block's `Document.chrome` (list/grid view, zoom,
   * self-contained scrollable viewport). Defaults `false` — `document`
   * blocks otherwise always embed bare, sized and scrolled by the block box
   * itself. A host that wants one specific document-kind block to drop a
   * user into its standalone, self-contained viewer (a "focused page" view,
   * independent of anything driving `Canvas`'s own pan/zoom) can flip this
   * on for that one `CanvasBlock` — `Canvas` itself never sets it, so
   * nothing changes unless a consumer opts in. Ignored by every other kind.
   */
  chrome?: boolean;
  /** Replaces the rendered face entirely, for block kinds a consumer owns. */
  renderBlock?: (block: CanvasBlockData) => ReactNode;
}

export type CanvasBlockProps = Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'onChange'> &
  CanvasBlockOwnProps;

/** `document`'s `header`/`footer` are stored as HTML strings (JSON-serializable block data), but `Document` takes them as `ReactNode` slots — this bridges the two, same trust model as the `text` block kind's own `dangerouslySetInnerHTML`. */
function RawHtml({ html }: { html: string }) {
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

/**
 * Renders one block's face for its kind. A kind gets its own component only
 * when it's genuinely new; `text`, `image` and `divider` are pure delegation to
 * `RichTextEditor`-shaped HTML, `Image` and `Divider`, so giving them wrapper
 * folders would add files without adding behaviour.
 */
function BlockFace({
  block,
  editing,
  onTextChange,
  onEditingEnd,
  onItemToggle,
  onPagesChange,
  onHeaderChange,
  onFooterChange,
  onNameChange,
  onOutputPortClick,
  onInputPortClick,
  nodeConnecting,
  aiRewrite,
  chrome,
}: Pick<
  CanvasBlockOwnProps,
  | 'block'
  | 'editing'
  | 'onTextChange'
  | 'onEditingEnd'
  | 'onItemToggle'
  | 'onPagesChange'
  | 'onHeaderChange'
  | 'onFooterChange'
  | 'onNameChange'
  | 'onOutputPortClick'
  | 'onInputPortClick'
  | 'nodeConnecting'
  | 'aiRewrite'
  | 'chrome'
>) {
  switch (block.kind) {
    case 'sticky':
      return (
        <StickyNote
          text={block.text}
          {...(block.tone ? { tone: block.tone } : {})}
          {...(block.color ? { color: block.color } : {})}
          editing={editing ?? false}
          aiRewrite={aiRewrite ?? false}
          {...(onTextChange ? { onTextChange } : {})}
          {...(onEditingEnd ? { onEditingEnd } : {})}
        />
      );

    case 'shape':
      return (
        <CanvasShape
          shape={block.shape}
          {...(block.text ? { text: block.text } : {})}
          {...(block.tone ? { tone: block.tone } : {})}
          {...(block.color ? { color: block.color } : {})}
          editing={editing ?? false}
          {...(onTextChange ? { onTextChange } : {})}
          {...(onEditingEnd ? { onEditingEnd } : {})}
        />
      );

    case 'node':
      return (
        <Node
          id={block.id}
          name={block.name}
          fill
          {...(block.color ? { color: block.color } : {})}
          hasInput={block.hasInput ?? true}
          hasOutput={block.hasOutput ?? true}
          connecting={nodeConnecting ?? false}
          {...(onNameChange ? { onRename: onNameChange } : {})}
          {...(onOutputPortClick ? { onOutputPortClick } : {})}
          {...(onInputPortClick ? { onInputPortClick } : {})}
        />
      );

    case 'embed':
      return (
        <CanvasEmbed
          title={block.title}
          {...(block.url ? { url: block.url } : {})}
          {...(block.html ? { html: block.html } : {})}
        />
      );

    case 'frame':
      return <CanvasFrame title={block.title} {...(block.tone ? { tone: block.tone } : {})} />;

    case 'image':
      // `draggable={false}` is load-bearing, not tidiness. An `<img>` is
      // natively draggable in every browser, so pressing one and moving starts
      // the browser's own image drag-and-drop; the canvas then receives a
      // `pointercancel` instead of the `pointermove` sequence its move gesture
      // needs, and the block never travels. `img` is deliberately absent from
      // `INTERACTIVE_IN_BLOCK`, so the press is *meant* to become a block drag
      // — the browser was simply taking it first.
      //
      // Set here rather than on `Image` itself: a draggable image is a
      // legitimate thing to want elsewhere (dragging a thumbnail into an
      // editor), and only on a canvas does an ancestor already own the press.
      return (
        <Image
          className={styles.image}
          src={block.src}
          alt={block.alt}
          fit="cover"
          draggable={false}
        />
      );

    case 'divider':
      return (
        <div className={styles.divider}>
          <Divider orientation={block.orientation ?? 'horizontal'} />
        </div>
      );

    case 'text':
      // Rendered as HTML the consumer already owns and trusts — the same value
      // `RichTextEditor` round-trips. Untrusted markup belongs in `embed`,
      // which sandboxes it.
      return <div className={styles.richText} dangerouslySetInnerHTML={{ __html: block.html }} />;

    case 'code':
      return (
        <div className={styles.code}>
          <Code block>{block.code}</Code>
          {block.language && <span className={styles.codeLanguage}>{block.language}</span>}
        </div>
      );

    case 'table':
      return (
        <div className={styles.table}>
          <Table>
            {block.caption && <caption className={styles.tableCaption}>{block.caption}</caption>}
            <Table.Head>
              <Table.Row>
                {block.columns.map((column, index) => (
                  <Table.HeaderCell key={`${column}-${index}`}>{column}</Table.HeaderCell>
                ))}
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {block.rows.map((row, rowIndex) => (
                <Table.Row key={rowIndex}>
                  {/* Indexed off the columns, not the row: a short row becomes
                      empty cells instead of a ragged grid the header no longer
                      lines up with. */}
                  {block.columns.map((_, cellIndex) => (
                    <Table.Cell key={cellIndex}>{row[cellIndex] ?? ''}</Table.Cell>
                  ))}
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>
      );

    case 'link':
      return (
        <div className={styles.link}>
          {/* `rel` is not optional: a canvas link is usually somebody else's
              URL, and `noopener` is what stops the opened page reaching back
              through `window.opener`. */}
          <Link
            href={block.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.linkTitle}
            onPointerDown={(event) => event.stopPropagation()}
          >
            {block.title || block.url}
          </Link>
          {block.description && <p className={styles.linkDescription}>{block.description}</p>}
          <span className={styles.linkUrl}>{block.url}</span>
        </div>
      );

    case 'checklist':
      return (
        <CanvasChecklist
          items={block.items}
          {...(block.title ? { title: block.title } : {})}
          {...(onItemToggle ? { onItemToggle } : {})}
        />
      );

    case 'chart':
      return (
        <div className={styles.chart}>
          <ChartSurface
            label={block.label}
            data={block.data}
            {...(block.chartType ? { type: block.chartType } : {})}
          />
        </div>
      );

    case 'document': {
      // Editable header/footer is only opted into while this block is
      // actually being edited — otherwise a document with no header/footer
      // would gain an empty padded row it never had, since `headerValue`/
      // `footerValue` being set at all (even `''`) is what tells `Document`
      // to render the editable slot instead of the static `header`/`footer`
      // node.
      const editableHeaderFooter = editing
        ? { headerValue: block.header ?? '', footerValue: block.footer ?? '' }
        : {};
      return (
        <Document
          pages={block.pages}
          aspectRatio={block.aspectRatio ?? 'a4'}
          {...(block.layout ? { layout: block.layout } : {})}
          {...(block.header ? { header: <RawHtml html={block.header} /> } : {})}
          {...(block.footer ? { footer: <RawHtml html={block.footer} /> } : {})}
          {...editableHeaderFooter}
          editable={editing ?? false}
          chrome={chrome ?? false}
          aria-label={canvasBlockLabel(block)}
          {...(onPagesChange ? { onPagesChange } : {})}
          {...(onHeaderChange ? { onHeaderChange } : {})}
          {...(onFooterChange ? { onFooterChange } : {})}
        />
      );
    }
  }
}

/**
 * The positioned, selectable, resizable wrapper every block sits in.
 *
 * Position comes from the block's own canvas coordinates and nothing else —
 * the viewport transform lives on an ancestor, so this element never needs to
 * know about pan or zoom.
 *
 * It is a real focusable DOM node, which is the whole reason this canvas is
 * built from DOM rather than a `<canvas>`: blocks stay in the accessibility
 * tree, keyboard-reachable, and styled by the same tokens as everything else.
 */
export const CanvasBlock = forwardRef<HTMLDivElement, CanvasBlockProps>(function CanvasBlock(
  {
    block,
    selected = false,
    highlighted = false,
    editing = false,
    resizable = false,
    onResizeStart,
    onTextChange,
    onEditingEnd,
    onItemToggle,
    onColorChange,
    onPagesChange,
    onHeaderChange,
    onFooterChange,
    onNameChange,
    onOutputPortClick,
    onInputPortClick,
    nodeConnecting,
    aiRewrite = false,
    chrome,
    renderBlock,
    className,
    style,
    ...rest
  },
  ref,
) {
  const nodeLike = isNodeLikeBlockKind(block.kind);
  const fixedSize = isFixedSizeBlockKind(block.kind);

  const showFillPicker =
    selected &&
    !editing &&
    (block.kind === 'sticky' || block.kind === 'shape' || block.kind === 'node') &&
    onColorChange;

  // `node` draws its own ports inside `Node`; `sticky`/`shape` get theirs
  // here. Same reason the shape AI trigger lives at this level: a port sits
  // half outside the face's own box, and `diamond`/`triangle` clip anything
  // drawn inside them.
  const showPorts = block.kind === 'sticky' || block.kind === 'shape';

  // A `shape`'s AI trigger lives here, not inside `CanvasShape` — see the
  // `.aiTrigger` CSS comment for why. `StickyNote` still owns its own
  // trigger internally since it's never clip-path'd.
  const aiClient = useAI();
  const shapeAiAction = useAIAction();
  const showShapeAI =
    aiRewrite && selected && !editing && block.kind === 'shape' && !!aiClient && !!onTextChange;

  return (
    <div
      ref={ref}
      className={mergeClasses(styles.block, className)}
      style={{
        transform: `translate(${block.x}px, ${block.y}px)`,
        width: block.width,
        height: block.height,
        ...style,
      }}
      data-kind={block.kind}
      data-node-like={nodeLike ? '' : undefined}
      data-selected={selected ? '' : undefined}
      data-highlighted={highlighted ? '' : undefined}
      data-editing={editing ? '' : undefined}
      // A labelled group rather than a bare div: an `aria-label` on a roleless
      // element is ignored by most screen readers, and on a canvas the block
      // boundary is genuinely useful — you need to know where one ends and the
      // next begins.
      //
      // Except for `frame`, `checklist`, `document`, and `node`, whose faces
      // are already labelled groups of their own; labelling the wrapper too
      // would announce the same name twice around nested groups that mean
      // the same thing.
      {...(block.kind === 'frame' ||
      block.kind === 'checklist' ||
      block.kind === 'document' ||
      block.kind === 'node'
        ? {}
        : {
            role: 'group',
            'aria-label': canvasBlockLabel(block),
            'aria-roledescription': 'Canvas block',
          })}
      {...rest}
    >
      {renderBlock ? (
        renderBlock(block)
      ) : (
        <BlockFace
          block={block}
          editing={editing}
          aiRewrite={aiRewrite}
          {...(onTextChange ? { onTextChange } : {})}
          {...(onEditingEnd ? { onEditingEnd } : {})}
          {...(onItemToggle ? { onItemToggle } : {})}
          {...(onPagesChange ? { onPagesChange } : {})}
          {...(onHeaderChange ? { onHeaderChange } : {})}
          {...(onFooterChange ? { onFooterChange } : {})}
          {...(onNameChange ? { onNameChange } : {})}
          {...(onOutputPortClick ? { onOutputPortClick } : {})}
          {...(onInputPortClick ? { onInputPortClick } : {})}
          {...(nodeConnecting !== undefined ? { nodeConnecting } : {})}
          {...(chrome !== undefined ? { chrome } : {})}
        />
      )}

      {/* Pointer-only affordance: keyboard resizing is Alt+arrows on the
          block itself, so these add nothing for a keyboard user and would
          only add eight tab stops per block.

          Never drawn for a fixed-size kind, whatever `resizable` says —
          a `node`'s size is its label's, and corner points that resize
          nothing are worse than none.

          A node-like kind that *is* resizable (`sticky`, `shape`) gets the
          same eight zones with no paint on them: invisible strips along the
          edges and squares at the corners, which announce themselves by the
          cursor alone. A note is a surface someone is reading, and eight dots
          orbiting it to say "this can be resized" cost more attention than
          they return — the cursor says the same thing at the moment it's
          actually useful, and says nothing the rest of the time. Corners sit
          above the edges so a corner cursor wins where they meet. */}
      {resizable && selected && !fixedSize && (
        <span aria-hidden="true" className={styles.handles} data-canvas-resize-handles="">
          {RESIZE_HANDLES.map((handle) => (
            <span
              key={handle}
              className={nodeLike ? styles.edgeHandle : styles.handle}
              data-handle={handle}
              onPointerDown={(event) => onResizeStart?.(event, handle)}
            />
          ))}
        </span>
      )}

      {/* The same input/output ports a `node` draws, so a sticky note or a
          shape can be wired into a diagram exactly like one. Real `<button>`s,
          not decoration: connecting is click-to-arm then click-to-complete,
          which is what keeps it reachable without a pointer drag. Unlike the
          resize handles these are always present rather than selection-gated
          — a connection starts from a block you haven't selected yet. */}
      {showPorts && onInputPortClick && (
        <button
          type="button"
          className={nodeStyles.port}
          data-port="input"
          aria-label={`Connect to ${canvasBlockLabel(block)}'s input`}
          onClick={(event) => {
            event.stopPropagation();
            onInputPortClick(block.id);
          }}
        />
      )}
      {showPorts && onOutputPortClick && (
        <button
          type="button"
          className={nodeStyles.port}
          data-port="output"
          data-connecting={nodeConnecting ? '' : undefined}
          aria-label={`Connect ${canvasBlockLabel(block)}'s output to another block`}
          onClick={(event) => {
            event.stopPropagation();
            onOutputPortClick(block.id);
          }}
        />
      )}

      {/* Only offered for the kinds with a `color` field, and only while
          selected — same "pointer-only, appears on selection" shape as the
          resize handles, marked so a press opens the popover instead of
          starting a drag. */}
      {showFillPicker &&
        (block.kind === 'sticky' || block.kind === 'shape' || block.kind === 'node') && (
          <span
            className={styles.fillPicker}
            data-canvas-block-actions=""
            onPointerDown={(event) => event.stopPropagation()}
          >
            <CanvasFillPicker
              {...(block.color ? { value: block.color } : {})}
              onChange={(color) => onColorChange?.(color)}
            />
          </span>
        )}

      {showShapeAI && block.kind === 'shape' && (
        <span
          className={styles.aiTrigger}
          data-canvas-block-actions=""
          onPointerDown={(event) => event.stopPropagation()}
        >
          <AISuggestionPopover
            triggerLabel="Rewrite with AI"
            status={shapeAiAction.status}
            result={shapeAiAction.result}
            {...(shapeAiAction.error ? { error: shapeAiAction.error } : {})}
            onOpenChange={(open) => {
              if (open)
                shapeAiAction.trigger({ prompt: defaultBuildShapeAIPrompt(block.text ?? '') });
              else shapeAiAction.reset();
            }}
            onAccept={(result) => {
              onTextChange?.(result);
              shapeAiAction.reset();
            }}
            onReject={() => shapeAiAction.reset()}
            onRetry={() =>
              shapeAiAction.trigger({ prompt: defaultBuildShapeAIPrompt(block.text ?? '') })
            }
          />
        </span>
      )}
    </div>
  );
});

CanvasBlock.displayName = 'CanvasBlock';
